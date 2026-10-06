"""Seller setup Saathi is allowed to keep. No buyer data."""

from __future__ import annotations

import json
import os
from dataclasses import dataclass
from pathlib import Path

JOBS: tuple[str, ...] = (
    "cataloguer",
    "photo_coach",
    "salesperson",
    "negotiator",
    "stock_keeper",
    "order_taker",
    "payment_checker",
    "scribe",
    "shift_manager",
    "shop_analyst",
)

DEFAULT_STAFF: dict[str, bool] = {
    "cataloguer": True,
    "photo_coach": True,
    "salesperson": False,
    "negotiator": False,
    "stock_keeper": False,
    "order_taker": False,
    "payment_checker": False,
    "scribe": True,
    "shift_manager": False,
    "shop_analyst": False,
}

PROJECT_ID = "saathi-510820"
WORKSPACE_ACCOUNT = "mundrayagya1@gmail.com"


@dataclass(frozen=True)
class Settings:
    seller_id: str
    project_id: str
    workspace_account: str
    spreadsheet_id: str
    drive_folder_id: str
    model: str
    key_secret_name: str
    languages: tuple[str, ...]
    floor_price_rule: str | None
    staff: dict[str, bool]


def project_root() -> Path:
    return Path(__file__).resolve().parents[2]


def data_dir() -> Path:
    override = os.environ.get("SAATHI_DATA_DIR")
    if override:
        return Path(override)
    return project_root() / "data"


def gemini_api_key() -> str:
    return os.environ.get("GEMINI_API_KEY") or os.environ.get("GOOGLE_API_KEY") or ""


def gemini_configured() -> bool:
    return bool(gemini_api_key())


def sheets_configured() -> bool:
    return bool(os.environ.get("SAATHI_SPREADSHEET_ID") and os.environ.get("SAATHI_SHEETS_ACCESS_TOKEN"))


def load_settings() -> Settings:
    path = data_dir() / "seller.json"
    raw: dict = {}
    if path.exists():
        raw = json.loads(path.read_text(encoding="utf-8"))
    staff_raw = raw.get("staff") or {}
    staff = {job: bool(staff_raw.get(job, DEFAULT_STAFF[job])) for job in JOBS}
    languages = tuple(raw.get("languages") or ["en", "hi"])
    model = os.environ.get("SAATHI_MODEL") or raw.get("model") or "gemini-2.5-flash"
    spreadsheet = os.environ.get("SAATHI_SPREADSHEET_ID") or raw.get("spreadsheetId") or ""
    floor = raw.get("floorPriceRule")
    return Settings(
        seller_id=str(raw.get("sellerId") or "saathi-demo"),
        project_id=str(raw.get("projectId") or PROJECT_ID),
        workspace_account=str(raw.get("workspaceAccount") or WORKSPACE_ACCOUNT),
        spreadsheet_id=str(spreadsheet),
        drive_folder_id=str(raw.get("driveFolderId") or ""),
        model=str(model),
        key_secret_name=str(raw.get("keySecretName") or "seller-saathi-demo-gemini"),
        languages=tuple(str(item) for item in languages),
        floor_price_rule=None if floor in (None, "") else str(floor),
        staff=staff,
    )
