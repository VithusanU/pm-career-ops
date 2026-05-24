"use client";
import { useState } from "react";
import clsx from "clsx";

const PM_QUESTIONS = [
  {
    category: "Product Sense",
    questions: [
      { q: "Design a product for [X population]", framework: "Clarify → Users → Problems → Solutions → Prioritize → Metrics → Trade-offs" },
      { q: "How would you improve [existing product]?", framework: "Current state → User segments → Key pain points → 3 improvements → Priority + metrics" },
      { q: "What's your favorite product and why?", framework: "Product → Core user → Job to be done → Why it nails the use case → What I'd change" },
      { q: "How would you design [feature] for [company]?", framework: "Goal clarification → Users → Use cases → Scope → UX flow → Edge cases → Metrics" },
    ],
  },
  {
    category: "Analytical",
    questions: [
      { q: "A key metric dropped 20% overnight — diagnose it.", framework: "External factors → Data quality → Segmentation (platform, geo, user type) → Recent changes → Hypothesis → Fix" },
      { q: "How would you measure success for [feature]?", framework: "Goal → Primary metric → Secondary metrics → Guardrail metrics → Target + timeline" },
      { q: "Should we build Feature A or Feature B?", framework: "Clarify goals → Impact sizing → Effort estimate → Strategic fit → Risk → Recommendation" },
      { q: "How would you grow [metric] by 20%?", framework: "Current state → Levers → Quick wins vs long bets → Prioritized experiments → Expected lift" },
    ],
  },
  {
    category: "Behavioral (STAR)",
    questions: [
      { q: "Tell me about a time you influenced without authority.", framework: "Situation → Task → Action (built coalition, used data, found shared goal) → Result" },
      { q: "Describe a product decision you got wrong.", framework: "Context → Decision → What happened → What I learned → How I apply it now" },
      { q: "How do you handle competing priorities?", framework: "Situation → Stakeholders → My framework (impact/effort/strategy) → Decision → Outcome" },
      { q: "Tell me about a project you shipped from 0 to 1.", framework: "Problem → Discovery process → MVP scoping → Execution → Launch → Results + learnings" },
    ],
  },
  {
    category: "Strategy",
    questions: [
      { q: "How would you enter [new market]?", framework: "TAM/SAM/SOM → Beachhead segment → Competitive moat → GTM → Key risks" },
      { q: "A competitor just launched [feature] — how do you respond?", framework: "Assess threat → Customer impact → Our position → Options (copy/differentiate/ignore) → Recommendation" },
      { q: "How would you prioritize a roadmap?", framework: "Goals → Input sources → Framework (RICE / ICE) → Stakeholder alignment → Communication" },
    ],
  },
];

const RESUME_BULLETS = [
  {
    label: "Weak → Strong (Ops)",
    before: "Managed a team of 5 people",
    after: "Led a 5-person ops team that reduced order fulfillment time by 34% through process redesign and SLA enforcement",
  },
  {
    label: "Weak → Strong (Dev)",
    before: "Built a web application",
    after: "Shipped Drivn, a full-stack productivity platform (React/Node) — designed the core task execution loop based on user feedback from 20+ beta testers",
  },
  {
    label: "Weak → Strong (Analytics)",
    before: "Used data to make decisions",
    after: "Built a KPI dashboard tracking 12 operational metrics; identified a $40K/month inefficiency and drove the fix through cross-functional alignment",
  },
];

const JOB_SOURCES = [
  {
    category: "🎯 Highest Signal (PM Recruiters Post Here First)",
    note: "These are the boards hiring managers and PM-focused recruiters check daily.",
    links: [
      { label: "Lenny's Newsletter Job Board", url: "https://www.lennysnewsletter.com/c/job-board", tag: "Top Pick", desc: "Curated PM roles at top-tier product companies. High signal, low noise." },
      { label: "LinkedIn Jobs — Product Manager", url: "https://www.linkedin.com/jobs/search/?keywords=product%20manager", tag: "Highest Volume", desc: "Most PM roles are posted here. Set up job alerts for 'Product Manager' + city/remote." },
      { label: "Y Combinator Work at a Startup", url: "https://www.workatastartup.com/jobs?role=pm", tag: "Startup", desc: "Direct access to YC-backed companies. Founders often review applications personally." },
      { label: "Wellfound (AngelList)", url: "https://wellfound.com/role/r/product-manager", tag: "Startup", desc: "Startups and scale-ups. Salary transparency, equity details shown upfront." },
    ],
  },
  {
    category: "📋 High Volume Job Boards",
    note: "Cast a wide net — set up daily email alerts so you catch roles early.",
    links: [
      { label: "Indeed — Product Manager", url: "https://www.indeed.com/q-product-manager-jobs.html", tag: "", desc: "Aggregates roles from company sites. Good for SMBs that don't post on LinkedIn." },
      { label: "Glassdoor — PM Jobs", url: "https://www.glassdoor.com/Job/product-manager-jobs-SRCH_KO0,15.htm", tag: "", desc: "Job listings + company reviews + salary data. Research companies here before applying." },
      { label: "Builtin — Product Jobs", url: "https://builtin.com/jobs/product", tag: "Tech Focus", desc: "Tech company roles. Strong in major US metros (NYC, SF, Chicago, Austin, Boston)." },
      { label: "Dice — PM Roles", url: "https://www.dice.com/jobs?q=product+manager&countryCode=US", tag: "", desc: "Tech-focused. Good for finding PM roles at mid-size tech companies." },
    ],
  },
  {
    category: "🚀 PM-Community & Niche Boards",
    note: "These boards attract companies that take product seriously. Less competition.",
    links: [
      { label: "Product Hunt Jobs", url: "https://www.producthunt.com/jobs?category=product", tag: "", desc: "Consumer-facing and early-stage product companies." },
      { label: "Mind the Product Jobs", url: "https://www.mindtheproduct.com/product-management-jobs/", tag: "", desc: "Global PM roles from companies with strong product cultures." },
      { label: "Product School Job Board", url: "https://productschool.com/jobs/", tag: "", desc: "PM roles from companies that hire Product School grads. Mid-market heavy." },
      { label: "Pallet — PM Collections", url: "https://pallet.com/browse/jobs?roles=product", tag: "", desc: "Curated job collections run by PM influencers and communities." },
    ],
  },
  {
    category: "🎓 Entry-Level & APM Programs",
    note: "If you're breaking in, APM programs are the front door. Apply to all of them.",
    links: [
      { label: "APM List — All APM Programs", url: "https://apmlist.com/", tag: "Must Visit", desc: "The definitive list of Associate PM programs at top tech companies. Bookmark this." },
      { label: "Handshake — PM Roles", url: "https://joinhandshake.com/career-paths/product-manager/", tag: "New Grads", desc: "University recruiting platform. Best if you're a recent grad or still in school." },
      { label: "Google APM Program", url: "https://buildyourfuture.withgoogle.com/programs/apm", tag: "Tier 1", desc: "Google's Associate PM program. Competitive, opens annually." },
      { label: "Meta RPM Program", url: "https://www.metacareers.com/careerprograms/pathways/rpm", tag: "Tier 1", desc: "Meta's Rotational PM program. Strong alumni network." },
    ],
  },
  {
    category: "🏢 Apply Directly (Skip the ATS Queue)",
    note: "Hiring managers often see direct applications before LinkedIn. Go straight to source.",
    links: [
      { label: "Notion Careers", url: "https://www.notion.so/careers", tag: "", desc: "Product-led growth company with strong PM culture." },
      { label: "Linear Careers", url: "https://linear.app/careers", tag: "", desc: "High-craft B2B tool. Small PM team, very selective." },
      { label: "Figma Careers", url: "https://www.figma.com/careers/", tag: "", desc: "Design tool with deep PM/design collaboration culture." },
      { label: "Stripe Careers", url: "https://stripe.com/jobs/search?teams[]=Product+%26+Design", tag: "", desc: "Writing-heavy PM culture. Strong on product strategy." },
      { label: "Shopify Careers", url: "https://www.shopify.com/careers", tag: "", desc: "Large PM org, good for commerce/marketplace domain." },
      { label: "Atlassian Careers", url: "https://www.atlassian.com/company/careers/all-jobs", tag: "", desc: "B2B / developer tools. Strong mission-driven PM culture." },
    ],
  },
  {
    category: "🔍 How Hiring Managers Actually Find You",
    note: "Active outreach beats passive applications 3:1. Here's where to show up.",
    links: [
      { label: "LinkedIn (Be Findable)", url: "https://www.linkedin.com/in/", tag: "Top Channel", desc: "70%+ of PM roles are filled via LinkedIn. Open to Work + keyword-optimized headline = inbound recruiter messages." },
      { label: "Product Management Happy Hour (Slack)", url: "https://productmanagementhappyhour.com/", tag: "Community", desc: "Active Slack with a #jobs channel. Recruiters post roles directly." },
      { label: "Lenny's Community", url: "https://www.lennysnewsletter.com/about", tag: "Community", desc: "Paid community, but the job board is free. Hiring managers post here personally." },
      { label: "r/ProductManagement", url: "https://www.reddit.com/r/ProductManagement/", tag: "Community", desc: "Job posts in the weekly thread. Good for low-competition roles at smaller companies." },
      { label: "Referral Outreach via LinkedIn", url: "https://www.linkedin.com/search/results/people/?keywords=product%20manager%20recruiter", tag: "Highest ROI", desc: "Referrals fill ~40% of PM roles. Message PMs at target companies for coffee chats → ask about referrals." },
    ],
  },
];

export default function Resources() {
  const [activeCategory, setActiveCategory] = useState(0);
  const [activeBullet, setActiveBullet] = useState(0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Resources</h1>
        <p className="text-slate-500 text-sm mt-1">Interview prep, resume system, PM frameworks, and where to apply.</p>
      </div>

      {/* WHERE TO APPLY — moved to top since it's the most actionable */}
      <div className="card">
        <h2 className="font-semibold text-slate-900 mb-1">Where PM Hiring Managers Find Candidates</h2>
        <p className="text-sm text-slate-500 mb-4">
          Sourced from how real PM hiring managers and recruiters describe their process. Apply to these first.
        </p>
        <div className="space-y-6">
          {JOB_SOURCES.map((section) => (
            <div key={section.category}>
              <div className="flex items-baseline gap-2 mb-1">
                <h3 className="text-sm font-semibold text-slate-800">{section.category}</h3>
              </div>
              <p className="text-xs text-slate-500 mb-2">{section.note}</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {section.links.map(({ label, url, tag, desc }) => (
                  <a
                    key={url}
                    href={url}
                    target="_blank"
                    rel="noreferrer"
                    className="group flex flex-col gap-1 bg-slate-50 hover:bg-blue-50 border border-slate-200 hover:border-blue-300 rounded-lg p-3 transition-all"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-medium text-slate-800 group-hover:text-blue-700 transition-colors">
                        {label} ↗
                      </span>
                      {tag && (
                        <span className="shrink-0 text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 font-medium">
                          {tag}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500">{desc}</p>
                  </a>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Interview Prep */}
      <div className="card">
        <h2 className="font-semibold text-slate-900 mb-3">PM Interview Question Bank</h2>
        <div className="flex flex-wrap gap-2 mb-4">
          {PM_QUESTIONS.map((cat, i) => (
            <button
              key={i}
              onClick={() => setActiveCategory(i)}
              className={clsx(
                "text-xs px-3 py-1.5 rounded-lg border transition-all",
                activeCategory === i
                  ? "bg-brand-600 text-white border-brand-600"
                  : "bg-white border-slate-200 text-slate-600 hover:border-slate-300"
              )}
            >
              {PM_QUESTIONS[i].category}
            </button>
          ))}
        </div>
        <div className="space-y-3">
          {PM_QUESTIONS[activeCategory].questions.map(({ q, framework }) => (
            <div key={q} className="bg-slate-50 rounded-lg p-4">
              <p className="font-medium text-slate-800 text-sm mb-2">"{q}"</p>
              <p className="text-xs text-slate-500">
                <span className="font-semibold text-brand-700">Framework: </span>
                {framework}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Resume System */}
      <div className="card">
        <h2 className="font-semibold text-slate-900 mb-1">Resume Bullet Transformer</h2>
        <p className="text-sm text-slate-500 mb-3">
          Every bullet = Action + Metric + Impact. Never describe what you did — describe what changed.
        </p>
        <div className="flex flex-wrap gap-2 mb-4">
          {RESUME_BULLETS.map((b, i) => (
            <button
              key={i}
              onClick={() => setActiveBullet(i)}
              className={clsx(
                "text-xs px-3 py-1.5 rounded-lg border transition-all",
                activeBullet === i
                  ? "bg-brand-600 text-white border-brand-600"
                  : "bg-white border-slate-200 text-slate-600"
              )}
            >
              {b.label}
            </button>
          ))}
        </div>
        <div className="space-y-3">
          <div className="bg-red-50 rounded-lg p-3">
            <p className="text-xs font-semibold text-red-600 uppercase mb-1">Before</p>
            <p className="text-sm text-red-800">{RESUME_BULLETS[activeBullet].before}</p>
          </div>
          <div className="bg-green-50 rounded-lg p-3">
            <p className="text-xs font-semibold text-green-600 uppercase mb-1">After</p>
            <p className="text-sm text-green-800">{RESUME_BULLETS[activeBullet].after}</p>
          </div>
        </div>
      </div>

      {/* PM Frameworks cheat sheet */}
      <div className="card">
        <h2 className="font-semibold text-slate-900 mb-3">PM Framework Cheat Sheet</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
          {[
            { name: "RICE Scoring", desc: "Reach × Impact × Confidence ÷ Effort. Use for roadmap prioritization." },
            { name: "Jobs-to-be-Done", desc: "When [situation], I want to [motivation], so I can [outcome]. Focus on the job, not the feature." },
            { name: "North Star Metric", desc: "1 metric that captures product value delivery. Everything ladders up to it." },
            { name: "Product Sense Framework", desc: "Users → Problems → Solutions → Tradeoffs → Metrics. Never jump to solutions." },
            { name: "MECE Analysis", desc: "Mutually Exclusive, Collectively Exhaustive. No gaps, no overlaps in segmentation." },
            { name: "Working Backwards", desc: "Start with the press release. What does success look like for the customer? Build toward that." },
          ].map(({ name, desc }) => (
            <div key={name} className="bg-slate-50 rounded-lg p-3">
              <p className="font-semibold text-brand-700 mb-1">{name}</p>
              <p className="text-slate-600 text-xs">{desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Positioning */}
      <div className="card">
        <h2 className="font-semibold text-slate-900 mb-3">Personal Brand Positioning</h2>
        <div className="space-y-3 text-sm">
          <div className="bg-brand-50 border border-brand-100 rounded-lg p-4">
            <p className="text-xs font-semibold text-brand-600 uppercase mb-1">Positioning Statement</p>
            <p className="text-slate-800 font-medium">
              "I'm an execution-focused PM candidate who bridges operations, software development, and product strategy.
              I've shipped real products, led teams, and built systems — now I want to bring that thinking to PM."
            </p>
          </div>
          <div>
            <p className="font-semibold text-slate-700 mb-2">LinkedIn Headline Options</p>
            <ul className="space-y-1 text-slate-600">
              {[
                "Aspiring PM | Built Drivn & Hangman | Ops + Dev background | Systems thinker",
                "Breaking into Product Management | Former Ops Leader | Software Builder | AI-curious",
                "Associate PM Candidate | Execution-first mindset | Product case studies at [your site]",
              ].map((h) => (
                <li key={h} className="bg-slate-50 rounded px-3 py-2">{h}</li>
              ))}
            </ul>
          </div>
          <div>
            <p className="font-semibold text-slate-700 mb-2">Content Pillars</p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {["Product Teardowns", "PM Career Advice", "AI in Product", "Build in Public"].map((p) => (
                <div key={p} className="bg-purple-50 text-purple-700 text-xs font-medium rounded-lg p-2 text-center">
                  {p}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
