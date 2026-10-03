# PathForge – AI Career & Research Roadmap

PathForge turns **a student's background + current skills + a career/research goal** into a **skill-gap analysis** and a
**personalised, prerequisite-aware learning roadmap**, rendered as an interactive dependency graph. Every course in the
roadmap carries a reason ("*Machine Learning is a core skill for AI Engineer — you're at 10%, the target is 75%…*").

The roadmap comes from a **deterministic, explainable engine** built on structured data
(courses → skills → prerequisites → careers → research directions). The AI assistant, **PathGPT**, explains and adjusts
that roadmap; it is never the recommendation engine itself.

## Quick start

Requirements: Node.js 22+ (developed on Node 24). No database server or API keys needed.

```bash
npm install
npm run dev
```

- Web app: http://localhost:5173
- API: http://localhost:4000

On first start the API creates an **embedded PostgreSQL database** (PGlite, stored in `server/data/`), seeds the catalog
and creates a demo account.

**Demo account** (local seed data, see `server/src/db/seed.ts`): `demo@pathforge.dev` / `pathforge123`, a third-year
Physics student working towards *AI Engineer*. The login page also has an "Explore with the demo account" button.

| Script | What it does |
| --- | --- |
| `npm run dev` | API (tsx watch) + web (Vite) together |
| `npm test` | Engine and API integration tests (in-memory database) |
| `npm run typecheck` | Type-check server and client |
| `npm run build` / `npm start` | Production build of both apps / start the compiled API |
| `npm run db:reset -w server` | Drop all tables and re-seed (stop the dev server first) |

## Configuration (`server/.env`, all optional)

Copy `server/.env.example` to `server/.env`.

| Variable | Purpose |
| --- | --- |
| `DATABASE_URL` | Use a real PostgreSQL server instead of the embedded one, e.g. `postgres://user:pass@localhost:5432/pathforge`. The same schema runs on both. |
| `JWT_SECRET` | Token signing secret. **Required** when `NODE_ENV=production`. |
| `AI_PROVIDER`, `GEMINI_API_KEY` / `OPENAI_API_KEY` | Let Gemini or OpenAI phrase PathGPT's answers. Without a key, PathGPT uses its built-in reasoning engine. Models: `GEMINI_MODEL` (default `gemini-2.5-flash`), `OPENAI_MODEL` (default `gpt-4o-mini`). |
| `EXPOSE_RESET_TOKEN` | There is no mail service, so outside production the forgot-password response includes the reset link. |

## Deploy to Vercel

The repo is ready for Vercel: `vercel.json` builds both apps, serves `client/dist` as a static SPA and routes `/api/*`
to one serverless function (`api/index.mjs`) that runs the Express app.

Vercel functions have no persistent disk, so the embedded PGlite database can't be used there — connect a hosted PostgreSQL:

1. **Database** — in the Vercel dashboard open *Storage → Create Database → Neon* (free tier) and connect it to the project,
   or create one at [neon.tech](https://neon.tech) and copy its **pooled** connection string.
2. **Project** — *Add New → Project → Import* this GitHub repository. Keep the root directory and leave the framework preset on *Other*
   (`vercel.json` sets the build).
3. **Environment variables** (Settings → Environment Variables):

   | Variable | Value |
   | --- | --- |
   | `DATABASE_URL` | Postgres connection string (set automatically by the Neon integration) |
   | `JWT_SECRET` | a long random string — required in production |
   | `EXPOSE_RESET_TOKEN` | `true` only for a demo without an email service (shows the reset link on screen) |
   | `GEMINI_API_KEY` / `OPENAI_API_KEY` | optional, for LLM-written PathGPT answers |

4. **Deploy.** The first API request creates the tables and seeds the catalog, Vietnamese translations and demo account.

## Languages (English / Tiếng Việt)

Use the **EN | VI** toggle in the sidebar, the top bar, the login pages, onboarding, or *Settings → Profile → Language*.
The choice is remembered per browser (first visit follows the browser language).

Everything follows the selected language:

- **UI text** — `client/src/i18n/vi.json`, keyed by the English text (`t('…')`). Run `npm run i18n:check -w client` to list untranslated strings.
- **Catalog content** (courses, skills, careers, paths, research directions, projects) — `server/src/data/vi.ts`, seeded into the
  `catalog_translations` table and re-synced automatically when the file changes.
- **Explanations, PathGPT answers and API errors** — generated server-side in the language sent as `Accept-Language`
  (`server/src/engine/phrases.ts`, `server/src/ai/localAssistant.ts`, `server/src/i18n.ts`). PathGPT also understands
  Vietnamese questions, with or without diacritics.

## Features

| Page | Highlights |
| --- | --- |
| Landing | Hero with animated roadmap, how-it-works, explainability, path modes, career grid |
| Login / Register / Forgot & reset password | JWT auth, bcrypt hashing, rate-limited auth endpoints, single-use 30-minute reset tokens |
| Onboarding | 4 steps: profile → skill sliders (pre-filled from a typical baseline for the chosen major) → completed courses → career, research direction, secondary interests |
| Dashboard | Welcome, current goal, progress ring, current focus, next step, critical gaps, ETA, roadmap preview, checklist with *mark as completed*, hours-by-category chart, recommended project |
| Skill Gap | Current vs required per skill for the active path, the career alone or the research direction; critical / improve / ready groups; priority; the course that closes each gap; **Generate My Roadmap** |
| Roadmap | React Flow dependency graph (horizontal/vertical, hover highlights a course's prerequisite chain), statuses *completed / current / recommended / locked / skipped*, list view with reordering, skip, add (pulls in missing prerequisites), remove, weekly pace, regenerate, and **alternative path modes** (Standard, Research, Specialisation) with time/size previews |
| Course Library & Course Detail | Search + filters (category, difficulty, career, research, credits, length, my status), full detail incl. **"Why is this course recommended?"** personalised to the learner |
| Career Explorer | Reverse view: career → required skills → courses → projects → portfolio suggestions → the roadmap this learner would get (works signed out too) |
| Projects | Readiness per project from current skill levels, learning stage, recommended next project |
| PathGPT | Chat that uses the learner's profile, gaps and roadmap; answers *why do I need X*, *can I skip X*, *I only have N months*, *moving from my major to Y*, project suggestions, progress; offers one-click actions (skip, mark completed, change pace, open course) |
| Settings | Profile, skills, completed courses, goals (regenerates the roadmap), password, log out |

## The recommendation engine (`server/src/engine/`)

Deterministic: the same profile always produces the same roadmap, and every decision is stored as a reason.

1. **Targets** — required skills from the career; the selected path can raise them; the *Research Path* folds in the
   research direction's requirements (`buildTargets`).
2. **Current levels** — the higher of the self-reported level and what completed courses teach
   (finishing a course counts as evidence of its skills) (`effectiveLevels`).
3. **Gaps** — `gap = required − current`, `gap% = gap / required`, `score = gap × importance weight`.
   *Critical* = at least half the required level missing on an important skill (`analyzeGap`).
4. **Course selection** — for each gap, largest score first: among courses that reach the required level, prefer the one
   most relevant to the goal (career core > elective > research link), then the smallest sufficient step.
5. **Milestones** — the path's capstone (industry capstone, CV capstone, research paper project, …).
6. **Prerequisites** — walk them: completed ones stay as *completed* nodes, ones the learner already masters are
   **skipped automatically** (with the evidence shown), the rest are added.
7. **Priority** — own gap score + 0.9 × the highest priority of anything the course unlocks, so prerequisites of
   critical courses rise.
8. **Order** — topological sort (Kahn) that picks the highest-priority ready course at each step.
9. **Statuses & schedule** — computed live: the first unlocked course is *current*, other unlocked ones *recommended*,
   the rest *locked* until prerequisites are completed or skipped; weeks are scheduled from the weekly learning time.

Explanations (`explain.ts`) are generated from these stored reasons and the learner's live levels, so they stay correct
as the learner progresses.

## Architecture

```
CareerMap/
├─ server/                 Node.js + Express 5 + TypeScript
│  ├─ src/data/            Seed catalog: skills, 66 courses, 9 careers (3 paths each), 10 research directions, 19 projects, majors
│  ├─ src/db/              PostgreSQL schema, PGlite/pg adapter, seeding
│  ├─ src/engine/          Gap analysis, roadmap generation, statuses, explanations, project fit
│  ├─ src/ai/              PathGPT: local reasoning engine + optional Gemini/OpenAI grounding
│  ├─ src/routes/          auth, catalog, me (profile/onboarding/goals), roadmap, insights, assistant
│  └─ test/                node:test engine + API integration tests
└─ client/                 React 19 + TypeScript + Vite + Tailwind CSS 4 + React Flow + Recharts
   └─ src/
      ├─ components/       UI primitives, roadmap graph, course detail/drawer, charts, layout
      ├─ pages/            13 pages (lazy-loaded)
      └─ lib/              API client, hooks, types, formatting
```

### Database (PostgreSQL)

| Table | Relationships |
| --- | --- |
| `users` | → `careers` (primary goal), → `research_directions` (primary direction) |
| `skills`, `careers`, `research_directions`, `courses`, `projects` | catalog entities |
| `course_prerequisites` | course ↔ prerequisite course (self-referencing many-to-many) |
| `course_skills` | course ↔ skill, with the level the course teaches |
| `career_skills`, `research_skills` | career/research ↔ skill, with required level and importance weight |
| `career_courses`, `research_courses` | career/research ↔ course (core / elective) |
| `career_paths`, `career_path_skills`, `career_path_courses` | alternative roadmaps per career and their extra requirements and milestones |
| `project_skills`, `project_courses`, `project_careers`, `project_research` | project requirements and links |
| `user_skills`, `user_completed_courses`, `user_interests` | the learner's levels, completed courses, secondary interests |
| `roadmaps`, `roadmap_courses` | one active roadmap per user (history kept); ordered courses with origin, skip flag, priority and stored reasons |
| `chat_messages` | PathGPT history |

### API overview

| Endpoint | |
| --- | --- |
| `POST /api/auth/register · login · forgot-password · reset-password · change-password`, `GET /api/auth/me` | auth |
| `GET /api/catalog/meta · courses · courses/:code · careers · careers/:slug?path= · research` | catalog (personalised when signed in) |
| `GET/PUT /api/me/profile`, `PUT /api/me/skills · completed · goals`, `POST /api/me/onboarding` | learner profile |
| `GET /api/roadmap`, `GET /api/roadmap/paths`, `POST /api/roadmap/generate` | roadmap and path previews |
| `POST /api/roadmap/courses/:code/complete · skip · move`, `POST/DELETE /api/roadmap/courses` , `PUT /api/roadmap/weekly-hours` | customisation |
| `GET /api/insights/gap?scope= · dashboard · projects` | analysis |
| `POST /api/assistant/chat`, `GET/DELETE /api/assistant/history` | PathGPT |
