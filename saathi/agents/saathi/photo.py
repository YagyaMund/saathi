"""Photo coach measurements. Gemini may add clutter; these checks do not guess a price."""

from __future__ import annotations

from io import BytesIO

from PIL import Image, UnidentifiedImageError

from saathi.copy import photo_note


def review_image(data: bytes) -> dict:
    try:
        image = Image.open(BytesIO(data))
        image.load()
        image = image.convert("RGB")
    except (UnidentifiedImageError, OSError, ValueError):
        return {"issues": ["unread"], "usable": False}
    width, height = image.size
    issues: list[str] = []
    if width < 480 or height < 480:
        issues.append("crop")
    sample = image.resize((40, 40))
    pixels = [sample.getpixel((x, y)) for y in range(sample.height) for x in range(sample.width)]
    brightness = sum(sum(pixel) for pixel in pixels) / (len(pixels) * 3)
    if brightness < 40:
        issues.append("dark")
    if "crop" not in issues:
        gray = [sum(pixel) / 3 for pixel in pixels]
        mean = sum(gray) / len(gray)
        variance = sum((value - mean) ** 2 for value in gray) / len(gray)
        if variance < 25:
            issues.append("blur")
    return {"issues": issues, "usable": not issues}


def note_for(review: dict | None, language: str) -> str:
    issues = list((review or {}).get("issues") or [])
    allowed = [item for item in issues if item in {"dark", "blur", "crop", "clutter", "unread"}]
    return photo_note(allowed, language)
