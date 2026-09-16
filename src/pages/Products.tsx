import { type CSSProperties, lazy, Suspense, useState } from "react";
import { Link } from "react-router-dom";
import { motion, useReducedMotion } from "motion/react";
import { CartBar } from "../components/CartBar";
import { InfoTip } from "../components/InfoTip";
import { PixelPack } from "../components/PixelPack";
import { QtyStepper } from "../components/QtyStepper";
import { products } from "../data/mock";
import { FLAVORS } from "../lib/flavors";
import { brl, days, packs } from "../lib/format";
import { DURATION, EASE_OUT, STAGGER } from "../lib/motion";
import { cart, coverageDays, STOCKOUT_DAYS, suggestedCases } from "../lib/store";

// three.js, drei and the can model load in their own chunk, only when the packs actually run in 3D.
const PackCanvas = lazy(() => import("../components/PackStage").then((m) => ({ default: m.PackCanvas })));
const PackView = lazy(() => import("../components/PackStage").then((m) => ({ default: m.PackView })));

/** Every flavor ships the same pack at the same price: say it once, above the grid. */
const PACK = products[0];
const PACK_PRICE = PACK.price * PACK.caseSize;

export function Products() {
  const reduce = useReducedMotion() ?? false;
  const [qty, setQty] = useState<Record<string, number>>(() =>
    Object.fromEntries(products.map((p) => [p.id, suggestedCases(p)])),
  );
  const [added, setAdded] = useState<string | null>(null);

  function add(id: string) {
    const n = qty[id] ?? 0;
    if (n <= 0) return;
    cart.add(id, n);
    setAdded(id);
    window.setTimeout(() => setAdded((cur) => (cur === id ? null : cur)), 1400);
  }

  return (
    <>
      <p className="kicker">Catálogo</p>
      <div className="toolbar">
        <div className="toolbar-title">
          <h1>Para você</h1>
          <InfoTip label="Sobre os packs e as quantidades">
            {/* Two different facts, kept apart: what a pack is, and where the quantities come from. */}
            <dl className="infotip-list">
              <div>
                <dt>Pack</dt>
                <dd>
                  {PACK.caseSize} latas de 350ml, {brl.format(PACK_PRICE)}
                </dd>
              </div>
              <div>
                <dt>Quantidades</dt>
                <dd>Já vêm sugeridas pelo giro da sua loja</dd>
              </div>
            </dl>
          </InfoTip>
        </div>
      </div>

      <motion.div
        className="product-stack"
        initial="hidden"
        animate="show"
        variants={{ hidden: {}, show: { transition: { staggerChildren: reduce ? 0 : STAGGER } } }}
      >
        {products.map((p) => {
          const n = qty[p.id] ?? 0;
          const cover = coverageDays(p);
          const risk = cover < STOCKOUT_DAYS;
          const flavor = FLAVORS[p.flavor];
          const detail = `/produtos/${p.id}`;
          return (
            <motion.article
              key={p.id}
              className="card sku-card"
              style={{ "--flavor": flavor.accent, "--flavor-strong": flavor.palette.strong } as CSSProperties}
              variants={{
                hidden: reduce ? { opacity: 1, y: 0 } : { opacity: 0, y: 16 },
                show: { opacity: 1, y: 0, transition: { duration: DURATION, ease: EASE_OUT } },
              }}
            >
              {/* The stack opens the product too; the name below is the link keyboards and readers use. */}
              <Link className="sku-stage" to={detail} viewTransition tabIndex={-1} aria-hidden="true">
                {reduce ? (
                  <PixelPack flavor={p.flavor} count={n} />
                ) : (
                  <Suspense fallback={<PixelPack flavor={p.flavor} count={n} />}>
                    <PackView className="sku-view" flavor={p.flavor} count={n} />
                  </Suspense>
                )}
              </Link>
              {risk ? <span className="sku-risk">Acaba em {days(cover)}</span> : null}
              <div className="sku-body">
                <h2>
                  <Link to={detail} viewTransition>
                    <span className="flavor-dot" aria-hidden="true" />
                    {p.name}
                  </Link>
                </h2>
                <p className="sku-meta">
                  {packs(n)} · {n * p.caseSize} latas
                  <b>{brl.format(n * p.price * p.caseSize)}</b>
                </p>
                <div className="sku-actions">
                  <QtyStepper value={n} name={p.name} onChange={(next) => setQty((q) => ({ ...q, [p.id]: next }))} />
                  <button type="button" className="btn btn-primary" onClick={() => add(p.id)} disabled={n === 0}>
                    {added === p.id ? "Adicionado" : "Adicionar"}
                  </button>
                </div>
              </div>
            </motion.article>
          );
        })}
      </motion.div>

      {reduce ? null : (
        <Suspense fallback={null}>
          <PackCanvas />
        </Suspense>
      )}

      <CartBar />
    </>
  );
}
