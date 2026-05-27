"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import CompanyDocs from "@/components/CompanyDocs";
import type { Application } from "@/lib/types";

export default function Companies() {
  const supabase = createClient();
  const [apps, setApps] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from("applications")
      .select("*")
      .order("score", { ascending: false })
      .then(({ data }) => {
        setApps(data ?? []);
        setLoading(false);
      });
  }, []);

  // One card per unique company (highest-scored entry wins)
  const companies = Object.values(
    apps.reduce<Record<string, Application>>((acc, a) => {
      if (!acc[a.company] || a.score > acc[a.company].score) acc[a.company] = a;
      return acc;
    }, {})
  );

  const priorityColors: Record<string, string> = {
    High:   "bg-red-100 text-red-700 border border-red-200",
    Medium: "bg-yellow-100 text-yellow-700 border border-yellow-200",
    Low:    "bg-slate-100 text-slate-600 border border-slate-200",
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Company Research Hub</h1>
        <p className="text-slate-500 text-sm mt-1">
          Deep analysis for every company in your pipeline. Upload teardowns, notes, and reports per company.
        </p>
      </div>

      {loading ? (
        <div className="py-16 text-center text-slate-400 text-sm">Loading your companies…</div>
      ) : companies.length === 0 ? (
        <div className="py-16 text-center bg-white rounded-xl border border-slate-200">
          <p className="text-slate-400 text-sm mb-2">No companies yet.</p>
          <p className="text-slate-400 text-xs">
            Add a job in the{" "}
            <a href="/pipeline" className="text-blue-500 hover:underline font-medium">Pipeline</a>
            {" "}and it will appear here automatically.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {companies.map((c) => (
            <div key={c.company} className="card hover:shadow-md transition-shadow flex flex-col">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h2 className="font-bold text-slate-900">{c.company}</h2>
                  <p className="text-xs text-slate-400">{c.role}</p>
                </div>
                <span className={`badge ${priorityColors[c.priority] ?? "bg-slate-100 text-slate-600"}`}>
                  {c.priority}
                </span>
              </div>

              {c.notes && (
                <p className="text-sm text-slate-600 mb-3 line-clamp-2">{c.notes}</p>
              )}

              {c.ats_keywords?.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-3">
                  {c.ats_keywords.slice(0, 3).map((kw) => (
                    <span key={kw} className="badge bg-blue-50 text-blue-600">{kw}</span>
                  ))}
                </div>
              )}

              <div className="border-t border-slate-100 pt-3 mt-auto">
                <p className="text-xs font-semibold text-slate-400 uppercase mb-2">Research Checklist</p>
                <ul className="text-xs text-slate-600 space-y-1">
                  {[
                    "Product overview & core user flow",
                    "Onboarding analysis",
                    "3 PM improvements",
                    "Business model",
                    "Competitors",
                    "AI opportunities",
                  ].map((item) => (
                    <li key={item} className="flex items-center gap-1.5">
                      <span className="w-3 h-3 rounded-sm border border-slate-300 inline-block shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>

              <CompanyDocs company={c.company} />
            </div>
          ))}
        </div>
      )}

      {/* Research Framework */}
      {!loading && companies.length > 0 && (
        <div className="card">
          <h2 className="font-semibold text-slate-900 mb-3">Standard Research Framework</h2>
          <p className="text-sm text-slate-500 mb-4">
            Use this for every company. Output becomes your interview prep AND a blog post draft.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
            {[
              { section: "1. Company Overview",   items: ["Mission & vision", "Funding stage & size", "Revenue model", "Key metrics (DAU, ARR, etc.)"] },
              { section: "2. Product Analysis",   items: ["Core product loop", "Primary user persona", "Key features", "What makes it sticky"] },
              { section: "3. Onboarding Audit",   items: ["First 5 minutes", "Activation moment (aha!)", "Friction points", "Drop-off risks"] },
              { section: "4. SWOT",               items: ["Strengths", "Weaknesses", "Opportunities (your ideas)", "Threats / competitors"] },
              { section: "5. PM Opportunity Areas", items: ["Features to build", "Retention improvements", "Growth levers", "AI integration ideas"] },
              { section: "6. Blog Angle",         items: ["Hook sentence", "3 key insights", "Your unique take", "Call to action"] },
            ].map((s) => (
              <div key={s.section} className="bg-slate-50 rounded-lg p-3">
                <p className="font-semibold text-slate-700 mb-2">{s.section}</p>
                <ul className="space-y-1 text-slate-600">
                  {s.items.map((item) => (
                    <li key={item} className="flex items-center gap-1.5">
                      <span className="text-brand-500">›</span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
