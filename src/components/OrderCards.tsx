import { orders } from "../data/mock";

const brl = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

export function OrderCards({ limit }: { limit?: number }) {
  const list = limit ? orders.slice(0, limit) : orders;
  return (
    <ul className="order-list">
      {list.map((o) => (
        <li
          key={o.id}
          className={
            "order-card" + (o.status === "Cancelado" ? " order-card-bad" : " order-card-ok")
          }
        >
          <div className="order-card-top">
            <span
              className={o.status === "Cancelado" ? "badge badge-bad" : "badge badge-ok"}
            >
              {o.status === "Cancelado" ? "×" : "✓"} {o.status}
            </span>
            <span className="muted">›</span>
          </div>
          <p>
            Pedido nº {o.id}
            <br />
            Valor total {brl.format(o.total)}
          </p>
          <p className="hint">
            Origem {o.origin}
            <br />
            Previsão {o.date} · {o.slot}
          </p>
          {o.status !== "Cancelado" ? (
            <button type="button" className="btn btn-primary order-again">
              Pedir novamente
            </button>
          ) : null}
        </li>
      ))}
    </ul>
  );
}
