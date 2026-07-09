import { createClient } from "@/lib/supabase/server";
import KPICard from "@/components/KPICard";
import DailyChecklist from "@/components/DailyChecklist";
import UpcomingActions from "@/components/UpcomingActions";
import { currentWeekRange, isWithinRange } from "@/lib/dates";
import type { Stage } from "@/lib/types";

const WEEKLY_TARGETS = { applications: 10, interviews: 1, connections: 15, content: 2 };

const STAGES: Stage[] = ["Researching", "Applied", "Phone Screen", "Interview", "Final Round", "Offer", "Rejected", "Withdrawn"];
const ACTIVE_STAGES: Stage[] = ["Applied", "Phone Screen", "Interview", "Final Round"];

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

  const { start: weekStart, end: weekEnd } = currentWeekRange();

  // Weekly-scoped KPIs — measure "did I do the work this week", not lifetime totals.
  const appliedThisWeek = applications.filter((a) => isWithinRange(a.date_applied, weekStart, weekEnd)).length;
  const contactsThisWeek = allContacts.filter((c) => isWithinRange(c.created_at, weekStart, weekEnd)).length;
  const publishedThisWeek = allContent.filter((c) => isWithinRange(c.date_published, weekStart, weekEnd)).length;

  // Live-state snapshots — "what's true right now", not time-boxed.
  const interviews = applications.filter((a) => ["Phone Screen", "Interview", "Final Round"].includes(a.stage)).length;
  const appliedTotal = applications.filter((a) => a.stage !== "Researching").length;
  const conversionRate = appliedTotal > 0 ? Math.round((interviews / appliedTotal) * 100) : 0;

  const stageCounts = STAGES.reduce((acc, s) => ({ ...acc, [s]: applications.filter((a) => a.stage === s).length }), {} as Record<string, number>);
  const maxStageCount = Math.max(1, ...STAGES.map((s) => stageCounts[s]));

  const needsAttention = applications.filter(
    (a) => ACTIVE_STAGES.includes(a.stage as Stage) && !a.next_action_date
  );

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
        <KPICard label="Applications Sent" value={appliedThisWeek} target={WEEKLY_TARGETS.applications} unit="this week" color="blue" />
        <KPICard label="Interviews Active" value={interviews} target={WEEKLY_TARGETS.interviews} unit="in pipeline" color="green" />
        <KPICard label="New Contacts" value={contactsThisWeek} target={WEEKLY_TARGETS.connections} unit="this week" color="purple" />
        <KPICard label="Content Published" value={publishedThisWeek} target={WEEKLY_TARGETS.content} unit="this week" color="orange" />
      </div>

      <div className="card flex items-center gap-4">
        <div className="flex-1">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">Application → Interview Rate</p>
          <div className="flex items-end gap-2">
            <span className="text-3xl font-bold text-slate-900">{conversionRate}%</span>
            <span className="text-slate-400 text-sm mb-1">({interviews} of {appliedTotal} apps, all-time)</span>
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="card">
          <h2 className="font-semibold text-slate-900 mb-3">Pipeline Funnel</h2>
          {applications.length === 0 ? (
            <p className="text-sm text-slate-400">Add applications to see your funnel.</p>
          ) : (
            <ul className="space-y-2">
              {STAGES.map((s) => (
                <li key={s} className="flex items-center gap-2">
                  <span className="text-xs text-slate-500 w-24 shrink-0 truncate">{s}</span>
                  <div className="flex-1 h-4 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-brand-500 rounded-full transition-all"
                      style={{ width: `${(stageCounts[s] / maxStageCount) * 100}%` }}
                    />
                  </div>
                  <span className="text-xs font-medium text-slate-600 w-5 text-right shrink-0">{stageCounts[s]}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="card">
          <h2 className="font-semibold text-slate-900 mb-3">Needs Attention</h2>
          {needsAttention.length === 0 ? (
            <p className="text-sm text-slate-400">Every active application has a next action scheduled. 🎉</p>
          ) : (
            <ul className="space-y-2">
              {needsAttention.slice(0, 8).map((a) => (
                <li key={a.id} className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm text-slate-800 font-medium truncate">{a.company}</p>
                    <p className="text-xs text-slate-400">{a.stage} · no next action set</p>
                  </div>
                  <a href="/pipeline" className="text-xs text-blue-600 hover:underline font-medium shrink-0">Set one →</a>
                </li>
              ))}
            </ul>
          )}
        </div>
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
