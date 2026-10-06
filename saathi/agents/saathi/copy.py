"""Words Saathi says. English and Hindi only."""

from __future__ import annotations

EN_SILK = (
    "Red Kanchipuram silk saree with a gold border. Price ₹1400. Three pieces in stock."
)
HI_SILK = "लाल कांजीवरम सिल्क साड़ी, सुनहरी बॉर्डर। कीमत ₹1400। तीन पीस।"
NEED_PRICE = "Blue cotton saree, two pieces."
DARK_LISTING = "Maroon cotton saree. Price ₹900. Four pieces in stock."

SAMPLES: list[dict[str, str | None]] = [
    {"id": "silk-en", "label": "Red Kanchipuram silk", "text": EN_SILK, "sampleImage": "red-silk"},
    {"id": "silk-hi", "label": "लाल कांजीवरम साड़ी", "text": HI_SILK, "sampleImage": None},
    {"id": "need-price", "label": "Missing price", "text": NEED_PRICE, "sampleImage": None},
    {"id": "dark-photo", "label": "Dark photo", "text": DARK_LISTING, "sampleImage": "dark-silk"},
]

INTRO = (
    "Saathi here. Cataloguer, Photo coach, and Scribe are on duty. "
    "Send a photo and tell me the piece — cloth, colour, price, and how many you have. "
    "I write one row in your Products sheet. I do not keep this chat.\n\n"
    "साथी यहाँ है। कैटलॉगर, फोटो कोच और स्क्राइब काम पर हैं। "
    "एक फोटो भेजिए और बताइए — कपड़ा, रंग, कीमत, और कितने पीस हैं। "
    "मैं आपकी Products शीट में एक पंक्ति लिखूँगी। यह बातचीत मैं सहेजती नहीं।"
)

WELCOME = {
    "en": (
        "Saathi here. Cataloguer, Photo coach, and Scribe are on duty. "
        "Send a photo and tell me the cloth, colour, price, and how many pieces you have."
    ),
    "hi": (
        "साथी यहाँ है। कैटलॉगर, फोटो कोच और स्क्राइब काम पर हैं। "
        "एक फोटो भेजिए और कपड़ा, रंग, कीमत, और पीस बताइए।"
    ),
}

ASK = {
    "en": {
        "title": "What is this piece? Buyers need a name.",
        "fabric": "Which cloth is it? Silk, cotton, or something else?",
        "colour": "Which colour is it?",
        "price_inr": "What price should I put on it? Tell me the number.",
        "stock": "How many pieces are in the shop?",
    },
    "hi": {
        "title": "यह क्या है? खरीदार को एक नाम चाहिए।",
        "fabric": "कपड़ा कौन सा है? सिल्क, सूती, या कुछ और?",
        "colour": "रंग कौन सा है?",
        "price_inr": "कीमत क्या रखूँ? अंक बताइए।",
        "stock": "दुकान में कितने पीस हैं?",
    },
}

FIELD_LABEL = {
    "en": {
        "title": "Name",
        "fabric": "Cloth",
        "colour": "Colour",
        "price_inr": "Price",
        "stock": "Stock",
        "category": "Category",
        "photo_note": "Photo",
    },
    "hi": {
        "title": "नाम",
        "fabric": "कपड़ा",
        "colour": "रंग",
        "price_inr": "कीमत",
        "stock": "स्टॉक",
        "category": "श्रेणी",
        "photo_note": "फोटो",
    },
}

PHOTO = {
    "en": {
        "dark": "The photo is dark. Shoot it toward a window.",
        "blur": "The photo is blurry. Hold the phone still and shoot again.",
        "crop": "The photo is too small or cropped. Step back so the whole piece is in the frame.",
        "clutter": "The background is busy. Put the piece on a plain floor.",
        "unread": "I could not read that photo. Send it again in daylight.",
        "ok": "The photo will do. A plain floor makes the cloth easier to see.",
        "prefix": "Photo coach",
    },
    "hi": {
        "dark": "फोटो अंधेरी है। खिड़की की रोशनी में दोबारा लीजिए।",
        "blur": "फोटो धुंधली है। फ़ोन को स्थिर रखिए और दोबारा लीजिए।",
        "crop": "फोटो छोटी या कटी है। पीछे हटिए ताकि पूरा पीस फ्रेम में आए।",
        "clutter": "पीछे सामान बहुत है। सादे फर्श पर रखिए।",
        "unread": "यह फोटो पढ़ नहीं पाई। दिन की रोशनी में दोबारा भेजिए।",
        "ok": "फोटो चल जाएगी। सादे फर्श पर लेने से कपड़ा साफ दिखेगा।",
        "prefix": "फोटो कोच",
    },
}

JOB_LABEL = {
    "cataloguer": ("Cataloguer", "कैटलॉगर"),
    "photo_coach": ("Photo coach", "फोटो कोच"),
    "scribe": ("Scribe", "स्क्राइब"),
    "salesperson": ("Salesperson", "सेल्सपर्सन"),
    "negotiator": ("Negotiator", "नेगोशिएटर"),
    "stock_keeper": ("Stock keeper", "स्टॉक कीपर"),
    "order_taker": ("Order taker", "ऑर्डर टेकर"),
    "payment_checker": ("Payment checker", "पेमेंट चेकर"),
    "shift_manager": ("Shift manager", "शिफ्ट मैनेजर"),
    "shop_analyst": ("Shop analyst", "शॉप एनालिस्ट"),
}

NEGOTIATOR_OFF = {
    "en": "Negotiator is off duty. Tell me the piece and the price you want on the sheet.",
    "hi": "नेगोशिएटर काम पर नहीं है। पीस और शीट पर रखनी कीमत बताइए।",
}

VOICE_NEEDS_KEY = {
    "en": "I can hear a voice note once the Gemini key is set. Type the same words for now.",
    "hi": "वॉइस नोट Gemini कुंजी के बाद सुनूँगी। अभी वही बात लिख दीजिए।",
}

GEMINI_FAILED = {
    "en": "Gemini did not answer. I left the sheet untouched.",
    "hi": "Gemini ने जवाब नहीं दिया। शीट वैसे ही है।",
}

ATTACHMENT = {
    "en": "I cannot open that Chat attachment from here yet. Upload the photo on the demo page, or type the piece.",
    "hi": "वह Chat फ़ाइल यहाँ से नहीं खुल रही। डेमो पेज पर फोटो डालिए, या पीस लिख दीजिए।",
}

SHEET_MISSED = {
    "en": "The Google Sheet did not update. The local row is here.",
    "hi": "Google शीट अपडेट नहीं हुई। स्थानीय पंक्ति यहाँ है।",
}

OFF_DUTY = {
    "en": {
        "cataloguer": "Cataloguer is off duty, so I am not listing pieces.",
        "scribe": "Scribe is off duty, so nothing was written to the sheet.",
    },
    "hi": {
        "cataloguer": "कैटलॉगर काम पर नहीं है, इसलिए अभी लिस्टिंग नहीं बनेगी।",
        "scribe": "स्क्राइब काम पर नहीं है, इसलिए शीट में कुछ नहीं लिखा।",
    },
}


def lang(language: str) -> str:
    return "hi" if language == "hi" else "en"


def photo_note(issues: list[str], language: str) -> str:
    table = PHOTO[lang(language)]
    ordered = [name for name in ("dark", "blur", "crop", "clutter", "unread") if name in issues]
    if not ordered:
        return table["ok"]
    return " ".join(table[name] for name in ordered)


def staff_text(staff: dict[str, bool], language: str) -> str:
    hindi = lang(language) == "hi"
    index = 1 if hindi else 0
    on = [JOB_LABEL[job][index] for job, hired in staff.items() if hired and job in JOB_LABEL]
    off = [JOB_LABEL[job][index] for job, hired in staff.items() if not hired and job in JOB_LABEL]
    if hindi:
        return "काम पर: " + ", ".join(on) + "। काम पर नहीं: " + ", ".join(off) + "।"
    return "On duty: " + ", ".join(on) + ". Off duty: " + ", ".join(off) + "."


def wrote_text(sku: str, title: str, price: int, stock: int, language: str) -> str:
    if lang(language) == "hi":
        return f"स्क्राइब ने {sku} लिख दिया। {title} — ₹{price}, {stock} पीस।"
    return f"Scribe wrote {sku}. {title} — ₹{price}, {stock} in stock."
