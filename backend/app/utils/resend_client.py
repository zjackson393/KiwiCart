from __future__ import annotations

import logging

import resend

from app.utils import settings

resend.api_key = settings.resend_api_key

logger = logging.getLogger(__name__)


def upsert_contact(email: str, name: str, subscribed: bool) -> None:
  """
  Create or update the Resend contact for this user in the Weekly
  Breadcrumb audience. Raises on failure — callers decide whether to
  roll back the DB change or just log and move on.
  """
  first_name, _, last_name = name.partition(" ")
  resend.Contacts.create(
      {
        "audience_id": settings.resend_audience_id,
        "email": email,
        "first_name": first_name or None,
        "last_name": last_name or None,
        "unsubscribed": not subscribed,
      }
  )