"""Generic scenario builder: YAML in, Scenario dict out."""

from __future__ import annotations

import hashlib
from datetime import datetime, timedelta
from pathlib import Path
from typing import Any

import numpy as np
import yaml

from .limits import compute_limits, in_control_end_for
from .patterns import get_pattern


VALUE_PRECISION = 4


def _stable_seed(scenario_id: str) -> int:
    digest = hashlib.sha256(scenario_id.encode("utf-8")).digest()
    return int.from_bytes(digest[:8], "big", signed=False) & 0x7FFFFFFF


def _round(value: float) -> float:
    return round(float(value), VALUE_PRECISION)


def _sample_times(start_time: str, interval_minutes: float, n_samples: int) -> list[str]:
    base = datetime.strptime(start_time, "%H:%M")
    return [
        (base + timedelta(minutes=interval_minutes * i)).strftime("%H:%M")
        for i in range(n_samples)
    ]


def _build_sensor(
    cfg: dict[str, Any],
    n_samples: int,
    times: list[str],
    rng: np.random.Generator,
) -> dict[str, Any]:
    pattern_cfg = cfg["pattern"]
    pattern_fn = get_pattern(pattern_cfg["type"])

    baseline = cfg["baseline"]
    values, is_anomaly = pattern_fn(
        rng,
        n_samples,
        float(baseline["mean"]),
        float(baseline["sigma"]),
        pattern_cfg,
    )

    limits_override = cfg.get("limits")
    if limits_override:
        mean = float(limits_override["mean"])
        ucl = float(limits_override["ucl"])
        lcl = float(limits_override["lcl"])
    else:
        mean, ucl, lcl = compute_limits(
            values, in_control_end_for(pattern_cfg, n_samples)
        )

    points = [
        {
            "sample": i + 1,
            "time": times[i],
            "value": _round(values[i]),
            "mean": _round(mean),
            "ucl": _round(ucl),
            "lcl": _round(lcl),
            "isAnomaly": bool(is_anomaly[i]),
        }
        for i in range(n_samples)
    ]

    return {
        "key": cfg["key"],
        "label": cfg["label"],
        "unit": cfg["unit"],
        "description": cfg["description"],
        "points": points,
    }


def build_scenario(yaml_path: Path) -> dict[str, Any]:
    cfg = yaml.safe_load(yaml_path.read_text(encoding="utf-8"))

    seed = cfg.get("seed")
    if seed is None:
        seed = _stable_seed(cfg["id"])
    rng = np.random.default_rng(int(seed))

    n_samples = int(cfg["n_samples"])
    start_time = str(cfg["start_time"])
    interval_minutes = float(cfg["interval_minutes"])
    times = _sample_times(start_time, interval_minutes, n_samples)
    sensors = [_build_sensor(s, n_samples, times, rng) for s in cfg["sensors"]]

    result: dict[str, Any] = {
        "id": cfg["id"],
        "title": cfg["title"],
        "summary": cfg["summary"],
        "problemStatement": cfg["problemStatement"],
        "line": cfg["line"],
        "product": cfg["product"],
        "objectives": list(cfg["objectives"]),
        "sensors": sensors,
        "logs": [
            {
                "time": log["time"],
                "source": log["source"],
                "message": log["message"],
            }
            for log in cfg["logs"]
        ],
        "groundTruth": {
            "anomalyType": cfg["groundTruth"]["anomalyType"],
            "rootCause": cfg["groundTruth"]["rootCause"],
            "teachingFocus": list(cfg["groundTruth"]["teachingFocus"]),
        },
    }

    # Optional Socratic-tutor authoring fields. Pass through verbatim if present.
    if "tutorPlan" in cfg:
        result["tutorPlan"] = [
            {
                "concept": rung["concept"],
                "nudge": rung["nudge"],
                "hint": rung["hint"],
                "reveal": rung["reveal"],
            }
            for rung in cfg["tutorPlan"]
        ]
    if "misconceptions" in cfg:
        result["misconceptions"] = [
            {
                "id": m["id"],
                "label": m["label"],
                "triggerCues": list(m["triggerCues"]),
                "correctiveHint": m["correctiveHint"],
            }
            for m in cfg["misconceptions"]
        ]

    return result
