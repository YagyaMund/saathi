"""ADK agents for Saathi. Run locally with a Gemini API key. Agent Runtime stays off."""

from __future__ import annotations

import os

from google.adk.agents.llm_agent import Agent
from google.genai import types

from saathi.scribe import write_products_row
from saathi.staff import read_staff

MODEL = os.environ.get("SAATHI_MODEL", "gemini-2.5-flash")
QUIET = types.GenerateContentConfig(temperature=0)

cataloguer = Agent(
    name="cataloguer",
    model=MODEL,
    description=(
        "Turns a photo and the seller's words into one product listing. "
        "Asks when a buyer-critical fact is missing. Does not guess."
    ),
    instruction=(
        "You are the Cataloguer for a one-person shop. The seller sends a photo and says "
        "what the piece is, in English or Hindi. Produce one listing: title, category, "
        "fabric, colour, price in rupees, and stock. If buyers always need a fact and she "
        "did not say it, ask her. Do not guess a price, a stock count, or a fabric. "
        "You do not write the Sheet. The Scribe does. Do not search the web. "
        "Do not mention other customers."
    ),
    generate_content_config=QUIET,
)

photo_coach = Agent(
    name="photo_coach",
    model=MODEL,
    description=(
        "Looks at a product photo and says if it is dark, blurry, cropped, or cluttered, "
        "and how to shoot it again. Does not edit the image."
    ),
    instruction=(
        "You are the Photo coach. Look only at the photo. Say if it is dark, blurry, "
        "cropped, or cluttered, and how to shoot it again. The Cataloguer still lists "
        "the product. You do not edit the image. You do not invent a price."
    ),
    generate_content_config=QUIET,
)

scribe = Agent(
    name="scribe",
    model=MODEL,
    description="The only writer to the seller's Google Sheet. Writes one Products row.",
    instruction=(
        "You are the Scribe, the only one who writes the seller's Google Sheet. "
        "Write one Products row by calling write_products_row. Call it only when title, "
        "fabric, colour, price_inr, and stock are all present. Never write a customer "
        "name, phone, address, or payment. If she later edits a cell, her edit stands."
    ),
    tools=[write_products_row],
    generate_content_config=QUIET,
)

root_agent = Agent(
    name="saathi",
    model=MODEL,
    description=(
        "Front door for a one-person shop. Speaks in Google Chat in English or Hindi "
        "and delegates to hired staff."
    ),
    instruction=(
        "You are Saathi, the only voice the seller hears in Google Chat. Reply in the "
        "language of her last message, English or Hindi. Use read_staff to see who is "
        "hired. Cataloguer, Photo coach, and Scribe are the jobs on duty in this demo. "
        "Delegate listing work to them. You never invent a price, a stock count, or a "
        "payment. Negotiator and Payment checker are off. Do not bargain and do not "
        "mark anything paid. Do not search the web."
    ),
    sub_agents=[cataloguer, photo_coach, scribe],
    tools=[read_staff],
    generate_content_config=QUIET,
)
