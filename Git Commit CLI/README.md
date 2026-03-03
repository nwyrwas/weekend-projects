# smart-commit

[![CI](https://github.com/your-username/smart-commit/actions/workflows/ci.yml/badge.svg)](https://github.com/your-username/smart-commit/actions/workflows/ci.yml)
[![npm version](https://img.shields.io/npm/v/smart-commit.svg)](https://www.npmjs.com/package/smart-commit)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

AI-powered conventional commit message generator using Claude. Analyzes your staged git changes and generates meaningful commit messages following the [Conventional Commits](https://www.conventionalcommits.org/) v1.0.0 specification.

## Installation

```bash
npm install -g smart-commit
```

## Quick Start

1. Set your Anthropic API key:

```bash
export ANTHROPIC_API_KEY=sk-your-key-here
```

Or run the interactive setup wizard:

```bash
smart-commit config
```

2. Stage your changes and run:

```bash
git add .
smart-commit
```

## Usage

### Basic Usage

```bash
# Generate a commit message for staged changes
smart-commit

# Preview the message without committing
smart-commit --dry-run

# Force a specific commit type
smart-commit --type feat

# Generate in a different language
smart-commit --lang es

# Use a different Claude model
smart-commit --model claude-opus-4-5-20250101

# Show version
smart-commit --version

# Show help
smart-commit --help
```

### Interactive Workflow

When you run `smart-commit`, it will:

1. Capture your staged changes via `git diff --staged`
2. Send the diff to Claude for analysis
3. Display the generated commit message with syntax highlighting
4. Prompt you to **accept**, **abort**, or **edit** the message

```
Generated commit message:

  feat(auth): add JWT token refresh endpoint

? Use this message?
❯ Yes - commit with this message
  No - abort
  Edit - open in $EDITOR
```

## Configuration

### Setup Wizard

Run `smart-commit config` to launch the interactive configuration wizard.

### Config File

Configuration is stored in `~/.smartcommitrc.json`:

```json
{
  "apiKey": "sk-your-key-here",
  "model": "claude-3-5-haiku-20241022",
  "maxDiffLines": 500,
  "language": "english",
  "includeScope": true,
  "temperature": 0.3
}
```

### Config Reference

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `apiKey` | `string` | `""` | Anthropic API key. Falls back to `ANTHROPIC_API_KEY` env var. |
| `model` | `string` | `"claude-3-5-haiku-20241022"` | Claude model to use for generation. |
| `maxDiffLines` | `number` | `500` | Maximum diff lines to send to the API. Larger diffs are truncated. |
| `language` | `string` | `"english"` | Language for the commit message description. |
| `includeScope` | `boolean` | `true` | Whether to include a scope in the commit type (e.g., `feat(auth):`). |
| `temperature` | `number` | `0.3` | AI model temperature (0-1). Lower = more deterministic. |

### Environment Variables

| Variable | Description |
|----------|-------------|
| `ANTHROPIC_API_KEY` | Fallback API key when not set in config file |

## CLI Flags

| Flag | Description |
|------|-------------|
| `--dry-run` | Print the generated message without committing |
| `--type <type>` | Force a specific commit type (feat, fix, docs, etc.) |
| `--lang <language>` | Generate the message in a specific language |
| `--model <model>` | Override the Claude model |
| `--version` | Show version number |
| `--help`, `-h` | Show help |

## Supported Commit Types

Following [Conventional Commits](https://www.conventionalcommits.org/):

- `feat` - A new feature
- `fix` - A bug fix
- `docs` - Documentation changes
- `style` - Code style changes (formatting, semicolons, etc.)
- `refactor` - Code refactoring (no feature or bug fix)
- `perf` - Performance improvements
- `test` - Adding or updating tests
- `chore` - Maintenance tasks
- `ci` - CI/CD changes
- `build` - Build system changes
- `revert` - Reverting a previous commit

## Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch: `git checkout -b feat/my-feature`
3. Make your changes
4. Run tests: `npm test`
5. Run linting: `npm run lint`
6. Commit using conventional commits
7. Push and open a pull request

### Development Setup

```bash
git clone https://github.com/your-username/smart-commit.git
cd smart-commit
npm install
npm run build
npm test
```

### Scripts

| Script | Description |
|--------|-------------|
| `npm run build` | Compile TypeScript |
| `npm test` | Run tests |
| `npm run test:coverage` | Run tests with coverage |
| `npm run lint` | Run ESLint |
| `npm run lint:fix` | Fix ESLint issues |
| `npm run format` | Format with Prettier |
| `npm run format:check` | Check formatting |

## License

MIT
