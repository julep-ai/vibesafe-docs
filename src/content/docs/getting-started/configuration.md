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
seed = 42                   # Ditto - reproducibility
reasoning_effort = "medium" # optional: minimal|low|medium|high|none
service_tier = "auto"      # optional: pass-through tier flag for providers
base_url = "https://api.openai.com/v1"
api_key_env = "OPENAI_API_KEY"  # Env var name
timeout = 60                # Seconds before giving up

[paths]
checkpoints = ".vibesafe/checkpoints"  # Generated code goes here
cache = ".vibesafe/cache"              # LLM response cache
index = ".vibesafe/index.toml"         # Active checkpoint mapping
generated = "__generated__"             # Import shim directory (deprecated)

[prompts]
function = "vibesafe/templates/function.j2"        # Packaged Jinja2 template for @vibesafe
http = "vibesafe/templates/http_endpoint.j2"       # Packaged template for @vibesafe(kind="http")
cli = "vibesafe/templates/cli_command.j2"         # Packaged template for @vibesafe(kind="cli")

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
@vibesafe(provider="claude")  # Use Claude
def complex_task(x: int) -> int:
    raise VibeCoded()

@vibesafe(provider="local")   # Use local model
def simple_task(x: int) -> int:
    raise VibeCoded()
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
```

**Do commit**:
```
.vibesafe/checkpoints/  # The generated code
.vibesafe/index.toml    # Active checkpoint mapping
vibesafe.toml           # Your config
```

## Custom Prompts

Create `src/vibesafe/templates/my_template.j2` (or ship your own path):

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
@vibesafe(template="vibesafe/templates/my_template.j2")
def my_func(x: int) -> int:
    raise VibeCoded()
```

Available template vars:
- `unit_id` - Full unit ID
- `signature` - Function signature
- `params` - Parameter list
- `doctests` - Parsed test cases
- `docstring` - Full docstring
- `pre_hole_src` - Code before VibeCoded()

## Template Resolution

Vibesafe resolves which prompt template to use for each unit through the following priority:

1. Explicit `template` parameter on the decorator
2. Unit type-based default from `vibesafe.toml`:
   - `http` units → `prompts.http` config value
   - `function` units → `prompts.function` config value
   - `cli` units → `prompts.cli` config value

This is handled automatically by the `resolve_template_id()` helper.

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
