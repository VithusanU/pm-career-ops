import { createClient } from "@/lib/supabase/server";
import KPICard from "@/components/KPICard";
import DailyChecklist from "@/components/DailyChecklist";
import UpcomingActions from "@/components/UpcomingActions";

const WEEKLY_TARGETS = { applications: 10, interviews: 1, connections: 15, content: 2 };

export default async function Dashboard() {
  const supabase = createClient();
  const [{ data: apps }, { data: contacts }, { data: content }] = await Promise.all([
    supabase.from("applications").select("*"),
    supabase.from("contacts").select("*"),
    supabase.from("content_items").select("*"),
  ]);

  const applications = apps ?? [];
  const allContacts = contacts ?? [];
  const allContent = content ?? [];

  const applied = applications.filter((a) => a.stage !== "Researching").length;
  const interviews = applications.filter((a) => ["Phone Screen", "Interview", "Final Round"].includes(a.stage)).length;
  const activeContacts = allContacts.filter((c) => ["Active", "Connected"].includes(c.status)).length;
  const published = allContent.filter((c) => c.status === "Published").length;
  const conversionRate = applied > 0 ? Math.round((interviews / applied) * 100) : 0;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Command Center</h1>
        <p className="text-slate-500 text-sm mt-1">
          {new Date().toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
          {" · "}Treat this like a product sprint. Ship daily.
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KPICard label="Applications Sent" value={applied} target={WEEKLY_TARGETS.applications} unit="this week" color="blue" />
        <KPICard label="Interviews Active" value={interviews} target={WEEKLY_TARGETS.interviews} unit="in pipeline" color="green" />
        <KPICard label="Network Contacts" value={activeContacts} target={WEEKLY_TARGETS.connections} unit="active" color="purple" />
        <KPICard label="Content Published" value={published} target={WEEKLY_TARGETS.content} unit="this week" color="orange" />
      </div>

      <div className="card flex items-center gap-4">
        <div className="flex-1">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">Application → Interview Rate</p>
          <div className="flex items-end gap-2">
            <span className="text-3xl font-bold text-slate-900">{conversionRate}%</span>
            <span className="text-slate-400 text-sm mb-1">({interviews} of {applied} apps)</span>
          </div>
          <div className="mt-2 h-2 bg-slate-100 rounded-full overflow-hidden">
            <div className="h-full bg-brand-500 rounded-full transition-all" style={{ width: `${Math.min(conversionRate, 100)}%` }} />
          </div>
        </div>
        <div className="text-right">
          <p className="text-xs text-slate-400">Target</p>
          <p className="text-lg font-bold text-brand-600">15%+</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <DailyChecklist />
        <UpcomingActions applications={applications} contacts={allContacts} />
      </div>

      <div className="card">
        <h2 className="font-semibold text-slate-900 mb-3">Weekly Focus Areas</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
          {[
            { color: "bg-blue-50", titleColor: "text-blue-800", bodyColor: "text-blue-700", title: "Volume", items: ["Apply to 10 roles/week", "3 tailored, 7 fast-apply", "Track every application"] },
            { color: "bg-purple-50", titleColor: "text-purple-800", bodyColor: "text-purple-700", title: "Visibility", items: ["2 LinkedIn posts/week", "1 blog article/week", "15 connection requests"] },
            { color: "bg-green-50", titleColor: "text-green-800", bodyColor: "text-green-700", title: "Sharpness", items: ["30 min PM study daily", "1 product teardown/week", "1 mock interview/week"] },
          ].map(({ color, titleColor, bodyColor, title, items }) => (
            <div key={title} className={`${color} rounded-lg p-3`}>
              <p className={`font-semibold ${titleColor} mb-1`}>{title}</p>
              <ul className={`${bodyColor} space-y-1`}>{items.map((i) => <li key={i}>✓ {i}</li>)}</ul>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
