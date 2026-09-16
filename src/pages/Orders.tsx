import { OrderCards } from "../components/OrderCards";
import { orders } from "../data/mock";

export function Orders() {
  const delivered = orders.filter((o) => o.status === "Entregue").length;
  return (
    <>
      <p className="kicker">Varejo</p>
      <div className="toolbar">
        <h1>Pedidos</h1>
      </div>
      <div className="kpi">
        <div className="card">
          <span className="kicker">Entregues</span>
          <b>{delivered}</b>
        </div>
        <div className="card">
          <span className="kicker">Abertos</span>
          <b>0</b>
        </div>
        <div className="card">
          <span className="kicker">Total</span>
          <b>{orders.length}</b>
        </div>
      </div>
      <OrderCards />
    </>
  );
}
