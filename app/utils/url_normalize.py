"""
URL normalization for duplicate detection.
"""

from __future__ import annotations

from urllib.parse import parse_qsl, urlencode, urlparse, urlunparse

TRACKING_PARAMS = frozenset({
    "utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content",
    "fbclid", "gclid", "mc_eid", "ref", "source",
})


def normalize_url(url: str) -> str:
    """Normalize a URL for duplicate comparison."""
    parsed = urlparse(url.strip())
    scheme = (parsed.scheme or "https").lower()
    host = (parsed.hostname or "").lower()
    port = parsed.port
    if port and ((scheme == "http" and port == 80) or (scheme == "https" and port == 443)):
        port = None

    path = parsed.path or "/"
    if path != "/":
        path = path.rstrip("/")

    # Strip tracking query params, sort remaining
    query_pairs = [
        (k, v) for k, v in parse_qsl(parsed.query, keep_blank_values=True)
        if k.lower() not in TRACKING_PARAMS
    ]
    query_pairs.sort()
    query = urlencode(query_pairs)

    netloc = host
    if port:
        netloc = f"{host}:{port}"

    return urlunparse((scheme, netloc, path, "", query, ""))
