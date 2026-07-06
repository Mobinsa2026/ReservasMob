import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import type { Role } from "../lib/types";

export function ProtectedRoute({ allow }: { allow?: (role: Role) => boolean }) {
  const { user, isAuthenticated } = useAuth();

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  if (allow && !allow(user.role)) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}
