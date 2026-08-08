# Contributing to Casemove

Thank you for your interest in contributing to Casemove! This document provides guidelines and information about contributing to this project.

## Communication

- **Discord**: Join our server at [https://discord.gg/FqT6eQY3K](https://discord.gg/FqT6eQY3K)

## How to Contribute

### Reporting Bugs

If you find a bug, please open an issue with the following information:

- A clear and descriptive title
- Steps to reproduce the behavior
- Expected behavior
- Actual behavior
- Screenshots or logs (if applicable)
- Your environment (OS, browser, version, etc.)

### Suggesting Features

Feature requests are welcome! Please open an issue and include:

- A clear and descriptive title
- A detailed description of the proposed feature
- Why this feature would be useful
- Any examples or mockups (if applicable)

### Contributing Code

#### Getting Started

**Prerequisites:**

- Node.js >= 22
- npm or yarn

**Setup:**

1. Fork the repository on GitHub.
2. Clone your fork locally:
   ```bash
   git clone https://github.com/YOUR_USERNAME/Casemove.git
   cd Casemove
   ```
3. Install dependencies:
   ```bash
   npm install
   ```
4. Start the development server:
   ```bash
   npm run dev
   ```
5. Run the test suite:
   ```bash
   npm test
   ```

### Improving Documentation

Documentation improvements are always welcome! This includes:

- Fixing typos or unclear wording
- Adding missing documentation
- Improving code comments
- Adding examples or tutorials

### Testing

Help improve test coverage and reliability:

- Write unit tests for untested code
- Add integration tests for critical paths
- Report flaky or broken tests

## Branch Naming Convention

Please use the following branch naming patterns:

- `feature/short-description`
- `fix/issue-number-description`
- `docs/what-changed`

## Commit Message Format

This project follows the [Conventional Commits](https://www.conventionalcommits.org/) specification.

```
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

**Types:**

| Type | Description |
|------|-------------|
| `feat` | A new feature |
| `fix` | A bug fix |
| `docs` | Documentation only changes |
| `style` | Changes that do not affect the meaning of the code |
| `refactor` | A code change that neither fixes a bug nor adds a feature |
| `perf` | A code change that improves performance |
| `test` | Adding missing tests or correcting existing tests |
| `chore` | Changes to the build process or auxiliary tools |

## Pull Request Process

1. Fork the repository and create your branch from `main`.
2. Make your changes and add tests if applicable.
3. Ensure the test suite passes.
4. Submit a pull request with a clear description of your changes.

## Code Style

- **Linter**: ESLint
- **Formatter**: Prettier

## Thank You

Thank you for taking the time to contribute to Casemove! Every contribution, no matter how small, makes a difference.
