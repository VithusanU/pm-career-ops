"use client";
import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { DEFAULT_CHECKLIST, slugify } from "@/lib/companies";
import CompanyDocs from "@/components/CompanyDocs";
import type { Application, Company } from "@/lib/types";

const priorityColors: Record<string, string> = {
  High:   "bg-red-100 text-red-700 border border-red-200",
  Medium: "bg-yellow-100 text-yellow-700 border border-yellow-200",
  Low:    "bg-slate-100 text-slate-600 border border-slate-200",
};

interface CompanyCard {
  company: Company | null; // null when migration 002 hasn't been run yet
  key: string;
  name: string;
  bestApp: Application;
}

export default function Companies() {
  const supabase = createClient();
  const [apps, setApps] = useState<Application[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [migrationNeeded, setMigrationNeeded] = useState(false);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const [{ data: appData }, companiesRes] = await Promise.all([
      supabase.from("applications").select("*").order("score", { ascending: false }),
      supabase.from("companies").select("*").order("name"),
    ]);
    setApps(appData ?? []);
    if (companiesRes.error) {
      setMigrationNeeded(true);
      setCompanies([]);
    } else {
      setMigrationNeeded(false);
      setCompanies(companiesRes.data ?? []);
    }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  // One card per unique company (highest-scored application wins), linked
  // to its `companies` row by company_id where set, falling back to a
  // name-slug match for rows saved before migration 002 was applied.
  const cards: CompanyCard[] = Object.values(
    apps.reduce<Record<string, CompanyCard>>((acc, a) => {
      const key = a.company_id ?? slugify(a.company);
      if (!key) return acc;
      const company = companies.find((c) => c.id === a.company_id) ?? companies.find((c) => c.slug === slugify(a.company)) ?? null;
      if (!acc[key] || a.score > acc[key].bestApp.score) {
        acc[key] = { company, key, name: a.company, bestApp: a };
      }
      return acc;
    }, {})
  );

  const toggleChecklistItem = async (card: CompanyCard, itemId: string) => {
    if (!card.company) return; // no persistence available until migration runs
    const updated = card.company.checklist.map((i) => (i.id === itemId ? { ...i, done: !i.done } : i));
    setCompanies((prev) => prev.map((c) => (c.id === card.company!.id ? { ...c, checklist: updated } : c)));
    await supabase.from("companies").update({ checklist: updated }).eq("id", card.company.id);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Company Research Hub</h1>
        <p className="text-slate-500 text-sm mt-1">
          Deep analysis for every company in your pipeline. Upload teardowns, notes, and reports per company.
        </p>
      </div>

      {migrationNeeded && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 text-sm text-amber-800">
          ⚠️ Run <code className="bg-amber-100 px-1 rounded">supabase/migrations/002_pm_ops_v2.sql</code> in your Supabase SQL editor to make the research checklist below save permanently. Until then, checkboxes won&apos;t persist across reloads.
        </div>
      )}

      {loading ? (
        <div className="py-16 text-center text-slate-400 text-sm">Loading your companies…</div>
      ) : cards.length === 0 ? (
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
          {cards.map((card) => {
            const c = card.bestApp;
            const checklist = card.company?.checklist?.length ? card.company.checklist : DEFAULT_CHECKLIST;
            return (
              <div key={card.key} className="card hover:shadow-md transition-shadow flex flex-col">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h2 className="font-bold text-slate-900">{card.name}</h2>
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
                    {checklist.map((item) => (
                      <li key={item.id} className="flex items-center gap-1.5">
                        <input
                          type="checkbox"
                          checked={item.done}
                          onChange={() => toggleChecklistItem(card, item.id)}
                          disabled={!card.company}
                          className="w-3 h-3 accent-blue-600 shrink-0"
                        />
                        <span className={item.done ? "line-through text-slate-400" : ""}>{item.label}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <CompanyDocs company={card.name} companyId={card.company?.id ?? null} />
              </div>
            );
          })}
        </div>
      )}

      {/* Research Framework */}
      {!loading && cards.length > 0 && (
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
