---
title: Configuration
description: Set up vibesafe.toml in 30 seconds
sidebar:
  order: 2
---

## The Absolute Minimum

Create `vibesafe.toml` in your project root:

```toml
[provider.default]
kind = "openai-compatible"
model = "gpt-4o-mini"
api_key_env = "OPENAI_API_KEY"
```

Done. Everything else has sensible defaults.

## What Each Thing Does

```toml
[project]
python = ">=3.12"  # Minimum Python version
env = "dev"        # "dev" = auto-regen, "prod" = frozen

[provider.default]
kind = "openai-compatible"  # Only option right now
model = "gpt-4o-mini"       # Any OpenAI-compatible model
temperature = 0.0           # Keep at 0.0 for determinism
seed = 42                   # Ditto - reproducibility
base_url = "https://api.openai.com/v1"
api_key_env = "OPENAI_API_KEY"  # Env var name
timeout = 60                # Seconds before giving up

[paths]
checkpoints = ".vibesafe/checkpoints"  # Generated code goes here
cache = ".vibesafe/cache"              # LLM response cache
index = ".vibesafe/index.toml"         # Active checkpoint mapping
generated = "__generated__"             # Import shims directory

[prompts]
function = "prompts/function.j2"        # Jinja2 template for @vibesafe.func
http = "prompts/http_endpoint.j2"       # Jinja2 template for @vibesafe.http

[sandbox]
enabled = false  # Sandboxed test execution (experimental)
timeout = 10     # Test timeout
```

## Common Setups

### Claude (Anthropic)

```toml
[provider.default]
kind = "openai-compatible"
model = "claude-3-5-sonnet-20241022"
base_url = "https://api.anthropic.com/v1"
api_key_env = "ANTHROPIC_API_KEY"
temperature = 0.0
seed = 42
```

Then: `export ANTHROPIC_API_KEY="sk-ant-..."`

### Local LLM

```toml
[provider.default]
kind = "openai-compatible"
model = "llama-3-70b-instruct"
base_url = "http://localhost:8000/v1"  # Your server
api_key_env = "LOCAL_API_KEY"          # Optional
temperature = 0.0
```

Works with llama.cpp, vLLM, Ollama, LM Studio, etc.

### Multiple Providers

```toml
[provider.default]
kind = "openai-compatible"
model = "gpt-4o-mini"
api_key_env = "OPENAI_API_KEY"

[provider.claude]
kind = "openai-compatible"
model = "claude-3-5-sonnet-20241022"
base_url = "https://api.anthropic.com/v1"
api_key_env = "ANTHROPIC_API_KEY"

[provider.local]
kind = "openai-compatible"
model = "llama-3-70b"
base_url = "http://localhost:8000/v1"
```

Use in code:
```python
@vibesafe.func(provider="claude")  # Use Claude
def complex_task(x: int) -> int:
    yield VibesafeHandled()

@vibesafe.func(provider="local")   # Use local model
def simple_task(x: int) -> int:
    yield VibesafeHandled()
```

## Environment Variables

Override config with env vars:

```bash
export VIBESAFE_ENV=prod         # Override project.env
export OPENAI_API_KEY=sk-...     # API key for default provider
export ANTHROPIC_API_KEY=sk-ant  # API key for claude provider
```

## Git Setup

Add to `.gitignore`:

```
.vibesafe/cache/      # LLM responses (optional to exclude)
__generated__/        # Can regenerate with --write-shims
```

**Do commit**:
```
.vibesafe/checkpoints/  # The generated code
.vibesafe/index.toml    # Active checkpoint mapping
vibesafe.toml           # Your config
```

## Custom Prompts

Create `prompts/my_template.j2`:

```jinja2
Generate a Python function that:
- Has signature: {{ signature }}
- Passes these tests:
{%- for test in doctests %}
{{ test.source }} → {{ test.want }}
{%- endfor %}

Return only the function code, no explanations.
```

Use it:
```python
@vibesafe.func(template="prompts/my_template.j2")
def my_func(x: int) -> int:
    yield VibesafeHandled()
```

Available template vars:
- `unit_id` - Full unit ID
- `signature` - Function signature
- `params` - Parameter list
- `doctests` - Parsed test cases
- `docstring` - Full docstring
- `pre_hole_src` - Code before VibesafeHandled()

## Dev vs Prod Mode

**Dev mode** (`env = "dev"`):
- Hash mismatch? Warn and regenerate
- Missing checkpoint? Generate automatically
- Use for: Local development, iteration

**Prod mode** (`env = "prod"`):
- Hash mismatch? Error, fail deployment
- Missing checkpoint? Error
- Use for: CI/CD, staging, production

Switch with env var:
```bash
export VIBESAFE_ENV=prod
```

## Troubleshooting

**"API key not found"**

Check:
1. `echo $OPENAI_API_KEY` shows your key
2. `api_key_env` in config matches env var name
3. Virtual environment is activated (if using one)

**"Invalid model"**

Verify:
1. Model name is correct for your provider
2. API key has access to that model
3. `base_url` is correct

**"Template not found"**

Ensure:
1. Path is relative to project root
2. File exists and is readable
3. Use forward slashes (even on Windows)

## Next Steps

Config done? Write your first spec:

**[→ First Spec](./first-spec)** - Create an AI-generated function

Or learn about scanning:

**[→ Scanning](./scanning)** - Find vibesafe units in your codebase
