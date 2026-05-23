"use client";
import { useState } from "react";
import rawApps from "@/data/applications.json";
import clsx from "clsx";

type Stage = "Researching" | "Applied" | "Phone Screen" | "Interview" | "Final Round" | "Offer" | "Rejected" | "Withdrawn";

const STAGES: Stage[] = [
  "Researching", "Applied", "Phone Screen", "Interview", "Final Round", "Offer", "Rejected", "Withdrawn",
];

const stageColors: Record<Stage, string> = {
  Researching:   "bg-slate-100 text-slate-700",
  Applied:       "bg-blue-100 text-blue-700",
  "Phone Screen":"bg-yellow-100 text-yellow-700",
  Interview:     "bg-purple-100 text-purple-700",
  "Final Round": "bg-indigo-100 text-indigo-700",
  Offer:         "bg-green-100 text-green-700",
  Rejected:      "bg-red-100 text-red-700",
  Withdrawn:     "bg-slate-100 text-slate-400",
};

const priorityColors: Record<string, string> = {
  High:   "bg-red-50 text-red-600 border border-red-200",
  Medium: "bg-yellow-50 text-yellow-600 border border-yellow-200",
  Low:    "bg-slate-50 text-slate-500 border border-slate-200",
};

export default function Pipeline() {
  const [apps, setApps] = useState(rawApps);
  const [filter, setFilter] = useState<Stage | "All">("All");
  const [sortBy, setSortBy] = useState<"score" | "dateAdded">("score");

  const visible = apps
    .filter((a) => filter === "All" || a.stage === filter)
    .sort((a, b) =>
      sortBy === "score"
        ? b.score - a.score
        : new Date(b.dateAdded).getTime() - new Date(a.dateAdded).getTime()
    );

  const changeStage = (id: string, stage: string) => {
    setApps((prev) =>
      prev.map((a) => {
        if (a.id !== id) return a;
        const updated = { ...a, stage };
        if (stage === "Applied" && !a.dateApplied) {
          (updated as typeof a & { dateApplied: string }).dateApplied = new Date().toISOString().split("T")[0];
        }
        return updated;
      })
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Application Pipeline</h1>
          <p className="text-slate-500 text-sm">{apps.length} roles tracked · Manage your funnel like a PM</p>
        </div>
        <div className="flex gap-2">
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
            className="text-sm border border-slate-200 rounded-lg px-3 py-1.5 bg-white"
          >
            <option value="score">Sort: Priority Score</option>
            <option value="dateAdded">Sort: Date Added</option>
          </select>
        </div>
      </div>

      {/* Stage filter tabs */}
      <div className="flex flex-wrap gap-2">
        {(["All", ...STAGES] as const).map((s) => {
          const count = s === "All" ? apps.length : apps.filter((a) => a.stage === s).length;
          return (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={clsx(
                "px-3 py-1 rounded-full text-xs font-medium border transition-all",
                filter === s
                  ? "bg-brand-600 text-white border-brand-600"
                  : "bg-white text-slate-600 border-slate-200 hover:border-slate-300"
              )}
            >
              {s} {count > 0 && <span className="opacity-70">({count})</span>}
            </button>
          );
        })}
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Company / Role</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Stage</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Priority</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Score</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Next Action</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Move Stage</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {visible.map((app) => (
              <tr key={app.id} className="hover:bg-slate-50 transition-colors">
                <td className="px-4 py-3">
                  <p className="font-semibold text-slate-900">{app.company}</p>
                  <p className="text-slate-400 text-xs">{app.role}</p>
                  {app.dateApplied && (
                    <p className="text-slate-300 text-xs">Applied {app.dateApplied}</p>
                  )}
                </td>
                <td className="px-4 py-3">
                  <span className={clsx("badge", stageColors[app.stage as Stage])}>{app.stage}</span>
                </td>
                <td className="px-4 py-3">
                  <span className={clsx("badge", priorityColors[app.priority])}>{app.priority}</span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1.5">
                    <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-brand-500 rounded-full"
                        style={{ width: `${app.score}%` }}
                      />
                    </div>
                    <span className="text-xs text-slate-600 font-medium">{app.score}</span>
                  </div>
                </td>
                <td className="px-4 py-3 max-w-[200px]">
                  <p className="text-slate-700 truncate">{app.nextAction}</p>
                  {app.nextActionDate && (
                    <p className="text-slate-400 text-xs">{app.nextActionDate}</p>
                  )}
                </td>
                <td className="px-4 py-3">
                  <select
                    value={app.stage}
                    onChange={(e) => changeStage(app.id, e.target.value)}
                    className="text-xs border border-slate-200 rounded-md px-2 py-1 bg-white"
                  >
                    {STAGES.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
