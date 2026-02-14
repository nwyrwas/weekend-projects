from dataclasses import dataclass
from datetime import datetime
import re
import json
import csv
import time
import os


@dataclass
class LogEntry:
    timestamp: datetime
    level: str # INFO, DEBUG, WARN, ERROR
    message: str



def parse_log_line(line: str) -> LogEntry:

    pattern = r'(\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}) (\w+)\s+(.*)'
    match = re.match(pattern, line)

    if match:
        ts = datetime.strptime(match.group(1), '%Y-%m-%d %H:%M:%S')
        return LogEntry(ts, match.group(2), match.group(3))
    return None



def find_error_spikes(logs: list, window_minutes: int, threshold: int):
    # Find time windows where errors exceed threshold
    from collections import deque

    window = deque() # Utilize sliding window of error timestamps
    spikes = []
    window_seconds = window_minutes * 60

    for entry in logs:
        if entry.level == 'ERROR':

            # Add to window
            window.append(entry.timestamp)

            #Shrink the window (remove entries that would be outside of the time range)
            while window and (entry.timestamp - window[0]).total_seconds() > window_seconds:
                window.popleft()

            # Checking if threshold was exceeded
            if len(window) >= threshold:
                spikes.append((entry.timestamp, len(window)))

    return spikes


def find_repeated_patterns(logs: list, min_occurrences: int = 3):
    ## Find error messages that repeat frequently
    error_counts = {} # created a hashmap for counting

    for entry in logs:
        if entry.level == 'ERROR':

            # Normalize message ( by removing timestamps, IDs)
            normalized = re.sub(r'\d+', 'N', entry.message)

            error_counts[normalized] = error_counts.get(normalized, 0) + 1

    # Filter by minimum occurances
    return {k: v for k, v in error_counts.items() if v >= min_occurrences}


def analyze_time_range(logs: list, start: datetime, end: datetime):

    # Analyze logs within a specific time range using two pointers
    left = 0
    right = 0
    n = len(logs)

    # Find start position
    while left < n and logs[left].timestamp < start:
        left += 1

    # Find end position
    right = left
    while right < n and logs[right].timestamp <= end:
        right += 1

    # Analyze the range
    range_logs = logs[left:right]
    return {
        'total': len(range_logs),
        'errors': sum(1 for l in range_logs if l.level == 'ERROR'),
        'warnings': sum(1 for l in range_logs if l.level == 'WARN')
    }


#----------------------------------------------------------#
# Bonus: Export to JSON/CSV
#----------------------------------------------------------#

def export_to_json(logs: list, output_path: str, analysis: dict = None):
    """Export log analysis results to a JSON report."""
    report = {
        'generated_at': datetime.now().isoformat(),
        'total_entries': len(logs),
        'summary': {
            'info': sum(1 for l in logs if l.level == 'INFO'),
            'debug': sum(1 for l in logs if l.level == 'DEBUG'),
            'warn': sum(1 for l in logs if l.level == 'WARN'),
            'error': sum(1 for l in logs if l.level == 'ERROR'),
        },
        'entries': [
            {
                'timestamp': str(l.timestamp),
                'level': l.level,
                'message': l.message
            }
            for l in logs
        ]
    }

    if analysis:
        report['analysis'] = analysis

    with open(output_path, 'w') as f:
        json.dump(report, f, indent=2)

    return output_path


def export_to_csv(logs: list, output_path: str):
    """Export log entries to a CSV file."""
    with open(output_path, 'w', newline='') as f:
        writer = csv.writer(f)
        writer.writerow(['timestamp', 'level', 'message'])
        for entry in logs:
            writer.writerow([str(entry.timestamp), entry.level, entry.message])

    return output_path


#----------------------------------------------------------#
# Bonus: Real-time log tailing
#----------------------------------------------------------#

def tail_log(filepath: str, parser_func=None):
    """Watch a log file in real-time, like 'tail -f'.

    Monitors the file for new lines and parses them as they appear.
    Press Ctrl+C to stop.
    """
    if parser_func is None:
        parser_func = parse_log_line

    print(f"Tailing {filepath}... (Ctrl+C to stop)\n")

    with open(filepath, 'r') as f:
        # Move to end of file
        f.seek(0, 2)

        try:
            while True:
                line = f.readline()
                if line:
                    line = line.strip()
                    entry = parser_func(line)
                    if entry:
                        # Color-code by level
                        level_colors = {
                            'ERROR': '\033[91m',  # Red
                            'WARN': '\033[93m',   # Yellow
                            'INFO': '\033[92m',   # Green
                            'DEBUG': '\033[94m',  # Blue
                        }
                        reset = '\033[0m'
                        color = level_colors.get(entry.level, '')
                        print(f"{color}[{entry.timestamp}] [{entry.level}] {entry.message}{reset}")
                else:
                    time.sleep(0.5)  # Wait for new data
        except KeyboardInterrupt:
            print("\nStopped tailing.")


#----------------------------------------------------------#
# Bonus: Visualization with matplotlib
#----------------------------------------------------------#

def visualize_errors(logs: list, output_path: str = 'error_chart.png'):
    """Create a detailed multi-panel dashboard of log analysis."""
    try:
        import matplotlib
        matplotlib.use('Agg')  # Non-interactive backend
        import matplotlib.pyplot as plt
        import matplotlib.dates as mdates
        from collections import Counter
    except ImportError:
        print("matplotlib is required for visualization.")
        print("Install it with: pip3 install matplotlib")
        return None

    # Group logs by minute
    minute_counts = {}
    for entry in logs:
        minute_key = entry.timestamp.replace(second=0)
        if minute_key not in minute_counts:
            minute_counts[minute_key] = {'total': 0, 'errors': 0, 'warnings': 0, 'info': 0, 'debug': 0}
        minute_counts[minute_key]['total'] += 1
        if entry.level == 'ERROR':
            minute_counts[minute_key]['errors'] += 1
        elif entry.level == 'WARN':
            minute_counts[minute_key]['warnings'] += 1
        elif entry.level == 'INFO':
            minute_counts[minute_key]['info'] += 1
        elif entry.level == 'DEBUG':
            minute_counts[minute_key]['debug'] += 1

    if not minute_counts:
        print("No data to visualize.")
        return None

    times = sorted(minute_counts.keys())
    errors = [minute_counts[t]['errors'] for t in times]
    warnings = [minute_counts[t]['warnings'] for t in times]
    infos = [minute_counts[t]['info'] for t in times]
    debugs = [minute_counts[t]['debug'] for t in times]
    totals = [minute_counts[t]['total'] for t in times]

    # Calculate cumulative errors
    cumulative_errors = []
    running_total = 0
    for e in errors:
        running_total += e
        cumulative_errors.append(running_total)

    # Calculate error rate per minute
    error_rates = [
        (minute_counts[t]['errors'] / minute_counts[t]['total'] * 100) if minute_counts[t]['total'] > 0 else 0
        for t in times
    ]

    # Count log levels for pie chart
    level_counts = Counter(entry.level for entry in logs)

    # Count top error messages
    error_messages = Counter()
    for entry in logs:
        if entry.level == 'ERROR':
            normalized = entry.message[:50]  # Truncate for display
            error_messages[normalized] += 1
    top_errors = error_messages.most_common(8)

    # Create the dashboard - 3x2 grid
    fig = plt.figure(figsize=(16, 14))
    fig.suptitle('Log Analysis Dashboard', fontsize=16, fontweight='bold', y=0.98)

    # Add summary text
    total_entries = len(logs)
    total_errors = sum(1 for l in logs if l.level == 'ERROR')
    total_warnings = sum(1 for l in logs if l.level == 'WARN')
    time_range = f"{logs[0].timestamp.strftime('%H:%M')} - {logs[-1].timestamp.strftime('%H:%M')}" if logs else "N/A"

    fig.text(0.5, 0.95,
             f"Total Entries: {total_entries}  |  Errors: {total_errors}  |  Warnings: {total_warnings}  |  Time Range: {time_range}",
             ha='center', fontsize=11, color='gray')

    # Plot 1: Log Volume Over Time (top left)
    ax1 = fig.add_subplot(3, 2, 1)
    ax1.fill_between(times, totals, alpha=0.3, color='steelblue')
    ax1.plot(times, totals, color='steelblue', linewidth=1.5, label='Total')
    ax1.set_ylabel('Log Count')
    ax1.set_title('Log Volume Over Time', fontweight='bold')
    ax1.legend(loc='upper right')
    ax1.grid(True, alpha=0.3)
    ax1.xaxis.set_major_formatter(mdates.DateFormatter('%H:%M'))
    plt.setp(ax1.xaxis.get_majorticklabels(), rotation=45)

    # Plot 2: Error Rate Over Time (top right)
    ax2 = fig.add_subplot(3, 2, 2)
    ax2.fill_between(times, error_rates, alpha=0.3, color='red')
    ax2.plot(times, error_rates, color='red', linewidth=1.5)
    ax2.axhline(y=sum(error_rates)/len(error_rates), color='darkred', linestyle='--', alpha=0.5, label='Avg Error Rate')
    ax2.set_ylabel('Error Rate (%)')
    ax2.set_title('Error Rate Over Time', fontweight='bold')
    ax2.legend(loc='upper right')
    ax2.grid(True, alpha=0.3)
    ax2.xaxis.set_major_formatter(mdates.DateFormatter('%H:%M'))
    plt.setp(ax2.xaxis.get_majorticklabels(), rotation=45)

    # Plot 3: Stacked Errors & Warnings (middle left)
    ax3 = fig.add_subplot(3, 2, 3)
    ax3.bar(times, errors, width=0.0004, color='#e74c3c', alpha=0.8, label='Errors')
    ax3.bar(times, warnings, width=0.0004, color='#f39c12', alpha=0.8, bottom=errors, label='Warnings')
    ax3.set_ylabel('Count')
    ax3.set_title('Errors & Warnings Per Minute', fontweight='bold')
    ax3.legend(loc='upper right')
    ax3.grid(True, alpha=0.3)
    ax3.xaxis.set_major_formatter(mdates.DateFormatter('%H:%M'))
    plt.setp(ax3.xaxis.get_majorticklabels(), rotation=45)

    # Plot 4: Cumulative Errors (middle right)
    ax4 = fig.add_subplot(3, 2, 4)
    ax4.plot(times, cumulative_errors, color='#e74c3c', linewidth=2)
    ax4.fill_between(times, cumulative_errors, alpha=0.2, color='red')
    ax4.set_ylabel('Cumulative Errors')
    ax4.set_title('Cumulative Error Count', fontweight='bold')
    ax4.grid(True, alpha=0.3)
    ax4.xaxis.set_major_formatter(mdates.DateFormatter('%H:%M'))
    plt.setp(ax4.xaxis.get_majorticklabels(), rotation=45)

    # Plot 5: Log Level Distribution (bottom left)
    ax5 = fig.add_subplot(3, 2, 5)
    colors_map = {'ERROR': '#e74c3c', 'WARN': '#f39c12', 'INFO': '#2ecc71', 'DEBUG': '#3498db'}
    labels = list(level_counts.keys())
    sizes = list(level_counts.values())
    colors = [colors_map.get(l, 'gray') for l in labels]
    wedges, texts, autotexts = ax5.pie(sizes, labels=labels, colors=colors, autopct='%1.1f%%',
                                         startangle=90, textprops={'fontsize': 10})
    for autotext in autotexts:
        autotext.set_fontweight('bold')
    ax5.set_title('Log Level Distribution', fontweight='bold')

    # Plot 6: Top Error Messages (bottom right)
    ax6 = fig.add_subplot(3, 2, 6)
    if top_errors:
        messages = [msg[:35] + '...' if len(msg) > 35 else msg for msg, _ in top_errors]
        counts = [count for _, count in top_errors]
        y_pos = range(len(messages))
        bars = ax6.barh(y_pos, counts, color='#e74c3c', alpha=0.8)
        ax6.set_yticks(y_pos)
        ax6.set_yticklabels(messages, fontsize=8)
        ax6.set_xlabel('Count')
        ax6.set_title('Top Error Messages', fontweight='bold')
        ax6.invert_yaxis()
        # Add count labels on bars
        for bar, count in zip(bars, counts):
            ax6.text(bar.get_width() + 0.1, bar.get_y() + bar.get_height()/2,
                     str(count), va='center', fontsize=9, fontweight='bold')
    else:
        ax6.text(0.5, 0.5, 'No errors found', ha='center', va='center', fontsize=12, color='green')
        ax6.set_title('Top Error Messages', fontweight='bold')

    plt.tight_layout(rect=[0, 0, 1, 0.93])
    plt.savefig(output_path, dpi=150, bbox_inches='tight')
    plt.close()

    return output_path
