import { useMemo, useState } from "react";
import { geoMercator, geoPath } from "d3-geo";
import { scaleLinear } from "d3-scale";
import europe from "@/data/europe.geojson?url";
import { useQuery } from "@tanstack/react-query";
import { PAY_GAP } from "@/data/payGap";
import { equalPayDayFromGap, formatEPD, daysUnpaid } from "@/lib/equalPayDay";
import { getGapForYear } from "@/lib/getGap";

interface Props {
  selectedIso2: string | null;
  onSelect: (iso2: string) => void;
  year: number;
}

const WIDTH = 760;
const HEIGHT = 720;

export function EuropeMap({ selectedIso2, onSelect, year }: Props) {
  const [hover, setHover] = useState<{
    x: number; y: number; name: string; gap: number; year: number; epd: string; days: number;
  } | null>(null);

  const { data: geo } = useQuery({
    queryKey: ["europe-geo"],
    queryFn: async () => (await fetch(europe)).json(),
    staleTime: Infinity,
  });

  const nameByIso = useMemo(() => {
    const m = new Map<string, string>();
    PAY_GAP.forEach((d) => m.set(d.isoA2, d.country));
    return m;
  }, []);

  // EPD is shown for the year *after* the reference year
  const epdYear = year + 1;

  const colorScale = useMemo(
    () =>
      scaleLinear<string>()
        .domain([0, 30, 75])
        .range(["oklch(0.94 0.03 90)", "oklch(0.75 0.18 30)", "oklch(0.42 0.24 10)"])
        .clamp(true),
    []
  );

  const projection = useMemo(
    () => geoMercator().center([15, 54]).scale(620).translate([WIDTH / 2, HEIGHT / 2]),
    []
  );
  const pathGen = useMemo(() => geoPath(projection), [projection]);

  const labels = useMemo(() => {
    if (!geo) return [];
    return geo.features
      .map((f: any) => {
        const iso2 = f.properties.ISO2;
        const gap = getGapForYear(iso2, year);
        if (gap == null) return null;
        const [cx, cy] = pathGen.centroid(f);
        if (!isFinite(cx) || !isFinite(cy)) return null;
        const epd = equalPayDayFromGap(gap, epdYear);
        const area = pathGen.area(f);
        return {
          iso2,
          cx,
          cy,
          area,
          name: nameByIso.get(iso2) ?? iso2,
          gap,
          epdShort: formatEPD(epd),
        };
      })
      .filter(Boolean) as Array<{
        iso2: string; cx: number; cy: number; area: number;
        name: string; gap: number; epdShort: string;
      }>;
  }, [geo, nameByIso, pathGen, year, epdYear]);

  if (!geo) {
    return (
      <div className="flex h-[720px] items-center justify-center text-sm text-muted-foreground">
        Loading map…
      </div>
    );
  }

  return (
    <div className="relative">
      <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} className="h-auto w-full">
        <g>
          {geo.features.map((f: any) => {
            const iso2 = f.properties.ISO2;
            const gap = getGapForYear(iso2, year);
            const days = gap != null ? daysUnpaid(gap, epdYear) : 0;
            const fill = gap != null ? colorScale(days) : "oklch(0.9 0.005 85)";
            const isSelected = selectedIso2 === iso2;
            const d = pathGen(f) ?? "";
            return (
              <path
                key={f.properties.FID ?? iso2}
                d={d}
                fill={fill}
                stroke={isSelected ? "var(--accent-magenta)" : "oklch(0.97 0.005 85)"}
                strokeWidth={isSelected ? 2.4 : 0.6}
                className={gap != null ? "cursor-pointer transition-opacity hover:opacity-80" : "opacity-40"}
                onMouseMove={(e) => {
                  if (gap == null) return;
                  const rect = (e.currentTarget.ownerSVGElement as SVGSVGElement).getBoundingClientRect();
                  const epd = equalPayDayFromGap(gap, epdYear);
                  setHover({
                    x: e.clientX - rect.left,
                    y: e.clientY - rect.top,
                    name: nameByIso.get(iso2) ?? iso2,
                    gap,
                    year,
                    epd: formatEPD(epd, { month: "long", day: "numeric" }),
                    days: daysUnpaid(gap, epdYear),
                  });
                }}
                onMouseLeave={() => setHover(null)}
                onClick={() => gap != null && onSelect(iso2)}
              />
            );
          })}
        </g>

        <g pointerEvents="none">
          {labels
            .filter((l) => l.area > 280)
            .map((l) => (
              <g key={l.iso2} transform={`translate(${l.cx}, ${l.cy})`}>
                <rect
                  x={-22}
                  y={-9}
                  width={44}
                  height={18}
                  rx={3}
                  fill="oklch(0.97 0.005 85)"
                  fillOpacity={0.88}
                  stroke="oklch(0.15 0.02 50 / 0.18)"
                  strokeWidth={0.4}
                />
                <text
                  textAnchor="middle"
                  dy={4}
                  className="font-display"
                  style={{
                    fontSize: 11,
                    fill: "oklch(0.15 0.02 50)",
                    letterSpacing: "-0.01em",
                  }}
                >
                  {l.epdShort}
                </text>
              </g>
            ))}
        </g>
      </svg>

      {hover && (
        <div
          className="pointer-events-none absolute z-10 rounded-md border border-border bg-background px-3 py-2 text-xs shadow-lg"
          style={{ left: hover.x + 14, top: hover.y + 14 }}
        >
          <div className="font-display text-base leading-none">{hover.name}</div>
          <div className="mt-1.5 text-[10px] uppercase tracking-widest text-muted-foreground">
            Equal Pay Day {epdYear}
          </div>
          <div className="font-display text-xl text-[var(--accent-magenta)]">{hover.epd}</div>
          <div className="mt-1 text-muted-foreground">
            {hover.days} days unpaid · {hover.gap.toFixed(1)}% gap · ref. {hover.year}
          </div>
        </div>
      )}

      <Legend />
    </div>
  );
}

function Legend() {
  const stops = [0, 15, 30, 45, 60, 75];
  const scale = scaleLinear<string>()
    .domain([0, 30, 75])
    .range(["oklch(0.94 0.03 90)", "oklch(0.75 0.18 30)", "oklch(0.42 0.24 10)"])
    .clamp(true);
  return (
    <div className="absolute bottom-2 left-2 rounded-md border border-border bg-background/90 px-3 py-2 text-[10px] backdrop-blur">
      <div className="mb-1 uppercase tracking-widest text-muted-foreground">
        Days women work unpaid
      </div>
      <div className="flex items-center gap-1">
        {stops.map((s) => (
          <div key={s} className="flex flex-col items-center gap-1">
            <div className="h-3 w-8" style={{ background: scale(s) }} />
            <span>{s}d</span>
          </div>
        ))}
      </div>
    </div>
  );
}
