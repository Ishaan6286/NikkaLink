"""
URL safety utilities — SSRF prevention and validation for external fetches.
"""

from __future__ import annotations

import ipaddress
import socket
from urllib.parse import urlparse

from app.core.exceptions import ValidationError

BLOCKED_HOSTS = frozenset({"localhost", "127.0.0.1", "0.0.0.0", "::1"})
BLOCKED_SCHEMES = frozenset({"file", "ftp", "gopher", "data", "javascript", "vbscript"})
PRIVATE_NETWORKS = (
    ipaddress.ip_network("10.0.0.0/8"),
    ipaddress.ip_network("172.16.0.0/12"),
    ipaddress.ip_network("192.168.0.0/16"),
    ipaddress.ip_network("127.0.0.0/8"),
    ipaddress.ip_network("169.254.0.0/16"),
    ipaddress.ip_network("::1/128"),
    ipaddress.ip_network("fc00::/7"),
    ipaddress.ip_network("fe80::/10"),
)


def _is_private_ip(ip_str: str) -> bool:
    try:
        addr = ipaddress.ip_address(ip_str)
    except ValueError:
        return True
    if addr.is_private or addr.is_loopback or addr.is_link_local or addr.is_reserved:
        return True
    return any(addr in net for net in PRIVATE_NETWORKS)


def validate_external_url(url: str) -> str:
    """
    Validate a URL is safe to fetch externally.

    Raises ValidationError for SSRF-risky or malformed URLs.
  """
    parsed = urlparse(url.strip())
    scheme = (parsed.scheme or "").lower()
    if scheme not in {"http", "https"}:
        raise ValidationError("Only http and https URLs are allowed")
    if scheme in BLOCKED_SCHEMES:
        raise ValidationError(f"Scheme '{scheme}' is not allowed")

    host = (parsed.hostname or "").lower().strip(".")
    if not host:
        raise ValidationError("URL must include a hostname")
    if host in BLOCKED_HOSTS or host.endswith(".local"):
        raise ValidationError("Internal hostnames are not allowed")

    # Resolve hostname and block private IPs
    try:
        resolved = socket.getaddrinfo(host, None, proto=socket.IPPROTO_TCP)
    except socket.gaierror as exc:
        raise ValidationError(f"Cannot resolve hostname: {host}") from exc

    for family, _, _, _, sockaddr in resolved:
        ip = sockaddr[0]
        if _is_private_ip(ip):
            raise ValidationError("URLs pointing to private networks are not allowed")

    if len(url) > 2048:
        raise ValidationError("URL exceeds maximum length of 2048 characters")

    return url.strip()
