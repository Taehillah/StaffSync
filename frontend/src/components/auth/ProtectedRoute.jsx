import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../../stores/authStore";

export default function ProtectedRoute() {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  // While the store is deciding (e.g., reading localStorage), render nothing
  if (isLoading) return null;

  // Not logged in → go to login, remember where you were trying to go
  if (!isAuthenticated) {
    return <Navigate to="/auth/login" replace state={{ from: location }} />;
  }

  // Logged in → render the protected page
  return <Outlet />;
}
