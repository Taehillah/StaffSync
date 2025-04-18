import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Form, 
  Button, 
  Card, 
  FloatingLabel, 
  Alert,
  Spinner
} from 'react-bootstrap';
import { FaLock, FaEnvelope, FaSignInAlt } from 'react-icons/fa';
import { useAuth } from '../../stores/authStore';
import logo from '../../assets/images/Logo2.png';
import logo2 from '../../assets/images/saafGold.png';

const LoginForm = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    
    <div className="login-container">
      
       {/*Header with Logo */}
       <header className="py-3 px-4 w-100 d-flex align-items-center" style={{ 
        background: 'rgba(0, 0, 0, 0.2)',
        position: 'fixed',
        top: 0,
        zIndex: 1000
      }}>
        <img 
          src={logo} 
          alt="StaffSync Logo" 
          style={{ 
            height: '40px', 
            marginRight: '10px',
            filter: 'brightness(0) invert(1)' // Makes white logo if needed
          }} 
        />
        <h1 className="text-white m-0">StaffSync</h1>
      </header>

      {/* Main Content Centered */}
      <div className="auth-card">
        <div className="text-center mb-4">
        <img 
        src={logo2} 
        alt="StaffSync Logo" 
        style={{ 
          height: '60px',
          marginBottom: '1rem',
          filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))'
        }} 
      />
          <h2 className="text-white">Welcome Back</h2>
          <p className="text-white-50">Please enter your credentials to login</p>
        </div>

        {error && <Alert variant="danger">{error}</Alert>}

        <Form onSubmit={handleSubmit}>
          <FloatingLabel controlId="email" label="Email address" className="mb-3 text-white">
            <Form.Control
              type="email"
              placeholder="name@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="bg-transparent text-white"
            />
            <div className="text-white-50 small mt-1">
              <FaEnvelope className="me-1" />
              Enter your registered email
            </div>
          </FloatingLabel>

          <FloatingLabel controlId="password" label="Password" className="mb-3 text-white">
            <Form.Control
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              className="bg-transparent text-white"
            />
            <div className="text-white-50 small mt-1">
              <FaLock className="me-1" />
              At least 6 characters
            </div>
          </FloatingLabel>

          <div className="d-grid mb-3">
            <Button 
              variant="primary" 
              type="submit"
              disabled={loading}
              className="btn-glass"
            >
              {loading ? (
                <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" />
              ) : (
                <>
                  <FaSignInAlt className="me-2" />
                  Login
                </>
              )}
            </Button>
          </div>

          <div className="text-center">
            <p className="mb-0 text-white-50">
              Don't have an account?{' '}
              <a href="/auth/register" className="text-white">
                Register here
              </a>
            </p>
            <a href="/auth/forgot-password" className="text-white-50 small">
              Forgot password?
            </a>
          </div>
        </Form>
      </div>

      {/* Simple Footer (Optional) */}
      <footer className="py-4 text-center text-white-50 small w-100" style={{
        position: 'fixed',
        bottom: 0,
        background: 'rgba(0, 0, 0, 0.2)'
      }}>
        © {new Date().getFullYear()} StaffSync. All rights reserved.
      </footer>
    </div>
  );
};

export default LoginForm;