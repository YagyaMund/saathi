"""Who is hired. This is model setup, not a customer record."""

from __future__ import annotations

from saathi.config import load_settings


def read_staff() -> dict:
    """Return which shop jobs are hired. No customer data and no secrets."""
    return {"jobs": load_settings().staff}
