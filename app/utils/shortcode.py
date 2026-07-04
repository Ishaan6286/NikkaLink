"""
Short code generator using cryptographically secure Base62 encoding.

Base62 character set: a-z, A-Z, 0-9
7-character codes yield 62^7 ≈ 3.5 trillion unique combinations.
"""

from __future__ import annotations

import secrets
import string

# Base62 alphabet (no ambiguous characters like 0/O, 1/l issues are
# acceptable for URL shorteners since they are copy-pasted, not typed)
ALPHABET = string.ascii_letters + string.digits  # a-zA-Z0-9


def generate_short_code(length: int = 7) -> str:
    """
    Generate a cryptographically random short code.

    Args:
        length: Number of characters (default 7).

    Returns:
        A random Base62 string.
    """
    return "".join(secrets.choice(ALPHABET) for _ in range(length))
