"""Validate a built scenario dict against the TS Scenario contract."""

from __future__ import annotations

from typing import Any


VALID_SENSOR_KEYS = {
    "pressure",
    "temperature",
    "diameter",
    "wallThickness",
    "coolantTemp",
}

REQUIRED_SCENARIO_KEYS = {
    "id",
    "title",
    "summary",
    "problemStatement",
    "line",
    "product",
    "objectives",
    "sensors",
    "logs",
    "groundTruth",
}

REQUIRED_SENSOR_KEYS = {"key", "label", "unit", "description", "points"}
REQUIRED_POINT_KEYS = {"sample", "time", "value", "mean", "ucl", "lcl"}
REQUIRED_LOG_KEYS = {"time", "source", "message"}
REQUIRED_GROUND_TRUTH_KEYS = {"anomalyType", "rootCause", "teachingFocus"}

REQUIRED_TUTOR_RUNG_KEYS = {"concept", "nudge", "hint", "reveal"}
REQUIRED_MISCONCEPTION_KEYS = {"id", "label", "triggerCues", "correctiveHint"}


class SchemaError(ValueError):
    pass


def _require_keys(d: dict[str, Any], required: set[str], where: str) -> None:
    missing = required - d.keys()
    if missing:
        raise SchemaError(f"{where}: missing keys {sorted(missing)}")


def validate_scenario(d: dict[str, Any]) -> None:
    if not isinstance(d, dict):
        raise SchemaError("scenario must be a dict")

    _require_keys(d, REQUIRED_SCENARIO_KEYS, "scenario")

    if not d["sensors"]:
        raise SchemaError("scenario.sensors must be non-empty")

    seen_keys: set[str] = set()
    for idx, sensor in enumerate(d["sensors"]):
        where = f"sensor[{idx}]"
        _require_keys(sensor, REQUIRED_SENSOR_KEYS, where)
        key = sensor["key"]
        if key not in VALID_SENSOR_KEYS:
            raise SchemaError(
                f"{where}.key '{key}' not in {sorted(VALID_SENSOR_KEYS)}"
            )
        if key in seen_keys:
            raise SchemaError(f"{where}.key '{key}' appears more than once")
        seen_keys.add(key)

        points = sensor["points"]
        if not points:
            raise SchemaError(f"{where}.points must be non-empty")
        for i, point in enumerate(points):
            ploc = f"{where}.points[{i}]"
            _require_keys(point, REQUIRED_POINT_KEYS, ploc)
            if point["sample"] != i + 1:
                raise SchemaError(
                    f"{ploc}.sample expected {i + 1}, got {point['sample']}"
                )
            if not (point["lcl"] <= point["mean"] <= point["ucl"]):
                raise SchemaError(
                    f"{ploc}: expected lcl <= mean <= ucl, "
                    f"got lcl={point['lcl']} mean={point['mean']} ucl={point['ucl']}"
                )

    for idx, log in enumerate(d["logs"]):
        _require_keys(log, REQUIRED_LOG_KEYS, f"log[{idx}]")

    _require_keys(d["groundTruth"], REQUIRED_GROUND_TRUTH_KEYS, "groundTruth")

    if "tutorPlan" in d:
        if not isinstance(d["tutorPlan"], list):
            raise SchemaError("tutorPlan must be a list")
        for idx, rung in enumerate(d["tutorPlan"]):
            _require_keys(rung, REQUIRED_TUTOR_RUNG_KEYS, f"tutorPlan[{idx}]")

    if "misconceptions" in d:
        if not isinstance(d["misconceptions"], list):
            raise SchemaError("misconceptions must be a list")
        seen_ids: set[str] = set()
        for idx, m in enumerate(d["misconceptions"]):
            where = f"misconceptions[{idx}]"
            _require_keys(m, REQUIRED_MISCONCEPTION_KEYS, where)
            if not isinstance(m["triggerCues"], list) or not m["triggerCues"]:
                raise SchemaError(f"{where}.triggerCues must be a non-empty list")
            if m["id"] in seen_ids:
                raise SchemaError(f"{where}.id '{m['id']}' appears more than once")
            seen_ids.add(m["id"])
