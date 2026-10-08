"""Read a listing from the seller's words. Price and stock stay here, not in a prompt."""

from __future__ import annotations

import re

from saathi.language import detect_language

LISTING_FIELDS = ("title", "category", "fabric", "colour", "price_inr", "stock")

NUM_WORDS = {
    "one": 1,
    "two": 2,
    "three": 3,
    "four": 4,
    "five": 5,
    "six": 6,
    "seven": 7,
    "eight": 8,
    "nine": 9,
    "ten": 10,
    "एक": 1,
    "दो": 2,
    "तीन": 3,
    "चार": 4,
    "पाँच": 5,
    "पांच": 5,
    "छह": 6,
    "सात": 7,
    "आठ": 8,
    "नौ": 9,
    "दस": 10,
}

# Longer English colours first so "maroon" is not read as something else.
COLOURS: tuple[tuple[str, str, str], ...] = (
    ("maroon", "maroon", "मैरून"),
    ("beige", "beige", "बेज"),
    ("cream", "cream", "क्रीम"),
    ("orange", "orange", "नारंगी"),
    ("purple", "purple", "बैंगनी"),
    ("yellow", "yellow", "पीली"),
    ("brown", "brown", "भूरी"),
    ("black", "black", "काली"),
    ("white", "white", "सफेद"),
    ("green", "green", "हरी"),
    ("pink", "pink", "गुलाबी"),
    ("grey", "grey", "स्लेटी"),
    ("gray", "grey", "स्लेटी"),
    ("blue", "blue", "नीली"),
    ("gold", "gold", "सुनहरी"),
    ("golden", "gold", "सुनहरी"),
    ("red", "red", "लाल"),
    ("सुनहरी", "gold", "सुनहरी"),
    ("सुनहरा", "gold", "सुनहरा"),
    ("मैरून", "maroon", "मैरून"),
    ("नारंगी", "orange", "नारंगी"),
    ("बैंगनी", "purple", "बैंगनी"),
    ("गुलाबी", "pink", "गुलाबी"),
    ("सफेद", "white", "सफेद"),
    ("काली", "black", "काली"),
    ("काला", "black", "काला"),
    ("पीली", "yellow", "पीली"),
    ("पीला", "yellow", "पीला"),
    ("भूरी", "brown", "भूरी"),
    ("स्लेटी", "grey", "स्लेटी"),
    ("नीली", "blue", "नीली"),
    ("नीला", "blue", "नीला"),
    ("हरी", "green", "हरी"),
    ("हरा", "green", "हरा"),
    ("लाल", "red", "लाल"),
)

FABRICS: tuple[tuple[str, str, str], ...] = (
    (
        r"kanchipuram\s+silk|kanjivaram\s+silk|कांजीवरम\s+सिल्क|कांजीवरम्\s+सिल्क",
        "Kanchipuram silk",
        "कांजीवरम सिल्क",
    ),
    (r"kanchipuram|kanjivaram|कांजीवरम|कांजीवरम्", "Kanchipuram silk", "कांजीवरम सिल्क"),
    (r"banarasi|बनारसी", "Banarasi silk", "बनारसी सिल्क"),
    (r"chiffon|शिफॉन", "chiffon", "शिफॉन"),
    (r"georgette|जॉर्जेट", "georgette", "जॉर्जेट"),
    (r"organza|ऑर्गेंजा", "organza", "ऑर्गेंजा"),
    (r"linen|लिनन", "linen", "लिनन"),
    (r"cotton|सूती|कॉटन", "cotton", "सूती"),
    (r"silk|सिल्क", "silk", "सिल्क"),
)

PRODUCTS: tuple[tuple[str, str, str], ...] = (
    (r"sarees|saree|saris|sari", "saree", "Saree"),
    (r"साड़ियाँ|साड़ियों|साड़ी|साडी", "saree", "Saree"),
    (r"dupattas|dupatta", "dupatta", "Dupatta"),
    (r"दुपट्टे|दुपट्टा", "dupatta", "Dupatta"),
    (r"blouses|blouse", "blouse", "Blouse"),
    (r"ब्लाउज", "blouse", "Blouse"),
    (r"lehengas|lehenga", "lehenga", "Lehenga"),
    (r"लहंगे|लहंगा", "lehenga", "Lehenga"),
)

DIGIT_MAP = str.maketrans("०१२३४५६७८९", "0123456789")
PRICE_RE = re.compile(
    r"(?:₹|rs\.?|inr|price|कीमत)\s*₹?\s*([0-9]{1,3}(?:,[0-9]{2,3})+|[0-9]{1,7})",
    re.IGNORECASE,
)
EMAIL_RE = re.compile(r"[\w.+-]+@[\w.-]+\.\w+")
PHONE_RE = re.compile(r"\d{10,}")
GREETINGS = {
    "hi",
    "hello",
    "hey",
    "help",
    "namaste",
    "start",
    "saathi",
    "नमस्ते",
    "नमस्कार",
    "हाय",
    "मदद",
    "शुरू",
    "साथी",
}
STAFF_QUERIES = {
    "who is working",
    "who's working",
    "who is on",
    "who is hired",
    "staff",
    "कौन काम पर है",
    "स्टाफ",
}
FLOOR_RE = re.compile(r"\b(floor|bargain|negotiat\w*|discount)\b|मोलभाव|फ्लोर", re.IGNORECASE)


def digits(text: str) -> str:
    return (text or "").translate(DIGIT_MAP)


def scrub(text: str) -> str:
    cleaned = EMAIL_RE.sub("", text or "")
    cleaned = PHONE_RE.sub("", cleaned)
    return " ".join(cleaned.split())


def empty_listing() -> dict:
    return {field: None for field in LISTING_FIELDS}


def is_greeting(text: str) -> bool:
    token = re.sub(r"[!?.।,]+", "", (text or "").strip().lower())
    return token in GREETINGS


def is_staff_query(text: str) -> bool:
    token = re.sub(r"[!?.।]+", "", (text or "").strip().lower())
    return token in STAFF_QUERIES


def is_floor_talk(text: str) -> bool:
    return bool(FLOOR_RE.search(text or ""))


def _show_colour(en: str, hi: str, language: str) -> str:
    if language == "hi":
        return hi
    return en[:1].upper() + en[1:]


def _find_colour(text: str, language: str) -> str | None:
    cleaned = re.sub(
        r"(gold|golden|सुनहरी|सुनहरा)\s*(border|बॉर्डर)",
        " ",
        text,
        flags=re.IGNORECASE,
    )
    hits: list[tuple[int, str]] = []
    for token, en, hi in COLOURS:
        if re.search(r"[\u0900-\u097F]", token):
            match = re.search(re.escape(token), cleaned)
        else:
            match = re.search(rf"\b{re.escape(token)}\b", cleaned, re.IGNORECASE)
        if match:
            hits.append((match.start(), _show_colour(en, hi, language)))
    if not hits:
        return None
    hits.sort()
    non_gold = [hit for hit in hits if hit[1].lower() not in {"gold", "सुनहरी", "सुनहरा"}]
    return (non_gold or hits)[0][1]


def _find_fabric(text: str, language: str) -> str | None:
    for pattern, en, hi in FABRICS:
        if re.search(pattern, text, re.IGNORECASE):
            return hi if language == "hi" else en
    return None


def _find_product(text: str, language: str) -> tuple[str, str] | None:
    for pattern, _key, en_label in PRODUCTS:
        if re.search(pattern, text, re.IGNORECASE):
            if language == "hi":
                hi_label = {
                    "Saree": "साड़ी",
                    "Dupatta": "दुपट्टा",
                    "Blouse": "ब्लाउज",
                    "Lehenga": "लहंगा",
                }[en_label]
                return en_label, hi_label
            return en_label, en_label.lower()
    return None


def _parse_price(text: str) -> tuple[int | None, str]:
    match = PRICE_RE.search(text)
    if not match:
        return None, text
    number = int(match.group(1).replace(",", ""))
    if number <= 0 or number >= 10_000_000:
        return None, text
    stripped = text[: match.start()] + " " + text[match.end() :]
    return number, stripped


def _parse_stock(text: str) -> int | None:
    patterns = [
        r"\b(?:stock|स्टॉक)\s*(\d{1,4})\b",
        r"\b(\d{1,4})\s*(?:pieces|piece|pcs|pc|पीस)(?:\s+in\s+stock)?\b",
    ]
    for pattern in patterns:
        match = re.search(pattern, text, re.IGNORECASE)
        if match:
            number = int(match.group(1))
            if 0 < number < 100_000:
                return number
    word_alt = "|".join(sorted(NUM_WORDS, key=len, reverse=True))
    word_match = re.search(
        rf"(?<!\w)(?:{word_alt})\s*(?:pieces|piece|pcs|pc|पीस)",
        text,
        re.IGNORECASE,
    )
    if word_match:
        token = re.match(rf"(?:{word_alt})", word_match.group(0), re.IGNORECASE)
        if token:
            key = token.group(0).lower()
            return NUM_WORDS.get(key) or NUM_WORDS.get(token.group(0))
    return None


def parse_listing(text: str, language: str | None = None) -> dict:
    listing = empty_listing()
    raw = digits(text or "")
    language = language or detect_language(raw)
    if language not in ("en", "hi"):
        language = "en"
    price, remainder = _parse_price(raw)
    colour = _find_colour(raw, language)
    fabric = _find_fabric(raw, language)
    product = _find_product(raw, language)
    stock = _parse_stock(remainder)
    listing["price_inr"] = price
    listing["colour"] = colour
    listing["fabric"] = fabric
    listing["stock"] = stock
    if product:
        listing["category"] = product[0] if language == "en" else product[1]
        parts: list[str] = []
        if colour:
            parts.append(colour)
        if fabric:
            parts.append(fabric)
        parts.append(product[1])
        listing["title"] = " ".join(parts)
    return listing


def first_missing(listing: dict) -> str | None:
    for field in ("title", "fabric", "colour", "price_inr", "stock"):
        if listing.get(field) in (None, ""):
            return field
    return None


def interpret_short(text: str, field: str, language: str) -> str | int | None:
    parsed = parse_listing(text, language)
    if parsed.get(field) not in (None, ""):
        return parsed[field]
    cleaned = scrub(digits(text or "").strip())
    if not cleaned:
        return None
    if field == "price_inr":
        bare = re.fullmatch(r"[0-9]{1,3}(?:,[0-9]{2,3})+|[0-9]{1,7}", cleaned)
        if bare:
            number = int(cleaned.replace(",", ""))
            if 0 < number < 10_000_000:
                return number
        return None
    if field == "stock":
        if cleaned in NUM_WORDS:
            return NUM_WORDS[cleaned]
        if re.fullmatch(r"\d{1,4}", cleaned):
            number = int(cleaned)
            if 0 < number < 100_000:
                return number
        return None
    if field in {"colour", "fabric", "title"} and len(cleaned.split()) <= 6:
        return cleaned
    return None
