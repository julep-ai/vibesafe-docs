---
title: CLI Reference
description: Complete command-line interface documentation
---

This page documents all Vibesafe CLI commands, their options, and usage patterns.

## vibesafe scan

Discover and list all vibesafe units in the project.

### Usage

```bash
vibesafe scan [OPTIONS]
```

### Options

#### `--write-shims` (DEPRECATED)

**Status:** Deprecated as of v0.2.0

Previously generated import shims in `__generated__/` directory. Now prints a deprecation warning.

```bash
$ vibesafe scan --write-shims

Found 3 units...

⚠ Shims are deprecated and no longer needed.

Migration: Remove --write-shims from your scripts. Import generated code directly
through the runtime loader.
```

### Output

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

### Status Indicators

| Indicator | Meaning | Action |
|-----------|---------|--------|
| `✓ checkpoint active` | Compiled, tested, saved | Ready to use |
| `⚠ no checkpoint` | Not yet compiled | Run `vibesafe compile --target <unit>` |
| `⚠ drift detected` | Spec changed | Recompile with `--force` |
| `❌ tests failing` | Checkpoint exists but broken | Fix spec or regenerate |

## Other Commands

### vibesafe compile

Generate implementations for vibesafe units.

```bash
vibesafe compile [OPTIONS] [TARGET]
```

**Options:**
- `--target UNIT`: Compile specific unit
- `--force`: Recompile even if no drift detected

### vibesafe test

Run tests for vibesafe units.

```bash
vibesafe test [OPTIONS] [TARGET]
```

**Options:**
- `--target UNIT`: Test specific unit
- `--all`: Include full test suite

### vibesafe save

Activate compiled checkpoints.

```bash
vibesafe save [OPTIONS] [TARGET]
```

**Options:**
- `--target UNIT`: Save specific unit
- `--freeze-http-deps`: Record FastAPI dependency versions

### vibesafe status

Show project status and drift detection.

```bash
vibesafe status
```

### vibesafe diff

Compare spec vs active checkpoint.

```bash
vibesafe diff [OPTIONS] [TARGET]
```

**Options:**
- `--target UNIT`: Compare specific unit

### vibesafe repl

Interactive development mode.

```bash
vibesafe repl [OPTIONS] [TARGET]
```

**Options:**
- `--target UNIT`: Work on specific unit

## Global Options

All commands support:

- `--help`: Show help
- `--version`: Show version
- `--verbose`: Verbose output

## Environment Variables

- `VIBESAFE_ENV=dev|prod`: Override environment mode
- `OPENAI_API_KEY`: API key for OpenAI provider
- `ANTHROPIC_API_KEY`: API key for Anthropic provider