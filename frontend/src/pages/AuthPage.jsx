import { Routes, Route } from 'react-router-dom';
import LoginForm from '../components/auth/LoginForm';
import RegisterForm from '../components/auth/RegisterForm';

const AuthPage = () => {
  return (
    <div className="auth-page">
      <Routes>
        <Route path="login" element={<LoginForm />} />
        <Route path="register" element={<RegisterForm />} />
        <Route path="*" element={<LoginForm />} />
      </Routes>
    </div>
  );
};

export default AuthPage;
