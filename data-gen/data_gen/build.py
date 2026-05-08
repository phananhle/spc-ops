"""Build all scenarios.

Usage:
  python -m data_gen.build              # build all *.yaml in scenarios/
  python -m data_gen.build <scenario>   # build a specific scenario by stem
"""

from __future__ import annotations

import sys
from pathlib import Path

from .engine import build_scenario
from .io_writer import write_index_ts, write_scenario_json
from .schema import validate_scenario


def _repo_root() -> Path:
    return Path(__file__).resolve().parents[2]


def _scenarios_dir() -> Path:
    return Path(__file__).resolve().parent / "scenarios"


def _output_dir() -> Path:
    return _repo_root() / "src" / "data" / "scenarios"


def main(argv: list[str]) -> int:
    yaml_dir = _scenarios_dir()
    out_dir = _output_dir()

    if len(argv) > 1:
        targets = [yaml_dir / f"{argv[1]}.yaml"]
        if not targets[0].exists():
            print(f"error: {targets[0]} not found", file=sys.stderr)
            return 1
    else:
        targets = sorted(yaml_dir.glob("*.yaml"))
        if not targets:
            print(f"error: no *.yaml found in {yaml_dir}", file=sys.stderr)
            return 1

    for yaml_path in targets:
        scenario = build_scenario(yaml_path)
        validate_scenario(scenario)
        json_path = write_scenario_json(out_dir, scenario)
        print(f"wrote {json_path.relative_to(_repo_root())}")

    index_path = write_index_ts(out_dir)
    print(f"wrote {index_path.relative_to(_repo_root())}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main(sys.argv))
