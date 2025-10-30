---
title: Runtime Modes
description: Dev vs prod - different behaviors for different contexts
sidebar:
  order: 3
---

## The Core Tension

You want different things in different environments:

**Development**: "Let me iterate fast. Auto-regenerate when I change things."

**Production**: "Don't surprise me. Error if anything is unexpected. No LLM calls."

These are contradictory. Vibesafe gives you both.

## Two Modes

Set with `env` in `vibesafe.toml` or `VIBESAFE_ENV` environment variable:

```toml
[project]
env = "dev"  # or "prod"
```

Or:
```bash
export VIBESAFE_ENV=prod
```

## Dev Mode (`env = "dev"`)

**Philosophy**: Speed over safety. Auto-fix problems.

### Behavior

When you import a decorated function:

```python
from app.math import add
result = add(2, 3)
```

**What happens**:

1. **Checkpoint exists + hash matches**
   - ✅ Load it, use it
   - Fast (~20ms)

2. **Checkpoint exists + hash mismatch**
   - ⚠️ Print warning: "Spec drift detected"
   - Auto-regenerate (calls LLM)
   - Slow (~3s)
   - Use new version

3. **No checkpoint**
   - ⚠️ Print warning: "Checkpoint missing, generating..."
   - Auto-generate
   - Use new version

4. **Generation fails**
   - ❌ Error (can't proceed)

### Example Output

```
⚠️ Spec drift detected for app.math/add
   Current spec hash:  5a72e9...
   Saved spec hash:    abc123...
   Cause: Modified docstring

Regenerating app.math/add...
  ✓ Compiled successfully
  ✓ Tests passed

Using newly generated implementation.
```

### When to Use

- Local development
- Writing new specs
- Iterating on doctests
- Debugging generated code
- Experimenting with prompts

### Pros

- Fast iteration
- Automatic fixes
- No manual recompilation

### Cons

- Slower (LLM calls)
- Requires API key
- Non-deterministic (first load after change)

## Prod Mode (`env = "prod"`)

**Philosophy**: Safety over speed. Fail fast on problems.

### Behavior

When you import a decorated function:

```python
from app.math import add
result = add(2, 3)
```

**What happens**:

1. **Checkpoint exists + hash matches**
   - ✅ Load it, use it
   - Fast (~20ms)

2. **Checkpoint exists + hash mismatch**
   - ❌ Raise `VibesafeHashMismatch`
   - Deployment fails

3. **No checkpoint**
   - ❌ Raise `VibesafeCheckpointMissing`
   - Deployment fails

4. **Generation disabled**
   - Never calls LLM
   - Never uses API key

### Example Errors

**Hash mismatch**:
```python
VibesafeHashMismatch: Spec hash mismatch for app.math/add

Current spec hash:  5a72e9c4b3d8f1a2...
Expected hash:      abc123def456...

This means the spec has changed since the checkpoint was created.

Actions:
1. Revert spec changes, OR
2. Switch to dev mode temporarily
3. Recompile: vibesafe compile --target app.math/add --force
4. Test: vibesafe test --target app.math/add
5. Save: vibesafe save --target app.math/add
6. Commit and redeploy
```

**Missing checkpoint**:
```python
VibesafeCheckpointMissing: No checkpoint found for app.math/add

The function has not been compiled yet.

Actions:
1. Switch to dev: export VIBESAFE_ENV=dev
2. Compile: vibesafe compile --target app.math/add
3. Test: vibesafe test --target app.math/add
4. Save: vibesafe save --target app.math/add
5. Commit checkpoints
6. Switch back to prod
```

### When to Use

- Production deployments
- Staging environments
- CI/CD verification
- Reproducible builds
- Shared team environments

### Pros

- Fast (no LLM calls)
- No API key needed
- Deterministic
- Safe (errors on unexpected state)

### Cons

- Strict (fails on drift)
- Requires pre-compilation
- Less convenient for iteration

## Mode Comparison

| Aspect | Dev | Prod |
|--------|-----|------|
| **Speed** | Slow (first load after change) | Fast (always) |
| **API key** | Required | Not required |
| **Hash mismatch** | Warn + regenerate | Hard error |
| **Missing checkpoint** | Generate | Hard error |
| **LLM calls** | Yes (on demand) | Never |
| **Determinism** | First load non-deterministic | Fully deterministic |
| **Use for** | Development | Deployments |

## Switching Strategies

### Local Development

```bash
# Default: dev mode
export VIBESAFE_ENV=dev

# Iterate freely
vim app/math.py
python -c "from app.math import add; print(add(2, 3))"
# Auto-regenerates if changed
```

### Pre-Commit Check

```bash
# Before committing, verify in prod mode
export VIBESAFE_ENV=prod
vibesafe diff  # Check for drift
vibesafe test  # Verify checkpoints

# If all green, commit
git add .vibesafe/ app/
git commit -m "Add math functions"
```

### CI/CD Pipeline

```yaml
# .github/workflows/ci.yml
jobs:
  verify:
    env:
      VIBESAFE_ENV: prod  # Strict mode
    steps:
      - run: vibesafe diff  # Fail if drift
      - run: vibesafe test  # Verify valid
```

### Production Deployment

```dockerfile
# Dockerfile
ENV VIBESAFE_ENV=prod

# Copy pre-generated checkpoints
COPY .vibesafe/checkpoints /app/.vibesafe/checkpoints
COPY .vibesafe/index.toml /app/.vibesafe/index.toml

# No API keys needed
# No generation at runtime
```

## Hybrid Workflows

### Dev with Prod Verification

```bash
# 1. Develop in dev mode
export VIBESAFE_ENV=dev
vim app/math.py
python app.py  # Auto-regenerates

# 2. Tests pass? Switch to prod for final check
export VIBESAFE_ENV=prod
vibesafe diff   # Should show no drift
vibesafe test   # Should pass with frozen checkpoints

# 3. Commit if all green
git add .
git commit -m "New features"
```

### CI with Conditional Regeneration

```yaml
# Allow CI to regenerate if approved (use carefully!)
jobs:
  verify:
    steps:
      - name: Try prod mode
        run: vibesafe diff && vibesafe test
        continue-on-error: true

      - name: Regenerate if drift (manual approval required)
        if: failure() && github.event.inputs.approve_regen == 'true'
        run: |
          export VIBESAFE_ENV=dev
          vibesafe compile --force
          vibesafe test
          vibesafe save

      - name: Commit if regenerated
        if: failure() && github.event.inputs.approve_regen == 'true'
        run: |
          git add .vibesafe/
          git commit -m "CI: Regenerate checkpoints"
          git push
```

## Troubleshooting

### "Works in dev, fails in prod"

**Problem**: Local tests pass (dev mode) but CI fails (prod mode).

**Causes**:
1. Uncommitted checkpoints
2. Spec drift between local and CI
3. Different vibesafe versions

**Fix**:
```bash
# Check status
vibesafe diff

# Verify everything committed
git status .vibesafe/

# Match versions
vibesafe --version  # Local
# Compare with CI

# Regenerate and commit
export VIBESAFE_ENV=dev
vibesafe compile --force
vibesafe test
vibesafe save
git add .vibesafe/
git commit -m "Fix checkpoint drift"
```

### "Prod mode too strict"

**Problem**: Want some flexibility in production.

**Not recommended**, but you can:
1. Use dev mode selectively (env var per service)
2. Pre-generate everything before deploy
3. Monitor drift as warning, not error (custom wrapper)

**Better**: Embrace prod mode strictness. It catches real problems.

### "How do I test prod mode locally?"

```bash
# 1. Ensure all compiled and saved
export VIBESAFE_ENV=dev
vibesafe compile
vibesafe test
vibesafe save

# 2. Switch to prod
export VIBESAFE_ENV=prod

# 3. Run your app
python app.py  # Should work if no drift

# 4. Try changing a spec
vim app/math.py  # Modify something
python app.py    # Should error with hash mismatch
```

## Performance

### Dev Mode (First Load After Change)

```
Import → Hash mismatch detected
       → Call LLM (2-5s) ← Slow
       → Save checkpoint (20ms)
       → Load and return (5ms)
Total: ~3-6 seconds
```

### Dev Mode (Cached)

```
Import → Hash matches
       → Load checkpoint (5ms)
       → Return
Total: ~20ms
```

### Prod Mode (Always)

```
Import → Hash matches (verified)
       → Load checkpoint (5ms)
       → Return
Total: ~20ms
```

**Prod is 150-300x faster** than dev when regeneration is needed.

## Security

### API Key Exposure

**Dev mode**: Requires API key in environment
- Risk: Key leakage
- Mitigation: Use `.env` files, rotate keys

**Prod mode**: No API key needed
- Risk: None (no generation)
- Benefit: Smaller attack surface

### Code Injection

**Dev mode**: LLM generates code dynamically
- Risk: Malicious prompts → bad code
- Mitigation: Tests, sandboxing, review

**Prod mode**: Only loads pre-verified checkpoints
- Risk: Minimal (code reviewed before deploy)
- Benefit: Deterministic, safe

## Next Steps

Now you understand the two modes. Continue with:

- **[How-To Guides →](../how-to-guides/)** - Practical workflows
- **[Operations →](../operations/)** - Deployment best practices
- **[Reference →](../reference/)** - Complete CLI documentation
