import type { ReactNode } from "react";
import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";
import { BrandMark } from "./BrandMark";
import { clearSession, readSession } from "../lib/auth";
import { payments, routes } from "../data/mock";

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
  produtos: (
    <Icon>
      <path d="M21 8 12 3 3 8v8l9 5 9-5V8Z" />
      <path d="m3 8 9 5 9-5" />
      <path d="M12 13v8" />
    </Icon>
  ),
  pedidos: (
    <Icon>
      <path d="M6 3h12v18l-3-2-3 2-3-2-3 2V3Z" />
      <path d="M9 8h6M9 12h6M9 16h3" />
    </Icon>
  ),
  rotas: (
    <Icon>
      <circle cx="6" cy="19" r="2" />
      <circle cx="18" cy="5" r="2" />
      <path d="M8 19h7.5a3.5 3.5 0 0 0 0-7h-7a3.5 3.5 0 0 1 0-7H16" />
    </Icon>
  ),
  pagamentos: (
    <Icon>
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="M3 10h18M7 15h3" />
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
};

const late = payments.filter((p) => p.status === "Atrasado").length;
const onRoute = routes.filter((r) => r.status === "Em rota").length;

type NavItem = {
  to: string;
  label: string;
  icon: ReactNode;
  /** Something is moving right now: a quiet live dot. */
  live?: string;
  /** Something needs action: a count. */
  alert?: { count: number; label: string };
};

const links: NavItem[] = [
  { to: "/produtos", label: "Produtos", icon: icons.produtos },
  { to: "/pedidos", label: "Pedidos", icon: icons.pedidos },
  {
    to: "/rotas",
    label: "Rotas",
    icon: icons.rotas,
    live: onRoute > 0 ? `${onRoute} ${onRoute === 1 ? "caminhão em rota" : "caminhões em rota"}` : undefined,
  },
  {
    to: "/pagamentos",
    label: "Pagamentos",
    icon: icons.pagamentos,
    alert:
      late > 0
        ? { count: late, label: `${late} ${late === 1 ? "pagamento atrasado" : "pagamentos atrasados"}` }
        : undefined,
  },
];

function Signal({ item }: { item: NavItem }) {
  if (item.alert) {
    return (
      <span className="nav-count">
        <span aria-hidden="true">{item.alert.count}</span>
        <span className="visually-hidden">, {item.alert.label}</span>
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
  const email = readSession()?.email ?? "";
  const [user, domain] = email.split("@");

  function logout() {
    clearSession();
    navigate("/");
  }

  return (
    <div className="shell">
      <aside className="sidebar">
        <Link className="side-brand" to="/produtos" aria-label="Joja Cola, início do sistema">
          <BrandMark />
        </Link>
        <nav className="side-nav" aria-label="Sistema">
          {links.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => "side-link" + (isActive ? " active" : "")}
            >
              {item.icon}
              <span>{item.label}</span>
              <Signal item={item} />
            </NavLink>
          ))}
        </nav>
        <div className="side-foot">
          <Link className="side-link" to="/">
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
        {links.map((item) => (
          <NavLink key={item.to} to={item.to} className={({ isActive }) => (isActive ? "active" : undefined)}>
            {item.icon}
            <span>{item.label}</span>
            <Signal item={item} />
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
