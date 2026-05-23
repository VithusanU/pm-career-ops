# PM Career Ops

> Your personal Product Management job application operating system.  
> Built by Vithusan Uthayakumar — treating the job search like a PM manages a product sprint.

---

## Quick Start

```bash
npm install
npm run dev
# Open http://localhost:3000
```

**Requires:** Node.js 18+ — download at nodejs.org

---

## What This Is

A full-stack Next.js dashboard that operationalizes every part of the PM job search:

| Page | Purpose |
|------|---------|
| `/` Dashboard | KPIs, daily checklist, upcoming actions |
| `/pipeline` | Application tracker with stage management |
| `/companies` | Company research hub + framework |
| `/network` | LinkedIn CRM + message templates |
| `/content` | Content calendar + article templates |
| `/resources` | Interview prep, resume system, PM frameworks |

---

## Operating Manual

### The Core Philosophy

Treat the job search like a PM manages a product:
- **Users** = recruiters and hiring managers
- **Funnel** = your application pipeline
- **Activation** = getting to an interview
- **Conversion** = offer
- **Feedback loop** = every rejection teaches you something

Ship daily. Iterate weekly. Measure everything.

---

### Daily Routine (3.5 hrs total)

**Morning Block — 30 min**
1. Open Dashboard → check upcoming actions
2. Scan LinkedIn Jobs, Greenhouse, Lever, YC Jobs (15 min)
3. Add 2–3 new roles to `/pipeline` with priority scores
4. Triage any emails/responses from yesterday

**Deep Work Block — 2 hrs**
1. 1 tailored application (resume + cover letter customized to JD)
2. 1 company analysis using `templates/company-analysis.md`
3. 30 min PM study (1 framework, 1 case study, or 1 mock question)

**Networking Block — 30 min**
1. Send 5 LinkedIn connection requests (PMs, recruiters, founders)
2. Respond to any messages
3. Comment thoughtfully on 3 posts in PM communities

**Content Block — 30 min**
1. Write or continue 1 blog post draft
2. OR repurpose yesterday's company analysis as a LinkedIn post

**Reflection — 15 min**
1. Update pipeline stages
2. Log what you applied to + who you contacted
3. Note 1 PM insight from today

---

### Weekly KPI Targets

| Metric | Target |
|--------|--------|
| Applications sent | 10/week |
| Tailored applications | 3/week |
| LinkedIn connections | 15/week |
| Coffee chats / calls | 1/week |
| Blog posts published | 1/week |
| LinkedIn posts | 2/week |
| PM study sessions | 5/week |
| Mock interviews | 1/week |
| Company research reports | 2/week |

**Review every Sunday.** Use `templates/weekly-review.md`.

---

### Priority Scoring System

Score each application 1–100 based on:

| Factor | Weight | Score |
|--------|--------|-------|
| Role alignment (PM vs APM vs RPM) | 30% | /30 |
| Company quality (brand, growth, mission) | 25% | /25 |
| Skill match (50%+ of JD requirements) | 20% | /20 |
| Location / remote flexibility | 15% | /15 |
| Referral or warm intro available | 10% | /10 |

**80–100** = Tier 1 (full tailored application + company research)  
**60–79** = Tier 2 (tailored bullets + quick cover letter)  
**40–59** = Tier 3 (fast-apply, generic cover letter)  
**<40** = Skip

---

### Application Stages

```
Researching → Applied → Phone Screen → Interview → Final Round → Offer
                                                               ↓
                                                          Rejected / Withdrawn
```

Move stages same day you hear back. Never let it go stale.

---

### Company Research → Blog Post Pipeline

Every company analysis you do should become two things:
1. **Interview prep** — you can answer any product question about them
2. **Blog post** — proof of PM thinking for your portfolio

Template: `templates/company-analysis.md`  
Target: 2 companies/week = 8/month = a body of work that gets you noticed.

---

## File Structure

```
pm-career-ops/
├── app/                    # Next.js pages
│   ├── page.tsx            # Dashboard
│   ├── pipeline/           # Application tracker
│   ├── companies/          # Company research hub
│   ├── network/            # LinkedIn CRM
│   ├── content/            # Content calendar
│   └── resources/          # Interview + resume
├── components/             # Shared UI components
├── data/                   # Your live data (edit these)
│   ├── applications.json   # Job applications
│   ├── contacts.json       # Network contacts
│   └── content.json        # Content pipeline
└── templates/              # Reusable frameworks
    ├── company-analysis.md # Full research template
    ├── resume-framework.md # Resume + cover letter system
    ├── interview-prep.md   # Question bank + STAR stories
    └── weekly-review.md    # Sunday review template
```

---

## Updating Your Data

All live data lives in `/data/*.json`. Edit these files to:
- Add new applications (`applications.json`)
- Track new contacts (`contacts.json`)
- Manage content ideas (`content.json`)

The dashboard pulls from these automatically.

---

## Personal Brand Positioning

**Positioning:** Execution-focused PM candidate who bridges ops, software development, and product strategy.

**LinkedIn Headline:** `Aspiring PM | Built Drivn & Hangman | Ops + Dev background | Systems thinker`

**Content Pillars:** Product Teardowns · PM Career · AI in Product · Build in Public

---

*Built by Vithusan — github.com/VithusanU*
