import argparse
from analyzer import (
    parse_log_line, find_error_spikes, find_repeated_patterns,
    export_to_json, export_to_csv, tail_log, visualize_errors
)
from patterns import detect_log_format, get_parser, detect_anomalies

def main():
    parser = argparse.ArgumentParser(description='Log Analyzer')
    parser.add_argument('logfile', help='Path to log file')
    parser.add_argument('--errors', action='store_true', help='Show error summary')
    parser.add_argument('--spikes', type=int, help='Find error spikes (window in mins)')
    parser.add_argument('--patterns', action='store_true', help='Find repeated patterns')
    parser.add_argument('--export-json', type=str, help='Export report to JSON file')
    parser.add_argument('--export-csv', type=str, help='Export entries to CSV file')
    parser.add_argument('--tail', action='store_true', help='Real-time log tailing (like tail -f)')
    parser.add_argument('--visualize', type=str, nargs='?', const='error_chart.png', help='Generate error chart (optional: output path)')
    parser.add_argument('--format', type=str, choices=['standard', 'apache', 'nginx', 'json', 'auto'], default='auto', help='Log format (default: auto-detect)')
    parser.add_argument('--anomalies', action='store_true', help='Detect anomalies in log data')

    args = parser.parse_args()

    # Handle real-time tailing (doesn't need to parse the whole file)
    if args.tail:
        tail_log(args.logfile)
        return

    # Detect or set log format
    parser_func = parse_log_line  # default
    if args.format == 'auto':
        with open(args.logfile, 'r') as f:
            first_line = f.readline().strip()
            detected = detect_log_format(first_line)
            if detected != 'standard' and detected != 'unknown':
                custom_parser = get_parser(detected)
                if custom_parser:
                    parser_func = custom_parser
                print(f"Auto-detected format: {detected}")
            else:
                print(f"Using standard log format.")
    elif args.format != 'standard':
        custom_parser = get_parser(args.format)
        if custom_parser:
            parser_func = custom_parser
        print(f"Using format: {args.format}")

    # Read and parse the log file
    with open(args.logfile, 'r') as f:
        logs = []
        for line in f:
            entry = parser_func(line.strip())
            if entry:
                logs.append(entry)

    print(f"Parsed {len(logs)} log entries.\n")

    # Collect analysis results for export
    analysis = {}

    # Show error summary
    if args.errors:
        errors = [log for log in logs if log.level == 'ERROR']
        warnings = [log for log in logs if log.level == 'WARN']
        print(f"=== Error Summary ===")
        print(f"Total entries: {len(logs)}")
        print(f"Errors: {len(errors)}")
        print(f"Warnings: {len(warnings)}")
        print()
        for err in errors:
            print(f"  [{err.timestamp}] {err.message}")
        print()

        analysis['error_summary'] = {
            'total': len(logs),
            'errors': len(errors),
            'warnings': len(warnings)
        }

    # Find error spikes
    if args.spikes:
        spikes = find_error_spikes(logs, window_minutes=args.spikes, threshold=3)
        print(f"=== Error Spikes (window: {args.spikes} min) ===")
        if spikes:
            for timestamp, count in spikes:
                print(f"  [{timestamp}] {count} errors in window")
        else:
            print("  No error spikes found.")
        print()

        analysis['spikes'] = [
            {'timestamp': str(ts), 'count': c} for ts, c in spikes
        ] if spikes else []

    # Find repeated patterns
    if args.patterns:
        patterns = find_repeated_patterns(logs)
        print(f"=== Repeated Error Patterns ===")
        if patterns:
            for pattern, count in patterns.items():
                print(f"  ({count}x) {pattern}")
        else:
            print("  No repeated patterns found.")
        print()

        analysis['repeated_patterns'] = patterns if patterns else {}

    # Detect anomalies
    if args.anomalies:
        anomalies = detect_anomalies(logs)
        print(f"=== Anomaly Detection ===")
        if anomalies:
            for anomaly in anomalies:
                severity = anomaly['severity']
                atype = anomaly['type'].replace('_', ' ').title()

                # Color by severity
                colors = {'HIGH': '\033[91m', 'MEDIUM': '\033[93m', 'LOW': '\033[94m'}
                reset = '\033[0m'
                color = colors.get(severity, '')

                print(f"  {color}[{severity}] {atype} at {anomaly['time']}{reset}")

                if anomaly['type'] == 'high_error_rate':
                    print(f"         Error rate: {anomaly['error_rate']} (expected: {anomaly['expected_rate']})")
                elif anomaly['type'] == 'volume_spike':
                    print(f"         Count: {anomaly['count']} (expected: {anomaly['expected_count']})")
                elif anomaly['type'] == 'time_gap':
                    print(f"         Gap: {anomaly['gap_seconds']}s")
        else:
            print("  No anomalies detected.")
        print()

        analysis['anomalies'] = anomalies

    # Export to JSON
    if args.export_json:
        path = export_to_json(logs, args.export_json, analysis)
        print(f"Report exported to: {path}\n")

    # Export to CSV
    if args.export_csv:
        path = export_to_csv(logs, args.export_csv)
        print(f"Entries exported to: {path}\n")

    # Generate visualization
    if args.visualize:
        path = visualize_errors(logs, args.visualize)
        if path:
            print(f"Chart saved to: {path}\n")

if __name__ == "__main__":
    main()
