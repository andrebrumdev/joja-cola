import { Navigate, Outlet, useLocation } from "react-router-dom";
import { readSession } from "../lib/auth";

export function RequireAuth() {
  const location = useLocation();
  const session = readSession();
  if (!session) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }
  return <Outlet />;
}
