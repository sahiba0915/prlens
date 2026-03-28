# GitReviewPilot

**Fast, structured AI reviews** for your code and PRs — with a focused, token-friendly CLI.

Use it for:

- Local files (`gitreviewpilot review`)
- GitHub PR diffs (`gitreviewpilot pr`)
- Your local branch changes vs upstream (`gitreviewpilot changes`)
- Questions about your codebase (`gitreviewpilot ask`)

It minimizes diffs (keeps only changed lines) to reduce tokens and keep reviews focused.

## Install

### From npm (recommended)

```bash
npm i -g gitreviewpilot
gitreviewpilot --help
```

Or run without installing globally:

```bash
npx gitreviewpilot --help
```

## Quick start

```bash
gitreviewpilot review README.md
gitreviewpilot pr 123 --repo vercel/next.js
gitreviewpilot changes
gitreviewpilot ask "Where is config loaded?"
gitreviewpilot version
```

## How to use

### Set env (required for AI)

Pick one LLM provider and set its key (details are in this README under **LLM Provider**). Example (OpenAI-compatible):

```bash
export GITREVIEWPILOT_LLM_PROVIDER=openai-compatible
export GITREVIEWPILOT_LLM_BASE_URL=https://api.openai.com
export GITREVIEWPILOT_LLM_API_KEY=...
export GITREVIEWPILOT_LLM_MODEL=gpt-4o-mini
```

If you want `gitreviewpilot pr`, also set:

```bash
export GITREVIEWPILOT_GITHUB_TOKEN=...
```

### Run commands

#### Review a file

```bash
gitreviewpilot review README.md
```

#### Review a GitHub PR

```bash
gitreviewpilot pr 123 --repo vercel/next.js
```

#### Review local branch changes vs upstream

```bash
gitreviewpilot changes
```

#### Ask a question about the repo

```bash
gitreviewpilot ask "Where is config loaded?"
```

#### Print version

```bash
gitreviewpilot version
```

### Optional: run before every push

Inside a git repo:

```bash
gitreviewpilot install
```

That installs a `pre-push` hook that runs `gitreviewpilot changes` before pushing.

## Commands

### `review <file>`

Review a local file and print a structured report.

```bash
gitreviewpilot review src/index.ts
gitreviewpilot review src/index.ts --max-chars 8000
```

### `pr <number> --repo <owner/repo>`

Fetch the PR diff from GitHub, minimize it, then generate a structured AI review.

```bash
gitreviewpilot pr 123 --repo vercel/next.js
gitreviewpilot pr 123 --repo owner/repo --max-chars 8000
```

### `changes`

Review your local changes vs the configured upstream branch.

Under the hood it runs:

```bash
git diff --unified=0 @{u}...HEAD
```

Examples:

```bash
gitreviewpilot changes
gitreviewpilot changes --max-chars 8000
```

If you don’t have an upstream branch set, configure one (example):

```bash
git branch --set-upstream-to origin/main
```

### `ask "<question>"`

Ask a question about your local codebase (GitReviewPilot scans a limited subset of files for context).

```bash
gitreviewpilot ask "How does auth work?"
gitreviewpilot ask "Where is the database client created?"
```

### `install` (optional)

Installs a git `pre-push` hook that runs `gitreviewpilot changes` before pushing.

```bash
gitreviewpilot install
gitreviewpilot install --force
```

This writes `.git/hooks/pre-push` to run:

```bash
node ./dist/index.js changes
```

## Configuration

Optional: add `gitreviewpilot.config.json` at the project root (for example to customize `focus` areas for prompts).

### Logging

- `GITREVIEWPILOT_LOG_LEVEL`: `debug` | `info` | `warn` | `error` (default: `info`)

### GitHub (for `gitreviewpilot pr`)

- `GITREVIEWPILOT_GITHUB_TOKEN` (recommended) or `GITHUB_TOKEN`

### LLM Provider (required for AI)

GitReviewPilot supports multiple providers. Pick one.

#### OpenAI / OpenAI-compatible (default)

```bash
export GITREVIEWPILOT_LLM_PROVIDER=openai-compatible
export GITREVIEWPILOT_LLM_BASE_URL=https://api.openai.com
export GITREVIEWPILOT_LLM_API_KEY=...
export GITREVIEWPILOT_LLM_MODEL=gpt-4o-mini
```

Back-compat env vars also work: `OPENAI_BASE_URL`, `OPENAI_API_KEY`, `OPENAI_MODEL`.

#### Gemini

```bash
export GITREVIEWPILOT_LLM_PROVIDER=gemini
export GITREVIEWPILOT_LLM_API_KEY=...
export GITREVIEWPILOT_LLM_MODEL=gemini-2.0-flash
```

#### Anthropic

```bash
export GITREVIEWPILOT_LLM_PROVIDER=anthropic
export GITREVIEWPILOT_LLM_API_KEY=...
export GITREVIEWPILOT_LLM_MODEL=claude-3-5-sonnet-latest
```

## Privacy & security notes

- GitReviewPilot sends the content it is reviewing (files/diffs and related context) to the configured LLM provider.
- **Do not** run it on proprietary code if you’re not allowed to share that code with your chosen provider.
- API keys/tokens are read from environment variables (for example `GITREVIEWPILOT_LLM_API_KEY`, `GITREVIEWPILOT_GITHUB_TOKEN`). Don’t commit them to git.

## Development (this repo)

```bash
npm install
npm run build
node dist/index.js --help
```

Optional (for a `gitreviewpilot` command in your shell while developing):

```bash
npm link
gitreviewpilot --help
```

## Requirements

- Node.js `>= 20`
- Git (for `gitreviewpilot changes` and `gitreviewpilot install`)
