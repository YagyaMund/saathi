"""One Gemini call for the Cataloguer and the Photo coach. Prompts are not logged."""

from __future__ import annotations

import json
import logging

from saathi.config import gemini_api_key, load_settings

logger = logging.getLogger("saathi")

_QUIET = ("google.genai", "google_genai", "httpx", "httpcore")

SYSTEM = """You fill one JSON object for a shop listing. You are the Cataloguer and the Photo coach.
Return only this shape:
{"photo": {"issues": [], "usable": true}, "listing": {"title": null, "category": null, "fabric": null, "colour": null, "price_inr": null, "stock": null}}
photo is null when there is no image.
issues may contain only dark, blur, crop, clutter.
listing fields are null when the seller did not say them and they are not plain in the photo.
Price and stock come only from her words or her voice, never from a guess.
Fabric only if she named it.
Colour if she named it or it is plain in the photo.
Do not search the web. Do not add customers, phones, addresses, or payments.
"""


class GeminiError(RuntimeError):
    pass


def _quiet_loggers() -> None:
    for name in _QUIET:
        logging.getLogger(name).setLevel(logging.WARNING)


def _loads(raw: str) -> dict:
    text = (raw or "").strip()
    if text.startswith("```"):
        text = text.strip("`")
        text = text.removeprefix("json").strip()
    data = json.loads(text)
    if not isinstance(data, dict):
        raise GeminiError("Gemini did not return a listing")
    return data


class GeminiExtractor:
    """Calls the Gemini Developer API with this seller's key. Not Vertex."""

    def __init__(self, api_key: str, model: str) -> None:
        self.api_key = api_key
        self.model = model

    @classmethod
    def from_env(cls) -> "GeminiExtractor":
        key = gemini_api_key()
        if not key:
            raise GeminiError("Gemini key is not set")
        return cls(key, load_settings().model)

    def extract(
        self,
        *,
        text: str,
        image: bytes | None,
        image_mime: str | None,
        audio: bytes | None,
        audio_mime: str | None,
        language: str,
    ) -> dict:
        _quiet_loggers()
        try:
            from google import genai
            from google.genai import types
        except Exception as exc:  # pragma: no cover - dependency is installed with the app
            raise GeminiError("Gemini client is unavailable") from exc
        parts = []
        if image:
            parts.append(types.Part.from_bytes(data=image, mime_type=image_mime or "image/jpeg"))
        if audio:
            parts.append(types.Part.from_bytes(data=audio, mime_type=audio_mime or "audio/mp3"))
        spoken = text.strip() or "The seller sent media and did not type."
        parts.append(types.Part.from_text(text=f"Language for names: {language}.\n{spoken}"))
        client = genai.Client(api_key=self.api_key, vertexai=False)
        try:
            response = client.models.generate_content(
                model=self.model,
                contents=[types.Content(role="user", parts=parts)],
                config=types.GenerateContentConfig(
                    system_instruction=SYSTEM,
                    temperature=0,
                    response_mime_type="application/json",
                ),
            )
            data = _loads(response.text or "")
        except GeminiError:
            raise
        except Exception as exc:
            raise GeminiError("Gemini did not return a listing") from exc
        logger.info("gemini_listing_ok")
        return _sanitize(data)


def _sanitize(data: dict) -> dict:
    listing_in = data.get("listing") if isinstance(data.get("listing"), dict) else {}
    listing = {
        "title": _text(listing_in.get("title")),
        "category": _text(listing_in.get("category")),
        "fabric": _text(listing_in.get("fabric")),
        "colour": _text(listing_in.get("colour")),
        "price_inr": _whole(listing_in.get("price_inr")),
        "stock": _whole(listing_in.get("stock")),
    }
    photo_in = data.get("photo")
    photo = None
    if isinstance(photo_in, dict):
        issues = [
            item
            for item in (photo_in.get("issues") or [])
            if item in {"dark", "blur", "crop", "clutter"}
        ]
        photo = {"issues": issues, "usable": not issues}
    return {"photo": photo, "listing": listing}


def _text(value: object) -> str | None:
    if value is None:
        return None
    text = " ".join(str(value).split())
    if not text or text.lower() == "null":
        return None
    return text[:80]


def _whole(value: object) -> int | None:
    if value is None or value == "":
        return None
    try:
        number = int(value)
    except (TypeError, ValueError):
        return None
    if number <= 0 or number >= 10_000_000:
        return None
    return number
