# TODO — SPC-Ops

Queued follow-ups, not yet started.

## 1. Move manufacturing logs panel to the right rail, above the tutor chat

**Today:** the analysis column on the left holds [chart → (logs + objectives) below]. The right column is just the tutor chat.

**Wanted:** the right rail becomes [logs (top), tutor chat (bottom)]. The analysis column on the left keeps [chart → objectives].

**Why:** logs are the operator's evidence trail — they should sit alongside the conversation with the tutor, where the learner is reasoning, rather than tucked under the chart.

**Files likely to change:**
- [src/App.tsx](src/App.tsx) — restructure the JSX so the `<section className="context-panel">` (logs) moves out of `.below-chart-grid` and into the right rail with `.chat-panel`.
- [src/App.css](src/App.css) — replace `.below-chart-grid` (currently a 2-col grid for logs + objectives) with just objectives below the chart. Right rail becomes a flex column with logs panel on top, chat panel below. The `position: sticky` rule on `.chat-panel` may need to relax so logs + chat scroll together.

## 2. Hide the scenario title until the learner figures out the problem

**Today:** the page header shows `scenario.title` (e.g. *"PETG filament diameter drift from screw starvation"*) — which gives the entire answer away.

**Wanted:** show a placeholder like `Problem: ???` until the learner has identified the issue. Then reveal the real title.

**Open design questions for the next session:**
- What counts as "figured out"? Options: a manual *Reveal* button; tutor-detected keyword match against `groundTruth.rootCause`; an explicit "submit your diagnosis" form.
- Where does the answer text go? Replace the placeholder with the title in place, or open a new "Solution" panel.
- Should the placeholder also hide `scenario.summary`? It currently leaks the answer too. Probably yes, replace with a generic "Diagnose what's happening on this line."
- What state holds "solved"? Local React state for now; persistable later if needed.

**Suggested first slice:** add a manual *I think I know* button that toggles a `revealed` boolean. When `false`: show `Problem: ???` and a generic summary. When `true`: show real title, summary, and `groundTruth.anomalyType` / `rootCause` formatted as the answer key. No tutor-detection logic in the first pass.

**Files likely to change:**
- [src/App.tsx](src/App.tsx) — `useState<boolean>` for revealed; conditional render of header h1/p.
- [src/App.css](src/App.css) — small style for the placeholder + reveal button.
- Optionally [src/data/types.ts](src/data/types.ts) — add a `genericTitle?: string` and `genericSummary?: string` per scenario so the placeholder text can be authored in YAML rather than hardcoded.
