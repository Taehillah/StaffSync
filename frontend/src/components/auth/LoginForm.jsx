import React, { useState } from "react";
import { useNavigate, Navigate, Link } from "react-router-dom";
import { Form, Button, FloatingLabel, Alert, Spinner } from "react-bootstrap";
import { FaLock, FaEnvelope, FaSignInAlt } from "react-icons/fa";
import { useAuth } from "../../stores/authStore";
import crest from "../../assets/images/saafGold.png";
import wordmark from "../../assets/images/Logo2.png"; // optional wordmark


export default function LoginForm() {
  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  if (isAuthenticated) return <Navigate to="/dashboard" replace />;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      await login(email, password);
      navigate("/dashboard", { replace: true });
    } catch (err) {
      setError(err.message || "Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-viewport">
      {/* Brand / wordmark on top */}
      <div className="auth-brand">
        <img src={wordmark} alt="StaffSync" className="auth-wordmark" />
      </div>

      {/* Centered card */}
      <div className="auth-card auth-card--glow auth-card--compact">
        <div className="auth-crest">
          <img src={crest} alt="Crest" />
        </div>
        <h2 className="auth-title">Welcome Back</h2>
        <p className="auth-subtitle">Please enter your credentials to login</p>

        {error && <Alert variant="danger" className="py-2">{error}</Alert>}

        <Form onSubmit={handleSubmit} className="auth-form">
          <FloatingLabel
            controlId="email"
            label="Email address"
             className="mb-4 text-white"
          >
            <Form.Control
              type="email"
              placeholder="Email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="auth-input"
              
            />
            <div className="auth-help">
              <FaEnvelope className="me-1" />
              Enter your registered ICENET email
            </div>
          </FloatingLabel>

          <FloatingLabel
            controlId="password"
            label="Password"
            className="mb-4 text-white"
          >
            <Form.Control
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={12}
              className="auth-input"
            />
            <div className="auth-help">
              <FaLock className="me-1" />
              At least 12 characters
            </div>
          </FloatingLabel>

          <Button
            type="submit"
            className="btn-auth"
            disabled={loading}
          >
            {loading ? (
              <Spinner
                as="span"
                animation="border"
                size="sm"
                role="status"
                aria-hidden="true"
              />
            ) : (
              <>
                <FaSignInAlt className="me-2" />
                Login
              </>
            )}
          </Button>

          <div className="auth-links">
            <span>
              Don’t have an account?{" "}
              <Link to="/auth/register">Register here</Link>
            </span>
            <Link to="/auth/forgot-password" className="link-muted">
              Forgot password?
            </Link>
          </div>
        </Form>
      </div>

      {/* Footer */}
      <footer className="auth-footer">
        © {new Date().getFullYear()} StaffSync. All rights reserved.
      </footer>
    </div>
  );
}
