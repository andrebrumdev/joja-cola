import { useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { allPayments, useAppState } from "../lib/store";

const brl = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

function badge(status: string) {
  if (status === "Pago") return "badge badge-ok";
  if (status === "Atrasado") return "badge badge-bad";
  return "badge badge-warn";
}

export function Payments() {
  const state = useAppState();
  const [params] = useSearchParams();
  const focus = params.get("nota");
  const payments = allPayments(state);
  const open = payments.filter((p) => p.status !== "Pago").reduce((a, p) => a + p.amount, 0);
  const paid = payments.filter((p) => p.status === "Pago").reduce((a, p) => a + p.amount, 0);
  const late = payments.filter((p) => p.status === "Atrasado").length;

  useEffect(() => {
    if (focus) document.getElementById(`nota-${focus}`)?.scrollIntoView({ block: "center" });
  }, [focus]);

  return (
    <>
      <p className="kicker">Checkout · varejo</p>
      <div className="toolbar">
        <h1>Pagamentos</h1>
      </div>
      <div className="kpi">
        <div className="card">
          <span className="kicker">Recebido</span>
          <b>{brl.format(paid)}</b>
        </div>
        <div className="card">
          <span className="kicker">Em aberto</span>
          <b>{brl.format(open)}</b>
        </div>
        <div className="card">
          <span className="kicker">Atrasadas</span>
          <b>{late}</b>
        </div>
      </div>
      <div className="card route-table-card">
        <table className="table pay-table">
          <caption className="visually-hidden">Notas fiscais e pagamentos</caption>
          <thead>
            <tr>
              <th scope="col">Nota</th>
              <th scope="col">Pedido</th>
              <th scope="col" className="num">Valor</th>
              <th scope="col">Meio</th>
              <th scope="col">Vencimento</th>
              <th scope="col">Status</th>
            </tr>
          </thead>
          <tbody>
            {payments.map((p) => (
              <tr key={p.id} id={`nota-${p.id}`} className={focus === p.id ? "row-active" : undefined}>
                <td className="route-id">
                  <strong>{p.id}</strong>
                </td>
                <td data-label="Pedido">
                  {p.orderId ? <Link to={`/pedidos?pedido=${p.orderId}`} viewTransition>nº {p.orderId}</Link> : "—"}
                </td>
                <td data-label="Valor" className="num">
                  {brl.format(p.amount)}
                </td>
                <td data-label="Meio">{p.method}</td>
                <td data-label="Vencimento">{p.due}</td>
                <td className="route-status">
                  <span className={badge(p.status)}>{p.status}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
