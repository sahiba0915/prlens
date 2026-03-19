# PRLens

PRLens is a developer-friendly CLI for getting **fast, structured AI reviews** of:

- Local files (`prlens review`)
- GitHub PR diffs (`prlens pr`)
- Your local branch changes vs upstream (`prlens changes`)
- Questions about your codebase (`prlens ask`)

It minimizes diffs (keeps only changed lines) to reduce tokens and keep reviews focused.

## Install

### From npm (recommended)

```bash
npm i -g prlens
prlens --help
```

Or run without installing globally:

```bash
npx prlens --help
```

## Quick start

```bash
prlens review README.md
prlens pr 123 --repo vercel/next.js
prlens changes
prlens ask "Where is config loaded?"
prlens version
```

## How to use

### Set env (required for AI)

Pick one LLM provider and set its key (details are in this README under **LLM Provider**). Example (OpenAI-compatible):

```bash
export PRLENS_LLM_PROVIDER=openai-compatible
export PRLENS_LLM_BASE_URL=https://api.openai.com
export PRLENS_LLM_API_KEY=...
export PRLENS_LLM_MODEL=gpt-4o-mini
```

If you want `prlens pr`, also set:

```bash
export PRLENS_GITHUB_TOKEN=...
```

### Run commands

#### Review a file

```bash
prlens review README.md
```

#### Review a GitHub PR

```bash
prlens pr 123 --repo vercel/next.js
```

#### Review local branch changes vs upstream

```bash
prlens changes
```

#### Ask a question about the repo

```bash
prlens ask "Where is config loaded?"
```

#### Print version

```bash
prlens version
```

### Optional: run before every push

Inside a git repo:

```bash
prlens install
```

That installs a `pre-push` hook that runs `prlens changes` before pushing.

## Commands

### `review <file>`

Review a local file and print a structured report.

```bash
prlens review src/index.ts
prlens review src/index.ts --max-chars 8000
```

### `pr <number> --repo <owner/repo>`

Fetch the PR diff from GitHub, minimize it, then generate a structured AI review.

```bash
prlens pr 123 --repo vercel/next.js
prlens pr 123 --repo owner/repo --max-chars 8000
```

### `changes`

Review your local changes vs the configured upstream branch.

Under the hood it runs:

```bash
git diff --unified=0 @{u}...HEAD
```

Examples:

```bash
prlens changes
prlens changes --max-chars 8000
```

If you don’t have an upstream branch set, configure one (example):

```bash
git branch --set-upstream-to origin/main
```

### `ask "<question>"`

Ask a question about your local codebase (PRLens scans a limited subset of files for context).

```bash
prlens ask "How does auth work?"
prlens ask "Where is the database client created?"
```

### `install` (optional)

Installs a git `pre-push` hook that runs `prlens changes` before pushing.

```bash
prlens install
prlens install --force
```

This writes `.git/hooks/pre-push` to run:

```bash
node ./dist/index.js changes
```

## Configuration

### Logging

- `PRLENS_LOG_LEVEL`: `debug` | `info` | `warn` | `error` (default: `info`)

### GitHub (for `prlens pr`)

- `PRLENS_GITHUB_TOKEN` (recommended) or `GITHUB_TOKEN`

### LLM Provider (required for AI)

PRLens supports multiple providers. Pick one.

#### OpenAI / OpenAI-compatible (default)

```bash
export PRLENS_LLM_PROVIDER=openai-compatible
export PRLENS_LLM_BASE_URL=https://api.openai.com
export PRLENS_LLM_API_KEY=...
export PRLENS_LLM_MODEL=gpt-4o-mini
```

Back-compat env vars also work: `OPENAI_BASE_URL`, `OPENAI_API_KEY`, `OPENAI_MODEL`.

#### Gemini

```bash
export PRLENS_LLM_PROVIDER=gemini
export PRLENS_LLM_API_KEY=...
export PRLENS_LLM_MODEL=gemini-2.0-flash
```

#### Anthropic

```bash
export PRLENS_LLM_PROVIDER=anthropic
export PRLENS_LLM_API_KEY=...
export PRLENS_LLM_MODEL=claude-3-5-sonnet-latest
```

## Privacy & security notes

- PRLens sends the content it is reviewing (files/diffs and related context) to the configured LLM provider.
- **Do not** run it on proprietary code if you’re not allowed to share that code with your chosen provider.
- API keys/tokens are read from environment variables (for example `PRLENS_LLM_API_KEY`, `PRLENS_GITHUB_TOKEN`). Don’t commit them to git.

## Development (this repo)

```bash
npm install
npm run build
node dist/index.js --help
```

Optional (for a `prlens` command in your shell while developing):

```bash
npm link
prlens --help
```

## Requirements

- Node.js `>= 20`
- Git (for `prlens changes` and `prlens install`)