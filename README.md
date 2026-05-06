# SPC-Ops

SPC-Ops is a lightweight demo of a Statistical Process Control teaching tool for manufacturing operators. The app shows synthetic process charts, contextual manufacturing logs, training objectives, a learner notes area, and a mocked Socratic tutor chat.

The current version is frontend-only. It uses local demo data and deterministic tutor responses so the UI can be reviewed before plugging in generated datasets or a real LLM backend.

## Tech Stack

- Vite
- React
- TypeScript
- Recharts
- Plain CSS

## Getting Started

Install dependencies:

```bash
npm install
```

Start the local development server:

```bash
npm run dev
```

Open the URL printed by Vite, usually:

```bash
http://127.0.0.1:5173/
```

Build for production:

```bash
npm run build
```

Preview the production build locally:

```bash
npm run preview
```

Run lint checks:

```bash
npm run lint
```

## Project Structure

```text
src/
  App.tsx                 Main SPC training interface
  App.css                 App-specific layout and component styles
  index.css               Global theme and base styles
  data/
    demoScenario.ts       Local synthetic manufacturing scenario
    types.ts              Scenario, sensor, log, and ground-truth types
  services/
    tutor.ts              Mock Socratic tutor response service
```

## Demo Data

The app reads from a single typed scenario object in `src/data/demoScenario.ts`. It includes:

- Four sensor streams: outer diameter, melt pressure, cooling bath temperature, and wall thickness
- Control chart metadata: mean, upper control limit, lower control limit, and anomaly flags
- Manufacturing logs
- Debugging objectives
- Ground-truth anomaly and root-cause metadata

When Hung's generated data is ready, the easiest path is to reshape it to match the types in `src/data/types.ts` and replace or add scenario files under `src/data/`.

## Tutor Mock

The chat currently uses `getMockTutorResponse()` in `src/services/tutor.ts`. It is intentionally simple and local. A future LLM integration can replace this with an API-backed function that accepts:

- The learner message
- The active scenario
- The active sensor
- The previous chat messages

## Free Deployment

Vercel is the simplest free deployment target for this project because it supports Vite apps out of the box.

Recommended Vercel settings:

- Framework preset: `Vite`
- Build command: `npm run build`
- Output directory: `dist`
- Install command: `npm install`

Netlify is also a good free option with the same build command and output directory, but Vercel is usually the fastest path if you already have the project on GitHub.
