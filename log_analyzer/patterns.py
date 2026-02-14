# Pattern Detection Algorithms
#
# Helper functions for pattern matching and analysis
# Supports multiple log formats: Standard, Apache, Nginx, JSON

import re
import json
from dataclasses import dataclass
from datetime import datetime
from analyzer import LogEntry


#----------------------------------------------------------#
# Multi-format log parsers
#----------------------------------------------------------#

def parse_apache_log(line: str) -> LogEntry:
    """Parse Apache Combined Log Format.
    Example: 127.0.0.1 - - [15/Jan/2024:10:23:45 +0000] "GET /index.html HTTP/1.1" 200 1234
    """
    pattern = r'(\S+) \S+ \S+ \[(.+?)\] "(\S+) (\S+) \S+" (\d{3}) \S+'
    match = re.match(pattern, line)
    if match:
        ts_str = match.group(2).split(' ')[0]  # Remove timezone
        ts = datetime.strptime(ts_str, '%d/%b/%Y:%H:%M:%S')
        status_code = int(match.group(5))

        # Map HTTP status to log level
        if status_code >= 500:
            level = 'ERROR'
        elif status_code >= 400:
            level = 'WARN'
        else:
            level = 'INFO'

        message = f"{match.group(3)} {match.group(4)} - {status_code}"
        return LogEntry(ts, level, message)
    return None


def parse_nginx_log(line: str) -> LogEntry:
    """Parse Nginx Log Format.
    Example: 192.168.1.1 - - [15/Jan/2024:10:23:45 +0000] "GET /api/users HTTP/1.1" 500 0 "-" "Mozilla/5.0"
    """
    pattern = r'(\S+) \S+ \S+ \[(.+?)\] "(\S+) (\S+) \S+" (\d{3}) (\d+)'
    match = re.match(pattern, line)
    if match:
        ts_str = match.group(2).split(' ')[0]
        ts = datetime.strptime(ts_str, '%d/%b/%Y:%H:%M:%S')
        status_code = int(match.group(5))

        if status_code >= 500:
            level = 'ERROR'
        elif status_code >= 400:
            level = 'WARN'
        else:
            level = 'INFO'

        message = f"{match.group(3)} {match.group(4)} - {status_code}"
        return LogEntry(ts, level, message)
    return None


def parse_json_log(line: str) -> LogEntry:
    """Parse JSON-formatted log lines.
    Example: {"timestamp": "2024-01-15T10:23:45", "level": "ERROR", "message": "Something failed"}
    """
    try:
        data = json.loads(line)
        ts = datetime.fromisoformat(data.get('timestamp', ''))
        level = data.get('level', 'INFO').upper()
        message = data.get('message', data.get('msg', ''))
        return LogEntry(ts, level, message)
    except (json.JSONDecodeError, ValueError):
        return None


def detect_log_format(line: str) -> str:
    """Auto-detect the log format from a sample line."""
    # Try JSON first
    try:
        json.loads(line)
        return 'json'
    except (json.JSONDecodeError, ValueError):
        pass

    # Check for Apache/Nginx format
    if re.match(r'\S+ \S+ \S+ \[.+?\] ".+?"', line):
        if '"Mozilla' in line or '"curl' in line:
            return 'nginx'
        return 'apache'

    # Default standard format
    if re.match(r'\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}', line):
        return 'standard'

    return 'unknown'


def get_parser(format_type: str):
    """Return the appropriate parser function for the format."""
    parsers = {
        'standard': None,  # Uses analyzer.parse_log_line
        'apache': parse_apache_log,
        'nginx': parse_nginx_log,
        'json': parse_json_log,
    }
    return parsers.get(format_type)


#----------------------------------------------------------#
# Anomaly Detection
#----------------------------------------------------------#

def detect_anomalies(logs: list, sensitivity: float = 2.0) -> list:
    """Detect unusual patterns in log data.

    Uses statistical analysis to find:
    - Unusual error rate spikes
    - Abnormal time gaps between entries
    - Sudden changes in log volume

    sensitivity: how many standard deviations from mean to flag (lower = more sensitive)
    """
    anomalies = []

    if len(logs) < 5:
        return anomalies

    # Group logs by minute
    minute_buckets = {}
    for entry in logs:
        minute_key = entry.timestamp.strftime('%Y-%m-%d %H:%M')
        if minute_key not in minute_buckets:
            minute_buckets[minute_key] = {'total': 0, 'errors': 0}
        minute_buckets[minute_key]['total'] += 1
        if entry.level == 'ERROR':
            minute_buckets[minute_key]['errors'] += 1

    if not minute_buckets:
        return anomalies

    # Calculate mean and std deviation for error rates
    error_rates = []
    for bucket in minute_buckets.values():
        rate = bucket['errors'] / bucket['total'] if bucket['total'] > 0 else 0
        error_rates.append(rate)

    mean_rate = sum(error_rates) / len(error_rates)
    variance = sum((r - mean_rate) ** 2 for r in error_rates) / len(error_rates)
    std_dev = variance ** 0.5

    # Flag anomalies
    for minute_key, bucket in minute_buckets.items():
        rate = bucket['errors'] / bucket['total'] if bucket['total'] > 0 else 0

        # High error rate anomaly
        if std_dev > 0 and (rate - mean_rate) > sensitivity * std_dev:
            anomalies.append({
                'type': 'high_error_rate',
                'time': minute_key,
                'error_rate': f"{rate:.0%}",
                'expected_rate': f"{mean_rate:.0%}",
                'severity': 'HIGH' if rate > 0.8 else 'MEDIUM'
            })

        # Volume spike anomaly
        total_counts = [b['total'] for b in minute_buckets.values()]
        mean_volume = sum(total_counts) / len(total_counts)
        vol_variance = sum((c - mean_volume) ** 2 for c in total_counts) / len(total_counts)
        vol_std = vol_variance ** 0.5

        if vol_std > 0 and (bucket['total'] - mean_volume) > sensitivity * vol_std:
            anomalies.append({
                'type': 'volume_spike',
                'time': minute_key,
                'count': bucket['total'],
                'expected_count': f"{mean_volume:.1f}",
                'severity': 'MEDIUM'
            })

    # Check for large time gaps
    for i in range(1, len(logs)):
        gap = (logs[i].timestamp - logs[i-1].timestamp).total_seconds()
        if gap > 300:  # More than 5 minutes gap
            anomalies.append({
                'type': 'time_gap',
                'time': str(logs[i].timestamp),
                'gap_seconds': int(gap),
                'severity': 'LOW'
            })

    return anomalies
