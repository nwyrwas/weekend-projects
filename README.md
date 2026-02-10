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

