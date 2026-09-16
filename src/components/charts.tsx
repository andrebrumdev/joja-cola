import { useState, type CSSProperties, type ReactNode } from "react";

// Chart primitives for the system pages. Palette validated on the card surface
// (#0e1e3d, dark) with the dataviz validator: series #3987e5, poles #3987e5/#e66767.

type Tip = { left: string; bottom: string; value: string; label: string } | null;

/** Smallest round ceiling with a little headroom, so the tallest mark and a limit line never touch the top tick. */
function niceMax(value: number) {
  const target = value * 1.08;
  const exp = 10 ** Math.floor(Math.log10(target));
  const max = [1, 1.2, 1.5, 2, 2.5, 3, 4, 5, 6, 8, 10].map((m) => m * exp).find((m) => m >= target) ?? 10 * exp;
  return Number(max.toPrecision(6));
}

function DataTable({ caption, head, rows }: { caption: string; head: [string, string]; rows: [string, string][] }) {
  return (
    <details className="chart-table">
      <summary>Ver tabela</summary>
      <table className="table">
        <caption className="visually-hidden">{caption}</caption>
        <thead>
          <tr>
            <th scope="col">{head[0]}</th>
            <th scope="col" className="num">
              {head[1]}
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map(([a, b]) => (
            <tr key={a}>
              <td>{a}</td>
              <td className="num">{b}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </details>
  );
}

function Tooltip({ tip }: { tip: Tip }) {
  if (!tip) return null;
  return (
    <div className="chart-tip" style={{ left: tip.left, bottom: tip.bottom }} role="presentation">
      <strong>{tip.value}</strong>
      <span>{tip.label}</span>
    </div>
  );
}

/** One series over discrete steps (days, batches). Optional limit line on the same axis. */
export function ColumnChart({
  title,
  data,
  format,
  limit,
  columnHead,
  height = 180,
}: {
  title: string;
  /** `label` sits on the x axis; `name` (optional, longer) is used by the tooltip, screen readers and the table. */
  data: { label: string; value: number; name?: string }[];
  format: (value: number) => string;
  limit?: { value: number; label: string };
  columnHead: string;
  height?: number;
}) {
  const [tip, setTip] = useState<Tip>(null);
  const max = niceMax(Math.max(...data.map((d) => d.value), limit?.value ?? 0));
  const ticks = [0, max / 2, max];
  const last = data.length - 1;

  return (
    <figure className="chart">
      <div className="chart-body">
        <div className="chart-axis" style={{ height }} aria-hidden="true">
          {ticks.map((t) => (
            <span key={t} style={{ bottom: `${(t / max) * 100}%` }}>
              {format(t)}
            </span>
          ))}
        </div>
        <div className="chart-plot" style={{ height }} onPointerLeave={() => setTip(null)}>
          {ticks.map((t) => (
            <i key={t} className="chart-grid" style={{ bottom: `${(t / max) * 100}%` }} aria-hidden="true" />
          ))}
          {limit ? (
            <div className="chart-limit" style={{ bottom: `${(limit.value / max) * 100}%` }} aria-hidden="true">
              <span>{limit.label}</span>
            </div>
          ) : null}
          <div className="chart-cols">
            {data.map((d, i) => {
              const pct = (d.value / max) * 100;
              const left = `${((i + 0.5) / data.length) * 100}%`;
              const name = d.name ?? d.label;
              const show = () => setTip({ left, bottom: `${pct}%`, value: format(d.value), label: name });
              return (
                <div
                  key={d.label}
                  className="chart-col"
                  tabIndex={0}
                  role="img"
                  aria-label={`${name}: ${format(d.value)}`}
                  onPointerEnter={show}
                  onFocus={show}
                  onBlur={() => setTip(null)}
                >
                  <span className="chart-bar" style={{ height: `${pct}%` }} />
                  {i === last ? (
                    <span className="chart-direct" style={{ bottom: `${pct}%` }} aria-hidden="true">
                      {format(d.value)}
                    </span>
                  ) : null}
                </div>
              );
            })}
          </div>
          <Tooltip tip={tip} />
        </div>
      </div>
      <div className="chart-x" aria-hidden="true">
        {data.map((d) => (
          <span key={d.label}>{d.label}</span>
        ))}
      </div>
      <DataTable caption={title} head={[columnHead, "Valor"]} rows={data.map((d) => [d.name ?? d.label, format(d.value)])} />
    </figure>
  );
}

/** Magnitude per category against a cut-off: above the line in accent, below in gray. */
export function ThresholdBars({
  title,
  data,
  threshold,
  max,
  format,
}: {
  title: string;
  data: { label: string; value: number }[];
  threshold: { value: number; label: string };
  max: number;
  format: (value: number) => string;
}) {
  const [active, setActive] = useState<string | null>(null);
  return (
    <figure className="chart">
      <div className="hbars">
        {data.map((d) => {
          const above = d.value >= threshold.value;
          return (
            <div
              key={d.label}
              className={"hbar" + (active === d.label ? " is-active" : "")}
              tabIndex={0}
              role="img"
              aria-label={`${d.label}: ${format(d.value)}, ${above ? "acima" : "abaixo"} do corte`}
              onPointerEnter={() => setActive(d.label)}
              onPointerLeave={() => setActive(null)}
              onFocus={() => setActive(d.label)}
              onBlur={() => setActive(null)}
            >
              <span className="hbar-label">{d.label}</span>
              <span className="hbar-track">
                <span
                  className={"hbar-fill" + (above ? "" : " is-muted")}
                  style={{ width: `${(d.value / max) * 100}%` }}
                />
                <span className="hbar-cut" style={{ left: `${(threshold.value / max) * 100}%` }} aria-hidden="true" />
              </span>
              <span className="hbar-value">{format(d.value)}</span>
            </div>
          );
        })}
      </div>
      <figcaption className="chart-legend">
        <span>
          <i className="swatch" style={{ "--swatch": "var(--series-1)" } as CSSProperties} /> Acima do corte
        </span>
        <span>
          <i className="swatch" style={{ "--swatch": "var(--series-muted)" } as CSSProperties} /> Abaixo do corte
        </span>
        <span>
          <i className="swatch-line" /> {threshold.label}
        </span>
      </figcaption>
      <DataTable caption={title} head={["Região", "Índice"]} rows={data.map((d) => [d.label, format(d.value)])} />
    </figure>
  );
}

/** Ordered share that sums to 100 (sentiment): one stacked bar, poles + neutral midpoint. */
export function ShareBar({
  title,
  segments,
}: {
  title: string;
  segments: { label: string; value: number; tone: "positive" | "neutral" | "negative" }[];
}) {
  const [tip, setTip] = useState<Tip>(null);
  let offset = 0;
  return (
    <figure className="chart">
      <div className="share" onPointerLeave={() => setTip(null)}>
        {segments.map((s) => {
          const left = `${offset + s.value / 2}%`;
          offset += s.value;
          const show = () => setTip({ left, bottom: "100%", value: `${s.value}%`, label: s.label });
          return (
            <span
              key={s.label}
              className={`share-seg tone-${s.tone}`}
              style={{ flexGrow: s.value }}
              tabIndex={0}
              role="img"
              aria-label={`${s.label}: ${s.value}%`}
              onPointerEnter={show}
              onFocus={show}
              onBlur={() => setTip(null)}
            />
          );
        })}
        <Tooltip tip={tip} />
      </div>
      <figcaption className="chart-legend">
        {segments.map((s) => (
          <span key={s.label}>
            <i className={`swatch tone-${s.tone}`} /> {s.label} <b>{s.value}%</b>
          </span>
        ))}
      </figcaption>
      <DataTable caption={title} head={["Sentimento", "Participação"]} rows={segments.map((s) => [s.label, `${s.value}%`])} />
    </figure>
  );
}

/** A live reading against its setpoint and tolerance band. */
export function Meter({
  label,
  value,
  setpoint,
  tolerance,
  min,
  max,
  format,
  unit,
}: {
  label: string;
  value: number;
  setpoint: number;
  tolerance: number;
  min: number;
  max: number;
  format: (value: number) => string;
  unit: string;
}) {
  const pos = (v: number) => `${((Math.min(max, Math.max(min, v)) - min) / (max - min)) * 100}%`;
  const inBand = Math.abs(value - setpoint) <= tolerance;
  const status: ReactNode = inBand ? (
    <span className="meter-status ok">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
        <path d="m5 12 5 5L20 7" />
      </svg>
      Na faixa
    </span>
  ) : (
    <span className="meter-status warn">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
        <path d="M12 8v5M12 17h.01" />
      </svg>
      Fora da faixa
    </span>
  );

  return (
    <div className="meter">
      <div className="meter-head">
        <span className="meter-label">{label}</span>
        {status}
      </div>
      <p className="meter-value">
        {format(value)} <small>{unit}</small>
      </p>
      <div
        className="meter-track"
        role="meter"
        aria-label={`${label}: ${format(value)} ${unit}, alvo ${format(setpoint)} ± ${format(tolerance)}`}
        aria-valuemin={min}
        aria-valuemax={max}
        aria-valuenow={Number(value.toFixed(3))}
      >
        <span className="meter-band" style={{ left: pos(setpoint - tolerance), right: `calc(100% - ${pos(setpoint + tolerance)})` }} />
        <span className="meter-set" style={{ left: pos(setpoint) }} />
        <span className={"meter-dot" + (inBand ? "" : " is-warn")} style={{ left: pos(value) }} />
      </div>
      <p className="meter-scale">
        Alvo {format(setpoint)} ± {format(tolerance)} {unit}
      </p>
    </div>
  );
}
