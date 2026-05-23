import applications from "@/data/applications.json";
import contacts from "@/data/contacts.json";
import content from "@/data/content.json";
import KPICard from "@/components/KPICard";
import DailyChecklist from "@/components/DailyChecklist";
import UpcomingActions from "@/components/UpcomingActions";

const WEEKLY_TARGETS = {
  applications: 10,
  connections: 15,
  content: 2,
  interviews: 1,
};

export default function Dashboard() {
  const applied = applications.filter((a) => a.stage !== "Researching").length;
  const interviews = applications.filter((a) =>
    ["Phone Screen", "Interview", "Final Round"].includes(a.stage)
  ).length;
  const activeContacts = contacts.filter((c) => c.status === "Active" || c.status === "Connected").length;
  const publishedContent = content.filter((c) => c.status === "Published").length;

  const conversionRate =
    applied > 0 ? Math.round((interviews / applied) * 100) : 0;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Command Center</h1>
        <p className="text-slate-500 text-sm mt-1">
          {new Date().toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
          {" · "}Treat this like a product sprint. Ship daily.
        </p>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KPICard
          label="Applications Sent"
          value={applied}
          target={WEEKLY_TARGETS.applications}
          unit="this week"
          color="blue"
        />
        <KPICard
          label="Interviews Active"
          value={interviews}
          target={WEEKLY_TARGETS.interviews}
          unit="in pipeline"
          color="green"
        />
        <KPICard
          label="Network Contacts"
          value={activeContacts}
          target={WEEKLY_TARGETS.connections}
          unit="active"
          color="purple"
        />
        <KPICard
          label="Content Published"
          value={publishedContent}
          target={WEEKLY_TARGETS.content}
          unit="this week"
          color="orange"
        />
      </div>

      {/* Conversion rate */}
      <div className="card flex items-center gap-4">
        <div className="flex-1">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">Application → Interview Rate</p>
          <div className="flex items-end gap-2">
            <span className="text-3xl font-bold text-slate-900">{conversionRate}%</span>
            <span className="text-slate-400 text-sm mb-1">({interviews} of {applied} apps)</span>
          </div>
          <div className="mt-2 h-2 bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-brand-500 rounded-full transition-all"
              style={{ width: `${Math.min(conversionRate, 100)}%` }}
            />
          </div>
        </div>
        <div className="text-right">
          <p className="text-xs text-slate-400">Target</p>
          <p className="text-lg font-bold text-brand-600">15%+</p>
        </div>
      </div>

      {/* Two-column layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <DailyChecklist />
        <UpcomingActions applications={applications} contacts={contacts} />
      </div>

      {/* Weekly focus */}
      <div className="card">
        <h2 className="font-semibold text-slate-900 mb-3">Weekly Focus Areas</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
          <div className="bg-blue-50 rounded-lg p-3">
            <p className="font-semibold text-blue-800 mb-1">Volume</p>
            <ul className="text-blue-700 space-y-1">
              <li>✓ Apply to 10 roles/week</li>
              <li>✓ 3 tailored, 7 fast-apply</li>
              <li>✓ Track every application</li>
            </ul>
          </div>
          <div className="bg-purple-50 rounded-lg p-3">
            <p className="font-semibold text-purple-800 mb-1">Visibility</p>
            <ul className="text-purple-700 space-y-1">
              <li>✓ 2 LinkedIn posts/week</li>
              <li>✓ 1 blog article/week</li>
              <li>✓ 15 connection requests</li>
            </ul>
          </div>
          <div className="bg-green-50 rounded-lg p-3">
            <p className="font-semibold text-green-800 mb-1">Sharpness</p>
            <ul className="text-green-700 space-y-1">
              <li>✓ 30 min PM study daily</li>
              <li>✓ 1 product teardown/week</li>
              <li>✓ 1 mock interview/week</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
