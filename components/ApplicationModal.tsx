"use client";
import { useState, useEffect } from "react";
import Modal from "./Modal";
import { createClient } from "@/lib/supabase/client";
import type { Application, Stage, Priority } from "@/lib/types";

const STAGES: Stage[] = ["Researching", "Applied", "Phone Screen", "Interview", "Final Round", "Offer", "Rejected", "Withdrawn"];
const PRIORITIES: Priority[] = ["High", "Medium", "Low"];
const SOURCES = ["LinkedIn", "Indeed", "Glassdoor", "Direct", "Referral", "AngelList", "YC Jobs", "Greenhouse", "Lever", "Workday", "Builtin", "Wellfound", "Other"];

interface Prefill {
  company?: string; role?: string; url?: string; source?: string;
  keywords?: string[]; notes?: string; error?: string;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
  initial?: Application | null;
  prefill?: Prefill | null;
}

const empty = {
  company: "", role: "", url: "", source: "LinkedIn",
  stage: "Researching" as Stage, priority: "Medium" as Priority,
  score: 60, date_applied: "", next_action: "", next_action_date: "",
  notes: "", ats_keywords: "", contact_name: "", contact_linkedin: "", response: "None",
};

export default function ApplicationModal({ isOpen, onClose, onSaved, initial, prefill }: Props) {
  const supabase = createClient();
  const isEdit = !!initial?.id;
  const [form, setForm] = useState(empty);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (initial) {
      setForm({
        company: initial.company, role: initial.role, url: initial.url,
        source: initial.source, stage: initial.stage, priority: initial.priority,
        score: initial.score, date_applied: initial.date_applied ?? "",
        next_action: initial.next_action, next_action_date: initial.next_action_date ?? "",
        notes: initial.notes, ats_keywords: (initial.ats_keywords ?? []).join(", "),
        contact_name: initial.contact_name, contact_linkedin: initial.contact_linkedin,
        response: initial.response,
      });
    } else if (prefill) {
      setForm({
        ...empty,
        company: prefill.company ?? "",
        role: prefill.role ?? "",
        url: prefill.url ?? "",
        source: prefill.source ?? "LinkedIn",
        notes: prefill.notes ?? "",
        ats_keywords: (prefill.keywords ?? []).join(", "),
      });
    } else {
      setForm(empty);
    }
    setError("");
  }, [initial, prefill, isOpen]);

  const set = (k: string, v: string | number) => setForm((f) => ({ ...f, [k]: v }));

  const save = async () => {
    if (!form.company.trim() || !form.role.trim()) {
      setError("Company and Role are required.");
      return;
    }
    setSaving(true);

    // Get the current user — required for RLS policy (user_id = auth.uid())
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setError("You must be signed in to save applications."); setSaving(false); return; }

    const payload = {
      company: form.company.trim(), role: form.role.trim(), url: form.url,
      source: form.source, stage: form.stage, priority: form.priority,
      score: form.score, date_applied: form.date_applied || null,
      next_action: form.next_action, next_action_date: form.next_action_date || null,
      notes: form.notes, ats_keywords: form.ats_keywords.split(",").map((k) => k.trim()).filter(Boolean),
      contact_name: form.contact_name, contact_linkedin: form.contact_linkedin, response: form.response,
    };
    if (isEdit) {
      const { error } = await supabase.from("applications").update(payload).eq("id", initial!.id);
      if (error) { setError(error.message); setSaving(false); return; }
    } else {
      const { error } = await supabase.from("applications")
        .insert({ ...payload, user_id: user.id, date_added: new Date().toISOString().split("T")[0] });
      if (error) { setError(error.message); setSaving(false); return; }
    }
    setSaving(false);
    onSaved();
    onClose();
  };

  const field = "w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500";
  const label = "block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1";

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={isEdit ? "Edit Application" : "Add Application"}>
      <div className="p-6 space-y-5">
        {prefill?.error && (
        <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
          ⚠️ {prefill.error}
        </p>
      )}
      {error && <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>}

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={label}>Company *</label>
            <input className={field} value={form.company} onChange={(e) => set("company", e.target.value)} placeholder="e.g. Notion" />
          </div>
          <div>
            <label className={label}>Role *</label>
            <input className={field} value={form.role} onChange={(e) => set("role", e.target.value)} placeholder="e.g. Associate PM" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={label}>Job URL</label>
            <input className={field} value={form.url} onChange={(e) => set("url", e.target.value)} placeholder="https://..." />
          </div>
          <div>
            <label className={label}>Source</label>
            <select className={field} value={form.source} onChange={(e) => set("source", e.target.value)}>
              {SOURCES.map((s) => <option key={s}>{s}</option>)}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className={label}>Stage</label>
            <select className={field} value={form.stage} onChange={(e) => set("stage", e.target.value)}>
              {STAGES.map((s) => <option key={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label className={label}>Priority</label>
            <select className={field} value={form.priority} onChange={(e) => set("priority", e.target.value)}>
              {PRIORITIES.map((p) => <option key={p}>{p}</option>)}
            </select>
          </div>
          <div>
            <label className={label}>Score (1–100)</label>
            <input type="number" min={1} max={100} className={field} value={form.score} onChange={(e) => set("score", Number(e.target.value))} />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={label}>Date Applied</label>
            <input type="date" className={field} value={form.date_applied} onChange={(e) => set("date_applied", e.target.value)} />
          </div>
          <div>
            <label className={label}>Next Action Date</label>
            <input type="date" className={field} value={form.next_action_date} onChange={(e) => set("next_action_date", e.target.value)} />
          </div>
        </div>

        <div>
          <label className={label}>Next Action</label>
          <input className={field} value={form.next_action} onChange={(e) => set("next_action", e.target.value)} placeholder="e.g. Follow up via LinkedIn" />
        </div>

        <div>
          <label className={label}>ATS Keywords (comma-separated)</label>
          <input className={field} value={form.ats_keywords} onChange={(e) => set("ats_keywords", e.target.value)} placeholder="roadmap, user research, analytics" />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={label}>Contact Name</label>
            <input className={field} value={form.contact_name} onChange={(e) => set("contact_name", e.target.value)} placeholder="Jane Smith" />
          </div>
          <div>
            <label className={label}>Contact LinkedIn</label>
            <input className={field} value={form.contact_linkedin} onChange={(e) => set("contact_linkedin", e.target.value)} placeholder="linkedin.com/in/..." />
          </div>
        </div>

        <div>
          <label className={label}>Notes</label>
          <textarea className={field} rows={3} value={form.notes} onChange={(e) => set("notes", e.target.value)} placeholder="Why you're excited, anything strategic to remember..." />
        </div>

        <div className="flex gap-3 pt-2">
          <button onClick={onClose} className="flex-1 border border-slate-200 rounded-xl py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors">Cancel</button>
          <button onClick={save} disabled={saving} className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl py-2.5 text-sm font-semibold transition-colors">
            {saving ? "Saving…" : isEdit ? "Save Changes" : "Add Application"}
          </button>
        </div>
      </div>
    </Modal>
  );
}
