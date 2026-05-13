import { useMemo, useState } from "react";
import { geoMercator, geoPath } from "d3-geo";
import { scaleLinear } from "d3-scale";
import europe from "@/data/europe.geojson?url";
import { useQuery } from "@tanstack/react-query";
import { PAY_GAP } from "@/data/payGap";

interface Props {
  selectedIso2: string | null;
  onSelect: (iso2: string) => void;
}

const WIDTH = 760;
const HEIGHT = 720;

export function EuropeMap({ selectedIso2, onSelect }: Props) {
  const [hover, setHover] = useState<{ x: number; y: number; name: string; gap: number; year: number } | null>(null);

  const { data: geo } = useQuery({
    queryKey: ["europe-geo"],
    queryFn: async () => (await fetch(europe)).json(),
    staleTime: Infinity,
  });

  const gapByIso = useMemo(() => {
    const m = new Map<string, (typeof PAY_GAP)[number]>();
    PAY_GAP.forEach((d) => m.set(d.isoA2, d));
    return m;
  }, []);

  const colorScale = useMemo(
    () =>
      scaleLinear<string>()
        .domain([-2, 8, 20])
        .range(["oklch(0.78 0.16 200)", "oklch(0.92 0.04 90)", "oklch(0.45 0.24 20)"])
        .clamp(true),
    []
  );

  const projection = useMemo(
    () => geoMercator().center([15, 54]).scale(620).translate([WIDTH / 2, HEIGHT / 2]),
    []
  );
  const pathGen = useMemo(() => geoPath(projection), [projection]);

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
        <rect width={WIDTH} height={HEIGHT} fill="transparent" />
        <g>
          {geo.features.map((f: any) => {
            const iso2 = f.properties.ISO2;
            const entry = gapByIso.get(iso2);
            const fill = entry ? colorScale(entry.gap) : "oklch(0.88 0.01 80)";
            const isSelected = selectedIso2 === iso2;
            const d = pathGen(f) ?? "";
            return (
              <path
                key={f.properties.FID ?? iso2}
                d={d}
                fill={fill}
                stroke={isSelected ? "var(--accent-magenta)" : "oklch(0.97 0.005 85)"}
                strokeWidth={isSelected ? 2.2 : 0.6}
                className={entry ? "cursor-pointer transition-opacity hover:opacity-80" : "opacity-50"}
                onMouseMove={(e) => {
                  if (!entry) return;
                  const rect = (e.currentTarget.ownerSVGElement as SVGSVGElement).getBoundingClientRect();
                  setHover({
                    x: e.clientX - rect.left,
                    y: e.clientY - rect.top,
                    name: entry.country,
                    gap: entry.gap,
                    year: entry.year,
                  });
                }}
                onMouseLeave={() => setHover(null)}
                onClick={() => entry && onSelect(iso2)}
              />
            );
          })}
        </g>
      </svg>

      {hover && (
        <div
          className="pointer-events-none absolute z-10 rounded-md border border-border bg-background px-3 py-2 text-xs shadow-lg"
          style={{ left: hover.x + 14, top: hover.y + 14 }}
        >
          <div className="font-display text-base leading-none">{hover.name}</div>
          <div className="mt-1 text-muted-foreground">
            <span className="text-foreground font-semibold">{hover.gap.toFixed(1)}%</span> gap · {hover.year}
          </div>
        </div>
      )}

      <Legend />
    </div>
  );
}

function Legend() {
  const stops = [-2, 4, 8, 12, 16, 20];
  const scale = scaleLinear<string>()
    .domain([-2, 8, 20])
    .range(["oklch(0.78 0.16 200)", "oklch(0.92 0.04 90)", "oklch(0.45 0.24 20)"])
    .clamp(true);
  return (
    <div className="absolute bottom-2 left-2 rounded-md border border-border bg-background/90 px-3 py-2 text-[10px] backdrop-blur">
      <div className="mb-1 uppercase tracking-widest text-muted-foreground">Pay gap %</div>
      <div className="flex items-center gap-1">
        {stops.map((s) => (
          <div key={s} className="flex flex-col items-center gap-1">
            <div className="h-3 w-8" style={{ background: scale(s) }} />
            <span>{s > 0 ? `+${s}` : s}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
