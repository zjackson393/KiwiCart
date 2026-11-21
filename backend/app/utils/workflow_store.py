from __future__ import annotations

import uuid
from typing import Any


class WorkflowStore:
    """
    Tiny in-memory hand-off store used to shuttle state between the
    grocery-list -> route-choice -> map-display steps of the KiwiCart
    workflow.

    Keyed by a workflow id issued as an httpOnly cookie, mirroring the
    in-process caching pattern already used for geocoding results in
    routes/Route.py. Not persisted across server restarts or replicas —
    that's fine here, since it only needs to survive one browsing
    session's trip between pages, not act as durable storage.
    """

    def __init__(self) -> None:
        self._data: dict[str, dict[str, Any]] = {}

    def get(self, workflow_id: str | None, key: str, default: Any = None) -> Any:
        if not workflow_id:
            return default
        return self._data.get(workflow_id, {}).get(key, default)

    def set(self, workflow_id: str, key: str, value: Any) -> None:
        self._data.setdefault(workflow_id, {})[key] = value

    def clear(self, workflow_id: str) -> None:
        self._data.pop(workflow_id, None)

    @staticmethod
    def new_id() -> str:
        return uuid.uuid4().hex


workflow_store = WorkflowStore()
