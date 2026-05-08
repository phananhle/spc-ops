# CLAUDE.md

Guidance for Claude Code working on **SPC-Ops** — a teaching tool for Statistical Process Control on manufacturing lines. Operators see synthetic process charts, manufacturing logs, and a Socratic tutor; the goal is to teach them how to reason from chart patterns + log evidence to root cause.

## Tech stack

- Frontend: Vite 8 + React 19 + TypeScript 6 + Recharts 3 + plain CSS
- Data generation: Python 3.11+ (numpy + pyyaml; **no pandas**)
- Deploy target: Vercel (static frontend only — Python runs locally)

## Run commands

```bash
npm install                       # one-time, JS deps
npm run dev                       # Vite dev server at http://localhost:5173
npm run build                     # tsc -b && vite build (typecheck + bundle)
npm run lint                      # ESLint

cd data-gen && pip install -e .   # one-time, Python package
python -m data_gen.build          # regenerate src/data/scenarios/*.json + index.ts
python -m data_gen.build <stem>   # regenerate one scenario
```

## Architecture

Data flows YAML → JSON → TypeScript:

1. Each scenario is one YAML file in [data-gen/data_gen/scenarios/](data-gen/data_gen/scenarios/).
2. The Python engine ([data-gen/data_gen/engine.py](data-gen/data_gen/engine.py)) reads YAML, generates synthetic SPC values via composable patterns ([patterns.py](data-gen/data_gen/patterns.py)), computes 3σ control limits ([limits.py](data-gen/data_gen/limits.py)), validates against the TS contract ([schema.py](data-gen/data_gen/schema.py)), and writes JSON to `src/data/scenarios/`.
3. [src/data/scenarios/index.ts](src/data/scenarios/index.ts) is **auto-regenerated** by the build — do not edit by hand. It exports `scenarios: Scenario[]` and `activeScenario` (alphabetically first JSON for now; picker UI is future work).
4. [src/App.tsx](src/App.tsx) imports `activeScenario` and renders charts, logs, objectives, and the Socratic tutor.
5. The tutor ([src/services/tutor.ts](src/services/tutor.ts)) is **scenario-agnostic**: it scans `scenario.sensors[*].key/label` for keyword matches and rotates through `groundTruth.teachingFocus` for fallbacks. Do not add scenario-specific narrative branches.

## The Scenario contract

Source of truth: [src/data/types.ts](src/data/types.ts).

Valid `SensorKey` values: `pressure`, `temperature`, `diameter`, `wallThickness`, `coolantTemp`. Each scenario picks any subset (typically 4). Each `SensorPoint` carries its own `mean / ucl / lcl` per sample (the chart reads them directly), plus an HH:MM `time` string so the X-axis can show clock time alongside the sample number.

## Pattern catalog

In [data-gen/data_gen/patterns.py](data-gen/data_gen/patterns.py):

- **`stable`** — Gaussian noise around `mean` with `sigma`. `is_anomaly` always False.
- **`trend`** — stable up to sample `start`, then a linear ramp `slope * (i - start + 1)` added to noise. Use negative `slope` for downward trends. `is_anomaly` True from `start` onward.
- **`variance_increase`** — stable up to `start`, then `sigma` is multiplied by `multiplier` (default 3.0). Mean unchanged. `is_anomaly` True from `start` onward.

Add a new pattern by writing one function with signature `(rng, n_samples, mean, sigma, params) -> (values, is_anomaly)` and registering it in `PATTERNS`. Update [limits.py](data-gen/data_gen/limits.py)'s `in_control_end_for` if the new pattern needs a non-default in-control window.

## Adding a new scenario

1. Author a new YAML in [data-gen/data_gen/scenarios/](data-gen/data_gen/scenarios/) (use [pipe-diameter-drift.yaml](data-gen/data_gen/scenarios/pipe-diameter-drift.yaml) or [filament-screw-starvation.yaml](data-gen/data_gen/scenarios/filament-screw-starvation.yaml) as templates). Required top-level fields include `id`, `n_samples`, `start_time`, `interval_minutes`, `sensors[]`, `logs[]`, `groundTruth`.
2. Run `python -m data_gen.build`. JSON is written to `src/data/scenarios/<id>.json` and `index.ts` is regenerated.
3. Verify the chart visually with `npm run dev`.
4. Commit the new YAML, the new JSON, and the regenerated `index.ts`.

If the story needs a pattern not in the catalog, add it before authoring the YAML.

## Conventions

- **JSON output is committed** under `src/data/scenarios/`. Vercel doesn't run Python at build time.
- **4-decimal value rounding** on Python output for diffable JSON.
- **Y-axis tick labels: 4 sig figs**, formatted via `Number(v.toPrecision(4)).toString()` in [App.tsx](src/App.tsx).
- **Chart Y-axis domain** must include UCL/LCL: `[min(dataMin, lcl) - pad, max(dataMax, ucl) + pad]`.
- **No `git add -A` / `git add .`** when committing — stage by path so generated artifacts (`__pycache__`, `*.egg-info`, `dist/`) don't sneak in.
- **No pandas, no zod, no per-scenario tutor branches.** The architecture is intentionally minimal.

## Pending follow-ups

See [TODO.md](TODO.md) for queued work. Currently:
1. Move the manufacturing logs panel to the right rail above the tutor chat.
2. Hide `scenario.title` behind a `Problem: ???` placeholder until the learner reveals it.

## Memory references

`~/.claude/projects/C--Users-hungq-spc-ops/memory/` holds the rationale behind decisions made in this codebase (PETG choice, lead-lag teaching pattern, why JSON is committed, etc.). Read those before second-guessing an architectural choice — they capture the *why* that isn't obvious from the code.
