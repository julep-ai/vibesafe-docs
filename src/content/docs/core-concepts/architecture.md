---
title: Architecture
description: How Vibesafe works - components, data flow, and design decisions
sidebar:
  order: 1
---

## The Core Problem

How do you deploy AI-generated code safely?

Traditional approaches all fail:
- **One-shot generation**: Copy from ChatGPT → Deploy → Code drifts → Break
- **On-demand generation**: Call LLM at runtime → Slow, non-deterministic, needs API keys in prod
- **Manual review**: Doesn't scale, error-prone, bottleneck

We needed something better.

## The Vibesafe Approach

Three ideas:

1. **Specs are source code** - Version-controlled, readable, what you review in PRs
2. **Generated code is an artifact** - Like binaries. Same source → same binary (via hashing)
3. **Two modes for two contexts** - Dev mode generates on-the-fly. Prod mode loads frozen checkpoints

This gives you: reproducible builds, drift detection, and zero runtime overhead.

## Data Flow (The Happy Path)

You write a spec:
```python
@vibesafe
def add(a: int, b: int) -> int:
    """>>> add(2, 3)\n5"""
    raise VibeCoded()
```

Here's what happens when you run `vibesafe compile`:

```
1. AST Parser reads your code
    ├─ Extracts signature: add(a: int, b: int) -> int
    ├─ Finds doctests: [(2, 3) → 5]
    └─ Captures code before raise: (none in this case)

2. Hasher computes spec hash
   ├─ Combines: signature + doctests + model config + template ID
   └─ Result: 5a72e9... (64-char hex string)

3. Cache check
   ├─ Look in .vibesafe/cache/5a72e9.../
   ├─ Hit? Return cached response
   └─ Miss? Continue to step 4

4. Prompt renderer (Jinja2)
   ├─ Load template: vibesafe/templates/function.j2
   ├─ Inject: signature, doctests, types
   └─ Output: Complete prompt string

5. Provider calls LLM
   ├─ POST to OpenAI API (or configured provider)
   ├─ With: temperature=0.0, seed=42 (determinism)
   └─ Response: "def add(a, b): return a + b"

6. Validator checks output
   ├─ Parse to AST (syntax valid?)
   ├─ Function name matches? ✓
   ├─ Signature matches? ✓
   └─ Strip markdown if wrapped

7. Checkpoint writer saves it
   ├─ Compute checkpoint hash: SHA-256(spec_hash + prompt + code)
   ├─ Result: 2d46f1... (checkpoint ID)
   ├─ Write to: .vibesafe/checkpoints/app/math/add/2d46f1.../
   │   ├─ impl.py (the generated code)
   │   └─ meta.toml (timestamp, hashes, model)
   └─ Update .vibesafe/index.toml with mapping

8. Test harness runs
   ├─ Execute doctests (all must pass)
   ├─ Type check with mypy
   ├─ Lint with ruff
   └─ Result: PASS or FAIL

9. If tests pass and you run `vibesafe save`:
    ├─ Mark checkpoint as "active" in index
```

**At runtime** (when you `from app.math import add`):
```
1. Decorator intercepts the import
2. Calls load_active("app.math/add")
3. Reads .vibesafe/index.toml → checkpoint hash
4. Loads .vibesafe/checkpoints/.../impl.py
5. In prod mode: verifies spec hash matches
6. Returns the function object
```

**Zero LLM calls.** Just loading a Python file.

## Components

### 1. Decorators & Registry (`core.py`)

The public API and global unit registry:

```python
@vibesafe  # For regular functions
@vibesafe(kind="http", method="POST", path="/calculate")  # For FastAPI endpoints
```

Decorators register units to a module-level registry:

```python
# Access the global registry
from vibesafe.core import get_registry, get_unit

registry = get_registry()  # All registered units
unit_meta = get_unit("app.math/add")  # Specific unit metadata
```

Stores metadata (provider, template, model) and defers to runtime loader.

### 2. AST Parser (`ast_parser.py`)

Reads your Python code and extracts:
- Function signature (name, params, return type)
- Docstring with doctests
- Code before `VibeCoded()` (pre-hole body)
- Referenced variables (for dependency hashing)

Uses Python's `ast` module. Handles both sync and async functions.

### 3. Hasher (`hashing.py`)

Computes two types of hashes:

**Spec hash** (H_spec):
```python
SHA-256(
    signature +
    docstring_normalized +
    pre_hole_body +
    vibesafe_version +
    template_id +
    provider_model +
    temperature +
    seed +
    dependency_digest
)
```

**Checkpoint hash** (H_chk):
```python
SHA-256(
    H_spec +
    prompt_sha +
    generated_code_sha
)
```

Same spec hash → same checkpoint (if cached).

### 4. Code Generator (`codegen.py`)

Orchestrates the whole pipeline:
1. Extract spec (AST parser)
2. Compute hashes
3. Check cache
4. Render prompt (Jinja2)
5. Call provider (LLM)
6. Validate output
7. Write checkpoint
8. Update index

Handles retries and error recovery.

### 5. Provider System (`providers.py`)

Abstracts LLM backends. Currently supports:
- OpenAI (gpt-4o, gpt-4o-mini)
- Anthropic (via OpenAI-compatible endpoint)
- Local models (llama.cpp, vLLM, Ollama)

All providers implement:
```python
class Provider(Protocol):
    def complete(self, prompt: str, **kwargs) -> str:
        """Generate code from prompt"""
```

Wrapped in a caching layer for speed.

### 6. Runtime Loader (`runtime.py`)

Loads active checkpoints at import time:

```python
def load_active(unit_id: str) -> Callable:
    # 1. Read index for checkpoint hash
    # 2. Load impl.py from checkpoint
    # 3. In prod: verify spec hash matches (fail fast)
    # 4. Return function object
```

**Dev mode**: Warns on mismatch, auto-regenerates
**Prod mode**: Errors on mismatch, no generation

### 7. Test Harness (`testing.py`)

Runs quality gates:
- **Doctests**: Extract examples, run them, verify output
- **Type checking**: `mypy --strict`
- **Linting**: `ruff check`
- **Optional**: Hypothesis property-based tests

All must pass before you can `save`.

### 8. CLI (`cli.py`)

The commands you run:
- `scan` - Find decorated functions
- `compile` - Generate implementations
- `test` - Run verification
- `save` - Activate checkpoints
- `status` - Show project state
- `diff` - Detect drift
- `check` - Verify checksums
- `repl` - Interactive mode

## File Structure

```
your-project/
├── vibesafe.toml              # Config
├── app/
│   └── math.py                # Your spec
└── .vibesafe/
    ├── index.toml             # Active checkpoint mapping
    ├── checkpoints/           # Generated implementations
    │   └── app/math/add/
    │       └── 2d46f1.../
    │           ├── impl.py    # AI-generated code
    │           └── meta.toml  # Metadata
    └── cache/                 # LLM response cache
        └── 5a72e9...json
```

**What to commit:**
- `vibesafe.toml` (config)
- `app/math.py` (your specs)
- `.vibesafe/checkpoints/` (generated code)
- `.vibesafe/index.toml` (checkpoint mapping)

**What to ignore:**
- `.vibesafe/cache/` (optional)

## Design Decisions

**Q: Why not generate at runtime?**

A: Non-deterministic. Slow. Requires API keys in production. Defeats reproducibility.

**Q: Why not just commit generated code directly?**

A: You'd lose the spec-to-code mapping. No way to detect drift. Specs are more readable.

**Q: Why hash everything?**

A: Reproducibility. If you can't guarantee same input → same output, you can't trust the system.

**Q: Why two modes (dev/prod)?**

A: Different contexts need different trade-offs. Dev wants speed. Prod wants safety.

**Q: Why not support editing generated code?**

A: Hash verification detects tampering. Regeneration overwrites edits. You'd fight the system. Better: edit spec, regenerate.

**Q: Why make tests mandatory?**

A: Without tests, how do you know the AI generated correct code? Doctests are lightweight and already standard Python.

## Performance Characteristics

**Compilation** (dev mode, cache miss):
- AST parsing: ~10ms
- Hash computation: ~5ms
- Prompt rendering: ~50ms
- **LLM call: 2-5 seconds** ← Bottleneck
- Validation: ~10ms
- Checkpoint write: ~20ms
- **Total: ~3-6 seconds**

**Compilation** (cache hit):
- Skip LLM call
- **Total: ~100ms**

**Runtime** (import):
- Index lookup: ~1ms
- File read: ~5ms
- Hash verification (prod): ~5ms
- **Total: ~20ms**

Prod mode is **150-300x faster** than dev mode because no LLM calls.

## Security Considerations

**API keys**: Never commit them. Use environment variables.

**Tampering**: Hash verification detects modified checkpoints. Prod mode fails fast.

**Supply chain**: Checkpoint metadata includes vibesafe version, model, timestamp. Full audit trail.

**Sandboxing**: Optional sandbox mode (experimental) isolates test execution.

## What's Next

Now you understand the architecture. Dive deeper:

- **[Hashing →](./hashing)** - How reproducibility actually works
- **[Runtime Modes →](./runtime-modes)** - Dev vs prod in detail
- **[Provider System →](./providers)** - LLM integration specifics
