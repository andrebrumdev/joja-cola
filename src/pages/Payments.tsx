import { payments } from "../data/mock";

const brl = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

function badge(status: string) {
  if (status === "Pago") return "badge badge-ok";
  if (status === "Atrasado") return "badge badge-bad";
  return "badge badge-warn";
}

export function Payments() {
  const open = payments.filter((p) => p.status !== "Pago").reduce((a, p) => a + p.amount, 0);
  const paid = payments.filter((p) => p.status === "Pago").reduce((a, p) => a + p.amount, 0);
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
          <span className="kicker">Notas</span>
          <b>{payments.length}</b>
        </div>
      </div>
      <div className="card" style={{ padding: 0, overflow: "hidden" }}>
        <table className="table">
          <thead>
            <tr>
              <th>Nota</th>
              <th>Parceiro</th>
              <th>Valor</th>
              <th>Meio</th>
              <th>Vencimento</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {payments.map((p) => (
              <tr key={p.id}>
                <td>
                  <strong>{p.id}</strong>
                </td>
                <td>{p.partner}</td>
                <td>{brl.format(p.amount)}</td>
                <td>{p.method}</td>
                <td>{p.due}</td>
                <td>
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
