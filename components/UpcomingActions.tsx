interface Application {
  id: string;
  company: string;
  stage: string;
  next_action: string;
  next_action_date: string | null;
}

interface Contact {
  id: string;
  name: string;
  company: string;
  status: string;
  next_follow_up: string | null;
}

interface Props {
  applications: Application[];
  contacts: Contact[];
}

function daysUntil(dateStr: string | null): number {
  if (!dateStr) return 999;
  return Math.ceil((new Date(dateStr).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
}

function urgencyColor(days: number): string {
  if (days <= 0) return "bg-red-100 text-red-700";
  if (days <= 2) return "bg-orange-100 text-orange-700";
  if (days <= 5) return "bg-yellow-100 text-yellow-700";
  return "bg-slate-100 text-slate-600";
}

export default function UpcomingActions({ applications, contacts }: Props) {
  const all = [
    ...applications.filter((a) => a.next_action_date).map((a) => ({
      id: `app-${a.id}`, label: a.next_action, context: `${a.company} · ${a.stage}`,
      days: daysUntil(a.next_action_date),
    })),
    ...contacts.filter((c) => c.next_follow_up && c.status !== "Closed").map((c) => ({
      id: `con-${c.id}`, label: `Follow up with ${c.name}`, context: c.company,
      days: daysUntil(c.next_follow_up),
    })),
  ].sort((a, b) => a.days - b.days).slice(0, 8);

  return (
    <div className="card">
      <h2 className="font-semibold text-slate-900 mb-3">Upcoming Actions</h2>
      {all.length === 0 ? (
        <p className="text-sm text-slate-400">No upcoming actions — add some to your pipeline!</p>
      ) : (
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
        </ul>
      )}
    </div>
  );
}
