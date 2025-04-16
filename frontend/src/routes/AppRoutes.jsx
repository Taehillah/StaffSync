import { Routes, Route } from 'react-router-dom';
import AuthPage from '../pages/AuthPage';
import DashboardPage from '../pages/DashboardPage';
import ProtectedRoute from '../components/auth/ProtectedRoute';

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/auth/*" element={<AuthPage />} />
      <Route element={<ProtectedRoute />}>
        <Route path="/*" element={<DashboardPage />} />
      </Route>
    </Routes>
  );
};

export default AppRoutes;
