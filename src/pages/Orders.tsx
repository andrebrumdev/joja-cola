import { useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { orderTotal, products, routes, type Order } from "../data/mock";
import { allOrders, cart, useAppState } from "../lib/store";

const brl = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

const STEPS = ["Confirmado", "Em rota", "Entregue"] as const;

function badge(status: Order["status"]) {
  if (status === "Entregue") return "badge badge-ok";
  if (status === "Cancelado") return "badge badge-bad";
  if (status === "Em rota") return "badge badge-live";
  return "badge badge-warn";
}

function summary(order: Order) {
  return order.items
    .map((item) => {
      const product = products.find((p) => p.id === item.productId);
      return `${item.cases} ${item.cases === 1 ? "pack" : "packs"} ${product?.name.replace("Joja Cola ", "") ?? item.productId}`;
    })
    .join(" · ");
}

export function Orders() {
  const state = useAppState();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const fresh = params.get("novo") ?? params.get("pedido");
  const orders = allOrders(state);
  const open = orders.filter((o) => o.status === "Confirmado" || o.status === "Em rota");
  const delivered = orders.filter((o) => o.status === "Entregue").length;
  const cancelled = orders.filter((o) => o.status === "Cancelado").length;

  useEffect(() => {
    if (fresh) document.getElementById(`pedido-${fresh}`)?.scrollIntoView({ block: "center" });
  }, [fresh]);

  function reorder(order: Order) {
    cart.reorder(order);
    navigate("/carrinho", { viewTransition: true });
  }

  return (
    <>
      <p className="kicker">Varejo</p>
      <div className="toolbar">
        <h1>Pedidos</h1>
        <Link className="btn btn-primary" to="/produtos" viewTransition>
          Novo pedido
        </Link>
      </div>

      {params.get("novo") ? (
        <p className="toast" role="status">
          Pedido nº {params.get("novo")} confirmado. A nota fiscal já está em Pagamentos.
        </p>
      ) : null}

      <div className="kpi">
        <div className="card">
          <span className="kicker">Em andamento</span>
          <b>{open.length}</b>
        </div>
        <div className="card">
          <span className="kicker">Entregues</span>
          <b>{delivered}</b>
        </div>
        <div className="card">
          <span className="kicker">Cancelados</span>
          <b>{cancelled}</b>
        </div>
      </div>

      <ul className="order-list">
        {orders.map((order) => {
          const route = routes.find((r) => r.id === order.routeId);
          const stepIndex = STEPS.indexOf(order.status as (typeof STEPS)[number]);
          const tracking = order.status === "Confirmado" || order.status === "Em rota";
          return (
            <li
              key={order.id}
              id={`pedido-${order.id}`}
              className={
                "order-card" +
                (order.status === "Cancelado" ? " order-card-bad" : order.status === "Entregue" ? " order-card-ok" : " order-card-live") +
                (fresh === order.id ? " is-fresh" : "")
              }
            >
              <div className="order-card-top">
                <span className={badge(order.status)}>{order.status}</span>
                <span className="hint">{order.date}</span>
              </div>
              <div className="order-main">
                <div>
                  <p className="order-id">Pedido nº {order.id}</p>
                  <p className="hint">{summary(order)}</p>
                </div>
                <p className="order-total">{brl.format(orderTotal(order.items))}</p>
              </div>

              <div className="order-body">
                {tracking ? (
                  <>
                    <ol className="order-steps" aria-label="Andamento do pedido">
                      {STEPS.map((step, i) => (
                        <li
                          key={step}
                          className={i < stepIndex ? "done" : i === stepIndex ? "now" : undefined}
                          aria-current={i === stepIndex ? "step" : undefined}
                        >
                          {step}
                        </li>
                      ))}
                    </ol>
                    {route ? (
                      <div className="order-live">
                        <p>
                          <b>Chega hoje, {route.eta}</b>
                          <span className="hint">
                            {route.truck} · rota {route.id} · {route.region}
                          </span>
                        </p>
                        <Link className="btn" to={`/rotas?rota=${route.id}`} viewTransition>
                          Acompanhar no mapa
                        </Link>
                      </div>
                    ) : (
                      <p className="hint order-live">
                        {order.origin} · {order.slot}
                      </p>
                    )}
                  </>
                ) : (
                  <p className="hint">
                    {order.origin} · {order.status === "Entregue" ? "Entregue em" : "Pedido de"} {order.date}
                  </p>
                )}
              </div>

              <div className="order-foot">
                {order.invoice ? (
                  <Link className="order-invoice" to={`/pagamentos?nota=${order.invoice}`} viewTransition>
                    Nota {order.invoice}
                  </Link>
                ) : (
                  <span className="hint">Sem nota fiscal</span>
                )}
                {!tracking ? (
                  <button type="button" className="btn btn-primary" onClick={() => reorder(order)}>
                    Pedir novamente
                  </button>
                ) : null}
              </div>
            </li>
          );
        })}
      </ul>
    </>
  );
}
