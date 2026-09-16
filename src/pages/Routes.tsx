import { useCallback, useState, type CSSProperties } from "react";
import { useReducedMotion } from "motion/react";
import { useSearchParams } from "react-router-dom";
import { FleetMap, STATUS_RING } from "../components/FleetMap";
import { routes } from "../data/mock";

function badge(status: string) {
  if (status === "Em rota") return "badge badge-ok";
  if (status === "Carregando") return "badge badge-warn";
  return "badge";
}

export function RoutesPage() {
  const reduce = useReducedMotion() ?? false;
  const [params] = useSearchParams();
  // Deep link from an order ("Acompanhar no mapa") opens with that route in focus.
  const [selected, setSelected] = useState<string | null>(() => {
    const id = params.get("rota");
    return routes.some((r) => r.id === id) ? id : null;
  });
  const active = routes.filter((r) => r.status === "Em rota").length;
  const km = routes.reduce((a, r) => a + r.km, 0);
  const stops = routes.reduce((a, r) => a + r.stops, 0);
  const toggle = useCallback((id: string) => setSelected((cur) => (cur === id ? null : id)), []);
  const focused = routes.find((r) => r.id === selected);

  return (
    <>
      <p className="kicker">ERP · GPS</p>
      <div className="toolbar">
        <h1>Rotas de entrega</h1>
        <p className="live-pill">Ao vivo</p>
      </div>
      <div className="kpi">
        <div className="card">
          <span className="kicker">Em rota</span>
          <b>
            {active} <small>de {routes.length}</small>
          </b>
        </div>
        <div className="card">
          <span className="kicker">Quilometragem do dia</span>
          <b>{km} km</b>
        </div>
        <div className="card">
          <span className="kicker">Paradas do dia</span>
          <b>{stops}</b>
        </div>
      </div>
      <div className="fleet-layout">
        <div className="card fleet-map-card">
          <FleetMap routes={routes} selectedId={selected} reduce={reduce} onSelect={toggle} />
          {/* Two questions, two rows: how far along a route is (line style; the colour
              only tells routes apart), and what each truck is doing (its badge ring). */}
          <div className="map-legend" role="group" aria-label="Legenda do mapa">
            <p className="map-legend-title" id="legend-trajeto">
              Trajeto
            </p>
            <ul aria-labelledby="legend-trajeto">
              <li>
                <i className="legend-line" aria-hidden="true" />A percorrer
              </li>
              <li>
                <i className="legend-line is-passed" aria-hidden="true" />
                Percorrido
              </li>
              <li>
                <i className="legend-line is-planned" aria-hidden="true" />
                Não iniciado
              </li>
            </ul>
            <p className="map-legend-title" id="legend-caminhao">
              Caminhão
            </p>
            <ul aria-labelledby="legend-caminhao">
              {(Object.keys(STATUS_RING) as (keyof typeof STATUS_RING)[]).map((status) => (
                <li key={status}>
                  <i className="legend-badge" style={{ "--status": STATUS_RING[status] } as CSSProperties} aria-hidden="true" />
                  {status}
                </li>
              ))}
            </ul>
          </div>
          {focused ? (
            <button type="button" className="map-reset" onClick={() => setSelected(null)}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                <path d="m15 18-6-6 6-6" />
              </svg>
              Todas as rotas
            </button>
          ) : null}
        </div>
        <div className="card route-table-card">
          <table className="table route-table">
            <caption className="visually-hidden">
              Rotas do dia. Selecione uma rota para destacá-la no mapa.
            </caption>
            <thead>
              <tr>
                <th scope="col">Rota</th>
                <th scope="col">Região</th>
                <th scope="col">Frota</th>
                <th scope="col" className="num">Paradas</th>
                <th scope="col" className="num">Distância</th>
                <th scope="col" className="num">Combustível</th>
                <th scope="col">Status</th>
                <th scope="col" className="num">ETA</th>
              </tr>
            </thead>
            <tbody>
              {routes.map((r) => (
                <tr
                  key={r.id}
                  className={selected === r.id ? "row-active" : undefined}
                  onClick={() => toggle(r.id)}
                >
                  <td className="route-id">
                    <button type="button" className="row-link" aria-pressed={selected === r.id}>
                      <span className="route-swatch" style={{ "--route": r.color } as CSSProperties} aria-hidden="true" />
                      <strong>{r.id}</strong>
                    </button>
                  </td>
                  <td data-label="Região">{r.region}</td>
                  <td data-label="Frota">{r.truck}</td>
                  <td data-label="Paradas" className="num">{r.stops}</td>
                  <td data-label="Distância" className="num">{r.km} km</td>
                  <td data-label="Combustível" className="num ok">−{r.fuelSaved}</td>
                  <td className="route-status">
                    <span className={badge(r.status)}>{r.status}</span>
                  </td>
                  <td data-label="ETA" className="num">{r.eta}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
