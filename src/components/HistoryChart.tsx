import { useState } from "react";
import { HISTORICAL_GAP, HISTORICAL_YEARS } from "@/data/historicalGap";
import { equalPayDayFromGap, formatEPD } from "@/lib/equalPayDay";

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
  const [hoverYear, setHoverYear] = useState<number | null>(null);

  const series = HISTORICAL_GAP[iso2] ?? {};
  const points = HISTORICAL_YEARS.map((y) => {
    const gap = series[y];
    if (typeof gap !== "number") return null;
    const epd = equalPayDayFromGap(gap, y + 1);
    const start = new Date(y + 1, 0, 1);
    const dayOfYear = Math.round(
      (epd.getTime() - start.getTime()) / 86_400_000
    );
    return { year: y, gap, dayOfYear, epd };
  }).filter(Boolean) as { year: number; gap: number; dayOfYear: number; epd: Date }[];

  if (points.length === 0) {
    return (
      <div className="rounded-md border border-border bg-background/60 px-4 py-6 text-center text-xs text-muted-foreground">
        No historical data available.
      </div>
    );
  }

  const minYear = HISTORICAL_YEARS[0];
  const maxYear = HISTORICAL_YEARS[HISTORICAL_YEARS.length - 1];
  const maxDay = Math.max(120, ...points.map((p) => p.dayOfYear));
  const minDay = 0;

  const xScale = (y: number) =>
    PAD_L + ((y - minYear) / (maxYear - minYear)) * (W - PAD_L - PAD_R);
  const yScale = (d: number) =>
    PAD_T + ((d - minDay) / (maxDay - minDay)) * (H - PAD_T - PAD_B);

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
  const hover = hoverYear != null ? points.find((p) => p.year === hoverYear) : null;
  const active = hover ?? highlight;
  const activeIsHover = !!hover;

  // Hit-test column width (in viewBox units)
  const colW = (W - PAD_L - PAD_R) / Math.max(1, points.length - 1);

  // Tooltip position (in % of viewBox so it scales with svg)
  const tooltip = active
    ? {
        leftPct: (xScale(active.year) / W) * 100,
        topPct: (yScale(active.dayOfYear) / H) * 100,
        date: formatEPD(active.epd, { month: "short", day: "numeric" }),
        year: active.year,
        gap: active.gap,
      }
    : null;

  return (
    <div className="relative">
      <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full">
        <defs>
          <linearGradient id="epd-area" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="var(--accent-magenta)" stopOpacity="0.35" />
            <stop offset="100%" stopColor="var(--accent-magenta)" stopOpacity="0.02" />
          </linearGradient>
        </defs>

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

        <path d={areaPath} fill="url(#epd-area)" />
        <path
          d={linePath}
          fill="none"
          stroke="var(--accent-magenta)"
          strokeWidth={1.6}
          strokeLinejoin="round"
          strokeLinecap="round"
        />

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

        {points.map((p) => {
          const isHighlight = p.year === highlightYear;
          const isHover = p.year === hoverYear;
          return (
            <circle
              key={p.year}
              cx={xScale(p.year)}
              cy={yScale(p.dayOfYear)}
              r={isHover ? 4.5 : isHighlight ? 4 : 1.8}
              fill={isHighlight || isHover ? "var(--accent-magenta)" : "oklch(0.42 0.24 10)"}
              stroke={isHighlight || isHover ? "var(--paper)" : "none"}
              strokeWidth={isHighlight || isHover ? 1.5 : 0}
            />
          );
        })}

        {active && (
          <line
            x1={xScale(active.year)}
            x2={xScale(active.year)}
            y1={PAD_T}
            y2={H - PAD_B}
            stroke="var(--accent-magenta)"
            strokeOpacity={activeIsHover ? 0.55 : 0.35}
            strokeDasharray="2 2"
          />
        )}

        {/* In-SVG label for the active point — shows the EPD date */}
        {active && (() => {
          const ax = xScale(active.year);
          const rightEdge = W - PAD_R;
          const leftEdge = PAD_L;
          const anchor: "start" | "middle" | "end" =
            ax > rightEdge - 32 ? "end" : ax < leftEdge + 32 ? "start" : "middle";
          return (
            <text
              x={ax}
              y={Math.max(PAD_T + 10, yScale(active.dayOfYear) - 9)}
              textAnchor={anchor}
              className="font-display"
              style={{ fontSize: 11, fill: "var(--accent-magenta)", fontWeight: 600 }}
            >
              {formatEPD(active.epd, { month: "short", day: "numeric" })}
            </text>
          );
        })()}

        {/* Invisible hit-test rectangles for hover */}
        {points.map((p) => (
          <rect
            key={`hit-${p.year}`}
            x={xScale(p.year) - colW / 2}
            y={PAD_T}
            width={colW}
            height={H - PAD_T - PAD_B}
            fill="transparent"
            onMouseEnter={() => setHoverYear(p.year)}
            onMouseLeave={() =>
              setHoverYear((cur) => (cur === p.year ? null : cur))
            }
            style={{ cursor: "crosshair" }}
          />
        ))}
      </svg>

      {tooltip && activeIsHover && (
        <div
          className="pointer-events-none absolute z-10 -translate-y-[110%] whitespace-nowrap rounded-md border border-border bg-background px-3 py-2 text-sm shadow-lg"
          style={{
            left: `${tooltip.leftPct}%`,
            top: `${tooltip.topPct}%`,
            transform:
              tooltip.leftPct > 75
                ? "translate(-100%, -110%) translateX(-8px)"
                : tooltip.leftPct < 25
                ? "translate(0%, -110%) translateX(8px)"
                : "translate(-50%, -110%)",
          }}
        >
          <div className="font-display text-base leading-none">
            {tooltip.date}{" "}
            <span className="text-muted-foreground">{tooltip.year + 1}</span>
          </div>
          <div className="mt-1 text-xs text-muted-foreground">
            ref. {tooltip.year} · {tooltip.gap.toFixed(1)}% gap
          </div>
        </div>
      )}
    </div>
  );
}
