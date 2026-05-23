"use client";
import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import clsx from "clsx";
import ContactModal from "@/components/ContactModal";
import type { Contact } from "@/lib/types";

const typeColors: Record<string, string> = {
  PM:        "bg-purple-100 text-purple-700",
  Recruiter: "bg-blue-100 text-blue-700",
  Founder:   "bg-orange-100 text-orange-700",
  Leader:    "bg-indigo-100 text-indigo-700",
};
const statusColors: Record<string, string> = {
  Connected: "bg-green-100 text-green-700",
  Active:    "bg-blue-100 text-blue-700",
  Pending:   "bg-yellow-100 text-yellow-700",
  Closed:    "bg-slate-100 text-slate-500",
};

const EXAMPLE_CONTACTS = [
  { name: "Sarah Chen", title: "Product Manager", company: "Linear", type: "PM", notes: "Connect via PM community Slack. Reference their recent blog post on roadmapping." },
  { name: "Marcus Reid", title: "Senior Recruiter", company: "Loom", type: "Recruiter", notes: "Recruits for PM roles. Mention your async communication experience." },
  { name: "Priya Nair", title: "Director of Product", company: "Notion", type: "Leader", notes: "Wrote a great article on PM onboarding. Reference it in your connection request." },
];

const MESSAGE_TEMPLATES = [
  {
    label: "Connection — PM",
    body: `Hi [Name], I came across your work at [Company] and really admired [specific thing]. I'm transitioning into PM roles with a background in ops and software development. Would love to connect and learn from your journey.`,
  },
  {
    label: "Connection — Recruiter",
    body: `Hi [Name], I noticed you recruit for PM roles at [Company]. I'm actively exploring Associate PM opportunities — I have a background in operations leadership and software development, and I've built [Project]. Happy to connect if any roles might be a fit.`,
  },
  {
    label: "Follow-Up (1 week)",
    body: `Hey [Name], thanks for connecting! I've been following [Company]'s work closely — especially [specific feature/launch]. I'd love to learn more about the PM team's day-to-day. Would you be open to a 20-minute coffee chat sometime this month?`,
  },
  {
    label: "Coffee Chat Request",
    body: `Hi [Name], I'll keep this brief — I'm transitioning into PM and would love 20 minutes to hear about your path and what you look for in early-career PMs. Happy to work around your schedule completely.`,
  },
  {
    label: "Post-Chat Thank You",
    body: `Hi [Name], really appreciated the time today — your insight on [specific thing] was genuinely helpful. I've already started applying it. I'll keep you posted on how things progress. Thanks again.`,
  },
];

export default function Network() {
  const supabase = createClient();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("All");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Contact | null>(null);
  const [activeTemplate, setActiveTemplate] = useState(0);

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase.from("contacts").select("*").order("created_at", { ascending: false });
    setContacts(data ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const openAdd = (prefill?: Partial<Contact>) => {
    setEditing(prefill ? ({ ...prefill } as Contact) : null);
    setModalOpen(true);
  };
  const openEdit = (c: Contact) => { setEditing(c); setModalOpen(true); };

  const deleteContact = async (id: string) => {
    if (!confirm("Delete this contact?")) return;
    await supabase.from("contacts").delete().eq("id", id);
    setContacts((prev) => prev.filter((c) => c.id !== id));
  };

  const types = ["All", "PM", "Recruiter", "Founder", "Leader"];
  const visible = filter === "All" ? contacts : contacts.filter((c) => c.type === filter);

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Networking CRM</h1>
          <p className="text-slate-500 text-sm mt-1">15 connections/week. Build real relationships.</p>
        </div>
        <button onClick={() => openAdd()}
          className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors">
          + Add Contact
        </button>
      </div>

      <div className="grid grid-cols-3 gap-4 text-center">
        {[
          { label: "Total Contacts", value: contacts.length },
          { label: "Active / Connected", value: contacts.filter((c) => ["Active", "Connected"].includes(c.status)).length },
          { label: "Coffee Chats Done", value: contacts.filter((c) => c.coffee_chat).length },
        ].map((s) => (
          <div key={s.label} className="card">
            <p className="text-2xl font-bold text-slate-900">{s.value}</p>
            <p className="text-xs text-slate-400 mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="flex gap-2 flex-wrap">
        {types.map((t) => (
          <button key={t} onClick={() => setFilter(t)}
            className={clsx("px-3 py-1 rounded-full text-xs font-medium border transition-all",
              filter === t ? "bg-blue-600 text-white border-blue-600" : "bg-white text-slate-600 border-slate-200 hover:border-slate-300"
            )}>
            {t}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="py-12 text-center text-slate-400 text-sm">Loading…</div>
      ) : visible.length === 0 ? (
        <div className="py-12 text-center">
          <p className="text-slate-400 text-sm mb-3">No contacts yet. Start building your network.</p>
          <button onClick={() => openAdd()} className="text-blue-600 text-sm font-medium hover:underline">Add your first contact →</button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {visible.map((c) => (
            <div key={c.id} className="card">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <p className="font-semibold text-slate-900">{c.name}</p>
                  <p className="text-xs text-slate-400">{c.title}{c.company ? ` @ ${c.company}` : ""}</p>
                </div>
                <span className={clsx("badge", typeColors[c.type] ?? "bg-slate-100 text-slate-600")}>{c.type}</span>
              </div>
              <span className={clsx("badge mb-2", statusColors[c.status] ?? "bg-slate-100 text-slate-600")}>{c.status}</span>
              {c.notes && <p className="text-xs text-slate-500 mt-1 mb-2 line-clamp-2">{c.notes}</p>}
              {c.next_follow_up && (
                <p className="text-xs text-slate-400 mb-2">Follow up: <span className="font-medium text-slate-600">{c.next_follow_up}</span></p>
              )}
              {c.coffee_chat && <p className="text-xs text-green-600 font-medium mb-2">☕ Coffee chat done</p>}
              {c.linkedin && (
                <a href={c.linkedin.startsWith("http") ? c.linkedin : `https://${c.linkedin}`} target="_blank" rel="noopener noreferrer"
                  className="text-xs text-blue-600 hover:underline block mb-2">LinkedIn →</a>
              )}
              <div className="flex gap-3 pt-2 border-t border-slate-100 mt-2">
                <button onClick={() => openEdit(c)} className="text-xs text-slate-400 hover:text-blue-600 font-medium transition-colors">Edit</button>
                <button onClick={() => deleteContact(c.id)} className="text-xs text-slate-400 hover:text-red-500 font-medium transition-colors">Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Message Templates */}
      <div className="card">
        <h2 className="font-semibold text-slate-900 mb-3">Message Templates</h2>
        <div className="flex flex-wrap gap-2 mb-4">
          {MESSAGE_TEMPLATES.map((t, i) => (
            <button key={i} onClick={() => setActiveTemplate(i)}
              className={clsx("text-xs px-3 py-1.5 rounded-lg border transition-all",
                activeTemplate === i ? "bg-blue-600 text-white border-blue-600" : "bg-white border-slate-200 text-slate-600 hover:border-slate-300"
              )}>
              {t.label}
            </button>
          ))}
        </div>
        <div className="bg-slate-50 rounded-lg p-4">
          <p className="text-xs font-semibold text-slate-400 uppercase mb-2">{MESSAGE_TEMPLATES[activeTemplate].label}</p>
          <p className="text-sm text-slate-700 whitespace-pre-line leading-relaxed">{MESSAGE_TEMPLATES[activeTemplate].body}</p>
        </div>
        <p className="text-xs text-slate-400 mt-2">Personalize the [brackets] before sending — never copy-paste blind.</p>
      </div>

      {/* Example contacts */}
      <div>
        <div className="flex items-center gap-3 mb-3">
          <h2 className="font-semibold text-slate-700">Example Contacts to Reach</h2>
          <span className="badge bg-slate-100 text-slate-500 text-xs">Templates — not in your CRM</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {EXAMPLE_CONTACTS.map((ex) => (
            <div key={ex.name} className="card border-dashed border-slate-300 bg-slate-50/50">
              <div className="flex items-start justify-between mb-1">
                <div>
                  <p className="font-medium text-slate-700 text-sm">{ex.name}</p>
                  <p className="text-xs text-slate-400">{ex.title} @ {ex.company}</p>
                </div>
                <span className={clsx("badge", typeColors[ex.type] ?? "")}>{ex.type}</span>
              </div>
              <p className="text-xs text-slate-500 mt-1 mb-3">{ex.notes}</p>
              <button
                onClick={() => openAdd({ name: ex.name, title: ex.title, company: ex.company, type: ex.type as Contact["type"] })}
                className="text-xs text-blue-600 hover:underline font-medium">
                + Add to my contacts
              </button>
            </div>
          ))}
        </div>
      </div>

      <ContactModal isOpen={modalOpen} onClose={() => setModalOpen(false)} onSaved={load} initial={editing} />
    </div>
  );
}
