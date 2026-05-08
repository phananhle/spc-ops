"""Pluggable anomaly patterns for synthetic SPC sensor streams.

Each pattern function returns (values, is_anomaly) of length n_samples.
Add a new pattern by writing one function and registering it in PATTERNS.
"""

from __future__ import annotations

from typing import Any, Callable

import numpy as np


PatternFn = Callable[
    [np.random.Generator, int, float, float, dict[str, Any]],
    tuple[np.ndarray, np.ndarray],
]


def stable(
    rng: np.random.Generator,
    n_samples: int,
    mean: float,
    sigma: float,
    params: dict[str, Any],
) -> tuple[np.ndarray, np.ndarray]:
    del params
    values = rng.normal(loc=mean, scale=sigma, size=n_samples)
    is_anomaly = np.zeros(n_samples, dtype=bool)
    return values, is_anomaly


def trend(
    rng: np.random.Generator,
    n_samples: int,
    mean: float,
    sigma: float,
    params: dict[str, Any],
) -> tuple[np.ndarray, np.ndarray]:
    start = int(params["start"])
    slope = float(params["slope"])
    if start < 1 or start > n_samples:
        raise ValueError(f"trend.start must be in [1, {n_samples}], got {start}")

    base = rng.normal(loc=mean, scale=sigma, size=n_samples)
    is_anomaly = np.zeros(n_samples, dtype=bool)
    for i in range(start - 1, n_samples):
        base[i] += slope * (i - (start - 1) + 1)
        is_anomaly[i] = True
    return base, is_anomaly


def variance_increase(
    rng: np.random.Generator,
    n_samples: int,
    mean: float,
    sigma: float,
    params: dict[str, Any],
) -> tuple[np.ndarray, np.ndarray]:
    start = int(params["start"])
    multiplier = float(params.get("multiplier", 3.0))
    if start < 1 or start > n_samples:
        raise ValueError(f"variance_increase.start must be in [1, {n_samples}], got {start}")
    if multiplier <= 1.0:
        raise ValueError(f"variance_increase.multiplier must be > 1.0, got {multiplier}")

    values = np.empty(n_samples, dtype=float)
    is_anomaly = np.zeros(n_samples, dtype=bool)
    for i in range(n_samples):
        if i + 1 < start:
            values[i] = rng.normal(loc=mean, scale=sigma)
        else:
            values[i] = rng.normal(loc=mean, scale=sigma * multiplier)
            is_anomaly[i] = True
    return values, is_anomaly


PATTERNS: dict[str, PatternFn] = {
    "stable": stable,
    "trend": trend,
    "variance_increase": variance_increase,
}


def get_pattern(name: str) -> PatternFn:
    if name not in PATTERNS:
        raise KeyError(f"Unknown pattern '{name}'. Known: {sorted(PATTERNS)}")
    return PATTERNS[name]
