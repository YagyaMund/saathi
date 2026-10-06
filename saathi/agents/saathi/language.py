"""Pick English or Hindi from the message in front of us."""

from __future__ import annotations

import re

DEVANAGARI = re.compile(r"[\u0900-\u097F]")
LATIN = re.compile(r"[A-Za-z]")


def detect_language(text: str, fallback: str = "en") -> str:
    if DEVANAGARI.search(text or ""):
        return "hi"
    if LATIN.search(text or ""):
        return "en"
    if fallback in ("en", "hi"):
        return fallback
    return "en"
