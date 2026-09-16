import { useEffect, useState } from "react";
import { useReducedMotion } from "motion/react";
import { ColumnChart, Meter } from "../components/charts";
import { production } from "../data/mock";

const num = (decimals: number) => (value: number) =>
  value.toLocaleString("pt-BR", { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
const pct = (value: number) => `${value.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%`;

type Reading = Record<"calda" | "agua" | "co2", number>;

const setpoints: Reading = {
  calda: production.dosing[0].setpoint,
  agua: production.dosing[1].setpoint,
  co2: production.dosing[2].setpoint,
};

/** Sensor noise inside the control band: the loop keeps the mix on target. */
function sample(): Reading {
  const jitter = (spread: number) => (Math.random() * 2 - 1) * spread;
  const calda = setpoints.calda + jitter(0.18);
  return {
    calda,
    // The blend is two streams: water is whatever the syrup is not.
    agua: 100 - calda,
    co2: setpoints.co2 + jitter(0.06),
  };
}

export function Production() {
  const reduce = useReducedMotion() ?? false;
  const [reading, setReading] = useState<Reading>(setpoints);
  const [clock, setClock] = useState(() => new Date());

  useEffect(() => {
    if (reduce) return;
    const id = window.setInterval(() => {
      setReading(sample());
      setClock(new Date());
    }, 1000);
    return () => window.clearInterval(id);
  }, [reduce]);

  const line = production.lines[0];
  const waste = production.waste;
  const avgWaste = waste.reduce((a, w) => a + w.pct, 0) / waste.length;
  const worst = Math.max(...waste.map((w) => w.pct));
  const running = production.lines.filter((l) => l.status === "Envasando").length;

  return (
    <>
      <p className="kicker">SCADA · sensores IoT</p>
      <div className="toolbar">
        <h1>Produção</h1>
        <p className="live-pill">
          Ao vivo
          <span className="hint">
            {production.plant} ·{" "}
            <time dateTime={clock.toISOString()}>
              {clock.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit", second: reduce ? undefined : "2-digit" })}
            </time>
          </span>
        </p>
      </div>

      <div className="kpi">
        <div className="card">
          <span className="kicker">Linhas envasando</span>
          <b>
            {running} <small>de {production.lines.length}</small>
          </b>
        </div>
        <div className="card">
          <span className="kicker">Ritmo da {line.name}</span>
          <b>
            {line.unitsPerHour.toLocaleString("pt-BR")} <small>latas/h</small>
          </b>
        </div>
        <div className="card">
          <span className="kicker">Desperdício médio</span>
          <b>
            {pct(avgWaste)} <small>limite {pct(production.wasteLimit)}</small>
          </b>
        </div>
      </div>

      <section className="card panel" aria-labelledby="dosing-title">
        <div className="panel-head">
          <div>
            <h2 id="dosing-title">Dosagem · {line.name}</h2>
            <p className="hint">
              Lote {line.batch} · {line.product}
            </p>
          </div>
        </div>
        <div className="meters">
          {production.dosing.map((d) => (
            <Meter
              key={d.id}
              label={d.label}
              value={reading[d.id]}
              setpoint={d.setpoint}
              tolerance={d.tolerance}
              min={d.min}
              max={d.max}
              unit={d.unit}
              format={num(d.decimals)}
            />
          ))}
        </div>
      </section>

      <div className="panel-grid">
        <section className="card panel" aria-labelledby="waste-title">
          <div className="panel-head">
            <div>
              <h2 id="waste-title">Desperdício por lote</h2>
              <p className="hint">
                Últimos {waste.length} lotes da {line.name} · pior lote {pct(worst)}, abaixo do limite
              </p>
            </div>
          </div>
          <ColumnChart
            title="Desperdício por lote"
            columnHead="Lote"
            data={waste.map((w) => ({ label: w.batch.slice(-2), name: `Lote ${w.batch}`, value: w.pct }))}
            format={pct}
            limit={{ value: production.wasteLimit, label: `Limite ${pct(production.wasteLimit)}` }}
          />
        </section>

        <section className="card panel" aria-labelledby="events-title">
          <div className="panel-head">
            <h2 id="events-title">Eventos da linha</h2>
          </div>
          <ol className="event-list">
            {production.events.map((e) => (
              <li key={e.time + e.text}>
                <time>{e.time}</time>
                <span>{e.text}</span>
              </li>
            ))}
          </ol>
        </section>
      </div>

      <div className="card route-table-card">
        <table className="table data-table">
          <caption className="visually-hidden">Linhas de envase</caption>
          <thead>
            <tr>
              <th scope="col">Linha</th>
              <th scope="col">Produto</th>
              <th scope="col">Lote</th>
              <th scope="col" className="num">Ritmo</th>
              <th scope="col" className="num">Eficiência</th>
              <th scope="col">Status</th>
            </tr>
          </thead>
          <tbody>
            {production.lines.map((l) => (
              <tr key={l.id}>
                <td className="route-id">
                  <strong>{l.name}</strong>
                </td>
                <td data-label="Produto">{l.product}</td>
                <td data-label="Lote">{l.batch}</td>
                <td data-label="Ritmo" className="num">
                  {l.unitsPerHour ? `${l.unitsPerHour.toLocaleString("pt-BR")}/h` : "—"}
                </td>
                <td data-label="Eficiência" className="num">
                  {l.efficiency ? pct(l.efficiency) : "—"}
                </td>
                <td className="route-status">
                  <span className={l.status === "Envasando" ? "badge badge-ok" : "badge badge-warn"}>{l.status}</span>
                  {"note" in l && l.note ? <span className="hint">{l.note}</span> : null}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
