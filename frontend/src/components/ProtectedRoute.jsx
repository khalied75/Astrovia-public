import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/auth-context";

export default function ProtectedRoute({ children, adminOnly = false }) {
  const { user, isAdmin, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="grid min-h-[60vh]  place-items-center font-mono text-xs text-neutral-400">
        CHECKING ORBIT...
      </div>
    );
  }
  if (!user)
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  if (adminOnly && !isAdmin) return <Navigate to="/" replace />;
  return children;
}
