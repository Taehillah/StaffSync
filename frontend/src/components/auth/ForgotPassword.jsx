import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  Form, 
  Button, 
  Alert,
  Spinner,
  FloatingLabel,
  Modal
} from 'react-bootstrap';
import { FaEnvelope, FaIdCard, FaMobileAlt, FaLock, FaCheckCircle } from 'react-icons/fa';
import logo from '../../assets/images/Logo2.png';
import logo2 from '../../assets/images/saafGold.png';

const ForgotPassword = () => {
  const [step, setStep] = useState(1); // 1: Verify identity, 2: OTP verification, 3: New password
  const [formData, setFormData] = useState({
    email: '',
    idNumber: '',
    otp: '',
    newPassword: '',
    confirmPassword: '',
    otpDestination: 'email' // 'email' or 'cellphone'
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [showOTPMethodModal, setShowOTPMethodModal] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const validateICENETEmail = (email) => {
    return email.endsWith('@dod.gov.za') || email.endsWith('@saaf.gov.za');
  };

  const handleSendOTP = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Validate ICENET email
    if (!validateICENETEmail(formData.email)) {
      setError('Please use your official ICENET or SAAF email address');
      setLoading(false);
      return;
    }

    // Simulate API call
    try {
      // In a real app, you would call your backend here
      await new Promise(resolve => setTimeout(resolve, 1500));
      setShowOTPMethodModal(true);
    } catch (err) {
      setError(err.message || 'Failed to send OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmOTPMethod = (method) => {
    setFormData(prev => ({ ...prev, otpDestination: method }));
    setShowOTPMethodModal(false);
    setLoading(true);
    
    // Simulate OTP sending
    setTimeout(() => {
      setLoading(false);
      setStep(2);
      setSuccess(`OTP sent to your ${method === 'email' ? 'email' : 'cellphone'}`);
    }, 1500);
  };

  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Simulate OTP verification
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // In a real app, verify OTP with backend
      if (formData.otp.length !== 6) {
        throw new Error('OTP must be 6 digits');
      }
      
      setStep(3);
      setSuccess('OTP verified successfully');
    } catch (err) {
      setError(err.message || 'Invalid OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Validate passwords
    if (formData.newPassword.length < 12) {
      setError('Password must be at least 12 characters');
      setLoading(false);
      return;
    }

    if (formData.newPassword !== formData.confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    // Simulate password reset
    try {
      await new Promise(resolve => setTimeout(resolve, 1500));
      setSuccess('Password reset successfully! Redirecting to login...');
      setTimeout(() => navigate('/auth/login'), 2000);
    } catch (err) {
      setError(err.message || 'Password reset failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-viewport">
      {/* Brand bar like Login */}
      <div className="auth-brand">
        <img src={logo} alt="StaffSync" className="auth-wordmark" />
      </div>

      {/* Card */}
      <div className="auth-card auth-card--glow auth-card--compact mx-auto">
        <div className="text-center mb-3">
          <img
            src={logo2}
            alt="Crest"
            style={{ height: '44px', width: 'auto', filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.35))' }}
          />
          <h2 className="text-white mt-2">
            {step === 1 ? 'Reset Password' : step === 2 ? 'Verify OTP' : 'New Password'}
          </h2>
          <p className="text-white-50 mb-0">
            {step === 1
              ? 'Enter your ICENET email and ID number'
              : step === 2
              ? 'Enter the OTP sent to you'
              : 'Create a new password (min 12 characters)'}
          </p>
        </div>

        {error && <Alert variant="danger">{error}</Alert>}
        {success && <Alert variant="success">{success}</Alert>}

        {/* Step 1: Verify Identity */}
        {step === 1 && (
          <Form onSubmit={handleSendOTP}>
            <FloatingLabel controlId="email" label="ICENET Email" className="mb-3">
              <Form.Control
                type="email"
                name="email"
                placeholder="ICENET Email"
                value={formData.email}
                onChange={handleChange}
                required
                className="auth-input"
              />
              <div className="text-white-50 small mt-1">Your official ICENET email</div>
            </FloatingLabel>

            <FloatingLabel controlId="idNumber" label="ID Number" className="mb-3">
              <Form.Control
                type="text"
                name="idNumber"
                placeholder="ID Number"
                value={formData.idNumber}
                onChange={handleChange}
                required
                className="auth-input"
              />
              <div className="text-white-50 small mt-1">Your official ID number</div>
            </FloatingLabel>

            <div className="d-grid mb-2">
              <Button variant="primary" type="submit" disabled={loading} className="btn-auth">
                {loading ? (
                  <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" />
                ) : (
                  <>Continue</>
                )}
              </Button>
            </div>

            <div className="auth-links text-center">
              <Link to="/auth/login">Remember your password? Login here</Link>
            </div>
          </Form>
        )}

        {/* Step 2: OTP Verification */}
        {step === 2 && (
          <Form onSubmit={handleVerifyOTP}>
            <FloatingLabel controlId="otp" label="OTP Code" className="mb-3">
              <Form.Control
                type="text"
                name="otp"
                placeholder="Enter 6-digit OTP"
                value={formData.otp}
                onChange={handleChange}
                required
                maxLength={6}
                className="auth-input"
              />
              <div className="text-white-50 small mt-1">
                Sent to your {formData.otpDestination === 'email' ? 'email' : 'cellphone'}
              </div>
            </FloatingLabel>

            <div className="d-grid gap-2">
              <Button variant="primary" type="submit" disabled={loading} className="btn-auth">
                {loading ? (
                  <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" />
                ) : (
                  <>Verify OTP</>
                )}
              </Button>
              <Button variant="outline-light" onClick={() => setStep(1)} className="mt-1">
                Back
              </Button>
            </div>
          </Form>
        )}

        {/* Step 3: New Password */}
        {step === 3 && (
          <Form onSubmit={handleResetPassword}>
            <FloatingLabel controlId="newPassword" label="New Password" className="mb-3">
              <Form.Control
                type="password"
                name="newPassword"
                placeholder="New Password"
                value={formData.newPassword}
                onChange={handleChange}
                required
                minLength={12}
                className="auth-input"
              />
              <div className="text-white-50 small mt-1">Minimum 12 characters</div>
            </FloatingLabel>

            <FloatingLabel controlId="confirmPassword" label="Confirm Password" className="mb-3">
              <Form.Control
                type="password"
                name="confirmPassword"
                placeholder="Confirm Password"
                value={formData.confirmPassword}
                onChange={handleChange}
                required
                minLength={12}
                className="auth-input"
              />
              <div className="text-white-50 small mt-1">Must match new password</div>
            </FloatingLabel>

            <div className="d-grid gap-2">
              <Button variant="primary" type="submit" disabled={loading} className="btn-auth">
                {loading ? (
                  <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" />
                ) : (
                  <>Reset Password</>
                )}
              </Button>
              <Button variant="outline-light" onClick={() => setStep(2)} className="mt-1">
                Back
              </Button>
            </div>
          </Form>
        )}
      </div>

      {/* OTP Method Selection Modal */}
      <Modal
        show={showOTPMethodModal}
        onHide={() => setShowOTPMethodModal(false)}
        centered
        backdrop="static"
      >
        <Modal.Header closeButton className="bg-dark text-white">
          <Modal.Title>Send OTP To</Modal.Title>
        </Modal.Header>
        <Modal.Body className="bg-dark text-white">
          <div className="d-grid gap-3">
            <Button
              variant="outline-light"
              size="lg"
              onClick={() => handleConfirmOTPMethod('email')}
              className="py-3"
            >
              Send to ICENET Email
            </Button>
            <Button
              variant="outline-light"
              size="lg"
              onClick={() => handleConfirmOTPMethod('cellphone')}
              className="py-3"
            >
              Send to Registered Cellphone
            </Button>
          </div>
        </Modal.Body>
      </Modal>

      {/* Footer */}
      <footer className="auth-footer">
        © {new Date().getFullYear()} StaffSync. All rights reserved.
      </footer>
    </div>
  );
};

export default ForgotPassword;
