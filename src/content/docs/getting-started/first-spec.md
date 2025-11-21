---
title: Your First Spec
description: Write, compile, and use your first AI-generated function in 5 minutes
sidebar:
  order: 3
---

## What We're Building

A simple `greet(name)` function that returns `"Hello, {name}!"`.

Except you won't write the implementation. AI will. You just write the spec.

**Time**: 5 minutes

## Step 1: Create the Spec File

```bash
mkdir -p app
touch app/__init__.py
vim app/hello.py
```

Write this:

```python
from vibesafe import vibesafe, VibesafeHandled

@vibesafe.func
def greet(name: str) -> str:
    """
    Return a personalized greeting message.

    >>> greet("Alice")
    'Hello, Alice!'
    >>> greet("Bob")
    'Hello, Bob!'
    >>> greet("世界")
    'Hello, 世界!'
    """
    yield VibesafeHandled()
```

That's it. That's your entire spec.

**What each part does:**
- `@vibesafe.func` - "Hey Vibesafe, generate this"
- `name: str -> str` - Type hints tell AI what types to expect
- `"""..."""` - Docstring explains what it does
- `>>> greet("Alice")` - Doctests show expected behavior
- `yield VibesafeHandled()` - "AI, fill in everything after this point"

## Step 2: Scan for It

Check that Vibesafe found your spec:

```bash
vibesafe scan
```

Output:
```
Found 1 vibesafe unit:
  app.hello/greet  [3 doctests]  ⚠ not compiled
```

## Step 3: Compile (Generate Code)

```bash
vibesafe compile --target app.hello/greet
```

What happens:
```
Compiling app.hello/greet...
  ✓ Extracted spec
  ✓ Computed spec hash: 5a72e9...
  ✓ Rendered prompt
  ✓ Called LLM (gpt-4o-mini)
  ✓ Validated implementation
  ✓ Saved checkpoint: 2d46f1...
  ✓ Updated index

Compilation successful!
```

**What just happened:**
1. Parsed your function to extract signature + doctests
2. Computed a unique hash from your spec
3. Generated a prompt from the template
4. Called OpenAI (or your configured provider)
5. Checked the AI's output is valid Python
6. Saved it to `.vibesafe/checkpoints/app/hello/greet/<hash>/impl.py`
7. Updated the registry in `.vibesafe/index.toml`

## Step 4: Test It

```bash
vibesafe test --target app.hello/greet
```

Output:
```
Testing app.hello/greet...
  ✓ Doctest 1/3 passed
  ✓ Doctest 2/3 passed
  ✓ Doctest 3/3 passed
  ✓ Type check passed (mypy)
  ✓ Lint passed (ruff)

[PASS] app.hello/greet
```

The AI-generated code passed all your tests. Nice.

**What got tested:**
- All 3 doctest examples
- Type annotations (mypy)
- Code style (ruff)

## Step 5: Save (Activate) It

```bash
vibesafe save --target app.hello/greet
```

Output:
```
Saving app.hello/greet...
  ✓ Tests passed
  ✓ Checkpoint activated: 2d46f1...
  ✓ Updated index

Checkpoint saved successfully!
```

Now it's "production-ready" (according to your tests).

## Step 6: Use It

Two ways:

**Method 1** - Direct import (recommended):
```python
from app.hello import greet  # Auto-loads from checkpoint

print(greet("World"))  # Hello, World!
```

**Method 2** - Use the runtime loader:
```python
from vibesafe.runtime import load_active

greet = load_active("app.hello/greet")
print(greet("Python"))  # Hello, Python!
```

Test it from command line:
```bash
python -c "from app.hello import greet; print(greet('World'))"
```

Output: `Hello, World!`

## Look at What AI Generated

Curious what the AI wrote?

```bash
# Find the checkpoint directory
ls .vibesafe/checkpoints/app/hello/greet/

# Read the implementation
cat .vibesafe/checkpoints/app/hello/greet/*/impl.py
```

You'll see something like:

```python
def greet(name: str) -> str:
    """
    Return a personalized greeting message.

    >>> greet("Alice")
    'Hello, Alice!'
    >>> greet("Bob")
    'Hello, Bob!'
    >>> greet("世界")
    'Hello, 世界!'
    """
    return f"Hello, {name}!"
```

The AI figured out the pattern from your examples. That's the whole point.

## Common Issues

**"No vibesafe units found"**

Your file isn't in `app/`, `src/`, or project root. Move it:
```bash
mv my_specs.py app/
```

**"API key not found"**

Set it:
```bash
export OPENAI_API_KEY="sk-..."
```

**"Tests failed"**

The AI generated code that doesn't pass your doctests. Options:

1. **Add more examples** to clarify:
```python
>>> greet("Alice")
'Hello, Alice!'
>>> greet("Bob")
'Hello, Bob!'
>>> greet("")  # Edge case
'Hello, !'
```

2. **Be more specific** in docstring:
```python
"""
Return a greeting in the format "Hello, {name}!".
Must include exclamation mark.
Must handle Unicode.
"""
```

3. **Force recompile** and try again:
```bash
vibesafe compile --target app.hello/greet --force
vibesafe test --target app.hello/greet
```

## More Examples

### Mathematical Function

```python
@vibesafe.func
def fibonacci(n: int) -> int:
    """
    Return the nth Fibonacci number (0-indexed).

    >>> fibonacci(0)
    0
    >>> fibonacci(1)
    1
    >>> fibonacci(5)
    5
    >>> fibonacci(10)
    55
    """
    if n < 0:
        raise ValueError("n must be non-negative")
    yield VibesafeHandled()
```

### String Manipulation

```python
@vibesafe.func
def reverse_words(text: str) -> str:
    """
    Reverse the order of words.

    >>> reverse_words("hello world")
    'world hello'
    >>> reverse_words("The quick brown fox")
    'fox brown quick The'
    >>> reverse_words("one")
    'one'
    """
    yield VibesafeHandled()
```

### Data Processing

```python
@vibesafe.func
def word_frequency(text: str) -> dict[str, int]:
    """
    Count word frequency (case-insensitive).

    >>> word_frequency("Hello world hello")
    {'hello': 2, 'world': 1}
    >>> word_frequency("The quick brown fox")
    {'the': 1, 'quick': 1, 'brown': 1, 'fox': 1}
    """
    normalized = text.lower()
    yield VibesafeHandled()
```

Compile and test all at once:
```bash
vibesafe compile
vibesafe test
vibesafe save
```

## What You Just Learned

1. **Write specs** - Function + type hints + doctests
2. **Compile** - AI generates implementation
3. **Test** - Automatic verification
4. **Save** - Mark as production-ready
5. **Use** - Regular Python imports

The workflow is: spec → compile → test → save → import.

Change the spec? Hash changes. Vibesafe knows to regenerate.

## Next Steps

Try:
- **Add edge cases** to your specs (empty strings, None, negative numbers)
- **Write an HTTP endpoint** with `@vibesafe.http`
- **Explore workflows** in [How-To Guides](../how-to-guides/)
- **Understand the system** in [Core Concepts](../core-concepts/)

Or check out working examples:
- **[GitHub Examples](https://github.com/julep-ai/vibesafe/tree/main/examples)** - Real code you can run
