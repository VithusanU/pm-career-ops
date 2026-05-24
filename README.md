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

**Next action tracking** — Every application has a next action and date. The dashboard surfaces what needs attention today.

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
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 3. Database schema

Run the following in your Supabase SQL editor:

```sql
create table applications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null,
  company text not null,
  role text not null,
  url text,
  source text,
  stage text default 'Researching',
  priority text default 'Medium',
  score integer default 60,
  date_applied text,
  date_added text,
  next_action text default '',
  next_action_date text,
  notes text default '',
  ats_keywords text[],
  contact_name text default '',
  contact_linkedin text default '',
  response text default 'None',
  created_at timestamptz default now()
);

alter table applications enable row level security;
create policy "Users manage own applications"
  on applications for all using (auth.uid() = user_id);
```

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
