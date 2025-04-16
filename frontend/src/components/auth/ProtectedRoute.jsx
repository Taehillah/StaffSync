import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../stores/authStore';

const ProtectedRoute = () => {
  const { isAuthenticated } = useAuth();
  
  return isAuthenticated ? <Outlet /> : <Navigate to="/auth/login" replace />;
};

export default ProtectedRoute;
