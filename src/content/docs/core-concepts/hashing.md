---
title: Hash-Locked Checkpoints
description: How Vibesafe guarantees reproducibility through cryptographic hashing
sidebar:
  order: 2
---

## The Problem with AI Code Generation

Ask ChatGPT the same question twice. Get two different answers.

Even with `temperature=0` and a fixed seed, you're at the mercy of:
- API updates
- Model changes
- Prompt variations
- Non-deterministic sampling

This makes AI code generation fundamentally unreliable for production.

## Vibesafe's Solution: Content-Addressed Storage

**Core insight**: If specs are version-controlled and hashing is deterministic, you can trust the system.

We compute a hash from your spec. Same spec = same hash. Always.

Then we use that hash as the key to store the generated code. Like Git for AI-generated implementations.

## Spec Hash (H_spec)

Every spec gets a unique 64-character hex string computed from everything that matters.

### What Goes Into the Hash

```python
H_spec = SHA-256(
    function_signature      # add(a: int, b: int) -> int
    + docstring_normalized  # With examples, whitespace normalized
    + pre_hole_body         # Code before VibesafeHandled()
    + vibesafe_version      # "0.1.2"
    + template_id           # "function" or "http_endpoint"
    + provider_model        # "gpt-4o-mini"
    + temperature           # 0.0
    + seed                  # 42
    + max_tokens            # 4096
    + dependency_digest     # Hashes of referenced code
)
```

### Example

```python
@vibesafe.func
def add(a: int, b: int) -> int:
    """
    Add two integers.

    >>> add(2, 3)
    5
    >>> add(-1, 1)
    0
    """
    yield VibesafeHandled()
```

**Hash inputs**:
- Signature: `add(a: int, b: int) -> int`
- Docstring: `Add two integers.\n\n>>> add(2, 3)\n5\n>>> add(-1, 1)\n0`
- Pre-hole: `` (empty - nothing before yield)
- Version: `0.1.2`
- Template: `function`
- Model: `gpt-4o-mini`
- Temperature: `0.0`
- Seed: `42`
- Dependencies: `` (no external references)

**Result**: `5a72e9c4b3d8f1a2...`

Change anything → different hash → different checkpoint.

## Checkpoint Hash (H_chk)

The checkpoint hash uniquely identifies a specific generated implementation.

```python
H_chk = SHA-256(
    H_spec              # Spec hash (from above)
    + prompt_sha        # SHA-256 of rendered prompt
    + generated_code_sha # SHA-256 of AI output
)
```

**Why three layers?**

1. **H_spec** → Guarantees same input
2. **prompt_sha** → Detects template changes
3. **generated_code_sha** → Verifies actual output

Result: `2d46f1b8e7c3a9d4...`

## Dependency Tracking

Vibesafe tracks what your spec depends on and includes it in the hash.

### Example with Dependencies

```python
from app.utils import validate

@vibesafe.func
def process(data: str) -> dict:
    """
    >>> process("test")
    {'valid': True}
    """
    # References 'validate' - tracked!
    if not validate(data):
        raise ValueError("Invalid")
    yield VibesafeHandled()
```

**Dependency digest includes**:
- Source code of `validate()`
- SHA-256 of `app/utils.py`
- Transitive dependencies (what `validate` depends on)

If `validate()` changes → spec hash changes → regeneration triggered.

## Hash Verification Flows

### Dev Mode

```
1. Import function
2. load_active("app.math/add")
3. Read index → checkpoint hash
4. Compute current spec hash
5. Load checkpoint metadata
6. Compare hashes:
   - Match? ✓ Return function
   - Mismatch? ⚠️ Warn "Spec drift, regenerating..."
              → Auto-compile
              → Return new function
```

### Prod Mode

```
1. Import function
2. load_active("app.math/add")
3. Checkpoint exists?
   - No? ❌ Error: "Checkpoint missing"
4. Load checkpoint metadata
5. Compute current spec hash
6. Compare hashes:
   - Match? ✓ Return function
   - Mismatch? ❌ Error: "Hash mismatch! Spec: 5a72..., Expected: abc123..."
```

## Caching by Spec Hash

LLM responses are cached using the spec hash as the key.

### Cache Structure

```
.vibesafe/cache/
  └── 5a72e9c4.../
      └── response.json  # Cached LLM output
```

**Cache hit conditions**:
- Exact spec hash match
- Cache entry exists and valid
- No `--force` flag

**Benefits**:
- **Speed**: 100ms vs 3s (30x faster)
- **Cost**: No API charges
- **Reproducibility**: Guaranteed identical output

## What Changes the Hash?

### Spec Hash Changes

| Change | Example | New Hash? |
|--------|---------|-----------|
| Modify signature | `add(a, b)` → `sum(x, y)` | Yes |
| Add doctest | Add `>>> add(0, 0)\n0` | Yes |
| Change docstring | "Add" → "Sum" | Yes |
| Update model | `gpt-4o-mini` → `gpt-4o` | Yes |
| Change template | `function.j2` → `custom.j2` | Yes |
| Add pre-hole code | Insert validation | Yes |
| Modify dependency | Change `validate()` | Yes |
| Upgrade vibesafe | v0.1.1 → v0.1.2 | Yes |

### Doesn't Change Hash

| Change | Example | New Hash? |
|--------|---------|-----------|
| Rename file | `math.py` → `arithmetic.py` | No (if module path same) |
| Add comments | Add `# This is...` | No |
| Reformat whitespace | Change indentation | No (normalized) |
| Add other functions | New unrelated `@vibesafe.func` | No |

## Practical Implications

### Deployment Workflow

```bash
# Dev
export VIBESAFE_ENV=dev
vibesafe compile  # Auto-regenerates on drift

# CI
export VIBESAFE_ENV=prod
vibesafe diff     # Fails if drift detected
vibesafe test     # Verifies checkpoints

# Prod
export VIBESAFE_ENV=prod
# Only loads verified checkpoints
# Hash mismatch → deployment fails
```

### Version Control

**Commit**:
```
.vibesafe/checkpoints/  # Implementations + metadata
.vibesafe/index.toml    # Active checkpoint mapping
vibesafe.toml           # Config
app/**/*.py             # Your specs
```

**Ignore**:
```
.vibesafe/cache/        # LLM responses
__generated__/          # Auto-generated shims
```

### Upgrading Vibesafe

Version changes affect spec hashes (vibes afe_version is in the hash).

**Migration**:
```bash
# 1. Upgrade
uv pip install --upgrade vibesafe

# 2. All specs show drift (version changed)
vibesafe diff

# 3. Recompile everything
vibesafe compile --force

# 4. Test
vibesafe test

# 5. Save
vibesafe save

# 6. Commit new checkpoints
git add .vibesafe/
git commit -m "Regenerate for vibesafe v0.1.2"
```

## Security

### Hash Collisions

SHA-256 has ~0 collision probability:
- 2^256 possible hashes
- Would take longer than age of universe to find collision
- Not a practical concern

### Tampering Detection

If someone modifies `impl.py`:
- Checkpoint hash won't match
- Prod mode raises `VibesafeHashMismatch`
- Dev mode warns and regenerates

**Protection**: Treat `.vibesafe/checkpoints/` as immutable in prod.

### Audit Trail

`meta.toml` in each checkpoint includes:
- Spec hash
- Checkpoint hash
- Vibesafe version
- Provider model
- Timestamp
- Dependency digests

Full traceable history of what generated each implementation.

## Next: How Runtime Uses These Hashes

Read [Runtime Modes →](./runtime-modes) to see how dev and prod modes enforce hash verification differently.
