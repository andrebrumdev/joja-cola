import { type CSSProperties, lazy, Suspense, useState } from "react";
import { Link, Navigate, useParams } from "react-router-dom";
import { useReducedMotion } from "motion/react";
import { CartBar } from "../components/CartBar";
import { QtyStepper } from "../components/QtyStepper";
import { products, type Product } from "../data/mock";
import { FLAVORS } from "../lib/flavors";
import { brl, days, packs } from "../lib/format";
import { cart, coverageDays, STOCKOUT_DAYS, suggestedCases } from "../lib/store";

const ProductHero = lazy(() => import("../components/ProductHero").then((m) => ({ default: m.ProductHero })));

export function ProductDetail() {
  const { id } = useParams();
  const product = products.find((p) => p.id === id);
  if (!product) return <Navigate to="/produtos" replace />;
  // Keyed by product: switching flavor starts from that flavor's own suggestion.
  return <ProductView key={product.id} product={product} />;
}

function ProductView({ product }: { product: Product }) {
  const reduce = useReducedMotion() ?? false;
  const flavor = FLAVORS[product.flavor];
  const suggested = suggestedCases(product);
  const [n, setN] = useState(suggested);
  const [added, setAdded] = useState(false);
  const cover = coverageDays(product);
  const risk = cover < STOCKOUT_DAYS;
  const packPrice = product.price * product.caseSize;
  const stillImage = <img className="pixel pd-still" src={flavor.image} alt="" />;

  function add() {
    if (n <= 0) return;
    cart.add(product.id, n);
    setAdded(true);
    window.setTimeout(() => setAdded(false), 1400);
  }

  return (
    <div className="pd" style={{ "--flavor": flavor.accent } as CSSProperties}>
      <Link className="pd-back" to="/produtos" viewTransition>
        <span className="pd-back-icon" aria-hidden="true">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5M11 18l-6-6 6-6" />
          </svg>
        </span>
        Produtos
      </Link>

      <nav className="pd-thumbs" aria-label="Outros sabores">
        {products.map((p) => {
          const current = p.id === product.id;
          return (
            <Link
              key={p.id}
              to={`/produtos/${p.id}`}
              viewTransition
              className={"pd-thumb" + (current ? " is-active" : "")}
              aria-current={current ? "page" : undefined}
              style={{ "--thumb": FLAVORS[p.flavor].accent } as CSSProperties}
            >
              <img className="pixel" src={FLAVORS[p.flavor].image} alt="" />
              <span>{FLAVORS[p.flavor].label}</span>
            </Link>
          );
        })}
      </nav>

      <section className="pd-stage" aria-labelledby="pd-title">
        <div className="pd-visual" aria-hidden="true">
          {reduce ? stillImage : <Suspense fallback={stillImage}><ProductHero flavor={product.flavor} /></Suspense>}
        </div>
        <div className="pd-copy">
          <h1 id="pd-title">{product.name}</h1>
          <p>{product.description}</p>
          {reduce ? null : <p className="pd-hint">Arraste a lata para girar</p>}
        </div>
      </section>

      <aside className="pd-panel" aria-label={`Detalhes de ${product.name}`}>
        <dl className="pd-specs">
          <div>
            <dt>Sabor</dt>
            <dd>{flavor.label}</dd>
          </div>
          <div>
            <dt>Embalagem</dt>
            <dd>{product.pack}</dd>
          </div>
          <div>
            <dt>Pack</dt>
            <dd>{product.caseSize} latas, 2×3 com fita</dd>
          </div>
          <div>
            <dt>SKU</dt>
            <dd>{product.sku}</dd>
          </div>
        </dl>
        <dl className="pd-specs">
          <div>
            <dt>Na sua loja</dt>
            <dd>{packs(product.storeStock)}</dd>
          </div>
          <div>
            <dt>Giro</dt>
            <dd>{packs(product.weeklySales)} por semana</dd>
          </div>
          <div>
            <dt>Estoque dura</dt>
            <dd className={risk ? "is-short" : undefined}>{risk ? `Acaba em ${days(cover)}` : days(cover)}</dd>
          </div>
          <div>
            <dt>Sugerido</dt>
            <dd>{packs(suggested)}</dd>
          </div>
        </dl>
        <dl className="pd-specs">
          <div>
            <dt>Preço</dt>
            <dd>
              {brl.format(packPrice)} o pack
              <small>{brl.format(product.price)} a lata</small>
            </dd>
          </div>
        </dl>
        <div className="pd-buy">
          <QtyStepper value={n} name={product.name} onChange={setN} />
          <p className="pd-subtotal" aria-live="polite">
            {n * product.caseSize} latas
            <b>{brl.format(n * packPrice)}</b>
          </p>
          <button type="button" className="btn btn-primary btn-lg pd-add" onClick={add} disabled={n === 0}>
            {added ? "Adicionado ao pedido" : "Adicionar ao pedido"}
          </button>
        </div>
      </aside>

      <CartBar />
    </div>
  );
}
