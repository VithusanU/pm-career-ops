import clsx from "clsx";

type Color = "blue" | "green" | "purple" | "orange";

const colorMap: Record<Color, string> = {
  blue:   "bg-blue-50 text-blue-700 border-blue-100",
  green:  "bg-green-50 text-green-700 border-green-100",
  purple: "bg-purple-50 text-purple-700 border-purple-100",
  orange: "bg-orange-50 text-orange-700 border-orange-100",
};

const valuColorMap: Record<Color, string> = {
  blue:   "text-blue-900",
  green:  "text-green-900",
  purple: "text-purple-900",
  orange: "text-orange-900",
};

interface Props {
  label: string;
  value: number;
  target: number;
  unit: string;
  color: Color;
}

export default function KPICard({ label, value, target, unit, color }: Props) {
  const pct = Math.min(Math.round((value / target) * 100), 100);
  return (
    <div className={clsx("rounded-xl border p-4", colorMap[color])}>
      <p className="text-xs font-semibold uppercase tracking-wide opacity-70 mb-2">{label}</p>
      <div className="flex items-end justify-between mb-2">
        <span className={clsx("text-3xl font-bold", valuColorMap[color])}>{value}</span>
        <span className="text-xs opacity-60">/{target} {unit}</span>
      </div>
      <div className="h-1.5 bg-white/60 rounded-full overflow-hidden">
        <div
          className="h-full bg-current opacity-50 rounded-full transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
