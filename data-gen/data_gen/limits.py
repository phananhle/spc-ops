"""Statistical control-limit computation."""

from __future__ import annotations

import numpy as np


def compute_limits(
    values: np.ndarray, in_control_end: int
) -> tuple[float, float, float]:
    if in_control_end < 2:
        raise ValueError(
            f"in_control_end must be >= 2 to compute std (got {in_control_end})"
        )
    if in_control_end > len(values):
        raise ValueError(
            f"in_control_end {in_control_end} exceeds values length {len(values)}"
        )
    in_control = values[:in_control_end]
    mean = float(in_control.mean())
    sigma = float(in_control.std(ddof=1))
    ucl = mean + 3.0 * sigma
    lcl = mean - 3.0 * sigma
    return mean, ucl, lcl


def in_control_end_for(pattern: dict, n_samples: int) -> int:
    pattern_type = pattern["type"]
    if pattern_type == "stable":
        return n_samples
    if pattern_type in ("trend", "variance_increase"):
        return max(2, int(pattern["start"]) - 1)
    return n_samples
