import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { BrandMark } from "./BrandMark";
import { clearSession, readSession } from "../lib/auth";

const links = [
  { to: "/produtos", label: "Produtos" },
  { to: "/pedidos", label: "Pedidos" },
  { to: "/rotas", label: "Rotas" },
  { to: "/pagamentos", label: "Pagamentos" },
];

export function AppShell() {
  const navigate = useNavigate();
  const session = readSession();

  function logout() {
    clearSession();
    navigate("/");
  }

  return (
    <div className="shell">
      <aside className="sidebar">
        <BrandMark />
        <nav className="side-nav" aria-label="Sistema">
          {links.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              className={({ isActive }) => "side-link" + (isActive ? " active" : "")}
            >
              {l.label}
            </NavLink>
          ))}
        </nav>
        <div className="side-foot">
          <span className="hint">{session?.email}</span>
          <button type="button" className="btn btn-ghost" onClick={logout}>
            Sair
          </button>
        </div>
      </aside>
      <main className="main">
        <div className="mobile-bar">
          <BrandMark />
          <button type="button" className="btn btn-ghost" onClick={logout}>
            Sair
          </button>
        </div>
        <Outlet />
      </main>
      <nav className="bottom-nav" aria-label="Sistema móvel">
        {links.map((l) => (
          <NavLink
            key={l.to}
            to={l.to}
            className={({ isActive }) => (isActive ? "active" : undefined)}
          >
            {l.label}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
