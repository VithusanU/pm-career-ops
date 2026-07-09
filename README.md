# PM Career Ops

A full-stack job application OS built to treat the PM job search the way a PM manages a product sprint — with a pipeline, KPIs, daily routines, and a feedback loop.

> **Live:** [pm-career-ops.vercel.app](https://pm-career-ops.vercel.app)

---

## The Idea

Most job seekers use a spreadsheet. A spreadsheet tracks the past — it does nothing for what's next. PM Career Ops reframes the job search as a pipeline problem: inputs (applications), stages, conversion rates, and a next action on every open deal.

---

## Pages

| Route | Purpose |
|-------|---------|
| `/` | Command Center — KPIs, daily routine checklist, upcoming actions |
| `/pipeline` | Application tracker with stage management, fit scoring, ATS keywords, and URL import |
| `/companies` | Company research hub with analysis framework |
| `/network` | Contact CRM with LinkedIn message templates |
| `/content` | Content calendar for building in public during the search |
| `/resources` | Interview prep, resume system, PM frameworks |

---

## Key Features

**AI-powered job import** — Paste any job posting URL. The app extracts the company, role, and ATS keywords automatically. Supports Greenhouse, Lever, Workday, Ashby, LinkedIn, and Indeed (via bookmarklet for bot-protected sites).

**Pipeline view** — Applications move through stages (Researching → Applied → Phone Screen → Interview → Final Round → Offer). Filter by stage, sort by fit score.

**Fit scoring** — Rate each application 1–100 based on role alignment, company quality, and skill match. Forces prioritisation when you have 40 applications and three days to prep.

**Next action tracking** — Every application has a next action and date. The dashboard surfaces what needs attention today, plus a stage-by-stage funnel and a "needs attention" list for active applications missing a next step.

**Gmail status sync (optional)** — Detects application-related emails (rejections, interview requests, offers) via read-only Gmail access and surfaces them as suggestions on the Pipeline page. Nothing is written to your pipeline automatically — you accept or dismiss each match.

**CSV import/export** — Bring in an existing spreadsheet or back up your pipeline at any time from the Pipeline page.

**Dark mode** — Full light/dark toggle, persists across sessions.

---

## Tech Stack

| | |
|---|---|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS |
| Auth | Supabase Auth (Google OAuth + PKCE) |
| Database | Supabase PostgreSQL with Row-Level Security |
| Job import | Server-side scraping + Jina AI headless fallback + bookmarklet |
| Deployment | Vercel |

---

## Getting Started

### Prerequisites

- Node.js 18+
- A [Supabase](https://supabase.com) project with Google OAuth configured

### 1. Clone and install

```bash
git clone https://github.com/VithusanU/pm-career-ops.git
cd pm-career-ops
npm install
```

### 2. Environment variables

Create `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your_supabase_anon_key

# Required only for Gmail application-status sync (Pipeline page → "Sync Gmail").
# Use the SAME Google Cloud OAuth client you already configured as the
# Google provider in Supabase Auth settings — it just needs the Gmail API
# enabled and https://www.googleapis.com/auth/gmail.readonly added to its
# consent screen scopes. Without these two set, the rest of the app works
# fine — the Gmail sync button just returns a "not configured" message.
GOOGLE_CLIENT_ID=your_google_oauth_client_id
GOOGLE_CLIENT_SECRET=your_google_oauth_client_secret
```

### 3. Database schema

Run `supabase/schema.sql` in your Supabase SQL editor, then run
`supabase/migrations/002_pm_ops_v2.sql` (adds companies, the fit-score
rubric, daily-checklist history, and Gmail sync tables). Migration 002 is
additive-only and backfills from your existing data — it won't touch or
require re-entering anything already in `applications`.

### 4. Start dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Project Structure

```
pm-career-ops/
├── app/
│   ├── page.tsx            # Command Center dashboard
│   ├── pipeline/           # Application tracker
│   ├── companies/          # Company research hub
│   ├── network/            # Contact CRM
│   ├── content/            # Content calendar
│   ├── resources/          # Interview + resume prep
│   └── api/import-job/     # Job URL import endpoint
├── components/             # Shared UI components
│   └── Nav.tsx             # Navigation + dark mode toggle
└── lib/                    # Supabase client + types
```

---

## License

MIT

---

*Built by [Vithusan Uruthirakumaran](https://github.com/VithusanU)*
