import { HISTORICAL_GAP, HISTORICAL_YEARS } from "@/data/historicalGap";
import { equalPayDayFromGap } from "@/lib/equalPayDay";

interface Props {
  iso2: string;
  highlightYear: number;
}

const W = 520;
const H = 160;
const PAD_L = 36;
const PAD_R = 12;
const PAD_T = 18;
const PAD_B = 24;

export function HistoryChart({ iso2, highlightYear }: Props) {
  const series = HISTORICAL_GAP[iso2] ?? {};
  const points = HISTORICAL_YEARS.map((y) => {
    const gap = series[y];
    if (typeof gap !== "number") return null;
    const epd = equalPayDayFromGap(gap, y + 1);
    const start = new Date(Date.UTC(y + 1, 0, 1));
    const dayOfYear = Math.round(
      (epd.getTime() - start.getTime()) / 86_400_000
    );
    return { year: y, gap, dayOfYear };
  }).filter(Boolean) as { year: number; gap: number; dayOfYear: number }[];

  if (points.length === 0) {
    return (
      <div className="rounded-md border border-border bg-background/60 px-4 py-6 text-center text-xs text-muted-foreground">
        No historical data available.
      </div>
    );
  }

  const minYear = HISTORICAL_YEARS[0];
  const maxYear = HISTORICAL_YEARS[HISTORICAL_YEARS.length - 1];
  const maxDay = Math.max(120, ...points.map((p) => p.dayOfYear)); // chart up to at least Apr
  const minDay = 0;

  const xScale = (y: number) =>
    PAD_L + ((y - minYear) / (maxYear - minYear)) * (W - PAD_L - PAD_R);
  const yScale = (d: number) =>
    PAD_T + ((d - minDay) / (maxDay - minDay)) * (H - PAD_T - PAD_B);

  // Reference month gridlines (Jan 1, Feb 1, Mar 1, Apr 1, May 1)
  const monthDays = [
    { d: 0, label: "Jan 1" },
    { d: 31, label: "Feb 1" },
    { d: 59, label: "Mar 1" },
    { d: 90, label: "Apr 1" },
    { d: 120, label: "May 1" },
  ].filter((m) => m.d <= maxDay);

  const linePath = points
    .map((p, i) => `${i === 0 ? "M" : "L"} ${xScale(p.year)} ${yScale(p.dayOfYear)}`)
    .join(" ");

  const areaPath =
    `M ${xScale(points[0].year)} ${yScale(0)} ` +
    points.map((p) => `L ${xScale(p.year)} ${yScale(p.dayOfYear)}`).join(" ") +
    ` L ${xScale(points[points.length - 1].year)} ${yScale(0)} Z`;

  const highlight = points.find((p) => p.year === highlightYear);

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full">
      <defs>
        <linearGradient id="epd-area" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="var(--accent-magenta)" stopOpacity="0.35" />
          <stop offset="100%" stopColor="var(--accent-magenta)" stopOpacity="0.02" />
        </linearGradient>
      </defs>

      {/* Month gridlines */}
      {monthDays.map((m) => (
        <g key={m.d}>
          <line
            x1={PAD_L}
            x2={W - PAD_R}
            y1={yScale(m.d)}
            y2={yScale(m.d)}
            stroke="oklch(0.15 0.02 50 / 0.1)"
            strokeDasharray="2 3"
          />
          <text
            x={PAD_L - 6}
            y={yScale(m.d) + 3}
            textAnchor="end"
            style={{ fontSize: 9, fill: "oklch(0.15 0.02 50 / 0.55)" }}
          >
            {m.label}
          </text>
        </g>
      ))}

      {/* Area + line */}
      <path d={areaPath} fill="url(#epd-area)" />
      <path
        d={linePath}
        fill="none"
        stroke="var(--accent-magenta)"
        strokeWidth={1.6}
        strokeLinejoin="round"
        strokeLinecap="round"
      />

      {/* Year axis ticks */}
      {points
        .filter((_, i) => i % 3 === 0 || i === points.length - 1)
        .map((p) => (
          <text
            key={p.year}
            x={xScale(p.year)}
            y={H - 6}
            textAnchor="middle"
            style={{ fontSize: 9, fill: "oklch(0.15 0.02 50 / 0.6)" }}
          >
            {p.year}
          </text>
        ))}

      {/* Data points */}
      {points.map((p) => (
        <circle
          key={p.year}
          cx={xScale(p.year)}
          cy={yScale(p.dayOfYear)}
          r={p.year === highlightYear ? 4 : 1.8}
          fill={p.year === highlightYear ? "var(--accent-magenta)" : "oklch(0.42 0.24 10)"}
          stroke={p.year === highlightYear ? "var(--paper)" : "none"}
          strokeWidth={p.year === highlightYear ? 1.5 : 0}
        />
      ))}

      {/* Highlight label */}
      {highlight && (
        <g>
          <line
            x1={xScale(highlight.year)}
            x2={xScale(highlight.year)}
            y1={PAD_T}
            y2={H - PAD_B}
            stroke="var(--accent-magenta)"
            strokeOpacity="0.35"
            strokeDasharray="2 2"
          />
          <text
            x={xScale(highlight.year)}
            y={Math.max(PAD_T + 10, yScale(highlight.dayOfYear) - 8)}
            textAnchor="middle"
            className="font-display"
            style={{ fontSize: 10, fill: "var(--accent-magenta)", fontWeight: 600 }}
          >
            {highlight.gap.toFixed(1)}%
          </text>
        </g>
      )}
    </svg>
  );
}
