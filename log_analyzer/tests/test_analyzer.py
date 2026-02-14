import pytest
import os
import sys
import json

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from datetime import datetime
from analyzer import (
    LogEntry, parse_log_line, find_error_spikes,
    find_repeated_patterns, analyze_time_range,
    export_to_json, export_to_csv
)
from patterns import detect_log_format, parse_apache_log, parse_json_log, detect_anomalies


class TestParseLogLine:
    """Tests for log line parsing."""

    def test_parse_valid_info(self):
        line = "2024-01-15 10:23:45 INFO Server started on port 8080"
        entry = parse_log_line(line)
        assert entry.level == 'INFO'
        assert entry.message == 'Server started on port 8080'

    def test_parse_valid_error(self):
        line = "2024-01-15 10:24:01 ERROR Connection timeout to API service"
        entry = parse_log_line(line)
        assert entry.level == 'ERROR'
        assert entry.message == 'Connection timeout to API service'

    def test_parse_valid_timestamp(self):
        line = "2024-01-15 10:23:45 INFO Test"
        entry = parse_log_line(line)
        assert entry.timestamp == datetime(2024, 1, 15, 10, 23, 45)

    def test_parse_invalid_line(self):
        entry = parse_log_line("this is not a log line")
        assert entry is None

    def test_parse_empty_line(self):
        entry = parse_log_line("")
        assert entry is None

    def test_parse_warn_level(self):
        line = "2024-01-15 10:24:02 WARN Retrying connection"
        entry = parse_log_line(line)
        assert entry.level == 'WARN'


class TestFindErrorSpikes:
    """Tests for sliding window error spike detection."""

    @pytest.fixture
    def logs_with_spike(self):
        """Create logs with an error spike."""
        return [
            LogEntry(datetime(2024, 1, 15, 10, 26, 0), 'ERROR', 'DB timeout'),
            LogEntry(datetime(2024, 1, 15, 10, 26, 1), 'ERROR', 'DB timeout'),
            LogEntry(datetime(2024, 1, 15, 10, 26, 2), 'ERROR', 'DB timeout'),
        ]

    @pytest.fixture
    def logs_no_spike(self):
        """Create logs without an error spike."""
        return [
            LogEntry(datetime(2024, 1, 15, 10, 0, 0), 'ERROR', 'Error 1'),
            LogEntry(datetime(2024, 1, 15, 11, 0, 0), 'ERROR', 'Error 2'),
            LogEntry(datetime(2024, 1, 15, 12, 0, 0), 'ERROR', 'Error 3'),
        ]

    def test_detects_spike(self, logs_with_spike):
        spikes = find_error_spikes(logs_with_spike, window_minutes=5, threshold=3)
        assert len(spikes) > 0

    def test_no_spike_when_spread_out(self, logs_no_spike):
        spikes = find_error_spikes(logs_no_spike, window_minutes=5, threshold=3)
        assert len(spikes) == 0

    def test_empty_logs(self):
        spikes = find_error_spikes([], window_minutes=5, threshold=3)
        assert spikes == []

    def test_ignores_non_errors(self):
        logs = [
            LogEntry(datetime(2024, 1, 15, 10, 0, 0), 'INFO', 'Info 1'),
            LogEntry(datetime(2024, 1, 15, 10, 0, 1), 'INFO', 'Info 2'),
            LogEntry(datetime(2024, 1, 15, 10, 0, 2), 'INFO', 'Info 3'),
        ]
        spikes = find_error_spikes(logs, window_minutes=5, threshold=3)
        assert spikes == []


class TestFindRepeatedPatterns:
    """Tests for repeated pattern detection."""

    def test_finds_repeated_errors(self):
        logs = [
            LogEntry(datetime(2024, 1, 15, 10, 0, 0), 'ERROR', 'DB timeout'),
            LogEntry(datetime(2024, 1, 15, 10, 0, 1), 'ERROR', 'DB timeout'),
            LogEntry(datetime(2024, 1, 15, 10, 0, 2), 'ERROR', 'DB timeout'),
        ]
        patterns = find_repeated_patterns(logs, min_occurrences=3)
        assert len(patterns) > 0

    def test_no_patterns_below_threshold(self):
        logs = [
            LogEntry(datetime(2024, 1, 15, 10, 0, 0), 'ERROR', 'Error A'),
            LogEntry(datetime(2024, 1, 15, 10, 0, 1), 'ERROR', 'Error B'),
        ]
        patterns = find_repeated_patterns(logs, min_occurrences=3)
        assert len(patterns) == 0

    def test_normalizes_numbers(self):
        logs = [
            LogEntry(datetime(2024, 1, 15, 10, 0, 0), 'ERROR', 'Timeout on port 8080'),
            LogEntry(datetime(2024, 1, 15, 10, 0, 1), 'ERROR', 'Timeout on port 3000'),
            LogEntry(datetime(2024, 1, 15, 10, 0, 2), 'ERROR', 'Timeout on port 5432'),
        ]
        patterns = find_repeated_patterns(logs, min_occurrences=3)
        assert len(patterns) == 1  # All should normalize to same pattern

    def test_empty_logs(self):
        patterns = find_repeated_patterns([], min_occurrences=3)
        assert patterns == {}


class TestAnalyzeTimeRange:
    """Tests for two-pointer time range analysis."""

    @pytest.fixture
    def sample_logs(self):
        return [
            LogEntry(datetime(2024, 1, 15, 10, 0, 0), 'INFO', 'Start'),
            LogEntry(datetime(2024, 1, 15, 10, 5, 0), 'ERROR', 'Error 1'),
            LogEntry(datetime(2024, 1, 15, 10, 10, 0), 'WARN', 'Warning 1'),
            LogEntry(datetime(2024, 1, 15, 10, 15, 0), 'ERROR', 'Error 2'),
            LogEntry(datetime(2024, 1, 15, 10, 20, 0), 'INFO', 'End'),
        ]

    def test_full_range(self, sample_logs):
        result = analyze_time_range(
            sample_logs,
            datetime(2024, 1, 15, 10, 0, 0),
            datetime(2024, 1, 15, 10, 20, 0)
        )
        assert result['total'] == 5
        assert result['errors'] == 2
        assert result['warnings'] == 1

    def test_partial_range(self, sample_logs):
        result = analyze_time_range(
            sample_logs,
            datetime(2024, 1, 15, 10, 5, 0),
            datetime(2024, 1, 15, 10, 15, 0)
        )
        assert result['total'] == 3
        assert result['errors'] == 2

    def test_empty_range(self, sample_logs):
        result = analyze_time_range(
            sample_logs,
            datetime(2024, 1, 15, 11, 0, 0),
            datetime(2024, 1, 15, 12, 0, 0)
        )
        assert result['total'] == 0


class TestExport:
    """Tests for JSON/CSV export."""

    @pytest.fixture
    def sample_logs(self):
        return [
            LogEntry(datetime(2024, 1, 15, 10, 0, 0), 'INFO', 'Test message'),
            LogEntry(datetime(2024, 1, 15, 10, 1, 0), 'ERROR', 'Test error'),
        ]

    def test_export_json(self, sample_logs, tmp_path):
        output = tmp_path / "report.json"
        export_to_json(sample_logs, str(output))
        assert output.exists()

        with open(output) as f:
            data = json.load(f)
        assert data['total_entries'] == 2
        assert data['summary']['error'] == 1

    def test_export_csv(self, sample_logs, tmp_path):
        output = tmp_path / "report.csv"
        export_to_csv(sample_logs, str(output))
        assert output.exists()

        with open(output) as f:
            lines = f.readlines()
        assert len(lines) == 3  # Header + 2 entries


class TestLogFormatDetection:
    """Tests for auto-detecting log formats."""

    def test_detect_standard(self):
        line = "2024-01-15 10:23:45 INFO Server started"
        assert detect_log_format(line) == 'standard'

    def test_detect_json(self):
        line = '{"timestamp": "2024-01-15T10:23:45", "level": "INFO", "message": "test"}'
        assert detect_log_format(line) == 'json'

    def test_detect_apache(self):
        line = '127.0.0.1 - - [15/Jan/2024:10:23:45 +0000] "GET /index.html HTTP/1.1" 200 1234'
        assert detect_log_format(line) == 'apache'

    def test_parse_json_log(self):
        line = '{"timestamp": "2024-01-15T10:23:45", "level": "ERROR", "message": "DB failed"}'
        entry = parse_json_log(line)
        assert entry.level == 'ERROR'
        assert entry.message == 'DB failed'


class TestAnomalyDetection:
    """Tests for anomaly detection."""

    def test_detects_high_error_rate(self):
        logs = []
        # Normal minutes with no errors
        for i in range(5):
            logs.append(LogEntry(datetime(2024, 1, 15, 10, i, 0), 'INFO', 'Normal'))

        # Spike minute with all errors
        for i in range(10):
            logs.append(LogEntry(datetime(2024, 1, 15, 10, 10, i), 'ERROR', 'Spike'))

        anomalies = detect_anomalies(logs, sensitivity=1.0)
        types = [a['type'] for a in anomalies]
        assert 'high_error_rate' in types

    def test_no_anomalies_in_normal_logs(self):
        logs = [
            LogEntry(datetime(2024, 1, 15, 10, i, 0), 'INFO', 'Normal')
            for i in range(10)
        ]
        anomalies = detect_anomalies(logs)
        error_anomalies = [a for a in anomalies if a['type'] == 'high_error_rate']
        assert len(error_anomalies) == 0

    def test_empty_logs(self):
        anomalies = detect_anomalies([])
        assert anomalies == []
