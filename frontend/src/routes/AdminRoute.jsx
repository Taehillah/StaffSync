import { Navigate } from 'react-router-dom';

const AdminRoute = ({ children, requiredTier }) => {
  // To replace with my actual auth state management
  const user = JSON.parse(localStorage.getItem('user')); 
  
  if (!user || user.tier > requiredTier) {
    return <Navigate to="/unauthorized" />;
  }

  return children;
};

export default AdminRoute; // Fixed export