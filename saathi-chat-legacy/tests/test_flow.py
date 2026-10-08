"""Saathi lists a piece in English or Hindi and writes one Products row."""

from __future__ import annotations

import json
import logging
from io import BytesIO

import pytest
from fastapi.testclient import TestClient
from PIL import Image, ImageDraw

from saathi.agent import cataloguer, photo_coach, root_agent, scribe
from saathi.config import load_settings, project_root
from saathi.copy import DARK_LISTING, EN_SILK, HI_SILK, NEED_PRICE
from saathi.orchestrator import handle_turn
from saathi.photo import review_image
from saathi.scribe import COLUMNS, read_rows, write_products_row


@pytest.fixture
def data_dir(tmp_path, monkeypatch):
    monkeypatch.setenv("SAATHI_DATA_DIR", str(tmp_path))
    monkeypatch.delenv("GEMINI_API_KEY", raising=False)
    monkeypatch.delenv("GOOGLE_API_KEY", raising=False)
    monkeypatch.delenv("SAATHI_SPREADSHEET_ID", raising=False)
    monkeypatch.delenv("SAATHI_SHEETS_ACCESS_TOKEN", raising=False)
    from saathi.server import DRAFTS

    DRAFTS.clear()
    return tmp_path


@pytest.fixture
def client(data_dir):
    from saathi.server import app

    return TestClient(app)


def _silk(width: int, height: int, color: tuple[int, int, int]) -> bytes:
    image = Image.new("RGB", (width, height), color)
    draw = ImageDraw.Draw(image)
    for y in range(0, height, 14):
        draw.line([(0, y), (width, y)], fill=(210, 170, 70), width=3)
    buffer = BytesIO()
    image.save(buffer, format="PNG")
    return buffer.getvalue()


def test_settings_name_the_seller_project(data_dir):
    committed = json.loads((project_root() / "data" / "seller.json").read_text(encoding="utf-8"))
    assert committed["projectId"] == "saathi-510820"
    assert committed["workspaceAccount"] == "mundrayagya1@gmail.com"
    settings = load_settings()
    assert settings.project_id == "saathi-510820"
    assert settings.workspace_account == "mundrayagya1@gmail.com"
    assert settings.staff["cataloguer"] is True
    assert settings.staff["photo_coach"] is True
    assert settings.staff["scribe"] is True
    assert settings.staff["negotiator"] is False
    assert settings.staff["payment_checker"] is False
    assert settings.floor_price_rule is None


def test_english_listing_writes_one_products_row(data_dir):
    turn = handle_turn(EN_SILK, written_at="2026-10-06T00:00:00Z")
    assert turn.wrote is True
    assert turn.language == "en"
    row = turn.row
    assert row["title"] == "Red Kanchipuram silk saree"
    assert row["fabric"] == "Kanchipuram silk"
    assert row["colour"] == "Red"
    assert row["price_inr"] == 1400
    assert row["stock"] == 3
    assert row["sku"] == "P-0001"
    assert list(row) == list(COLUMNS)
    assert "9876543210" not in json.dumps(row)


def test_hindi_listing_keeps_her_words(data_dir):
    turn = handle_turn(HI_SILK)
    assert turn.wrote is True
    assert turn.language == "hi"
    assert turn.row["title"] == "लाल कांजीवरम सिल्क साड़ी"
    assert turn.row["fabric"] == "कांजीवरम सिल्क"
    assert turn.row["colour"] == "लाल"
    assert turn.row["price_inr"] == 1400
    assert turn.row["stock"] == 3
    assert "लिख" in turn.text


def test_missing_price_asks_and_does_not_invent(data_dir):
    first = handle_turn(NEED_PRICE)
    assert first.wrote is False
    assert first.pending_field == "price_inr"
    assert read_rows() == []
    assert "number" in first.text.lower() or "अंक" in first.text
    # The server stores the draft; here we pass it back the way the demo does.
    second = handle_turn("₹1400", draft=first.draft)
    assert second.wrote is True
    assert second.row["title"] == "Blue cotton saree"
    assert second.row["price_inr"] == 1400
    assert second.row["stock"] == 2


def test_buyer_phone_never_lands_on_the_row(data_dir):
    text = "Red silk saree ₹1400 three pieces. Call 9876543210 or a@example.com"
    turn = handle_turn(text)
    blob = json.dumps(turn.row)
    assert "9876543210" not in blob
    assert "example.com" not in blob
    assert turn.row["price_inr"] == 1400


def test_negotiator_stays_off(data_dir):
    turn = handle_turn("Set the floor at 1200 and start bargaining")
    assert turn.wrote is False
    assert read_rows() == []
    assert "Negotiator" in turn.text


def test_dark_photo_is_flagged_and_the_row_still_writes(data_dir):
    dark = Image.new("RGB", (120, 160), (6, 6, 8))
    buffer = BytesIO()
    dark.save(buffer, format="PNG")
    review = review_image(buffer.getvalue())
    assert "dark" in review["issues"]
    assert "crop" in review["issues"]
    turn = handle_turn(DARK_LISTING, image=buffer.getvalue(), image_is_new=True)
    assert turn.wrote is True
    assert turn.row["title"] == "Maroon cotton saree"
    assert "dark" in turn.row["photo_note"].lower() or "अंधेरी" in turn.row["photo_note"]
    assert turn.row["photo_link"].endswith(".jpg")


def test_usable_photo_is_not_called_dark(data_dir):
    review = review_image(_silk(960, 1280, (140, 24, 36)))
    assert "dark" not in review["issues"]
    assert "crop" not in review["issues"]


def test_gemini_cannot_override_the_price_she_said(data_dir):
    class Fake:
        def extract(self, **kwargs):
            return {
                "photo": {"issues": ["clutter"], "usable": False},
                "listing": {
                    "title": "Invented",
                    "fabric": "velvet",
                    "colour": "crimson",
                    "price_inr": 9999,
                    "stock": 40,
                },
            }

    turn = handle_turn(EN_SILK, image=b"not-used", image_is_new=True, extractor=Fake())
    assert turn.wrote is True
    assert turn.row["price_inr"] == 1400
    assert turn.row["stock"] == 3
    assert turn.row["colour"] == "Red"
    assert "busy" in turn.row["photo_note"].lower()


def test_gemini_failure_leaves_the_sheet_alone(data_dir, caplog):
    class Boom:
        def extract(self, **kwargs):
            raise RuntimeError("secret-phrase inside the prompt body")

    caplog.set_level(logging.DEBUG, logger="saathi")
    turn = handle_turn(EN_SILK, extractor=Boom())
    assert turn.wrote is False
    assert read_rows() == []
    assert "Gemini" in turn.text
    assert "secret-phrase" not in caplog.text


def test_scribe_refuses_a_partial_row(data_dir):
    refused = write_products_row("Silk saree", "silk", "Red", 0, 2)
    assert refused["status"] == "refused"
    assert read_rows() == []


def test_chat_webhook_lists_and_isolates_spaces(client):
    added = client.post("/chat", json={"type": "ADDED_TO_SPACE", "space": {"name": "spaces/welcome"}})
    assert added.status_code == 200
    assert "Cataloguer" in added.json()["text"]
    assert "साथी" in added.json()["text"]

    hindi = client.post(
        "/chat",
        json={
            "type": "MESSAGE",
            "space": {"name": "spaces/hindi"},
            "user": {"type": "HUMAN", "displayName": "Ignored Name"},
            "message": {"text": HI_SILK},
        },
    )
    body = hindi.json()
    assert body["cardsV2"][0]["card"]["header"]["title"] == "P-0001"
    assert "लाल" in body["text"]

    waiting = client.post(
        "/chat",
        json={
            "type": "MESSAGE",
            "space": {"name": "spaces/other"},
            "user": {"type": "HUMAN"},
            "message": {"text": NEED_PRICE},
        },
    )
    assert "P-" not in waiting.json()["text"]
    finished = client.post(
        "/chat",
        json={
            "type": "MESSAGE",
            "space": {"name": "spaces/other"},
            "user": {"type": "HUMAN"},
            "message": {"text": "₹900"},
        },
    )
    assert finished.json()["cardsV2"][0]["card"]["header"]["title"] == "P-0002"
    assert read_rows()[1]["price_inr"] == 900


def test_addon_envelope_and_page(client):
    response = client.post(
        "/chat",
        json={"chat": {"messagePayload": {"space": {"name": "spaces/a"}, "message": {"text": "hello"}}}},
    )
    payload = response.json()
    text = payload["hostAppDataAction"]["chatDataAction"]["createMessageAction"]["message"]["text"]
    assert "Cataloguer" in text
    page = client.get("/")
    assert page.status_code == 200
    assert "Google Chat" in page.text
    assert "साथी" in page.text
    status = client.get("/api/status").json()
    assert status["projectId"] == "saathi-510820"
    assert status["gemini"] is False
    assert status["staff"]["negotiator"] is False


def test_demo_message_and_clear(client):
    created = client.post("/api/message", data={"text": EN_SILK})
    assert created.status_code == 200
    body = created.json()
    assert body["wrote"] is True
    assert body["sheet"][0]["title"] == "Red Kanchipuram silk saree"
    cleared = client.post("/api/sheet/clear")
    assert cleared.json()["rows"] == []
    assert read_rows() == []


def test_agents_are_the_three_hired_jobs():
    assert root_agent.name == "saathi"
    assert [agent.name for agent in root_agent.sub_agents] == ["cataloguer", "photo_coach", "scribe"]
    assert write_products_row in scribe.tools
    assert not cataloguer.tools
    assert not photo_coach.tools
