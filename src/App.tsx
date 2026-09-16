import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AppShell } from "./components/AppShell";
import { RequireAuth } from "./components/RequireAuth";
import { Landing } from "./pages/Landing";
import { Login } from "./pages/Login";
import { Orders } from "./pages/Orders";
import { Payments } from "./pages/Payments";
import { Products } from "./pages/Products";
import { RoutesPage } from "./pages/Routes";

export function App() {
  return (
    <BrowserRouter basename={import.meta.env.BASE_URL.replace(/\/$/, "") || "/"}>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route element={<RequireAuth />}>
          <Route element={<AppShell />}>
            <Route path="/produtos" element={<Products />} />
            <Route path="/pedidos" element={<Orders />} />
            <Route path="/rotas" element={<RoutesPage />} />
            <Route path="/pagamentos" element={<Payments />} />
          </Route>
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
