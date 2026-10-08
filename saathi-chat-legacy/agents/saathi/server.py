"""Google Chat webhook and the local Chat demo. Port 4721."""

from __future__ import annotations

import logging
import os
from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI, Request
from fastapi.responses import FileResponse, JSONResponse, Response
from fastapi.staticfiles import StaticFiles

from saathi.chat_event import added_turn, envelope, parse_incoming
from saathi.config import data_dir, gemini_configured, load_settings, project_root
from saathi.copy import INTRO, SAMPLES
from saathi.orchestrator import TurnResult, handle_turn
from saathi.scribe import clear_rows, read_rows

logger = logging.getLogger("saathi")
STATIC = Path(__file__).resolve().parent / "static"
SAMPLES_DIR = STATIC / "samples"
SAMPLES_DIR.mkdir(parents=True, exist_ok=True)
SAMPLE_FILES = {
    "red-silk": SAMPLES_DIR / "red-silk.png",
    "dark-silk": SAMPLES_DIR / "dark-silk.png",
}
MAX_BYTES = 8_000_000
AUDIO_TYPES = {"audio/wav", "audio/mpeg", "audio/mp3", "audio/mp4", "audio/aac", "audio/ogg", "audio/webm", "audio/flac"}

# In-memory drafts only. Product fields, never a transcript.
DRAFTS: dict[str, dict] = {}


def _load_env() -> None:
    env_path = project_root() / ".env"
    if not env_path.exists():
        return
    try:
        from dotenv import load_dotenv
    except ImportError:
        return
    load_dotenv(env_path, override=False)


def _quiet() -> None:
    for name in ("google.genai", "google_genai", "httpx", "httpcore", "google.adk"):
        logging.getLogger(name).setLevel(logging.WARNING)


@asynccontextmanager
async def lifespan(_app: FastAPI):
    _load_env()
    _quiet()
    yield


app = FastAPI(title="Saathi", lifespan=lifespan)
app.mount("/samples", StaticFiles(directory=SAMPLES_DIR), name="samples")


def _turn_payload(turn: TurnResult, *, space: str, new_image: bytes | None, new_mime: str | None) -> dict:
    stored = DRAFTS.get(space) or {}
    if turn.wrote:
        DRAFTS.pop(space, None)
    elif turn.draft is not None:
        if turn.keep_previous_image:
            image = new_image if new_image is not None else stored.get("image")
            mime = new_mime if new_image is not None else stored.get("image_mime")
        else:
            image = new_image
            mime = new_mime if new_image is not None else None
        DRAFTS[space] = {"listing": turn.draft, "image": image, "image_mime": mime}
    message: dict = {"text": turn.text}
    if turn.cards:
        message["cardsV2"] = turn.cards
    pending = None
    if turn.pending_field:
        pending = {"field": turn.pending_field, "language": turn.language}
    return {
        "language": turn.language,
        "mode": turn.mode,
        "wrote": turn.wrote,
        "pending": pending,
        "message": message,
        "sheet": read_rows(),
    }


def _run_space(
    space: str,
    text: str,
    *,
    image: bytes | None = None,
    image_mime: str | None = None,
    audio: bytes | None = None,
    audio_mime: str | None = None,
    attachment_unreachable: bool = False,
) -> TurnResult:
    stored = DRAFTS.get(space) or {}
    image_for_turn = image if image is not None else stored.get("image")
    mime_for_turn = image_mime if image is not None else stored.get("image_mime")
    return handle_turn(
        text,
        image=image_for_turn,
        image_mime=mime_for_turn,
        audio=audio,
        audio_mime=audio_mime,
        image_is_new=image is not None,
        draft=stored.get("listing"),
        attachment_unreachable=attachment_unreachable,
    )


@app.get("/")
def index() -> FileResponse:
    return FileResponse(STATIC / "index.html")


@app.get("/favicon.svg")
def favicon() -> FileResponse:
    return FileResponse(STATIC / "favicon.svg", media_type="image/svg+xml")


@app.get("/api/status")
def status() -> dict:
    settings = load_settings()
    hired = [job for job, on in settings.staff.items() if on]
    return {
        "projectId": settings.project_id,
        "workspaceAccount": settings.workspace_account,
        "model": settings.model,
        "gemini": gemini_configured(),
        "channel": "google_chat",
        "languages": list(settings.languages),
        "staff": settings.staff,
        "hired": hired,
        "intro": INTRO,
        "sheet": "google" if os.environ.get("SAATHI_SPREADSHEET_ID") and os.environ.get("SAATHI_SHEETS_ACCESS_TOKEN") else "local",
        "rows": len(read_rows()),
    }


@app.get("/api/samples")
def samples() -> dict:
    return {"samples": SAMPLES}


@app.get("/api/sheet")
def sheet() -> dict:
    draft = DRAFTS.get("demo")
    pending = None
    if draft and draft.get("listing"):
        from saathi.parse import first_missing

        missing = first_missing(draft["listing"])
        if missing:
            pending = {"field": missing, "language": draft["listing"].get("language") or "en"}
    return {"rows": read_rows(), "pending": pending}


@app.post("/api/sheet/clear")
def sheet_clear() -> dict:
    clear_rows()
    DRAFTS.clear()
    return {"rows": [], "pending": None}


@app.get("/media/{name}")
def media(name: str) -> Response:
    if not name.startswith("P-") or not name.endswith(".jpg") or not name[2:-4].isdigit():
        return Response(status_code=404)
    file_path = data_dir() / "media" / name
    if not file_path.is_file():
        return Response(status_code=404)
    return FileResponse(file_path, media_type="image/jpeg")


@app.post("/chat")
async def chat(request: Request) -> JSONResponse:
    try:
        payload = await request.json()
    except Exception:
        return JSONResponse({"text": "Send a Google Chat event."}, status_code=400)
    if not isinstance(payload, dict):
        return JSONResponse({"text": "Send a Google Chat event."}, status_code=400)
    incoming = parse_incoming(payload)
    if incoming.kind == "added":
        turn = added_turn()
        return JSONResponse(envelope(incoming, turn))
    if incoming.kind != "message":
        return JSONResponse(envelope(incoming, None))
    unreachable = bool(incoming.attachments)
    turn = _run_space(incoming.space, incoming.text, attachment_unreachable=unreachable)
    logger.info("chat_turn space=%s wrote=%s", incoming.space, turn.wrote)
    _turn_payload(turn, space=incoming.space, new_image=None, new_mime=None)
    return JSONResponse(envelope(incoming, turn))


@app.post("/api/message")
async def api_message(request: Request) -> JSONResponse:
    form = await request.form()
    text = str(form.get("text") or "")
    sample_name = str(form.get("sampleImage") or "")
    space = str(form.get("space") or "demo")
    upload = form.get("file")
    image: bytes | None = None
    image_mime: str | None = None
    audio: bytes | None = None
    audio_mime: str | None = None
    if sample_name:
        sample_path = SAMPLE_FILES.get(sample_name)
        if sample_path is None or not sample_path.is_file():
            return JSONResponse({"error": "Unknown sample photo."}, status_code=400)
        image = sample_path.read_bytes()
        image_mime = "image/png"
    if upload is not None and getattr(upload, "read", None):
        blob = await upload.read()
        if len(blob) > MAX_BYTES:
            return JSONResponse({"error": "That file is larger than 8 MB."}, status_code=400)
        content_type = (getattr(upload, "content_type", None) or "").split(";")[0].lower()
        if content_type.startswith("audio/") or content_type in AUDIO_TYPES:
            audio = blob
            audio_mime = content_type or "audio/mpeg"
        else:
            image = blob
            image_mime = content_type or "image/jpeg"
    turn = _run_space(
        space,
        text,
        image=image,
        image_mime=image_mime,
        audio=audio,
        audio_mime=audio_mime,
    )
    logger.info("demo_turn wrote=%s mode=%s", turn.wrote, turn.mode)
    return JSONResponse(_turn_payload(turn, space=space, new_image=image, new_mime=image_mime))


def main() -> None:
    import uvicorn

    _load_env()
    port = int(os.environ.get("PORT", "4721"))
    uvicorn.run(app, host="0.0.0.0", port=port, log_level="info")
