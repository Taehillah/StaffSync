// src/App.js
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import AdminRoute from './routes/AdminRoute';
import AuditLogViewer from './components/admin/AuditLogViewer';
import LoginForm from './components/auth/LoginForm'; // Make sure this exists

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LoginForm />} />
        <Route 
          path="/admin/audit-logs" 
          element={
            <AdminRoute requiredTier={3}>
              <AuditLogViewer />
            </AdminRoute>
          } 
        />
      </Routes>
    </Router>
  );
}

export default App;