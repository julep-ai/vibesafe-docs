---
title: Installation
description: Get Vibesafe installed and running in 5 minutes
sidebar:
  order: 1
---

## What You Need

Three things:
- Python 3.12+ (3.13 works, 3.11 doesn't)
- An API key (OpenAI, Anthropic, or local LLM)
- 5 minutes

That's it.

## Check Your Python

```bash
python --version
```

See 3.12 or higher? You're good. See 3.11 or lower? Time to upgrade.

**Quick upgrade:**
```bash
# macOS
brew install python@3.12

# Ubuntu/Debian
sudo apt install python3.12

# Windows
# Download from python.org
```

## Install uv (Optional but Recommended)

`uv` is ridiculously fast. If you don't have it:

```bash
# macOS/Linux
curl -LsSf https://astral.sh/uv/install.sh | sh

# Windows (PowerShell)
powershell -c "irm https://astral.sh/uv/install.ps1 | iex"
```

Don't want `uv`? Regular `pip` works fine too.

## Install Vibesafe

**Right now** (from source):

```bash
git clone https://github.com/julep-ai/vibesafe.git
cd vibesafe
uv venv
source .venv/bin/activate  # Windows: .venv\Scripts\activate
uv pip install -e ".[dev]"
```

**Soon** (when we publish to PyPI):
```bash
pip install vibesafe
```

**Verify it worked:**
```bash
vibesafe --version
# or
vibe --version  # shorter alias
```

You should see something like `vibesafe 0.2.1`.

## Set Your API Key

Pick your poison:

**OpenAI** (most common):
```bash
export OPENAI_API_KEY="sk-..."
```

**Anthropic** (Claude):
```bash
export ANTHROPIC_API_KEY="sk-ant-..."
```

**Local LLM** (llama.cpp, vLLM, Ollama, etc.):
```bash
export LOCAL_API_KEY="whatever"  # or leave empty
```

**Make it permanent:**
Add the export to your `~/.bashrc` or `~/.zshrc`:
```bash
echo 'export OPENAI_API_KEY="sk-..."' >> ~/.bashrc
```

## Test It

```bash
vibesafe --help
```

See a list of commands (scan, compile, test, etc.)? You're done.

## When Things Break

**"command not found: vibesafe"**

Your venv isn't activated:
```bash
source .venv/bin/activate
```

Still broken? Check your PATH includes `.venv/bin`.

**"ModuleNotFoundError: vibesafe"**

You're not in the right directory:
```bash
cd /path/to/vibesafe
uv pip install -e ".[dev]"
```

**"Python 3.12 required"**

You have an old Python. Upgrade (see above).

**Permission errors**

Don't install system-wide. Use a venv:
```bash
python3.12 -m venv .venv
source .venv/bin/activate
pip install -e ".[dev]"
```

## Optional Stuff

### Code Quality Tools

Already included if you installed with `[dev]`:
- `ruff` (linting/formatting)
- `mypy` (type checking)
- `pyright` (another type checker)

### Editor Plugins

- **VS Code**: Python extension (install from marketplace)
- **PyCharm**: Built-in Python support
- **Vim/Neovim**: ALE or coc-pyright
- **Emacs**: lsp-mode with pyright

### GitHub CLI

Useful if you're contributing:
```bash
# macOS
brew install gh

# Ubuntu/Debian
# (the long command from GitHub's docs)

gh auth login
```

## Next: Configure It

Installation done? Now set up your project:

**[→ Configuration](./configuration)** - Drop a `vibesafe.toml` in your project

Or skip ahead if you're impatient:

**[→ First Spec](./first-spec)** - Write your first AI-generated function
