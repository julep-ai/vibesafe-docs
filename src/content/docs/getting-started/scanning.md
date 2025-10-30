---
title: Scanning
description: Find and manage vibesafe units in your codebase
sidebar:
  order: 4
---

## What Scan Does

```bash
vibesafe scan
```

Finds all `@vibesafe.func` and `@vibesafe.http` decorated functions in your project and shows their status.

That's it. Simple.

## Example Output

```
Found 5 vibesafe units:

  app.math/add               [4 doctests]  ✓ checkpoint active
  app.math/fibonacci         [4 doctests]  ✓ checkpoint active
  app.api.routes/calculate   [2 doctests]  ⚠ no checkpoint
  app.api.routes/health      [1 doctest]   ⚠ drift detected
  app.utils.text/reverse     [3 doctests]  ✓ checkpoint active

Summary:
  Total units: 5
  Active checkpoints: 3
  Missing checkpoints: 1
  Drifted specs: 1
```

**Reading the output:**
- `app.math/add` - Unit ID (module path + function name)
- `[4 doctests]` - Number of test examples
- Status indicator (see below)

## Status Indicators

| Indicator | Meaning | What To Do |
|-----------|---------|------------|
| `✓ checkpoint active` | Compiled, tested, saved | Nothing - it's ready |
| `⚠ no checkpoint` | Not yet compiled | `vibesafe compile --target <unit>` |
| `⚠ drift detected` | Spec changed | Recompile with `--force` |
| `❌ tests failing` | Checkpoint exists but broken | Fix spec or regenerate |

## Generate Import Shims

```bash
vibesafe scan --write-shims
```

Creates `__generated__/` directory with import wrappers.

Example - for `app/math.py`:
```python
# __generated__/app/math.py (auto-generated)
from vibesafe.runtime import load_active

add = load_active("app.math/add")
fibonacci = load_active("app.math/fibonacci")
```

**When to run:**
- After adding new specs
- After renaming functions
- After reorganizing modules

## What Gets Scanned

Vibesafe looks in:
- `app/**/*.py` ✓
- `src/**/*.py` ✓
- `*.py` (root level) ✓
- `tests/**/*.py` ❌
- `examples/**/*.py` ❌

**Workaround** for non-standard locations:

Create `specs.py` in project root:
```python
from my_custom_dir.functions import *
```

Then scan finds everything imported there.

## Common Workflows

### After Writing New Specs

```bash
# 1. Check vibesafe found them
vibesafe scan

# 2. Regenerate shims
vibesafe scan --write-shims

# 3. Compile new ones
vibesafe compile
```

### Before Compiling

```bash
# See what needs work
vibesafe scan

# Look for:
# - "no checkpoint" → needs compile
# - "drift detected" → needs recompile
```

### Check for Drift

```bash
# Quick check
vibesafe scan

# Detailed diff
vibesafe diff
```

## Unit IDs

Format: `module.path/function_name`

Examples:

| File | Function | Unit ID |
|------|----------|---------|
| `app/math.py` | `add` | `app.math/add` |
| `app/api/routes.py` | `health` | `app.api.routes/health` |
| `src/utils.py` | `validate` | `src.utils/validate` |
| `helpers.py` | `format` | `helpers/format` |

Use in commands:
```bash
vibesafe compile --target app.math/add
vibesafe test --target app.api.routes/health
vibesafe save --target src.utils/validate
```

## Troubleshooting

**"No vibesafe units found"**

Your files aren't in `app/`, `src/`, or root.

Fix:
```bash
# Move to scanned location
mkdir -p app
mv my_specs.py app/

# Or create root-level import
echo "from my_module.funcs import *" > specs.py
```

**"Import error during scan"**

Python can't import your files.

Fix:
```bash
# Install dependencies
uv pip install -e ".[dev]"

# Check for syntax errors
ruff check .

# Fix PYTHONPATH if needed
export PYTHONPATH="${PWD}:${PYTHONPATH}"
```

**"Shims not updating"**

Force regeneration:
```bash
rm -rf __generated__/
vibesafe scan --write-shims
```

## Scan Automation

### Pre-Commit Hook

```bash
# .git/hooks/pre-commit
#!/bin/bash
vibesafe scan --write-shims
vibesafe diff
if [ $? -ne 0 ]; then
    echo "Drift detected! Run: vibesafe compile --force"
    exit 1
fi
```

### CI Pipeline

```yaml
# .github/workflows/ci.yml
- name: Check vibesafe status
  run: |
    vibesafe scan
    vibesafe diff  # Fails if drift detected
```

### Makefile

```makefile
.PHONY: scan
scan:
	vibesafe scan --write-shims
	vibesafe status
```

## Next Steps

Scanning done? Now you know what's in your project.

**Continue with:**
- **[How-To Guides](../how-to-guides/)** - Task-focused workflows
- **[Core Concepts](../core-concepts/)** - Understand how it works
- **[Reference](../reference/)** - Complete CLI documentation
