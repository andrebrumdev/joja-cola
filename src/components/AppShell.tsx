import { useEffect, useRef, type ReactNode } from "react";
import { Link, NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { BrandMark } from "./BrandMark";
import { clearSession, readSession } from "../lib/auth";
import { routes } from "../data/mock";
import { allPayments, cartCases, useAppState } from "../lib/store";

function Icon({ children }: { children: ReactNode }) {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {children}
    </svg>
  );
}

const icons = {
  rotas: (
    <Icon>
      <circle cx="6" cy="19" r="2" />
      <circle cx="18" cy="5" r="2" />
      <path d="M8 19h7.5a3.5 3.5 0 0 0 0-7h-7a3.5 3.5 0 0 1 0-7H16" />
    </Icon>
  ),
  producao: (
    <Icon>
      <path d="M3 21V10l6 4V10l6 4V4h6v17H3Z" />
      <path d="M7 17h2M12 17h2M17 17h1" />
    </Icon>
  ),
  marketing: (
    <Icon>
      <path d="M3 11v2a1 1 0 0 0 1 1h3l6 5V5L7 10H4a1 1 0 0 0-1 1Z" />
      <path d="M17 9a4 4 0 0 1 0 6M19.5 6.5a8 8 0 0 1 0 11" />
    </Icon>
  ),
  produtos: (
    <Icon>
      <path d="M21 8 12 3 3 8v8l9 5 9-5V8Z" />
      <path d="m3 8 9 5 9-5" />
      <path d="M12 13v8" />
    </Icon>
  ),
  carrinho: (
    <Icon>
      <circle cx="9" cy="20" r="1.5" />
      <circle cx="17" cy="20" r="1.5" />
      <path d="M3 4h2l2.4 11.2a1 1 0 0 0 1 .8h8.9a1 1 0 0 0 1-.8L20 8H6" />
    </Icon>
  ),
  pedidos: (
    <Icon>
      <path d="M6 3h12v18l-3-2-3 2-3-2-3 2V3Z" />
      <path d="M9 8h6M9 12h6M9 16h3" />
    </Icon>
  ),
  pagamentos: (
    <Icon>
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="M3 10h18M7 15h3" />
    </Icon>
  ),
  mais: (
    <Icon>
      <rect x="4" y="4" width="6" height="6" rx="1.5" />
      <rect x="14" y="4" width="6" height="6" rx="1.5" />
      <rect x="4" y="14" width="6" height="6" rx="1.5" />
      <rect x="14" y="14" width="6" height="6" rx="1.5" />
    </Icon>
  ),
  site: (
    <Icon>
      <path d="M7 17 17 7M9 7h8v8" />
    </Icon>
  ),
  sair: (
    <Icon>
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <path d="m16 17 5-5-5-5M21 12H9" />
    </Icon>
  ),
  fechar: (
    <Icon>
      <path d="M18 6 6 18M6 6l12 12" />
    </Icon>
  ),
};

const onRoute = routes.filter((r) => r.status === "Em rota").length;

type NavItem = {
  to: string;
  label: string;
  icon: ReactNode;
  /** Something is moving right now: a quiet live dot. */
  live?: string;
  /** Something needs action: a count. */
  alert?: { count: number; label: string };
  /** Neutral tally (cart size): not an alarm. */
  tally?: { count: number; label: string };
};

const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

function useNav() {
  const state = useAppState();
  const late = allPayments(state).filter((p) => p.status === "Atrasado").length;
  const inCart = cartCases(state);

  const rotas: NavItem = {
    to: "/rotas",
    label: "Rotas",
    icon: icons.rotas,
    live: onRoute > 0 ? plural(onRoute, "caminhão em rota", "caminhões em rota") : undefined,
  };
  const producao: NavItem = { to: "/producao", label: "Produção", icon: icons.producao, live: "linha envasando" };
  const marketing: NavItem = { to: "/marketing", label: "Marketing", icon: icons.marketing };
  const produtos: NavItem = { to: "/produtos", label: "Produtos", icon: icons.produtos };
  const carrinho: NavItem = {
    to: "/carrinho",
    label: "Carrinho",
    icon: icons.carrinho,
    tally: inCart > 0 ? { count: inCart, label: plural(inCart, "pack no carrinho", "packs no carrinho") } : undefined,
  };
  const pedidos: NavItem = { to: "/pedidos", label: "Pedidos", icon: icons.pedidos };
  const pagamentos: NavItem = {
    to: "/pagamentos",
    label: "Pagamentos",
    icon: icons.pagamentos,
    alert: late > 0 ? { count: late, label: plural(late, "pagamento atrasado", "pagamentos atrasados") } : undefined,
  };

  return {
    groups: [
      { label: "Operação", items: [rotas, producao, marketing] },
      { label: "Comercial", items: [produtos, carrinho, pedidos, pagamentos] },
    ],
    // Phone: the four daily destinations stay one tap away; the rest live under "Mais".
    bottom: [rotas, produtos, pedidos, pagamentos],
    more: [producao, marketing, carrinho],
    inCart,
  };
}

function Signal({ item }: { item: NavItem }) {
  if (item.alert) {
    return (
      <span className="nav-count">
        <span aria-hidden="true">{item.alert.count}</span>
        <span className="visually-hidden">, {item.alert.label}</span>
      </span>
    );
  }
  if (item.tally) {
    return (
      <span className="nav-count nav-tally">
        <span aria-hidden="true">{item.tally.count}</span>
        <span className="visually-hidden">, {item.tally.label}</span>
      </span>
    );
  }
  if (item.live) {
    return (
      <span className="nav-live">
        <span className="visually-hidden">, {item.live}</span>
      </span>
    );
  }
  return null;
}

export function AppShell() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { groups, bottom, more, inCart } = useNav();
  const sheet = useRef<HTMLDialogElement>(null);
  const email = readSession()?.email ?? "";
  const [user, domain] = email.split("@");
  const moreActive = more.some((item) => pathname.startsWith(item.to));

  useEffect(() => {
    sheet.current?.close();
  }, [pathname]);

  function logout() {
    clearSession();
    navigate("/", { viewTransition: true });
  }

  return (
    <div className="shell">
      <aside className="sidebar">
        <Link className="side-brand" to="/rotas" viewTransition aria-label="Joja Cola, início do sistema">
          <BrandMark />
        </Link>
        <nav className="side-nav" aria-label="Sistema">
          {groups.map((group) => (
            <div key={group.label} className="side-group" role="group" aria-labelledby={`nav-${group.label}`}>
              <p className="side-group-label" id={`nav-${group.label}`}>
                {group.label}
              </p>
              {group.items.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  viewTransition
                  className={({ isActive }) => "side-link" + (isActive ? " active" : "")}
                >
                  <span className="side-pill" aria-hidden="true" />
                  {item.icon}
                  <span>{item.label}</span>
                  <Signal item={item} />
                </NavLink>
              ))}
            </div>
          ))}
        </nav>
        <div className="side-foot">
          <Link className="side-link" to="/" viewTransition>
            <span className="side-pill" aria-hidden="true" />
            {icons.site}
            <span>Ver site</span>
          </Link>
          <div className="side-account">
            <span className="side-avatar" aria-hidden="true">
              {email.charAt(0).toUpperCase()}
            </span>
            <span className="side-who" title={email}>
              <span className="side-email">{user}</span>
              <span className="side-role">{domain ? `@${domain}` : "Sessão ativa"}</span>
            </span>
            <button type="button" className="side-exit" onClick={logout} aria-label="Sair do sistema">
              {icons.sair}
            </button>
          </div>
        </div>
      </aside>
      <main className="main">
        <div className="mobile-bar">
          <BrandMark />
          <button type="button" className="side-exit side-exit-labeled" onClick={logout}>
            {icons.sair}
            <span>Sair</span>
          </button>
        </div>
        <Outlet />
      </main>
      <nav className="bottom-nav" aria-label="Sistema móvel">
        {bottom.map((item) => (
          <NavLink key={item.to} to={item.to} viewTransition className={({ isActive }) => (isActive ? "active" : undefined)}>
            <span className="side-pill" aria-hidden="true" />
            {item.icon}
            <span>{item.label}</span>
            <Signal item={item} />
          </NavLink>
        ))}
        <button
          type="button"
          className={moreActive ? "active" : undefined}
          aria-haspopup="dialog"
          onClick={() => sheet.current?.showModal()}
        >
          <span className="side-pill" aria-hidden="true" />
          {icons.mais}
          <span>Mais</span>
          {inCart > 0 ? (
            <Signal item={{ to: "", label: "", icon: null, tally: { count: inCart, label: plural(inCart, "pack no carrinho", "packs no carrinho") } }} />
          ) : null}
        </button>
      </nav>
      <dialog
        ref={sheet}
        className="more-sheet"
        aria-labelledby="more-title"
        onClick={(e) => {
          // A tap on the backdrop lands on the dialog element itself.
          if (e.target === e.currentTarget) e.currentTarget.close();
        }}
      >
        <div className="more-sheet-inner">
          <div className="more-sheet-head">
            <p id="more-title">Mais</p>
            <button type="button" className="side-exit" onClick={() => sheet.current?.close()} aria-label="Fechar">
              {icons.fechar}
            </button>
          </div>
          <nav aria-label="Mais áreas do sistema">
            {more.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                viewTransition
                // Close first, so the transition captures the page and not the open sheet.
                onClick={() => sheet.current?.close()}
                className={({ isActive }) => "side-link" + (isActive ? " active" : "")}
              >
                <span className="side-pill" aria-hidden="true" />
                {item.icon}
                <span>{item.label}</span>
                <Signal item={item} />
              </NavLink>
            ))}
            <Link className="side-link" to="/" viewTransition onClick={() => sheet.current?.close()}>
              <span className="side-pill" aria-hidden="true" />
              {icons.site}
              <span>Ver site</span>
            </Link>
          </nav>
        </div>
      </dialog>
    </div>
  );
}
