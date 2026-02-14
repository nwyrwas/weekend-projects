# Log Analyzer CLI

A command-line tool that analyzes log files to find patterns, errors, and trends using sliding window techniques.

## Run it

```bash
cd log_analyzer
python cli.py sample_logs/server.log --errors
python cli.py sample_logs/server.log --spikes 5
python cli.py sample_logs/server.log --patterns
```

## Run tests

```bash
pytest tests/ -v
```
