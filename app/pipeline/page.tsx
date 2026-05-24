"use client";
import { useState, useEffect, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import clsx from "clsx";
import ApplicationModal from "@/components/ApplicationModal";
import type { Application, Stage } from "@/lib/types";

const STAGES: Stage[] = ["Researching", "Applied", "Phone Screen", "Interview", "Final Round", "Offer", "Rejected", "Withdrawn"];

const stageColors: Record<string, string> = {
  Researching:    "bg-slate-100 text-slate-700",
  Applied:        "bg-blue-100 text-blue-700",
  "Phone Screen": "bg-yellow-100 text-yellow-700",
  Interview:      "bg-purple-100 text-purple-700",
  "Final Round":  "bg-indigo-100 text-indigo-700",
  Offer:          "bg-green-100 text-green-700",
  Rejected:       "bg-red-100 text-red-700",
  Withdrawn:      "bg-slate-100 text-slate-400",
};

const priorityColors: Record<string, string> = {
  High:   "bg-red-100 text-red-700 border border-red-200",
  Medium: "bg-yellow-100 text-yellow-700 border border-yellow-200",
  Low:    "bg-slate-100 text-slate-600 border border-slate-200",
};

interface ImportResult {
  company: string; role: string; url: string; source: string;
  keywords: string[]; notes: string; error?: string;
}

function PipelineInner() {
  const supabase = createClient();
  const searchParams = useSearchParams();
  const [apps, setApps] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<Stage | "All">("All");
  const [sortBy, setSortBy] = useState<"score" | "date_added">("score");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Application | null>(null);
  const [prefill, setPrefill] = useState<ImportResult | null>(null);

  // Import from URL state
  const [showImport, setShowImport] = useState(false);
  const [importUrl, setImportUrl] = useState("");
  const [importing, setImporting] = useState(false);
  const [importError, setImportError] = useState("");
  const [showBookmarklet, setShowBookmarklet] = useState(false);
  const [bookmarkletCopied, setBookmarkletCopied] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase.from("applications").select("*").order("created_at", { ascending: false });
    setApps(data ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  // Handle bookmarklet query params (?_import=1&_title=...&_company=...&_url=...)
  useEffect(() => {
    if (searchParams.get("_import") === "1") {
      const title = searchParams.get("_title") ?? "";
      const company = searchParams.get("_company") ?? "";
      const importedUrl = searchParams.get("_url") ?? "";
      const source = searchParams.get("_source") ?? "";
      if (title || company || importedUrl) {
        setEditing(null);
        setPrefill({ company, role: title, url: importedUrl, source, keywords: [], notes: "" });
        setModalOpen(true);
        // Clean up URL params without a reload
        const clean = new URL(window.location.href);
        clean.searchParams.delete("_import");
        clean.searchParams.delete("_title");
        clean.searchParams.delete("_company");
        clean.searchParams.delete("_url");
        clean.searchParams.delete("_source");
        window.history.replaceState({}, "", clean.toString());
      }
    }
  }, [searchParams]);

  const openAdd = () => { setEditing(null); setPrefill(null); setModalOpen(true); };
  const openEdit = (app: Application) => { setEditing(app); setPrefill(null); setModalOpen(true); };

  const deleteApp = async (id: string) => {
    if (!confirm("Delete this application?")) return;
    await supabase.from("applications").delete().eq("id", id);
    setApps((prev) => prev.filter((a) => a.id !== id));
  };

  const changeStage = async (id: string, stage: string) => {
    await supabase.from("applications").update({ stage }).eq("id", id);
    setApps((prev) => prev.map((a) => (a.id === id ? { ...a, stage: stage as Stage } : a)));
  };

  const handleImport = async () => {
    if (!importUrl.trim()) return;
    setImporting(true);
    setImportError("");
    try {
      const res = await fetch("/api/import-job", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: importUrl.trim() }),
      });
      const data: ImportResult = await res.json();
      // Always open the modal — even on bot-blocked pages the URL + source are pre-filled
      setEditing(null);
      setPrefill(data);
      setModalOpen(true);
      setShowImport(false);
      setImportUrl("");
      setImportError("");
    } catch {
      setImportError("Network error — check your connection and try again.");
    }
    setImporting(false);
  };

  const BOOKMARKLET_CODE = `javascript:(function(){var t=document.querySelector('h1')?.innerText?.trim()||document.title||'';var c='';var sels=['[class*="company-name"]','[class*="companyName"]','[data-company]','[class*="employer"]','[class*="company"]'];for(var i=0;i<sels.length;i++){var el=document.querySelector(sels[i]);if(el&&el.innerText&&el.innerText.trim().length>1&&el.innerText.trim().length<80){c=el.innerText.trim();break;}}var src='Direct';var h=location.href;if(h.includes('linkedin.com'))src='LinkedIn';else if(h.includes('indeed.com'))src='Indeed';else if(h.includes('greenhouse.io'))src='Greenhouse';else if(h.includes('lever.co'))src='Lever';else if(h.includes('workday.com'))src='Workday';else if(h.includes('wellfound.com')||h.includes('angel.co'))src='AngelList';else if(h.includes('workatastartup.com'))src='YC Jobs';var p=new URLSearchParams({_import:'1',_title:t,_company:c,_url:h,_source:src});window.open('${typeof window !== "undefined" ? window.location.origin : ""}/pipeline?'+p.toString(),'_blank');})();`;

  const copyBookmarklet = async () => {
    try {
      await navigator.clipboard.writeText(BOOKMARKLET_CODE);
      setBookmarkletCopied(true);
      setTimeout(() => setBookmarkletCopied(false), 2500);
    } catch {
      // Fallback — select a textarea
    }
  };

  const visible = apps
    .filter((a) => filter === "All" || a.stage === filter)
    .sort((a, b) => sortBy === "score" ? b.score - a.score : new Date(b.date_added).getTime() - new Date(a.date_added).getTime());

  const stageCounts = STAGES.reduce((acc, s) => ({ ...acc, [s]: apps.filter((a) => a.stage === s).length }), {} as Record<string, number>);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Application Pipeline</h1>
          <p className="text-slate-500 text-sm">{apps.length} roles tracked</p>
        </div>
        <div className="flex items-center gap-2">
          <select value={sortBy} onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
            className="text-sm border border-slate-200 rounded-lg px-3 py-1.5 bg-white">
            <option value="score">Sort: Score</option>
            <option value="date_added">Sort: Date Added</option>
          </select>
          <button
            onClick={() => { setShowImport((v) => !v); setImportError(""); }}
            className={clsx(
              "text-sm font-semibold px-4 py-2 rounded-lg border transition-colors",
              showImport
                ? "bg-slate-100 text-slate-700 border-slate-300"
                : "bg-white text-slate-700 border-slate-200 hover:border-slate-300 hover:bg-slate-50"
            )}>
            🔗 Import from URL
          </button>
          <button onClick={openAdd}
            className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors">
            + Add Application
          </button>
        </div>
      </div>

      {/* URL Import Row */}
      {showImport && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 space-y-4">
          {/* URL paste section */}
          <div>
            <p className="text-sm font-semibold text-blue-800 mb-1">Paste a job posting URL</p>
            <p className="text-xs text-blue-600 mb-3">Works with Greenhouse, Lever, Workday, and most company career pages. For LinkedIn and Indeed (bot-protected), use the <button onClick={() => setShowBookmarklet(v => !v)} className="underline font-semibold hover:text-blue-800">bookmarklet</button> below for guaranteed results.</p>
            <div className="flex gap-2">
              <input
                value={importUrl}
                onChange={(e) => setImportUrl(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleImport()}
                placeholder="https://www.linkedin.com/jobs/view/... or any job URL"
                className="flex-1 rounded-lg border border-blue-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                autoFocus
              />
              <button
                onClick={handleImport}
                disabled={importing || !importUrl.trim()}
                className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-semibold px-5 py-2 rounded-lg transition-colors whitespace-nowrap">
                {importing ? "Importing…" : "Import →"}
              </button>
            </div>
            {importError && (
              <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2 mt-2">{importError}</p>
            )}
          </div>

          {/* Bookmarklet section */}
          <div className="border-t border-blue-200 pt-3">
            <button
              onClick={() => setShowBookmarklet(v => !v)}
              className="text-xs font-semibold text-blue-700 hover:text-blue-900 flex items-center gap-1.5">
              {showBookmarklet ? "▾" : "▸"} 🔖 Bookmarklet — works on LinkedIn, Indeed, and any site
            </button>

            {showBookmarklet && (
              <div className="mt-3 space-y-3">
                <p className="text-xs text-blue-700">
                  A bookmarklet runs in your browser while you&apos;re on the job page, so it can read what you see — bot protection doesn&apos;t affect it.
                </p>

                {/* Step 1 — drag or copy */}
                <div className="bg-white border border-blue-200 rounded-lg p-3 space-y-2">
                  <p className="text-xs font-semibold text-slate-700">Step 1 — Add the bookmarklet to your browser</p>
                  <p className="text-xs text-slate-500 mb-2">Drag the button below to your bookmarks bar, <em>or</em> copy the code and create a new bookmark manually (paste as the URL).</p>
                  <div className="flex flex-wrap items-center gap-2">
                    <a
                      href={BOOKMARKLET_CODE}
                      onClick={(e) => e.preventDefault()}
                      draggable
                      className="inline-flex items-center gap-1.5 bg-amber-400 hover:bg-amber-500 text-amber-900 text-xs font-bold px-4 py-2 rounded-lg cursor-grab active:cursor-grabbing border border-amber-500 select-none">
                      📌 Add to PM Career Ops
                    </a>
                    <button
                      onClick={copyBookmarklet}
                      className="text-xs text-slate-600 hover:text-slate-900 border border-slate-200 bg-white px-3 py-1.5 rounded-lg transition-colors">
                      {bookmarkletCopied ? "✓ Copied!" : "Copy code"}
                    </button>
                  </div>
                  <p className="text-xs text-slate-400">💡 If your bookmarks bar isn&apos;t visible: Chrome → View → Always Show Bookmarks Bar (⌘⇧B / Ctrl+Shift+B)</p>
                </div>

                {/* Step 2 — use it */}
                <div className="bg-white border border-blue-200 rounded-lg p-3">
                  <p className="text-xs font-semibold text-slate-700 mb-1">Step 2 — Use it on any job page</p>
                  <ol className="text-xs text-slate-500 space-y-1 list-decimal list-inside">
                    <li>Open the job posting in your browser (LinkedIn, Indeed, anywhere)</li>
                    <li>Click <strong>📌 Add to PM Career Ops</strong> in your bookmarks bar</li>
                    <li>A new tab opens here with the form pre-filled — review and save</li>
                  </ol>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        {(["All", ...STAGES] as const).map((s) => {
          const count = s === "All" ? apps.length : stageCounts[s] ?? 0;
          return (
            <button key={s} onClick={() => setFilter(s)}
              className={clsx("px-3 py-1 rounded-full text-xs font-medium border transition-all",
                filter === s ? "bg-blue-600 text-white border-blue-600" : "bg-white text-slate-600 border-slate-200 hover:border-slate-300"
              )}>
              {s} {count > 0 && <span className="opacity-70">({count})</span>}
            </button>
          );
        })}
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
        {loading ? (
          <div className="py-16 text-center text-slate-400 text-sm">Loading…</div>
        ) : visible.length === 0 ? (
          <div className="py-16 text-center">
            <p className="text-slate-400 text-sm mb-3">No applications yet.</p>
            <button onClick={openAdd} className="text-blue-600 text-sm font-medium hover:underline">Add your first one →</button>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Company / Role</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Stage</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Priority</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Score</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Next Action</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Move Stage</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {visible.map((app) => (
                <tr key={app.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3">
                    <p className="font-semibold text-slate-900">{app.company}</p>
                    <p className="text-slate-400 text-xs">{app.role}</p>
                    {app.url && (
                      <a href={app.url} target="_blank" rel="noreferrer" className="text-blue-400 text-xs hover:underline">Job posting ↗</a>
                    )}
                    {app.date_applied && <p className="text-slate-300 text-xs">Applied {app.date_applied}</p>}
                  </td>
                  <td className="px-4 py-3">
                    <span className={clsx("badge", stageColors[app.stage])}>{app.stage}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={clsx("badge", priorityColors[app.priority])}>{app.priority}</span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5">
                      <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full bg-blue-500 rounded-full" style={{ width: `${app.score}%` }} />
                      </div>
                      <span className="text-xs text-slate-600 font-medium">{app.score}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 max-w-[180px]">
                    <p className="text-slate-700 truncate text-xs">{app.next_action}</p>
                    {app.next_action_date && <p className="text-slate-400 text-xs">{app.next_action_date}</p>}
                  </td>
                  <td className="px-4 py-3">
                    <select value={app.stage} onChange={(e) => changeStage(app.id, e.target.value)}
                      className="text-xs border border-slate-200 rounded-md px-2 py-1 bg-white">
                      {STAGES.map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <button onClick={() => openEdit(app)} className="text-slate-400 hover:text-blue-600 transition-colors text-xs font-medium">Edit</button>
                      <button onClick={() => deleteApp(app.id)} className="text-slate-400 hover:text-red-500 transition-colors text-xs font-medium">Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <ApplicationModal
        isOpen={modalOpen}
        onClose={() => { setModalOpen(false); setPrefill(null); }}
        onSaved={load}
        initial={editing}
        prefill={prefill}
      />
    </div>
  );
}

export default function Pipeline() {
  return (
    <Suspense fallback={<div className="py-16 text-center text-slate-400 text-sm">Loading…</div>}>
      <PipelineInner />
    </Suspense>
  );
}
