"""Saathi decides who speaks. Price, stock, and the sheet write happen in code."""

from __future__ import annotations

import logging
from dataclasses import dataclass, field

from saathi.config import gemini_configured, load_settings
from saathi.copy import (
    ASK,
    ATTACHMENT,
    FIELD_LABEL,
    GEMINI_FAILED,
    NEGOTIATOR_OFF,
    OFF_DUTY,
    SHEET_MISSED,
    VOICE_NEEDS_KEY,
    WELCOME,
    lang,
    staff_text,
    wrote_text,
)
from saathi.gemini_client import GeminiExtractor
from saathi.language import detect_language
from saathi.parse import (
    empty_listing,
    first_missing,
    interpret_short,
    is_floor_talk,
    is_greeting,
    is_staff_query,
    parse_listing,
    scrub,
)
from saathi.photo import note_for, review_image
from saathi.scribe import commit_row

logger = logging.getLogger("saathi")


@dataclass
class TurnResult:
    language: str
    text: str
    cards: list[dict] = field(default_factory=list)
    wrote: bool = False
    row: dict | None = None
    draft: dict | None = None
    pending_field: str | None = None
    mode: str = "reply"
    keep_previous_image: bool = False


def handle_turn(
    text: str,
    *,
    image: bytes | None = None,
    image_mime: str | None = None,
    audio: bytes | None = None,
    audio_mime: str | None = None,
    image_is_new: bool = False,
    draft: dict | None = None,
    attachment_unreachable: bool = False,
    extractor: object | None = None,
    staff: dict[str, bool] | None = None,
    written_at: str | None = None,
) -> TurnResult:
    staff = staff or load_settings().staff
    fallback = draft.get("language") if draft else "en"
    language = detect_language(text or "", str(fallback or "en"))
    raw = text or ""

    if is_greeting(raw) and not image and not audio:
        return TurnResult(language=language, text=WELCOME[lang(language)], keep_previous_image=True)
    if is_staff_query(raw):
        return TurnResult(language=language, text=staff_text(staff, language), keep_previous_image=True)

    parsed = parse_listing(raw, language)
    if is_floor_talk(raw) and not parsed.get("title"):
        return TurnResult(language=language, text=NEGOTIATOR_OFF[lang(language)], keep_previous_image=True)

    if not raw.strip() and not image and not audio:
        if attachment_unreachable:
            return TurnResult(language=language, text=ATTACHMENT[lang(language)])
        return TurnResult(language=language, text=WELCOME[lang(language)])

    working = bool(raw.strip() or image or audio)
    if working and not staff.get("cataloguer", False):
        return TurnResult(language=language, text=OFF_DUTY[lang(language)]["cataloguer"])

    if audio and not raw.strip() and not image and not _extractor_or_none(extractor):
        return TurnResult(language=language, text=VOICE_NEEDS_KEY[lang(language)])

    short_fill = bool(draft) and not parsed.get("title") and not image_is_new and not audio
    mode = "rehearsal"
    if short_fill and draft is not None:
        listing = _fill_draft(draft, parsed, raw, language)
        review = None
    else:
        listing = empty_listing()
        listing["language"] = language
        review = None
        model_listing = None
        active = extractor
        if active is None and gemini_configured() and (raw.strip() or image or audio):
            active = GeminiExtractor.from_env()
        if active is not None and (raw.strip() or image or audio):
            mode = "gemini"
            try:
                extracted = active.extract(  # type: ignore[attr-defined]
                    text=raw,
                    image=image,
                    image_mime=image_mime,
                    audio=audio,
                    audio_mime=audio_mime,
                    language=language,
                )
            except Exception:
                logger.warning("gemini_failed")
                return TurnResult(language=language, text=GEMINI_FAILED[lang(language)], mode="gemini")
            model_listing = extracted.get("listing") if isinstance(extracted, dict) else None
            if image and isinstance(extracted, dict) and extracted.get("photo"):
                review = extracted["photo"]
        if image and review is None and staff.get("photo_coach", False):
            review = review_image(image)
        listing = _merge(parsed, model_listing, raw, language)
        if review and staff.get("photo_coach", False):
            listing["photo_note"] = note_for(review, language)

    listing["language"] = language
    missing = first_missing(listing)
    extra = ATTACHMENT[lang(language)] if attachment_unreachable else ""
    if missing:
        question = ASK[lang(language)][missing]
        body = _with_photo(listing.get("photo_note"), question, language)
        if extra:
            body = f"{body}\n\n{extra}"
        return TurnResult(
            language=language,
            text=body,
            cards=[_need_card(language, missing)],
            draft=_public_draft(listing),
            pending_field=missing,
            mode=mode,
            keep_previous_image=not parsed.get("title"),
        )

    if not staff.get("scribe", False):
        return TurnResult(
            language=language,
            text=OFF_DUTY[lang(language)]["scribe"],
            draft=_public_draft(listing),
            pending_field=None,
            mode=mode,
            keep_previous_image=True,
        )

    result = commit_row(
        title=str(listing["title"]),
        fabric=str(listing["fabric"]),
        colour=str(listing["colour"]),
        price_inr=int(listing["price_inr"]),
        stock=int(listing["stock"]),
        category=str(listing.get("category") or ""),
        photo_note=str(listing.get("photo_note") or ""),
        language=language,
        image=image,
        written_at=written_at,
    )
    if result["status"] != "written":
        field_name = result["missing"][0]
        return TurnResult(
            language=language,
            text=ASK[lang(language)].get(field_name, ASK[lang(language)]["title"]),
            draft=_public_draft(listing),
            pending_field=field_name,
            mode=mode,
            keep_previous_image=True,
        )
    row = result["row"]
    spoken = wrote_text(row["sku"], row["title"], row["price_inr"], row["stock"], language)
    body = _with_photo(row.get("photo_note"), spoken, language)
    if result.get("sheet_error"):
        body = f"{body}\n\n{SHEET_MISSED[lang(language)]}"
    if extra:
        body = f"{body}\n\n{extra}"
    return TurnResult(
        language=language,
        text=body,
        cards=[_row_card(row, result["destination"])],
        wrote=True,
        row=row,
        mode=mode,
    )


def _extractor_or_none(extractor: object | None) -> object | None:
    if extractor is not None:
        return extractor
    if gemini_configured():
        return GeminiExtractor.from_env()
    return None


def _fill_draft(draft: dict, parsed: dict, text: str, language: str) -> dict:
    listing = dict(draft)
    for key in ("title", "category", "fabric", "colour", "price_inr", "stock"):
        if parsed.get(key) not in (None, ""):
            listing[key] = parsed[key]
    missing = first_missing(listing)
    if missing:
        value = interpret_short(text, missing, language)
        if value not in (None, ""):
            listing[missing] = value
    return listing


def _merge(parsed: dict, model_listing: dict | None, text: str, language: str) -> dict:
    listing = empty_listing()
    model = model_listing or {}
    typed = bool(text.strip())
    for key in ("title", "category", "fabric", "colour", "price_inr", "stock"):
        if parsed.get(key) not in (None, ""):
            listing[key] = parsed[key]
        elif not typed and model.get(key) not in (None, ""):
            listing[key] = model[key]
        elif key == "colour" and not listing.get("colour") and model.get("colour"):
            listing[key] = model["colour"]
        elif key == "title" and not listing.get("title") and model.get("title"):
            listing[key] = scrub(str(model["title"]))[:80]
        elif key == "category" and not listing.get("category") and model.get("category"):
            listing[key] = model["category"]
    listing["language"] = language
    return listing


def _public_draft(listing: dict) -> dict:
    kept = {
        "title": listing.get("title"),
        "category": listing.get("category"),
        "fabric": listing.get("fabric"),
        "colour": listing.get("colour"),
        "price_inr": listing.get("price_inr"),
        "stock": listing.get("stock"),
        "photo_note": listing.get("photo_note") or "",
        "language": listing.get("language") or "en",
    }
    return kept


def _with_photo(note: object, rest: str, language: str) -> str:
    if not note:
        return rest
    prefix = "फोटो कोच" if lang(language) == "hi" else "Photo coach"
    return f"{prefix}: {note}\n\n{rest}"


def _need_card(language: str, field_name: str) -> dict:
    labels = FIELD_LABEL[lang(language)]
    title = "कैटलॉगर" if lang(language) == "hi" else "Cataloguer"
    needed = "अभी चाहिए" if lang(language) == "hi" else "Still needed"
    return {
        "cardId": f"need-{field_name}",
        "card": {
            "header": {"title": title, "subtitle": "Products"},
            "sections": [
                {
                    "widgets": [
                        {"decoratedText": {"topLabel": needed, "text": labels[field_name]}},
                    ]
                }
            ],
        },
    }


def _row_card(row: dict, destination: str) -> dict:
    language = lang(str(row.get("language") or "en"))
    labels = FIELD_LABEL[language]
    subtitle = "Google Sheet" if destination == "google" else "Local Products sheet"
    if language == "hi" and destination != "google":
        subtitle = "स्थानीय Products शीट"
    widgets = [
        {"decoratedText": {"topLabel": labels["title"], "text": str(row["title"])}},
        {"decoratedText": {"topLabel": labels["fabric"], "text": str(row["fabric"])}},
        {"decoratedText": {"topLabel": labels["colour"], "text": str(row["colour"])}},
        {"decoratedText": {"topLabel": labels["price_inr"], "text": f"₹{row['price_inr']}"}},
        {"decoratedText": {"topLabel": labels["stock"], "text": str(row["stock"])}},
    ]
    if row.get("photo_note"):
        widgets.append(
            {"decoratedText": {"topLabel": labels["photo_note"], "text": str(row["photo_note"])}}
        )
    return {
        "cardId": str(row["sku"]),
        "card": {
            "header": {"title": str(row["sku"]), "subtitle": subtitle},
            "sections": [{"widgets": widgets}],
        },
    }
