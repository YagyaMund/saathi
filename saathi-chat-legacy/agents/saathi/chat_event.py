"""Google Chat app events in, Message JSON out. The same shape the demo page renders."""

from __future__ import annotations

from dataclasses import dataclass, field

from saathi.copy import INTRO
from saathi.orchestrator import TurnResult


@dataclass
class Incoming:
    kind: str
    text: str
    space: str
    addon: bool = False
    attachments: list[dict] = field(default_factory=list)


def parse_incoming(payload: dict) -> Incoming:
    chat = payload.get("chat")
    if isinstance(chat, dict):
        message_payload = chat.get("messagePayload") or {}
        message = message_payload.get("message") or {}
        space = (message_payload.get("space") or {}).get("name") or "addon"
        text = message.get("argumentText") or message.get("text") or ""
        sender = message.get("sender") or {}
        if sender.get("type") not in (None, "", "HUMAN"):
            return Incoming(kind="ignored", text="", space=space, addon=True)
        return Incoming(
            kind="message",
            text=str(text).strip(),
            space=str(space),
            addon=True,
            attachments=list(message.get("attachment") or []),
        )
    kind = payload.get("type")
    space = str((payload.get("space") or {}).get("name") or "space")
    if kind == "REMOVED_FROM_SPACE":
        return Incoming(kind="removed", text="", space=space)
    if kind == "ADDED_TO_SPACE":
        return Incoming(kind="added", text="", space=space)
    if kind == "MESSAGE":
        message = payload.get("message") or {}
        sender = message.get("sender") or payload.get("user") or {}
        if sender.get("type") not in (None, "", "HUMAN"):
            return Incoming(kind="ignored", text="", space=space)
        text = message.get("argumentText") or message.get("text") or ""
        return Incoming(
            kind="message",
            text=str(text).strip(),
            space=space,
            attachments=list(message.get("attachment") or []),
        )
    return Incoming(kind="ignored", text="", space=space)


def added_turn() -> TurnResult:
    return TurnResult(language="en", text=INTRO, mode="reply")


def message_body(turn: TurnResult) -> dict:
    body: dict = {"text": turn.text}
    if turn.cards:
        body["cardsV2"] = turn.cards
    return body


def envelope(incoming: Incoming, turn: TurnResult | None) -> dict:
    if incoming.kind in {"removed", "ignored"} or turn is None:
        return {}
    message = message_body(turn)
    if not incoming.addon:
        return message
    return {
        "hostAppDataAction": {
            "chatDataAction": {"createMessageAction": {"message": message}},
        }
    }
