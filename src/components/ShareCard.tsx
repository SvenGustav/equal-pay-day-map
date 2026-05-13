import { useRef, useState } from "react";
import { toPng } from "html-to-image";

interface Props {
  country: string;
  gap: number;
  year: number;
  salary: number;
  womensEarnings: number;
  annualGap: number;
  currency: string;
  equalPayDay: string;
  daysUnpaid: number;
}

export function ShareCard(props: Props) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState<string>("");

  const fmt = (n: number) =>
    new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(Math.round(n));

  const handleDownload = async () => {
    if (!cardRef.current) return;
    setStatus("Rendering…");
    try {
      const dataUrl = await toPng(cardRef.current, { pixelRatio: 2, cacheBust: true });
      const a = document.createElement("a");
      a.href = dataUrl;
      a.download = `pay-gap-${props.country.toLowerCase().replace(/\s+/g, "-")}.png`;
      a.click();
      setStatus("Downloaded ✓");
    } catch {
      setStatus("Failed");
    }
    setTimeout(() => setStatus(""), 2000);
  };

  const handleShare = async () => {
    const text = `Equal Pay Day in ${props.country}: ${props.equalPayDay}. From this date, women effectively work unpaid for the rest of the year (${props.daysUnpaid} days, ${props.gap.toFixed(1)}% gap).`;
    if (navigator.share) {
      try {
        await navigator.share({ title: "EU Pay Gap", text });
        setStatus("Shared ✓");
      } catch {}
    } else {
      await navigator.clipboard.writeText(text);
      setStatus("Copied ✓");
    }
    setTimeout(() => setStatus(""), 2000);
  };

  return (
    <div className="space-y-3 border-t border-border pt-6">
      <div className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
        Shareable card
      </div>

      <div
        ref={cardRef}
        className="relative overflow-hidden rounded-lg border border-border bg-[var(--paper)] p-8"
        style={{
          backgroundImage:
            "radial-gradient(circle at 80% 10%, oklch(0.58 0.24 0 / 0.08), transparent 50%)",
        }}
      >
        <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--accent-magenta)]">
          Equal Pay Day · {props.country}
        </div>
        <div className="mt-4 font-display text-6xl leading-[0.95] text-foreground">
          {props.equalPayDay}
        </div>
        <div className="mt-2 max-w-[32ch] font-display text-xl italic leading-snug text-muted-foreground">
          From this date, women work the rest of {new Date().getFullYear()}{" "}
          unpaid — {props.daysUnpaid} days, a {props.gap.toFixed(1)}% gap.
        </div>

        <div className="mt-6 grid grid-cols-2 gap-4 border-t border-border pt-4">
          <div>
            <div className="text-[10px] uppercase tracking-widest text-muted-foreground">
              On a salary of
            </div>
            <div className="font-display text-2xl">
              {props.currency}
              {fmt(props.salary)}
            </div>
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-widest text-muted-foreground">
              Women lose
            </div>
            <div className="font-display text-2xl text-[var(--accent-magenta)]">
              {props.currency}
              {fmt(props.annualGap)}
            </div>
          </div>
        </div>

        <div className="mt-6 text-[10px] uppercase tracking-widest text-muted-foreground">
          Source: Eurostat TESEM180 · paygap.eu
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          onClick={handleDownload}
          className="rounded-md bg-[var(--accent-magenta)] px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90"
        >
          Download PNG
        </button>
        <button
          onClick={handleShare}
          className="rounded-md border border-border bg-background px-4 py-2 text-sm font-semibold transition-colors hover:bg-secondary"
        >
          Share / Copy text
        </button>
        {status && <span className="self-center text-xs text-muted-foreground">{status}</span>}
      </div>
    </div>
  );
}
