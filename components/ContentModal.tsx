"use client";
import { useState, useEffect } from "react";
import Modal from "./Modal";
import { createClient } from "@/lib/supabase/client";
import type { ContentItem, ContentStatus } from "@/lib/types";

const STATUSES: ContentStatus[] = ["Idea", "Draft", "Published"];
const TYPES = ["Company Analysis", "Feature Pitch", "Personal Brand", "Tool / AI Analysis", "Other"];
const PLATFORMS = ["Blog", "LinkedIn", "Twitter/X", "Newsletter"];

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
  initial?: ContentItem | null;
}

const empty = {
  title: "", type: "Company Analysis", status: "Idea" as ContentStatus,
  target_company: "", platform: [] as string[], date_drafted: "",
  date_published: "", outline: "", notes: "",
};

export default function ContentModal({ isOpen, onClose, onSaved, initial }: Props) {
  const supabase = createClient();
  const isEdit = !!initial?.id;
  const [form, setForm] = useState(empty);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (initial) {
      setForm({
        title: initial.title, type: initial.type, status: initial.status,
        target_company: initial.target_company ?? "", platform: initial.platform ?? [],
        date_drafted: initial.date_drafted ?? "", date_published: initial.date_published ?? "",
        outline: initial.outline ?? "", notes: initial.notes ?? "",
      });
    } else {
      setForm(empty);
    }
    setError("");
  }, [initial, isOpen]);

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));
  const togglePlatform = (p: string) =>
    setForm((f) => ({ ...f, platform: f.platform.includes(p) ? f.platform.filter((x) => x !== p) : [...f.platform, p] }));

  const save = async () => {
    if (!form.title.trim()) { setError("Title is required."); return; }
    setSaving(true);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setError("You must be signed in to save content."); setSaving(false); return; }

    const payload = {
      title: form.title.trim(), type: form.type, status: form.status,
      target_company: form.target_company, platform: form.platform,
      date_drafted: form.date_drafted || null, date_published: form.date_published || null,
      outline: form.outline, notes: form.notes,
    };

    if (isEdit) {
      const { error } = await supabase.from("content_items").update(payload).eq("id", initial!.id);
      if (error) { setError(error.message); setSaving(false); return; }
    } else {
      const { error } = await supabase.from("content_items").insert({ ...payload, user_id: user.id });
      if (error) { setError(error.message); setSaving(false); return; }
    }
    setSaving(false);
    onSaved();
    onClose();
  };

  const field = "w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500";
  const label = "block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1";

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={isEdit ? "Edit Content" : "Add Content"}>
      <div className="p-6 space-y-5">
        {error && <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>}

        <div>
          <label className={label}>Title *</label>
          <input className={field} value={form.title} onChange={(e) => set("title", e.target.value)} placeholder="e.g. Breaking Down Notion's Onboarding" />
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className={label}>Type</label>
            <select className={field} value={form.type} onChange={(e) => set("type", e.target.value)}>
              {TYPES.map((t) => <option key={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label className={label}>Status</label>
            <select className={field} value={form.status} onChange={(e) => set("status", e.target.value)}>
              {STATUSES.map((s) => <option key={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label className={label}>Target Company</label>
            <input className={field} value={form.target_company} onChange={(e) => set("target_company", e.target.value)} placeholder="e.g. Notion" />
          </div>
        </div>

        <div>
          <label className={label}>Platforms</label>
          <div className="flex flex-wrap gap-2">
            {PLATFORMS.map((p) => (
              <button key={p} type="button" onClick={() => togglePlatform(p)}
                className={`text-xs px-3 py-1.5 rounded-lg border transition-all ${
                  form.platform.includes(p) ? "bg-blue-600 text-white border-blue-600" : "bg-white border-slate-200 text-slate-600 hover:border-slate-300"
                }`}>
                {p}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={label}>Date Drafted</label>
            <input type="date" className={field} value={form.date_drafted} onChange={(e) => set("date_drafted", e.target.value)} />
          </div>
          <div>
            <label className={label}>Date Published</label>
            <input type="date" className={field} value={form.date_published} onChange={(e) => set("date_published", e.target.value)} />
          </div>
        </div>

        <div>
          <label className={label}>Outline</label>
          <textarea className={field} rows={4} value={form.outline} onChange={(e) => set("outline", e.target.value)} placeholder="1. Hook&#10;2. Key point&#10;3. CTA" />
        </div>

        <div>
          <label className={label}>Notes</label>
          <textarea className={field} rows={2} value={form.notes} onChange={(e) => set("notes", e.target.value)} placeholder="Anything strategic to remember..." />
        </div>

        <div className="flex gap-3 pt-2">
          <button onClick={onClose} className="flex-1 border border-slate-200 rounded-xl py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors">Cancel</button>
          <button onClick={save} disabled={saving} className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl py-2.5 text-sm font-semibold transition-colors">
            {saving ? "Saving…" : isEdit ? "Save Changes" : "Add Content"}
          </button>
        </div>
      </div>
    </Modal>
  );
}
