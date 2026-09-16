import { type CSSProperties, useId, useState } from "react";
import { Link } from "react-router-dom";
import { products } from "../data/mock";
import { FLAVORS } from "../lib/flavors";
import { brl, packs } from "../lib/format";
import { cartItems, useAppState } from "../lib/store";

/** Payment term used when the order is placed (see placeOrder in the store). */
const PAYMENT_DAYS = 14;

function dueDate(days: number) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
}

/**
 * Sticky summary of the cart while shopping: the flavor mix at a glance, the totals,
 * and a disclosure with the line-by-line breakdown, payment and delivery.
 */
export function CartBar() {
  const state = useAppState();
  const [open, setOpen] = useState(false);
  const panelId = useId();
  const items = cartItems(state);
  if (items.length === 0) return null;

  const lines = items.map((item) => {
    const product = products.find((p) => p.id === item.productId)!;
    return {
      id: product.id,
      flavor: FLAVORS[product.flavor],
      packs: item.cases,
      cans: item.cases * product.caseSize,
      value: item.cases * product.caseSize * product.price,
    };
  });
  const totalPacks = lines.reduce((sum, line) => sum + line.packs, 0);
  const totalCans = lines.reduce((sum, line) => sum + line.cans, 0);
  const total = lines.reduce((sum, line) => sum + line.value, 0);

  return (
    <section className={"cart-bar" + (open ? " is-open" : "")} aria-label="Resumo do carrinho">
      {/* The order's flavor mix, in proportion to packs; the labels beside it carry the numbers. */}
      <div className="cart-bar-mix" aria-hidden="true">
        {lines.map((line) => (
          <span key={line.id} style={{ flexGrow: line.packs, background: line.flavor.accent }} />
        ))}
      </div>

      <div className="cart-bar-details" id={panelId} inert={!open}>
        <div className="cart-bar-details-inner">
          <table className="cart-bar-table">
            <caption className="visually-hidden">Itens no carrinho</caption>
            <thead>
              <tr>
                <th scope="col">Sabor</th>
                <th scope="col" className="num">Packs</th>
                <th scope="col" className="num">Latas</th>
                <th scope="col" className="num">Valor</th>
              </tr>
            </thead>
            <tbody>
              {lines.map((line) => (
                <tr key={line.id}>
                  <th scope="row">
                    <span className="flavor-dot" style={{ "--flavor": line.flavor.accent } as CSSProperties} aria-hidden="true" />
                    {line.flavor.label}
                  </th>
                  <td className="num">{line.packs}</td>
                  <td className="num">{line.cans}</td>
                  <td className="num">{brl.format(line.value)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <th scope="row">Total</th>
                <td className="num">{totalPacks}</td>
                <td className="num">{totalCans}</td>
                <td className="num">{brl.format(total)}</td>
              </tr>
            </tfoot>
          </table>
          <dl className="cart-bar-terms">
            <div>
              <dt>Pagamento</dt>
              <dd>
                Boleto {PAYMENT_DAYS} dias, vence em {dueDate(PAYMENT_DAYS)}
              </dd>
            </div>
            <div>
              <dt>Entrega</dt>
              <dd>Próxima rota, pela manhã</dd>
            </div>
          </dl>
        </div>
      </div>

      <div className="cart-bar-row">
        <ul className="cart-bar-flavors" aria-label="Sabores no carrinho">
          {lines.map((line) => (
            <li key={line.id}>
              <span className="flavor-dot" style={{ "--flavor": line.flavor.accent } as CSSProperties} aria-hidden="true" />
              {line.flavor.label} <b>{line.packs}</b>
            </li>
          ))}
        </ul>
        <p className="cart-bar-total" aria-live="polite">
          <span>
            {packs(totalPacks)}
            <span className="cart-bar-cans"> · {totalCans} latas</span>
          </span>
          <b>{brl.format(total)}</b>
        </p>
        <button
          type="button"
          className="cart-bar-toggle"
          aria-expanded={open}
          aria-controls={panelId}
          onClick={() => setOpen((v) => !v)}
        >
          <span className="cart-bar-toggle-label">Detalhes</span>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="m6 15 6-6 6 6" />
          </svg>
        </button>
        <Link className="btn btn-primary" to="/carrinho" viewTransition>
          Revisar pedido
        </Link>
      </div>
    </section>
  );
}
