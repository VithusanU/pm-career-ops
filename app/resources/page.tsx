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

export default function Resources() {
  const [activeCategory, setActiveCategory] = useState(0);
  const [activeBullet, setActiveBullet] = useState(0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Resources</h1>
        <p className="text-slate-500 text-sm mt-1">Interview prep, resume system, and PM frameworks.</p>
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
