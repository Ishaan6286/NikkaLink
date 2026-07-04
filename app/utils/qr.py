"""
QR code generation utility.

Generates PNG-format QR codes in memory for shortened URLs.
"""

from __future__ import annotations

import io

import qrcode
from qrcode.constants import ERROR_CORRECT_M


def generate_qr_code(
    url: str,
    *,
    box_size: int = 10,
    border: int = 4,
) -> bytes:
    """
    Generate a QR code PNG image for the given URL.

    Args:
        url: The URL to encode.
        box_size: Size of each box in pixels.
        border: Border thickness in boxes.

    Returns:
        PNG image bytes.
    """
    qr = qrcode.QRCode(
        version=None,  # auto-determine
        error_correction=ERROR_CORRECT_M,
        box_size=box_size,
        border=border,
    )
    qr.add_data(url)
    qr.make(fit=True)

    img = qr.make_image(fill_color="black", back_color="white")

    buffer = io.BytesIO()
    img.save(buffer, format="PNG")
    buffer.seek(0)
    return buffer.getvalue()
