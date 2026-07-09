"use client";
import { useState, useEffect } from "react";
import Modal from "./Modal";
import { createClient } from "@/lib/supabase/client";
import { getOrCreateCompany } from "@/lib/companies";
import type { Contact, ContactType, ContactStatus } from "@/lib/types";

const TYPES: ContactType[] = ["PM", "Recruiter", "Founder", "Leader"];
const STATUSES: ContactStatus[] = ["Pending", "Connected", "Active", "Closed"];

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
  initial?: Contact | null;
}

const empty = {
  name: "", title: "", company: "", linkedin: "",
  type: "PM" as ContactType, status: "Pending" as ContactStatus,
  last_contact: "", next_follow_up: "", notes: "", coffee_chat: false,
};

export default function ContactModal({ isOpen, onClose, onSaved, initial }: Props) {
  const supabase = createClient();
  const isEdit = !!initial?.id;
  const [form, setForm] = useState(empty);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (initial) {
      setForm({
        name: initial.name, title: initial.title, company: initial.company,
        linkedin: initial.linkedin, type: initial.type, status: initial.status,
        last_contact: initial.last_contact ?? "", next_follow_up: initial.next_follow_up ?? "",
        notes: initial.notes, coffee_chat: initial.coffee_chat,
      });
    } else {
      setForm(empty);
    }
    setError("");
  }, [initial, isOpen]);

  const set = (k: string, v: string | boolean) => setForm((f) => ({ ...f, [k]: v }));

  const save = async () => {
    if (!form.name.trim()) { setError("Name is required."); return; }
    setSaving(true);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setError("You must be signed in to save contacts."); setSaving(false); return; }

    const company_id = form.company.trim() ? await getOrCreateCompany(supabase, user.id, form.company) : null;

    const payload = {
      name: form.name.trim(), title: form.title, company: form.company, company_id,
      linkedin: form.linkedin, type: form.type, status: form.status,
      last_contact: form.last_contact || null, next_follow_up: form.next_follow_up || null,
      notes: form.notes, coffee_chat: form.coffee_chat,
    };
    if (isEdit) {
      const { error } = await supabase.from("contacts").update(payload).eq("id", initial!.id);
      if (error) { setError(error.message); setSaving(false); return; }
    } else {
      const { error } = await supabase.from("contacts").insert({ ...payload, user_id: user.id });
      if (error) { setError(error.message); setSaving(false); return; }
    }
    setSaving(false);
    onSaved();
    onClose();
  };

  const field = "w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500";
  const label = "block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1";

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={isEdit ? "Edit Contact" : "Add Contact"} size="md">
      <div className="p-6 space-y-4">
        {error && <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>}

        <div>
          <label className={label}>Name *</label>
          <input className={field} value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="Jane Smith" />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={label}>Title</label>
            <input className={field} value={form.title} onChange={(e) => set("title", e.target.value)} placeholder="Product Manager" />
          </div>
          <div>
            <label className={label}>Company</label>
            <input className={field} value={form.company} onChange={(e) => set("company", e.target.value)} placeholder="Notion" />
          </div>
        </div>

        <div>
          <label className={label}>LinkedIn URL</label>
          <input className={field} value={form.linkedin} onChange={(e) => set("linkedin", e.target.value)} placeholder="linkedin.com/in/..." />
        </div>

        <div className="grid grid-cols-2 gap-4">
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
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={label}>Last Contact</label>
            <input type="date" className={field} value={form.last_contact} onChange={(e) => set("last_contact", e.target.value)} />
          </div>
          <div>
            <label className={label}>Follow-up Date</label>
            <input type="date" className={field} value={form.next_follow_up} onChange={(e) => set("next_follow_up", e.target.value)} />
          </div>
        </div>

        <div>
          <label className={label}>Notes</label>
          <textarea className={field} rows={3} value={form.notes} onChange={(e) => set("notes", e.target.value)} placeholder="How you met, what to follow up on..." />
        </div>

        <label className="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" checked={form.coffee_chat} onChange={(e) => set("coffee_chat", e.target.checked)} className="accent-blue-600 w-4 h-4" />
          <span className="text-sm text-slate-700">Coffee chat completed ☕</span>
        </label>

        <div className="flex gap-3 pt-2">
          <button onClick={onClose} className="flex-1 border border-slate-200 rounded-xl py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors">Cancel</button>
          <button onClick={save} disabled={saving} className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl py-2.5 text-sm font-semibold transition-colors">
            {saving ? "Saving…" : isEdit ? "Save Changes" : "Add Contact"}
          </button>
        </div>
      </div>
    </Modal>
  );
}
