# 🚀 Weekend Projects

A collection of practical projects built to reinforce Data Structures & Algorithms concepts. Each project directly applies patterns commonly tested in technical interviews at top tech companies.

## 📋 Overview

This repository contains 4 projects that progressively build on core DSA patterns:

| Project | DSA Pattern | Status |
|---------|-------------|--------|
| URL Shortener | Arrays & Hashmaps | ✅ Complete |
| Log Analyzer CLI | Two Pointers & Sliding Window | 🔲 Not Started |
| Browser History Manager | Linked Lists & Stacks | 🔲 Not Started |
| File System Navigator | Trees & Recursion | 🔲 Not Started |

## 🛠️ Projects

### 1. URL Shortener
A URL shortening service similar to bit.ly that demonstrates hashmap operations for O(1) lookup and storage.

**Key Concepts:**
- Hashmap for bidirectional URL mapping
- Base62 encoding for short code generation
- Collision handling

**Features:**
- Shorten any URL to a unique code
- Expand short codes back to original URLs
- Duplicate URL detection
- CLI interface

**Bonus Features:**
- URL validation (http/https only)
- Expiration dates for short URLs
- Click analytics tracking (count & timestamps)
- Custom short codes (user-specified aliases)
- Data persistence to JSON file
- Rate limiting (10 requests per 60 seconds)

**Run it:**
```bash
cd url_shortener
python main.py
```

---

### 2. Log Analyzer CLI
A command-line tool that analyzes log files to find patterns, error spikes, and trends using sliding window techniques.

**Key Concepts:**
- Sliding window for time-based analysis
- Two pointers for range queries
- Pattern detection with frequency counting

**Features:**
- Parse standard log formats
- Detect error spikes within configurable time windows
- Find repeated error patterns
- Generate summary statistics

**Run it:**
```bash
cd log-analyzer
python cli.py server.log --spikes 5 --patterns
```

---

### 3. Browser History Manager
A browser navigation system with back/forward functionality implemented using stacks and doubly linked lists.

**Key Concepts:**
- Stack-based state management
- Doubly linked list traversal
- Pointer manipulation

**Features:**
- Visit new URLs
- Navigate back/forward with multi-step support
- History tracking
- Edge case handling (start/end of history)

**Run it:**
```bash
cd browser-history
python cli.py
```

---

### 4. File System Navigator
A tree-based file explorer that traverses directories using recursive algorithms.

**Key Concepts:**
- Tree data structure modeling
- DFS/BFS traversal algorithms
- Recursion for hierarchical operations

**Features:**
- `ls`, `cd`, `pwd`, `mkdir`, `touch` commands
- `tree` - recursive directory display
- `find` - search files by name
- `du` - calculate directory sizes

**Run it:**
```bash
cd file-navigator
python cli.py
```

## 🎯 Learning Objectives

Each project reinforces specific interview patterns:
```
Week 1: Arrays & Hashmaps
        └── URL Shortener (O(1) lookup, key-value storage)

Week 2: Two Pointers & Sliding Window
        └── Log Analyzer (time-range analysis, pattern detection)

Week 3: Linked Lists & Stacks
        └── Browser History (LIFO operations, pointer manipulation)

Week 4: Trees & Recursion
        └── File Navigator (tree traversal, recursive algorithms)
```

## 🧰 Tech Stack

- **Language:** Python 3.10+
- **Testing:** pytest
- **CLI:** argparse
- **Data Structures:** Built from scratch (no external DSA libraries)

## 📁 Repository Structure
```
weekend-projects/
├── url-shortener/
│   ├── main.py
│   ├── shortener.py
│   ├── utils.py
│   ├── tests/
│   └── README.md
├── log-analyzer/
│   ├── cli.py
│   ├── analyzer.py
│   ├── patterns.py
│   ├── sample_logs/
│   ├── tests/
│   └── README.md
├── browser-history/
│   ├── cli.py
│   ├── browser.py
│   ├── doubly_linked.py
│   ├── tests/
│   └── README.md
├── file-navigator/
│   ├── cli.py
│   ├── navigator.py
│   ├── tree_node.py
│   ├── tests/
│   └── README.md
└── README.md
```

## 🚦 Getting Started
```bash
# Clone the repository
git clone https://github.com/nwyrwas/weekend-projects.git

# Navigate to a project
cd weekend-projects/url-shortener

# Run the project
python main.py

# Run tests
pytest tests/
```

## 📈 Why These Projects?

LeetCode teaches you patterns. These projects teach you to **apply** them.

Building real applications with DSA concepts:
- Demonstrates deeper understanding to interviewers
- Creates portfolio pieces beyond "I solved 500 LeetCode problems"
- Shows you can translate algorithmic thinking into working software

## 📝 License

MIT License - feel free to use these projects for your own learning!

---

*Built as part of a 4-week coding interview preparation program focusing on pattern recognition over problem memorization.*