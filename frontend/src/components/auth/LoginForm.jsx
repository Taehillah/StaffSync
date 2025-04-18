import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Form, 
  Button, 
  Container, 
  Card, 
  FloatingLabel, 
  Alert,
  Spinner
} from 'react-bootstrap';
import { FaLock, FaEnvelope, FaSignInAlt } from 'react-icons/fa';
import { useAuth } from '../../stores/authStore';

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
    <div className="login-hero" style={{
      minHeight: '100vh',
      background: `linear-gradient(rgba(10, 25, 47, 0.85), rgba(23, 42, 69, 0.9)),
                  url('https://images.unsplash.com/photo-1497366754035-f200968a6e72?ixlib=rb-1.2.1&auto=format&fit=crop&w=1920&q=80') no-repeat center center`,
      backgroundSize: 'cover',
      display: 'flex',
      flexDirection: 'column'
    }}>
      {/* Simple Header (Optional) */}
      <header className="py-3 px-4" style={{ background: 'rgba(0, 0, 0, 0.2)' }}>
        <h1 className="text-white m-0">StaffSync</h1>
      </header>

      {/* Main Content Centered */}
      <div className="d-flex flex-grow-1 align-items-center justify-content-center p-4">
        <Card className="p-4" style={{ width: '100%', maxWidth: '500px' }}>
          <Card.Body>
            <div className="text-center mb-4">
              <FaLock size={40} className="text-primary mb-3" />
              <h2>Welcome Back</h2>
              <p className="text-muted">Please enter your credentials to login</p>
            </div>

            {error && <Alert variant="danger">{error}</Alert>}

            <Form onSubmit={handleSubmit}>
            <FloatingLabel controlId="email" label="Email address" className="mb-3">
              <Form.Control
                type="email"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              <div className="text-muted small mt-1">
                <FaEnvelope className="me-1" />
                Enter your registered email
              </div>
            </FloatingLabel>

            <FloatingLabel controlId="password" label="Password" className="mb-3">
              <Form.Control
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
              />
              <div className="text-muted small mt-1">
                <FaLock className="me-1" />
                At least 6 characters
              </div>
            </FloatingLabel>

            <div className="d-grid mb-3">
              <Button 
                variant="primary" 
                type="submit"
                disabled={loading}
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
              <p className="mb-0">
                Don't have an account?{' '}
                <a href="/auth/register" className="text-decoration-none">
                  Register here
                </a>
              </p>
              <a href="/auth/forgot-password" className="text-decoration-none small">
                Forgot password?
              </a>
            </div>
            </Form>

<div className="text-center mt-4">
  <div className="d-flex justify-content-center gap-3">
    <a href="/auth/register" className="text-decoration-none small">
      Create Account
    </a>
    <span className="text-muted">|</span>
    <a href="/auth/forgot-password" className="text-decoration-none small">
      Forgot Password?
    </a>
  </div>
</div>
</Card.Body>
</Card>
</div>

{/* Simple Footer (Optional) */}
<footer className="py-4 text-center text-white-50 small">
© {new Date().getFullYear()} StaffSync. All rights reserved.
</footer>
</div>
);
};

export default LoginForm;