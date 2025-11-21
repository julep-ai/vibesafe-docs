---
title: API Examples
description: Code examples for Vibesafe API usage patterns
---

This page contains executable code examples for common Vibesafe API usage patterns.

## Registry Access

### Getting the Global Registry

```python
from vibesafe.core import get_registry

# Get all registered units
registry = get_registry()

# Registry is a dict: unit_id -> metadata
for unit_id, meta in registry.items():
    print(f"{unit_id}: {meta['type']}")

# Example output:
# examples.math.ops/sum_str: function
# examples.api.routes/hello_endpoint: http
```

### Getting Specific Unit Metadata

```python
from vibesafe.core import get_unit

# Get metadata for a specific unit
meta = get_unit("examples.math.ops/sum_str")

if meta:
    print(f"Type: {meta['type']}")
    print(f"Module: {meta['module']}")
    print(f"Function: {meta['qualname']}")
    print(f"Provider: {meta.get('provider', 'default')}")
    print(f"Template: {meta.get('template', 'default')}")
```

## Template Resolution

```python
from vibesafe.config import resolve_template_id, get_config

# Resolve template for HTTP endpoint
http_meta = {"kind": "http"}
template = resolve_template_id(http_meta)
print(f"HTTP template: {template}")
# Output: vibesafe/templates/http_endpoint.j2

# Resolve template for function with custom template
custom_meta = {"kind": "function", "template": "custom/my_template.j2"}
template = resolve_template_id(custom_meta)
print(f"Custom template: {template}")
# Output: custom/my_template.j2

# Use custom config
config = get_config()
config.prompts.function = "custom/func.j2"
template = resolve_template_id({"kind": "function"}, config)
print(f"Function template: {template}")
# Output: custom/func.j2
```

## Runtime Loading

```python
from vibesafe.runtime import load_active

# Load a compiled function directly
sum_func = load_active("examples.math.ops/sum_str")
result = sum_func("2", "3")
print(f"Result: {result}")
# Output: 5
```

## Migration from Old API

### Old Pattern (Deprecated)

```python
# OLD - Don't use this
from vibesafe import vibesafe

@vibesafe.func
def greet(name: str) -> str:
    """
    >>> greet("World")
    'Hello, World!'
    """
    yield VibesafeHandled()

@vibesafe.http
def create_user(name: str, email: str) -> dict:
    """
    POST endpoint to create a user.
    """
    yield VibesafeHandled()
```

### New Pattern (v0.2)

```python
# NEW - Use this
from vibesafe import vibesafe, VibeCoded

@vibesafe
def greet(name: str) -> str:
    """
    >>> greet("World")
    'Hello, World!'
    """
    raise VibeCoded()

@vibesafe(kind="http")
def create_user(name: str, email: str) -> dict:
    """
    POST endpoint to create a user.

    >>> create_user("Alice", "alice@example.com")
    {'id': '...', 'name': 'Alice', 'email': 'alice@example.com'}
    """
    raise VibeCoded()

@vibesafe(kind="cli")
def deploy(env: str, dry_run: bool = False) -> None:
    """
    Deploy application to environment.

    >>> deploy("staging", dry_run=True)
    # Outputs deployment plan
    """
    raise VibeCoded()
```
