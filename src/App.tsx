import { createBrowserRouter, Navigate, Outlet, RouterProvider, ScrollRestoration } from "react-router-dom";
import { AppShell } from "./components/AppShell";
import { RequireAuth } from "./components/RequireAuth";
import { Cart } from "./pages/Cart";
import { Landing } from "./pages/Landing";
import { Login } from "./pages/Login";
import { Marketing } from "./pages/Marketing";
import { Orders } from "./pages/Orders";
import { Payments } from "./pages/Payments";
import { Production } from "./pages/Production";
import { ProductDetail } from "./pages/ProductDetail";
import { Products } from "./pages/Products";
import { RoutesPage } from "./pages/Routes";

// Data router: `viewTransition` on links and navigate() only works in this mode.
function Root() {
  return (
    <>
      <Outlet />
      {/* New screens open at the top; back/forward restore where the visitor was. A fresh page load
          has the key "default" on every URL, so those are told apart by path. */}
      <ScrollRestoration getKey={(location) => (location.key === "default" ? location.pathname : location.key)} />
    </>
  );
}

const router = createBrowserRouter(
  [
    {
      element: <Root />,
      children: [
        { path: "/", element: <Landing /> },
        { path: "/login", element: <Login /> },
        {
          element: <RequireAuth />,
          children: [
            {
              element: <AppShell />,
              children: [
                { path: "/rotas", element: <RoutesPage /> },
                { path: "/producao", element: <Production /> },
                { path: "/marketing", element: <Marketing /> },
                { path: "/produtos", element: <Products /> },
                { path: "/produtos/:id", element: <ProductDetail /> },
                { path: "/carrinho", element: <Cart /> },
                { path: "/pedidos", element: <Orders /> },
                { path: "/pagamentos", element: <Payments /> },
              ],
            },
          ],
        },
        { path: "*", element: <Navigate to="/" replace /> },
      ],
    },
  ],
  { basename: import.meta.env.BASE_URL.replace(/\/$/, "") || "/" },
);

export function App() {
  return <RouterProvider router={router} />;
}
