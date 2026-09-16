import { type CSSProperties, useEffect, useRef, useState } from "react";
import { flushSync } from "react-dom";
import { Link, useNavigate } from "react-router-dom";
import { EmptyBoxArt } from "../components/EmptyBoxArt";
import { PixelCan } from "../components/PixelCan";
import { StepIcon } from "../components/StepIcon";
import { orderTotal, products, type Product } from "../data/mock";
import { FLAVORS } from "../lib/flavors";
import {
  allOrders,
  cart,
  cartItems,
  coverageDays,
  placeOrder,
  STOCKOUT_DAYS,
  suggestedCases,
  useAppState,
} from "../lib/store";

const brl = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
const int = (n: number) => n.toLocaleString("pt-BR");
const plural = (n: number, one: string, many: string) => `${int(n)} ${n === 1 ? one : many}`;

/** Days the store's shelf lasts at its own sales pace once this line arrives. */
const coverAfter = (p: Product, cases: number) => Math.round(((p.storeStock + cases) / p.weeklySales) * 7);

function dueDate(days: number) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
}

/** Days until the shelf runs out today, as the catalog alert words it. */
const daysLeft = (p: Product) => Math.max(1, Math.round(coverageDays(p)));

/** Filling the cart from its empty state swaps the whole screen: let it cross over like a navigation. */
function asTransition(update: () => void) {
  if (!document.startViewTransition) return update();
  document.startViewTransition(() => flushSync(update));
}

type Removed = { productId: string; cases: number; name: string };

export function Cart() {
  const state = useAppState();
  const navigate = useNavigate();
  const [removed, setRemoved] = useState<Removed | null>(null);
  const [filled, setFilled] = useState(false);
  const linesRef = useRef<HTMLUListElement>(null);
  const items = cartItems(state);
  const total = orderTotal(items);
  const cases = items.reduce((sum, item) => sum + item.cases, 0);
  const units = items.reduce(
    (sum, item) => sum + item.cases * (products.find((p) => p.id === item.productId)?.caseSize ?? 0),
    0,
  );
  const lastOrder = allOrders(state).find((o) => o.status !== "Cancelado");
  const atRisk = products.filter((p) => coverageDays(p) < STOCKOUT_DAYS);
  const suggestionTotal = orderTotal(atRisk.map((p) => ({ productId: p.id, cases: suggestedCases(p) })));

  // The button that filled the cart is gone after the swap; keyboard focus continues on the new lines.
  useEffect(() => {
    if (filled && items.length > 0) {
      linesRef.current?.focus();
      setFilled(false);
    }
  }, [filled, items.length]);

  function start(fill: () => void) {
    asTransition(() => {
      fill();
      setFilled(true);
    });
  }

  // The undo offer is short-lived: it answers the tap, it is not a history.
  useEffect(() => {
    if (!removed) return;
    const id = window.setTimeout(() => setRemoved(null), 6000);
    return () => window.clearTimeout(id);
  }, [removed]);

  function remove(p: Product, current: number) {
    cart.set(p.id, 0);
    setRemoved({ productId: p.id, cases: current, name: p.name });
  }

  function undo() {
    if (!removed) return;
    cart.set(removed.productId, removed.cases);
    setRemoved(null);
  }

  function finish() {
    const order = placeOrder();
    if (order) navigate(`/pedidos?novo=${order.id}`, { viewTransition: true });
  }

  const undoBar = removed ? (
    <p className="cart-undo" role="status">
      <span>{removed.name} saiu do carrinho.</span>
      <button type="button" className="link-action" onClick={undo}>
        Desfazer
      </button>
    </p>
  ) : null;

  return (
    <>
      <p className="kicker">Pedido</p>
      <div className="toolbar">
        <h1>Carrinho</h1>
        {items.length > 0 ? (
          <p className="hint cart-count">
            {plural(cases, "pack", "packs")} · {plural(items.length, "sabor", "sabores")}
          </p>
        ) : null}
      </div>

      {items.length === 0 ? (
        <>
          {undoBar}
          {/* Empty state first: what this page is for and the one next step. */}
          <section className="cart-empty-state" aria-labelledby="cart-empty-title">
            <EmptyBoxArt className="cart-empty-art" />
            <h2 id="cart-empty-title">Seu carrinho está vazio</h2>
            <p>Os packs que você escolher aparecem aqui, com o valor final do pedido.</p>
            <Link className="btn btn-primary btn-lg cart-empty-cta" to="/produtos" viewTransition>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.25" strokeLinecap="round" aria-hidden="true">
                <path d="M12 5v14M5 12h14" />
              </svg>
              Escolher produtos
            </Link>
          </section>

          {/* Then the shortcuts: suggestions built from the store's own sales and last order. */}
          <section className="cart-suggestions" aria-labelledby="cart-suggestions-title">
            <h2 id="cart-suggestions-title">Sugestões de compra</h2>
            {atRisk.length > 0 || lastOrder ? (
              <div className="card cart-options">
                {atRisk.length > 0 ? (
                  <section className="cart-option" aria-labelledby="cart-option-risk">
                    <h3 id="cart-option-risk">Repor o que pode faltar</h3>
                    <ul className="cart-option-items">
                      {atRisk.map((p) => (
                        <li key={p.id}>
                          <span className="cart-option-name">
                            {p.name}
                            <small className="is-short">Acaba em ~{plural(daysLeft(p), "dia", "dias")}</small>
                          </span>
                          <span className="cart-option-qty">{plural(suggestedCases(p), "pack", "packs")}</span>
                        </li>
                      ))}
                    </ul>
                    <p className="cart-option-total">
                      <span>Quantidade sugerida pelo giro da loja</span>
                      <b>{brl.format(suggestionTotal)}</b>
                    </p>
                    <button
                      type="button"
                      className="btn btn-primary"
                      onClick={() => start(() => atRisk.forEach((p) => cart.add(p.id, suggestedCases(p))))}
                    >
                      Adicionar sugestão
                    </button>
                  </section>
                ) : null}

                {lastOrder ? (
                  <section className="cart-option" aria-labelledby="cart-option-last">
                    <h3 id="cart-option-last">Repetir a última compra</h3>
                    <ul className="cart-option-items">
                      {lastOrder.items.map((item) => {
                        const product = products.find((p) => p.id === item.productId);
                        return (
                          <li key={item.productId}>
                            <span className="cart-option-name">
                              {product?.name ?? item.productId}
                              <small>{product?.pack}</small>
                            </span>
                            <span className="cart-option-qty">{plural(item.cases, "pack", "packs")}</span>
                          </li>
                        );
                      })}
                    </ul>
                    <p className="cart-option-total">
                      <span>
                        Pedido nº {lastOrder.id} · {lastOrder.date}
                      </span>
                      <b>{brl.format(orderTotal(lastOrder.items))}</b>
                    </p>
                    <button type="button" className="btn" onClick={() => start(() => cart.reorder(lastOrder))}>
                      Repetir pedido
                    </button>
                  </section>
                ) : null}
              </div>
            ) : null}

            <section className="cart-flavors" aria-labelledby="cart-flavors-title">
              <div className="cart-flavors-head">
                <h3 id="cart-flavors-title">Por sabor</h3>
                <Link className="cart-start-link" to="/produtos" viewTransition>
                  Ver catálogo
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M5 12h14M13 6l6 6-6 6" />
                  </svg>
                </Link>
              </div>
              <ul className="cart-flavor-list">
                {products.map((p) => {
                  const flavor = FLAVORS[p.flavor];
                  const suggested = suggestedCases(p);
                  const risk = coverageDays(p) < STOCKOUT_DAYS;
                  return (
                    <li key={p.id} className="cart-flavor" style={{ "--flavor": flavor.accent } as CSSProperties}>
                      <img className="pixel" src={flavor.image} alt="" />
                      <p className="cart-flavor-name">
                        <span className="cart-flavor-brand">Joja Cola </span>
                        {flavor.label}
                      </p>
                      <p className="cart-flavor-meta">
                        <span className={risk ? "is-short" : undefined}>
                          {risk ? `Acaba em ~${plural(daysLeft(p), "dia", "dias")}` : "Estoque em dia"}
                        </span>
                        <span className="cart-flavor-value">
                          {brl.format(orderTotal([{ productId: p.id, cases: suggested }]))}
                        </span>
                      </p>
                      <button
                        type="button"
                        className="btn"
                        aria-label={`Adicionar ${plural(suggested, "pack", "packs")} de ${p.name}`}
                        onClick={() => start(() => cart.add(p.id, suggested))}
                      >
                        Adicionar {plural(suggested, "pack", "packs")}
                      </button>
                    </li>
                  );
                })}
              </ul>
            </section>
          </section>
        </>
      ) : (
        <div className="cart-layout">
          <div className="cart-main">
            {undoBar}
            <ul className="card cart-lines" aria-label="Itens do pedido" ref={linesRef} tabIndex={-1}>
              {items.map((item) => {
                const product = products.find((p) => p.id === item.productId)!;
                const casePrice = product.price * product.caseSize;
                const suggested = suggestedCases(product);
                const days = coverAfter(product, item.cases);
                return (
                  <li key={item.productId} className="cart-line">
                    <PixelCan size={48} flavor={product.flavor} />
                    <div className="cart-line-info">
                      <h2>{product.name}</h2>
                      <p className="hint">
                        {product.pack} · pack com {product.caseSize} · {brl.format(casePrice)} o pack
                      </p>
                      <p className={"cart-cover" + (days < STOCKOUT_DAYS * 2 ? " is-short" : "")}>
                        Estoque na loja para ~{plural(days, "dia", "dias")}
                        {item.cases < suggested ? (
                          <button type="button" className="link-action" onClick={() => cart.set(product.id, suggested)}>
                            Usar sugestão ({plural(suggested, "pack", "packs")})
                          </button>
                        ) : null}
                      </p>
                    </div>
                    <div className="stepper" role="group" aria-label={`Caixas de ${product.name}`}>
                      <button
                        type="button"
                        onClick={() =>
                          item.cases > 1 ? cart.set(product.id, item.cases - 1) : remove(product, item.cases)
                        }
                        aria-label={item.cases > 1 ? `Diminuir ${product.name}` : `Remover ${product.name}`}
                      >
                        <StepIcon type="minus" />
                      </button>
                      <span aria-live="polite">{item.cases}</span>
                      <button
                        type="button"
                        onClick={() => cart.set(product.id, item.cases + 1)}
                        aria-label={`Aumentar ${product.name}`}
                      >
                        <StepIcon type="plus" />
                      </button>
                    </div>
                    <div className="cart-line-end">
                      <p className="cart-line-total">{brl.format(casePrice * item.cases)}</p>
                      <button type="button" className="link-danger" onClick={() => remove(product, item.cases)}>
                        Remover
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
            <Link className="cart-back" to="/produtos" viewTransition>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M19 12H5M11 18l-6-6 6-6" />
              </svg>
              Continuar comprando
            </Link>
          </div>

          <aside className="card cart-summary" aria-labelledby="cart-summary-title">
            <h2 id="cart-summary-title">Resumo</h2>
            <dl>
              <div>
                <dt>Itens</dt>
                <dd>
                  {plural(cases, "pack", "packs")}
                  <small>{plural(units, "lata", "latas")}</small>
                </dd>
              </div>
              <div>
                <dt>Pagamento</dt>
                <dd>
                  Boleto 14 dias
                  <small>vence em {dueDate(14)}</small>
                </dd>
              </div>
              <div>
                <dt>Entrega</dt>
                <dd>
                  Próxima rota
                  <small>pela manhã</small>
                </dd>
              </div>
              <div className="cart-total">
                <dt>Valor final</dt>
                <dd>{brl.format(total)}</dd>
              </div>
            </dl>
            <button type="button" className="btn btn-primary btn-lg cart-finish" onClick={finish}>
              Finalizar pedido
            </button>
            <p className="hint">A nota fiscal sai na hora e fica em Pagamentos.</p>
          </aside>

          {/* Phone: the total and the action stay in reach above the bottom navigation. */}
          <div className="cart-dock" role="region" aria-label="Finalizar pedido">
            <p>
              <span className="hint">Valor final</span>
              <b>{brl.format(total)}</b>
            </p>
            <button type="button" className="btn btn-primary" onClick={finish}>
              Finalizar pedido
            </button>
          </div>
        </div>
      )}
    </>
  );
}
