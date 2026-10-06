"""The only writer. One Products row. Buyer fields are not columns."""

from __future__ import annotations

import csv
import json
import logging
import threading
from datetime import datetime, timezone
from pathlib import Path
from urllib import request as urlrequest
from urllib.error import URLError

from saathi.config import data_dir, load_settings, sheets_configured
from saathi.parse import scrub

logger = logging.getLogger("saathi")
LOCK = threading.Lock()

COLUMNS = (
    "sku",
    "title",
    "category",
    "fabric",
    "colour",
    "price_inr",
    "stock",
    "photo_link",
    "photo_note",
    "language",
    "written_at",
)
REQUIRED = ("title", "fabric", "colour", "price_inr", "stock")


def _paths() -> tuple[Path, Path, Path]:
    root = data_dir()
    root.mkdir(parents=True, exist_ok=True)
    media = root / "media"
    media.mkdir(parents=True, exist_ok=True)
    return root / "products.json", root / "products.csv", media


def read_rows() -> list[dict]:
    path, _, _ = _paths()
    if not path.exists():
        return []
    data = json.loads(path.read_text(encoding="utf-8"))
    if not isinstance(data, list):
        return []
    return data


def _write_files(rows: list[dict]) -> None:
    json_path, csv_path, _ = _paths()
    json_path.write_text(json.dumps(rows, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    with csv_path.open("w", encoding="utf-8-sig", newline="") as handle:
        writer = csv.DictWriter(handle, fieldnames=list(COLUMNS))
        writer.writeheader()
        writer.writerows(rows)


def _next_sku(rows: list[dict]) -> str:
    highest = 0
    for row in rows:
        sku = str(row.get("sku") or "")
        if sku.startswith("P-") and sku[2:].isdigit():
            highest = max(highest, int(sku[2:]))
    return f"P-{highest + 1:04d}"


def _clean_text(value: str) -> str:
    return scrub(value).strip()


def save_photo(sku: str, image: bytes) -> str:
    from io import BytesIO

    from PIL import Image

    _, _, media = _paths()
    target = media / f"{sku}.jpg"
    image_obj = Image.open(BytesIO(image))
    image_obj.convert("RGB").save(target, format="JPEG", quality=85)
    return f"/media/{sku}.jpg"


def commit_row(
    *,
    title: str,
    fabric: str,
    colour: str,
    price_inr: int,
    stock: int,
    category: str = "",
    photo_note: str = "",
    language: str = "en",
    image: bytes | None = None,
    written_at: str | None = None,
) -> dict:
    values = {
        "title": _clean_text(title),
        "fabric": _clean_text(fabric),
        "colour": _clean_text(colour),
        "category": _clean_text(category),
        "photo_note": _clean_text(photo_note),
    }
    missing = [field for field in REQUIRED if field != "price_inr" and field != "stock" and not values.get(field)]
    try:
        price = int(price_inr)
        pieces = int(stock)
    except (TypeError, ValueError):
        price = 0
        pieces = 0
    if price <= 0:
        missing.append("price_inr")
    if pieces <= 0:
        missing.append("stock")
    if missing:
        return {"status": "refused", "missing": missing}
    language = "hi" if language == "hi" else "en"
    with LOCK:
        rows = read_rows()
        sku = _next_sku(rows)
        photo_link = ""
        if image:
            try:
                photo_link = save_photo(sku, image)
            except (OSError, ValueError):
                photo_link = ""
        row = {
            "sku": sku,
            "title": values["title"],
            "category": values["category"],
            "fabric": values["fabric"],
            "colour": values["colour"],
            "price_inr": price,
            "stock": pieces,
            "photo_link": photo_link,
            "photo_note": values["photo_note"],
            "language": language,
            "written_at": written_at or datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
        }
        rows.append(row)
        _write_files(rows)
    destination, sheet_error = _append_google_sheet(row)
    logger.info("scribe_wrote sku=%s destination=%s", sku, destination)
    return {
        "status": "written",
        "row": row,
        "destination": destination,
        "sheet_error": sheet_error,
    }


def write_products_row(
    title: str,
    fabric: str,
    colour: str,
    price_inr: int,
    stock: int,
    category: str = "",
    photo_note: str = "",
    language: str = "en",
) -> dict:
    """Write one complete Products row. Refuse when a buyer-critical field is missing.

    Customer names, phones, addresses, and payments are not accepted.
    """
    result = commit_row(
        title=title,
        fabric=fabric,
        colour=colour,
        price_inr=price_inr,
        stock=stock,
        category=category,
        photo_note=photo_note,
        language=language,
    )
    if result["status"] != "written":
        return {"status": "refused", "missing": result["missing"]}
    return {
        "status": "written",
        "sku": result["row"]["sku"],
        "destination": result["destination"],
    }


def clear_rows() -> None:
    with LOCK:
        _write_files([])
        _, _, media = _paths()
        for path in media.glob("P-*.jpg"):
            path.unlink(missing_ok=True)


def _append_google_sheet(row: dict) -> tuple[str, str | None]:
    if not sheets_configured():
        return "local", None
    settings = load_settings()
    spreadsheet_id = settings.spreadsheet_id
    token = os_token()
    url = (
        "https://sheets.googleapis.com/v4/spreadsheets/"
        f"{spreadsheet_id}/values/Products!A1:append?valueInputOption=USER_ENTERED"
    )
    body = json.dumps({"values": [[row[column] for column in COLUMNS]]}).encode("utf-8")
    req = urlrequest.Request(
        url,
        data=body,
        method="POST",
        headers={
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json",
        },
    )
    try:
        with urlrequest.urlopen(req, timeout=10) as response:
            response.read()
    except (URLError, TimeoutError, OSError):
        return "local", "sheet_unreachable"
    return "google", None


def os_token() -> str:
    import os

    return os.environ.get("SAATHI_SHEETS_ACCESS_TOKEN", "")
