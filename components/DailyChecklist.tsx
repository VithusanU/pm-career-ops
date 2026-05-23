"use client";
import { useState } from "react";

const MORNING = [
  { id: "m1", label: "Review pipeline — any follow-ups due today?" },
  { id: "m2", label: "Check job boards: LinkedIn, Lever, Greenhouse (15 min)" },
  { id: "m3", label: "Add 2–3 new roles to pipeline with priority scores" },
];

const DEEP_WORK = [
  { id: "d1", label: "1 tailored application (resume + cover letter customized)" },
  { id: "d2", label: "Company research report for 1 target company" },
  { id: "d3", label: "PM study block: 1 framework or case study (30 min)" },
];

const NETWORK = [
  { id: "n1", label: "5 LinkedIn connection requests (PMs, recruiters, founders)" },
  { id: "n2", label: "Respond to any messages / follow up overdue contacts" },
  { id: "n3", label: "Engage with 3 posts in PM community (comment, not just like)" },
];

const PUBLISH = [
  { id: "p1", label: "Write or continue 1 blog post / LinkedIn article" },
  { id: "p2", label: "Repurpose company analysis into a short LinkedIn post" },
];

const REFLECT = [
  { id: "r1", label: "Log what you applied to, who you contacted" },
  { id: "r2", label: "Note 1 thing you learned about PM today" },
  { id: "r3", label: "Update pipeline stages for any responses received" },
];

const BLOCKS = [
  { title: "🌅 Morning (30 min)", items: MORNING },
  { title: "🔨 Deep Work (2 hrs)", items: DEEP_WORK },
  { title: "🤝 Networking (30 min)", items: NETWORK },
  { title: "✍️ Publish (30 min)", items: PUBLISH },
  { title: "🌙 Reflect (15 min)", items: REFLECT },
];

export default function DailyChecklist() {
  const allIds = BLOCKS.flatMap((b) => b.items.map((i) => i.id));
  const [checked, setChecked] = useState<Set<string>>(new Set());

  const toggle = (id: string) => {
    setChecked((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const pct = Math.round((checked.size / allIds.length) * 100);

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-semibold text-slate-900">Daily Routine</h2>
        <span className="text-xs font-medium text-slate-500">{checked.size}/{allIds.length} done</span>
      </div>

      <div className="h-1.5 bg-slate-100 rounded-full mb-4 overflow-hidden">
        <div className="h-full bg-brand-500 rounded-full transition-all" style={{ width: `${pct}%` }} />
      </div>

      <div className="space-y-4 max-h-96 overflow-y-auto pr-1">
        {BLOCKS.map((block) => (
          <div key={block.title}>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1.5">{block.title}</p>
            <ul className="space-y-1">
              {block.items.map((item) => (
                <li key={item.id}>
                  <label className="flex items-start gap-2 cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={checked.has(item.id)}
                      onChange={() => toggle(item.id)}
                      className="mt-0.5 accent-blue-600"
                    />
                    <span className={`text-sm ${checked.has(item.id) ? "line-through text-slate-400" : "text-slate-700"}`}>
                      {item.label}
                    </span>
                  </label>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}
