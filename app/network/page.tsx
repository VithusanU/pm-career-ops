"use client";
import { useState } from "react";
import rawContacts from "@/data/contacts.json";
import clsx from "clsx";

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

const MESSAGE_TEMPLATES = [
  {
    label: "Connection Request — PM",
    body: `Hi [Name], I came across your work at [Company] and really admired [specific thing]. I'm transitioning into PM roles with a background in ops and software development. Would love to connect and learn from your journey.`,
  },
  {
    label: "Connection Request — Recruiter",
    body: `Hi [Name], I noticed you recruit for PM roles at [Company]. I'm actively exploring Associate PM opportunities — I have a background in operations leadership and software development, and I've built [Project]. Happy to connect and share my background if any roles might be a fit.`,
  },
  {
    label: "Follow-Up (1 week after connecting)",
    body: `Hey [Name], thanks for connecting! I've been following [Company]'s work closely — especially [specific feature/launch]. I'd love to learn more about the PM team's day-to-day. Would you be open to a 20-minute coffee chat sometime this month?`,
  },
  {
    label: "Coffee Chat Request",
    body: `Hi [Name], I know your time is valuable — I'll keep this brief. I'm transitioning into PM and building toward roles like [their role]. I'd love 20 minutes to hear about your path and what you look for in early-career PMs. Happy to work around your schedule completely.`,
  },
  {
    label: "Post-Coffee Chat Thank You",
    body: `Hi [Name], really appreciated the time today — your insight on [specific thing they said] was genuinely helpful. I've already started applying it by [action you took]. I'll keep you posted on how things progress. Thanks again.`,
  },
];

export default function Network() {
  const [contacts] = useState(rawContacts);
  const [filter, setFilter] = useState("All");
  const [activeTemplate, setActiveTemplate] = useState(0);

  const types = ["All", "PM", "Recruiter", "Founder", "Leader"];
  const visible = filter === "All" ? contacts : contacts.filter((c) => c.type === filter);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Networking CRM</h1>
        <p className="text-slate-500 text-sm mt-1">
          15 connections/week. Quality &gt; quantity. Build real relationships.
        </p>
      </div>

      <div className="grid grid-cols-3 gap-4 text-center">
        {[
          { label: "Total Contacts", value: contacts.length },
          { label: "Active / Connected", value: contacts.filter((c) => ["Active", "Connected"].includes(c.status)).length },
          { label: "Coffee Chats Done", value: contacts.filter((c) => c.coffeeChat).length },
        ].map((stat) => (
          <div key={stat.label} className="card">
            <p className="text-2xl font-bold text-slate-900">{stat.value}</p>
            <p className="text-xs text-slate-400 mt-1">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 flex-wrap">
        {types.map((t) => (
          <button
            key={t}
            onClick={() => setFilter(t)}
            className={clsx(
              "px-3 py-1 rounded-full text-xs font-medium border transition-all",
              filter === t
                ? "bg-brand-600 text-white border-brand-600"
                : "bg-white text-slate-600 border-slate-200 hover:border-slate-300"
            )}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Contact grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {visible.map((contact) => (
          <div key={contact.id} className="card">
            <div className="flex items-start justify-between mb-2">
              <div>
                <p className="font-semibold text-slate-900">{contact.name}</p>
                <p className="text-xs text-slate-400">{contact.title} @ {contact.company}</p>
              </div>
              <span className={clsx("badge", typeColors[contact.type] ?? "bg-slate-100 text-slate-600")}>
                {contact.type}
              </span>
            </div>
            <span className={clsx("badge mb-2", statusColors[contact.status] ?? "bg-slate-100 text-slate-600")}>
              {contact.status}
            </span>
            {contact.notes && <p className="text-xs text-slate-500 mt-1 mb-2">{contact.notes}</p>}
            {contact.nextFollowUp && (
              <p className="text-xs text-slate-400">
                Follow up: <span className="font-medium text-slate-600">{contact.nextFollowUp}</span>
              </p>
            )}
            {contact.coffeeChat && (
              <p className="text-xs text-green-600 font-medium mt-1">☕ Coffee chat completed</p>
            )}
          </div>
        ))}
      </div>

      {/* Message Templates */}
      <div className="card">
        <h2 className="font-semibold text-slate-900 mb-3">Message Templates</h2>
        <div className="flex flex-wrap gap-2 mb-4">
          {MESSAGE_TEMPLATES.map((t, i) => (
            <button
              key={i}
              onClick={() => setActiveTemplate(i)}
              className={clsx(
                "text-xs px-3 py-1.5 rounded-lg border transition-all",
                activeTemplate === i
                  ? "bg-brand-600 text-white border-brand-600"
                  : "bg-white border-slate-200 text-slate-600 hover:border-slate-300"
              )}
            >
              {t.label}
            </button>
          ))}
        </div>
        <div className="bg-slate-50 rounded-lg p-4">
          <p className="text-xs font-semibold text-slate-400 uppercase mb-2">{MESSAGE_TEMPLATES[activeTemplate].label}</p>
          <p className="text-sm text-slate-700 whitespace-pre-line leading-relaxed">
            {MESSAGE_TEMPLATES[activeTemplate].body}
          </p>
        </div>
        <p className="text-xs text-slate-400 mt-2">
          Personalize the [brackets] before sending. Never copy-paste without customizing.
        </p>
      </div>

      {/* Daily networking targets */}
      <div className="card">
        <h2 className="font-semibold text-slate-900 mb-3">Daily Networking Targets</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm text-center">
          {[
            { label: "PMs", target: "2–3/day", note: "Similar roles, 2–5 yrs exp" },
            { label: "Recruiters", target: "2–3/day", note: "PM/tech-focused recruiters" },
            { label: "Founders", target: "1/day", note: "Series A–B startups" },
            { label: "PM Leaders", target: "1/day", note: "Director/VP level" },
          ].map((item) => (
            <div key={item.label} className="bg-slate-50 rounded-lg p-3">
              <p className="font-bold text-slate-900 text-base">{item.target}</p>
              <p className="font-semibold text-slate-600">{item.label}</p>
              <p className="text-slate-400 text-xs mt-1">{item.note}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
