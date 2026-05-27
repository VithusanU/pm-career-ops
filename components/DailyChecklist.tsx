"use client";
import { useState, useEffect } from "react";

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
  { title: "🌅 Morning (30 min)",   items: MORNING   },
  { title: "🔨 Deep Work (2 hrs)",  items: DEEP_WORK },
  { title: "🤝 Networking (30 min)",items: NETWORK   },
  { title: "✍️ Publish (30 min)",   items: PUBLISH   },
  { title: "🌙 Reflect (15 min)",   items: REFLECT   },
];

const ALL_IDS = BLOCKS.flatMap((b) => b.items.map((i) => i.id));

function todayKey() {
  return `pm-checklist-${new Date().toISOString().split("T")[0]}`;
}

function loadChecked(): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = localStorage.getItem(todayKey());
    return raw ? new Set(JSON.parse(raw) as string[]) : new Set();
  } catch {
    return new Set();
  }
}

function saveChecked(checked: Set<string>) {
  try {
    localStorage.setItem(todayKey(), JSON.stringify(Array.from(checked)));
  } catch {}
}

// Remove stale keys older than 7 days so localStorage stays clean
function pruneOldKeys() {
  try {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - 7);
    Object.keys(localStorage)
      .filter((k) => k.startsWith("pm-checklist-"))
      .forEach((k) => {
        const date = k.replace("pm-checklist-", "");
        if (date < cutoff.toISOString().split("T")[0]) localStorage.removeItem(k);
      });
  } catch {}
}

export default function DailyChecklist() {
  const [checked, setChecked] = useState<Set<string>>(new Set());
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    pruneOldKeys();
    setChecked(loadChecked());
    setMounted(true);

    // Re-check the key every minute — if the date flips midnight, reset
    const interval = setInterval(() => {
      const stored = loadChecked();
      setChecked(stored);
    }, 60_000);
    return () => clearInterval(interval);
  }, []);

  const toggle = (id: string) => {
    setChecked((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      saveChecked(next);
      return next;
    });
  };

  const clearAll = () => {
    const empty = new Set<string>();
    saveChecked(empty);
    setChecked(empty);
  };

  const pct = ALL_IDS.length > 0 ? Math.round((checked.size / ALL_IDS.length) * 100) : 0;
  const allDone = checked.size === ALL_IDS.length;

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h2 className="font-semibold text-slate-900">Daily Routine</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            {new Date().toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
            {" · "}resets each day
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs font-medium text-slate-500">
            {mounted ? `${checked.size}/${ALL_IDS.length}` : `0/${ALL_IDS.length}`} done
          </span>
          {mounted && checked.size > 0 && (
            <button
              onClick={clearAll}
              className="text-xs text-slate-400 hover:text-red-500 transition-colors"
              title="Clear today's progress"
            >
              Reset
            </button>
          )}
        </div>
      </div>

      <div className="h-1.5 bg-slate-100 rounded-full mb-1 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-300 ${allDone ? "bg-green-500" : "bg-brand-500"}`}
          style={{ width: mounted ? `${pct}%` : "0%" }}
        />
      </div>
      {mounted && allDone && (
        <p className="text-xs text-green-600 font-medium mb-3">🎉 All done for today!</p>
      )}
      {mounted && !allDone && <div className="mb-3" />}

      <div className="space-y-4 max-h-96 overflow-y-auto pr-1">
        {BLOCKS.map((block) => (
          <div key={block.title}>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1.5">
              {block.title}
            </p>
            <ul className="space-y-1">
              {block.items.map((item) => {
                const done = mounted && checked.has(item.id);
                return (
                  <li key={item.id}>
                    <label className="flex items-start gap-2 cursor-pointer group">
                      <input
                        type="checkbox"
                        checked={done}
                        onChange={() => toggle(item.id)}
                        className="mt-0.5 accent-blue-600"
                      />
                      <span className={`text-sm transition-colors ${done ? "line-through text-slate-400" : "text-slate-700 group-hover:text-slate-900"}`}>
                        {item.label}
                      </span>
                    </label>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}
