import { Routes, Route } from 'react-router-dom';
import LoginForm from '../components/auth/LoginForm';
import RegisterForm from '../components/auth/RegisterForm';
import ForgotPassword from '../components/auth/ForgotPassword';

const AuthPage = () => {
  return (
    <div className="auth-page">
      <Routes>
        <Route path="login" element={<LoginForm />} />
       
        <Route path="register" element={<RegisterForm />} />
        <Route path="*" element={<LoginForm />} />
        <Route path="forgot-password" element={<ForgotPassword />} />
      </Routes>
    </div>
  );
};

export default AuthPage;
