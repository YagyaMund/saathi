# Saathi

Saathi is the AI salesperson for a one-person shop. She works in Google Chat, in English and Hindi. The seller's Google Sheet is the system of record. This slice hires three people: the Cataloguer, the Photo coach, and the Scribe.

Project: `saathi-510820`. Workspace account: `mundrayagya1@gmail.com`.

Saathi keeps a seller id, the project id, which jobs are on, the model name, and the secret name of that seller's Gemini key. She does not keep buyer names, phones, addresses, payment screenshots, or the chat. Price and stock are taken from her words in code. A model answer cannot replace them.

Negotiator and Payment checker are off. Nothing bargains, and nothing is marked paid.

## Run the demo

```bash
cd saathi
python3 -m venv .venv
source .venv/bin/activate
pip install -e ".[dev]"
python -m saathi
```

Open [http://127.0.0.1:4721](http://127.0.0.1:4721). The page is a Google Chat direct message plus her Products tab.

Without a key, Saathi reads the listing from the words you type. That is enough to write a row. With a key, the same turn also sends the photo or voice note to Gemini Flash.

```bash
cp .env.example .env
```

Put the seller's key in `.env` as `GEMINI_API_KEY`. Create it in project `saathi-510820`. Do not commit it, and do not paste it into chat. Leave `GOOGLE_GENAI_USE_VERTEXAI` unset or `FALSE` so the call uses that key, not Vertex.

```bash
pytest
```

## What you can say

- “Red Kanchipuram silk saree with a gold border. Price ₹1400. Three pieces in stock.”
- “लाल कांजीवरम सिल्क साड़ी, सुनहरी बॉर्डर। कीमत ₹1400। तीन पीस।”
- “Blue cotton saree, two pieces.” She asks for the price and does not invent one.
- A dark or tiny photo still gets a listing, and the Photo coach says how to shoot it again.

The chips on the page send those lines.

## Google Chat

`POST /chat` speaks the Chat app HTTP contract.

- `ADDED_TO_SPACE` gets a bilingual hello.
- `MESSAGE` gets a reply with `text` and, when a row is written, `cardsV2`.
- A Workspace add-on event (`chat.messagePayload`) gets the same reply inside `hostAppDataAction`.

Chat cannot call your laptop. To attach the app in project `saathi-510820`:

1. Enable the Google Chat API.
2. In the Chat API configuration, name the app Saathi and set the connection to an HTTP endpoint.
3. Point that URL at `https://<public-host>/chat` when you have one. Until then, use this page.
4. Turn on the added-to-space and message triggers.
5. Make the app visible to `mundrayagya1@gmail.com`.

Voice notes are file uploads. The demo page accepts a photo or an audio file. Gemini hears the audio only when the key is set.

## Her Sheet

Scribe writes one Products row: sku, title, category, fabric, colour, price, stock, photo link, photo note, language, time. Locally that row is `data/products.json` and `data/products.csv`. Photos sit in `data/media/` and the row stores the link.

To append the same row to her Google Sheet, set `SAATHI_SPREADSHEET_ID` and `SAATHI_SHEETS_ACCESS_TOKEN`. The tab is named `Products`. If the Sheet call fails, the local row stays and the chat says the Sheet did not update. Connecting OAuth (`drive.file`, and the Sheets scope while the app is in testing) is the next step. The consent screen is the only screen she sees.

## Agents

The ADK agents live in `agents/saathi/agent.py`: `saathi`, `cataloguer`, `photo_coach`, and `scribe`. Scribe is the only one with the sheet tool. From this folder, after the key is in `.env`:

```bash
adk web agents
```

That UI is for trying the agents. The shop demo is port 4721. Agent Runtime is not turned on.

The other seven jobs are in the staff list and off: Salesperson, Negotiator, Stock keeper, Order taker, Payment checker, Shift manager, Shop analyst.
