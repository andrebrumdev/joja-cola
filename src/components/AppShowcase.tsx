import type { ReactNode } from "react";
import { orders, products } from "../data/mock";
import can from "../assets/can.png";

const brl = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

function StatusBar() {
  return (
    <div className="ps-status">
      <span>9:41</span>
      <span className="ps-island" />
      <span className="ps-status-icons">
        <svg viewBox="0 0 18 12" width="17" height="11">
          <path d="M1 11h2.4V8H1zm4.2 0h2.4V6H5.2zm4.2 0h2.4V3.5H9.4zm4.2 0H16V1h-2.4z" fill="currentColor" />
        </svg>
        <svg viewBox="0 0 27 12" width="25" height="11">
          <rect x="0.5" y="0.5" width="22" height="11" rx="3.2" fill="none" stroke="currentColor" opacity="0.45" />
          <rect x="2.2" y="2.2" width="16.5" height="7.6" rx="1.8" fill="currentColor" />
          <rect x="24" y="4" width="2" height="4" rx="1" fill="currentColor" opacity="0.45" />
        </svg>
      </span>
    </div>
  );
}

export function PhoneFrame({ children }: { children: ReactNode }) {
  return (
    <div className="ps-phone" aria-hidden="true">
      <div className="ps-screen">
        <StatusBar />
        {children}
      </div>
    </div>
  );
}

// The 3D can sits in [data-can-anchor="sistema"] and jumps out of the phone
// from there; without the 3D scene the pixel can fills the slot instead.
export function TrackingScreen({ flatCan }: { flatCan: boolean }) {
  const recent = orders.filter((o) => o.status === "Entregue").slice(0, 2);
  return (
    <div className="ps-app">
      <header className="ps-head">
        <div>
          <p className="ps-eyebrow">Supermercado Vale</p>
          <p className="ps-title">Pedidos</p>
        </div>
        <span className="ps-avatar">SV</span>
      </header>

      <div className="ps-live">
        <div className="ps-live-can" data-can-anchor="sistema">
          {flatCan && <img className="pixel" src={can} alt="" />}
        </div>
        <div className="ps-live-info">
          <span className="ps-pill">
            <i />
            Em rota
          </span>
          <strong>Pedido nº 100000000004</strong>
          <span className="ps-muted">12 caixas · Lata 350ml</span>
          <span className="ps-eta">Chega hoje, 10:40</span>
        </div>
        <ol className="ps-steps">
          <li className="done">Fábrica</li>
          <li className="now">Em rota</li>
          <li>Entregue</li>
        </ol>
      </div>

      <p className="ps-section">Recentes</p>
      <ul className="ps-list">
        {recent.map((o) => (
          <li key={o.id}>
            <img className="pixel" src={can} alt="" />
            <div>
              <strong>{brl.format(o.total)}</strong>
              <span>
                {o.origin} · {o.date}
              </span>
            </div>
            <span className="ps-ok">Entregue</span>
          </li>
        ))}
      </ul>

      <span className="ps-cta">Pedir novamente</span>
    </div>
  );
}

// The can lands in the featured card's slot and jumps out again toward the close.
export function ShopScreen({ flatCan }: { flatCan: boolean }) {
  const [featured, family] = products;
  return (
    <div className="ps-app">
      <div className="ps-search">
        <svg viewBox="0 0 16 16" width="14" height="14">
          <circle cx="7" cy="7" r="5" fill="none" stroke="currentColor" strokeWidth="1.8" />
          <path d="m11 11 3.5 3.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
        Encontrar na Joja
      </div>
      <div className="ps-chips">
        <span className="on">Para você</span>
        <span>Zero</span>
        <span>Gelo</span>
        <span>Família</span>
      </div>

      <div className="ps-feature">
        <div>
          <span className="ps-tag">Mais pedido na sua região</span>
          <strong>{featured.name}</strong>
          <span className="ps-muted">
            {featured.pack} · Caixa {featured.caseSize}
          </span>
          <b>{brl.format(featured.price * featured.caseSize)}</b>
        </div>
        <div className="ps-feature-can" data-can-anchor="varejo">
          {flatCan && <img className="pixel" src={can} alt="" />}
        </div>
      </div>

      <div className="ps-sku">
        <img className="pixel" src={can} alt="" />
        <div>
          <strong>{family.name}</strong>
          <span>
            {family.pack} · Caixa {family.caseSize}
          </span>
          <b>{brl.format(family.price * family.caseSize)}</b>
        </div>
        <span className="ps-stepper">
          <i>−</i>1<i>+</i>
        </span>
      </div>

      <span className="ps-cta">Adicionar ao pedido · 3 itens</span>
    </div>
  );
}
