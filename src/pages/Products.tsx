import { useMemo, useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import { PixelCan } from "../components/PixelCan";
import { products } from "../data/mock";
import { DURATION, EASE_OUT, STAGGER } from "../lib/motion";

const brl = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

export function Products() {
  const reduce = useReducedMotion() ?? false;
  const [query, setQuery] = useState("");
  const [qty, setQty] = useState<Record<string, number>>({
    "lata-350": 3,
    "pet-2l": 1,
    "zero-350": 2,
    "gelo-1l": 1,
  });
  const [cart, setCart] = useState(0);
  const [added, setAdded] = useState<string | null>(null);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return products;
    return products.filter((p) =>
      `${p.name} ${p.sku} ${p.pack}`.toLowerCase().includes(q),
    );
  }, [query]);

  function bump(id: string, delta: number) {
    setQty((q) => ({ ...q, [id]: Math.max(1, (q[id] ?? 1) + delta) }));
  }

  function add(id: string) {
    const n = qty[id] ?? 1;
    setCart((c) => c + n);
    setAdded(id);
    window.setTimeout(() => setAdded((cur) => (cur === id ? null : cur)), 1200);
  }

  return (
    <>
      <p className="kicker">Catálogo</p>
      <div className="toolbar">
        <h1>Para você</h1>
        <p className="hint cart-live" aria-live="polite">
          Carrinho · {cart} cx
        </p>
      </div>
      <div className="reco-banner">Recomendações com base no giro da sua loja</div>
      <label className="field catalog-search">
        <span>Buscar SKU</span>
        <input
          id="catalog-q"
          type="search"
          autoComplete="off"
          placeholder="Nome, SKU ou embalagem"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </label>
      {visible.length === 0 ? (
        <div className="card empty-state">
          <p>
            Nenhum SKU para “{query}”.
          </p>
          <button type="button" className="btn" onClick={() => setQuery("")}>
            Limpar busca
          </button>
        </div>
      ) : (
        <motion.div
          className="product-stack"
          initial="hidden"
          animate="show"
          variants={{
            hidden: {},
            show: { transition: { staggerChildren: reduce ? 0 : STAGGER } },
          }}
        >
          {visible.map((p) => {
            const n = qty[p.id] ?? 1;
            const casePrice = p.price * p.caseSize;
            const isAdded = added === p.id;
            return (
              <motion.article
                key={p.id}
                className="card sku-card"
                variants={{
                  hidden: reduce ? { opacity: 1, y: 0 } : { opacity: 0, y: 16 },
                  show: {
                    opacity: 1,
                    y: 0,
                    transition: { duration: DURATION, ease: EASE_OUT },
                  },
                }}
              >
                <PixelCan size={72} />
                <div className="sku-body">
                  <p className="kicker">{p.sku}</p>
                  <h2>{p.name}</h2>
                  <p>
                    {p.pack} · Caixa com {p.caseSize} itens
                  </p>
                  <p className="price">{brl.format(casePrice)}</p>
                  <p className="hint">{brl.format(p.price)} cada</p>
                  <div className="sku-actions">
                    <div className="stepper">
                      <button
                        type="button"
                        onClick={() => bump(p.id, -1)}
                        aria-label={`Diminuir ${p.name}`}
                        disabled={n <= 1}
                      >
                        −
                      </button>
                      <span aria-live="polite">{n}</span>
                      <button
                        type="button"
                        onClick={() => bump(p.id, 1)}
                        aria-label={`Aumentar ${p.name}`}
                      >
                        +
                      </button>
                    </div>
                    <button
                      type="button"
                      className="btn btn-primary"
                      onClick={() => add(p.id)}
                    >
                      {isAdded ? "Adicionado" : "Adicionar"}
                    </button>
                  </div>
                </div>
              </motion.article>
            );
          })}
        </motion.div>
      )}
    </>
  );
}
