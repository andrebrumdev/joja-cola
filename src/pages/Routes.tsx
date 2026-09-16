import { useCallback, useState } from "react";
import { useReducedMotion } from "motion/react";
import { FleetMap } from "../components/FleetMap";
import { routes } from "../data/mock";

function badge(status: string) {
  if (status === "Em rota") return "badge badge-ok";
  if (status === "Carregando") return "badge badge-warn";
  return "badge";
}

export function RoutesPage() {
  const reduce = useReducedMotion() ?? false;
  const [selected, setSelected] = useState<string>("R-12");
  const active = routes.filter((r) => r.status === "Em rota").length;
  const km = routes.reduce((a, r) => a + r.km, 0);
  const onSelect = useCallback((id: string) => setSelected(id), []);

  return (
    <>
      <p className="kicker">ERP · GPS</p>
      <div className="toolbar">
        <h1>Rotas de entrega</h1>
        <p className="hint">Ao vivo · MapLibre</p>
      </div>
      <div className="kpi">
        <div className="card">
          <span className="kicker">Em rota</span>
          <b>{active}</b>
        </div>
        <div className="card">
          <span className="kicker">Quilometragem do dia</span>
          <b>{km} km</b>
        </div>
        <div className="card">
          <span className="kicker">Roteirizador</span>
          <b>GPS</b>
        </div>
      </div>
      <div className="fleet-layout">
        <div className="card fleet-map-card">
          <FleetMap
            routes={routes}
            selectedId={selected}
            reduce={reduce}
            onSelect={onSelect}
          />
        </div>
        <div className="card" style={{ padding: 0, overflow: "hidden" }}>
          <table className="table">
            <thead>
              <tr>
                <th>Rota</th>
                <th>Região</th>
                <th>Frota</th>
                <th>Paradas</th>
                <th>Combustível</th>
                <th>Status</th>
                <th>ETA</th>
              </tr>
            </thead>
            <tbody>
              {routes.map((r) => (
                <tr
                  key={r.id}
                  className={selected === r.id ? "row-active" : undefined}
                >
                  <td>
                    <button
                      type="button"
                      className="row-link"
                      onClick={() => setSelected(r.id)}
                    >
                      <strong>{r.id}</strong>
                    </button>
                  </td>
                  <td>{r.region}</td>
                  <td>{r.truck}</td>
                  <td>
                    {r.stops} · {r.km} km
                  </td>
                  <td className="ok">−{r.fuelSaved}</td>
                  <td>
                    <span className={badge(r.status)}>{r.status}</span>
                  </td>
                  <td>{r.eta}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
