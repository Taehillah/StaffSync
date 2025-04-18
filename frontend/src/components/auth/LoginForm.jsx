import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Form, 
  Button, 
  Container, 
  Card, 
  Row, 
  Col, 
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
    <Container fluid className="login-container px-4">
  <Row className="justify-content-center">
    <Col xs={12} sm={10} md={8} lg={6} xl={5}>
      <Card className="auth-card p-4"> 
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
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default LoginForm;