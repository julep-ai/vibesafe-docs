---
title: CLI Reference
description: Complete command-line interface documentation
---

This page documents all Vibesafe CLI commands, their options, and usage patterns.

## vibesafe scan

Scan project for vibesafe-decorated functions and register them.

### Usage

```bash
vibesafe scan
```

### Options

None. (The --write-shims flag has been removed as of v0.2)

### Output

Displays a table of discovered units with their IDs, doctest counts, and checkpoint
 status.

Example

```bash
$ vibesafe scan
Scanning for vibesafe units...

┏━━━━━━━━━━━━━━━━━━━━━━━━┳━━━━━━━━━┳━━━━━━━━━━━━┓
┃ Unit ID                ┃ Tests   ┃ Status     ┃
┡━━━━━━━━━━━━━━━━━━━━━━━━╇━━━━━━━━━╇━━━━━━━━━━━━┩
│ app.math.ops/sum_str   │ 2       │ ✓ active   │
│ app.api.routes/get_user│ 3       │ ✗ missing  │
└────────────────────────┴─────────┴────────────┘

Total units: 2
```

:::note[Shims Deprecated]
Prior to v0.2, vibesafe scan --write-shims would generate import shims.
This is no longer needed—import functions directly from their modules.
:::

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