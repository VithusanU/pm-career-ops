"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Application, GmailStatusSignal } from "@/lib/types";

interface Props {
  applications: Application[];
  onApplied: () => void; // ask the parent to reload applications after a sync
}

const TYPE_LABEL: Record<string, string> = {
  rejected: "Possible rejection",
  interview: "Possible interview / next steps",
  offer: "Possible offer",
  update: "Possible update",
};

export default function GmailSignals({ applications, onApplied }: Props) {
  const supabase = createClient();
  const [pending, setPending] = useState<GmailStatusSignal[]>([]);
  const [syncing, setSyncing] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [syncMessage, setSyncMessage] = useState("");
  const [available, setAvailable] = useState(true);

  // Only surfaces legacy signals created before auto-apply shipped — new
  // syncs apply directly and never create a "pending" row.
  const loadPending = async () => {
    const { data, error } = await supabase
      .from("gmail_status_signals")
      .select("*")
      .eq("status", "pending")
      .order("email_date", { ascending: false });
    if (error) { setAvailable(false); return; }
    setPending(data ?? []);
  };

  useEffect(() => { loadPending(); }, []);

  const sync = async () => {
    setSyncing(true);
    setSyncMessage("");
    try {
      const res = await fetch("/api/sync-gmail", { method: "POST" });
      const data = await res.json();
      if (data.error) {
        setSyncMessage(data.error);
      } else {
        const changes = (data.applied ?? []) as { company: string; detected_type: string; newStage?: string }[];
        if (changes.length === 0) {
          setSyncMessage(`Scanned ${data.scanned} emails — no new status updates found.`);
        } else {
          const summary = changes
            .map((c) => `${c.company} → ${c.newStage ?? TYPE_LABEL[c.detected_type] ?? "updated"}`)
            .join(", ");
          setSyncMessage(`Applied ${changes.length} update${changes.length === 1 ? "" : "s"}: ${summary}`);
          onApplied();
        }
      }
      await loadPending();
    } catch {
      setSyncMessage("Sync failed — check your connection and try again.");
    }
    setSyncing(false);
  };

  const accept = async (signal: GmailStatusSignal) => {
    const app = applications.find((a) => a.id === signal.application_id);
    if (!app) return;
    const updates: { stage?: Application["stage"]; response?: string } = {};
    if (signal.detected_type === "rejected") {
      updates.stage = "Rejected"; updates.response = "Rejected (via Gmail)";
    } else if (signal.detected_type === "offer") {
      updates.stage = "Offer"; updates.response = "Offer received (via Gmail)";
    } else if (signal.detected_type === "interview") {
      if (app.stage === "Applied") updates.stage = "Phone Screen";
      updates.response = "Interview requested (via Gmail)";
    } else {
      updates.response = "Update received (via Gmail) — check email";
    }

    await supabase.from("applications").update(updates).eq("id", app.id);
    await supabase.from("gmail_status_signals").update({ status: "accepted" }).eq("id", signal.id);
    setPending((prev) => prev.filter((s) => s.id !== signal.id));
    onApplied();
  };

  const dismiss = async (signal: GmailStatusSignal) => {
    await supabase.from("gmail_status_signals").update({ status: "dismissed" }).eq("id", signal.id);
    setPending((prev) => prev.filter((s) => s.id !== signal.id));
  };

  const resetHistory = async () => {
    if (!confirm(
      "This clears the log of emails already processed, so the next sync re-reads and re-applies every matched email from scratch (including ones it already handled, like a past misclassification). It only clears the sync log — your applications, stages, and notes aren't touched directly. Continue?"
    )) return;

    setResetting(true);
    setSyncMessage("");
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase.from("gmail_status_signals").delete().eq("user_id", user.id);
      }
      setPending([]);
      setSyncMessage("Sync history cleared. Click Sync Gmail to re-scan everything.");
    } finally {
      setResetting(false);
    }
  };

  if (!available) return null; // migration 002 not applied yet — fail quiet, not broken

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4">
      <div className="flex items-center justify-between mb-2">
        <div>
          <h2 className="font-semibold text-slate-900 text-sm">📧 Gmail Status Sync</h2>
          <p className="text-xs text-slate-400 mt-0.5">Claude reads matched emails and updates stages automatically.</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button onClick={resetHistory} disabled={resetting || syncing}
            title="Clear the log of already-processed emails so the next sync re-evaluates everything"
            className="text-xs font-medium px-3 py-1.5 rounded-lg border bg-white text-slate-500 border-slate-200 hover:border-red-300 hover:text-red-600 disabled:opacity-50 transition-colors">
            {resetting ? "Resetting…" : "Reset history"}
          </button>
          <button onClick={sync} disabled={syncing || resetting}
            className="text-xs font-semibold px-3 py-1.5 rounded-lg border bg-white text-slate-700 border-slate-200 hover:border-slate-300 disabled:opacity-50 transition-colors">
            {syncing ? "Syncing…" : "Sync Gmail"}
          </button>
        </div>
      </div>
      {syncMessage && <p className="text-xs text-slate-600 mt-2">{syncMessage}</p>}

      {pending.length > 0 && (
        <div className="mt-3 pt-3 border-t border-slate-100">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">
            Older matches awaiting review
          </p>
          <ul className="space-y-2">
            {pending.map((s) => {
              const app = applications.find((a) => a.id === s.application_id);
              return (
                <li key={s.id} className="flex items-start justify-between gap-3 bg-slate-50 rounded-lg p-3">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-slate-800">
                      {TYPE_LABEL[s.detected_type] ?? "Possible update"} — {app?.company ?? "Unknown company"}
                    </p>
                    <p className="text-xs text-slate-500 truncate">{s.snippet}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button onClick={() => accept(s)} className="text-xs font-semibold text-blue-600 hover:underline">Accept</button>
                    <button onClick={() => dismiss(s)} className="text-xs text-slate-400 hover:text-red-500">Dismiss</button>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
