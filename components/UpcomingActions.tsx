interface Application {
  id: string;
  company: string;
  role: string;
  nextAction: string;
  nextActionDate: string | null;
  stage: string;
}

interface Contact {
  id: string;
  name: string;
  company: string;
  nextFollowUp: string | null;
  status: string;
}

interface Props {
  applications: Application[];
  contacts: Contact[];
}

function daysUntil(dateStr: string | null): number {
  if (!dateStr) return 999;
  const diff = new Date(dateStr).getTime() - Date.now();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

function urgencyColor(days: number): string {
  if (days <= 0) return "bg-red-100 text-red-700";
  if (days <= 2) return "bg-orange-100 text-orange-700";
  if (days <= 5) return "bg-yellow-100 text-yellow-700";
  return "bg-slate-100 text-slate-600";
}

export default function UpcomingActions({ applications, contacts }: Props) {
  const appActions = applications
    .filter((a) => a.nextActionDate)
    .map((a) => ({
      id: `app-${a.id}`,
      label: a.nextAction,
      context: `${a.company} · ${a.stage}`,
      date: a.nextActionDate,
      days: daysUntil(a.nextActionDate),
    }));

  const contactActions = contacts
    .filter((c) => c.nextFollowUp && c.status !== "Closed")
    .map((c) => ({
      id: `con-${c.id}`,
      label: `Follow up with ${c.name}`,
      context: c.company,
      date: c.nextFollowUp,
      days: daysUntil(c.nextFollowUp),
    }));

  const all = [...appActions, ...contactActions]
    .sort((a, b) => a.days - b.days)
    .slice(0, 8);

  return (
    <div className="card">
      <h2 className="font-semibold text-slate-900 mb-3">Upcoming Actions</h2>
      <ul className="space-y-2">
        {all.map((item) => (
          <li key={item.id} className="flex items-start gap-3">
            <span className={`badge mt-0.5 shrink-0 ${urgencyColor(item.days)}`}>
              {item.days <= 0 ? "Today" : item.days === 1 ? "Tomorrow" : `${item.days}d`}
            </span>
            <div className="min-w-0">
              <p className="text-sm text-slate-800 font-medium truncate">{item.label}</p>
              <p className="text-xs text-slate-400">{item.context}</p>
            </div>
          </li>
        ))}
        {all.length === 0 && (
          <p className="text-sm text-slate-400">No upcoming actions. Add some to your pipeline!</p>
        )}
      </ul>
    </div>
  );
}
