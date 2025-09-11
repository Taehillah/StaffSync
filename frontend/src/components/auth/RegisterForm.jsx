import React, { useState } from 'react';
import { useNavigate, Navigate, Link } from 'react-router-dom';
import {
  Form,
  Button,
  Alert,
  Spinner,
  FloatingLabel,
  Row,
  Col,
} from 'react-bootstrap';
import { FaUser, FaIdCard, FaPhone, FaEnvelope, FaBriefcase, FaBuilding, FaClipboardList, FaSignInAlt } from 'react-icons/fa';
import { useAuth } from '../../stores/authStore.js';
import { mockUnits, mockMusterings } from '../../data/mockData';
import wordmark from '../../assets/images/Logo2.png';
import crest from '../../assets/images/saafGold.png';
import {
  validateForceNumber,
  musteringCodes,
} from '../../utils/authPageValidations.js';

// Shared rank options (kept consistent with Dashboard)
const RANK_OPTIONS = [
  'Gen', 'Lt Gen', 'Maj Gen', 'Brig Gen', 'Col', 'Lt Col', 'Maj', 'Capt', 'Lt', '2Lt',
  'SCMWO', 'CMWO', 'MWO', 'WO1', 'WO2', 'FSgt', 'Sgt', 'Cpl', 'LCpl', 'Amn',
  'Mrs', 'Mr', 'Ms'
];

const DEPARTMENT_OPTIONS = ['Army', 'SAAF', 'Navy', 'SAMHS', 'DI'];

const RegisterForm = () => {
  const [formData, setFormData] = useState({
    forceNumber: '',
    rank: '',
    firstName: '',
    surname: '',
    idNumber: '',
    email: '',
    cellphone: '',
    unit: '',
    workTel: '',
    mustering: '',
    department: '',
    position: '',
    securityClearance: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { register, isAuthenticated } = useAuth();

  // If already logged in, go to dashboard
  if (isAuthenticated) return <Navigate to="/dashboard" replace />;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await register(formData);
      navigate('/dashboard', { replace: true });
    } catch (err) {
      setError(err.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const isForceNumberValid = validateForceNumber(formData.forceNumber);

  return (
    <div className="auth-viewport">
      {/* Brand / wordmark on top */}
      <div className="auth-brand">
        <img src={wordmark} alt="StaffSync" className="auth-wordmark" />
      </div>
  
      <div className="register-card">{/* wider + roomy card */}
        {/* Crest + Titles */}
        <div className="text-center mb-3" style={{ gridColumn: '1 / -1' }}>
          <img
            src={crest}
            alt="Crest"
            style={{ height: 44, width: 'auto', filter: 'drop-shadow(0 2px 8px rgba(0,0,0,0.5))' }}
          />
          <h2 className="text-white mt-2 mb-1">Create Account</h2>
          <p className="text-white-50 mb-0">Please fill in all required details</p>
        </div>
  
        {error && (
          <div style={{ gridColumn: '1 / -1' }}>
            <Alert variant="danger">{error}</Alert>
          </div>
        )}
  
        <Form onSubmit={handleSubmit} style={{ gridColumn: '1 / -1' }}>
          {/* Bigger gap between fields */}
          <Row className="g-4">
            {/* Row 1 */}
            <Col md={3}>
              <FloatingLabel controlId="forceNumber"  className="mb-2">
                <Form.Control
                  type="text"
                  name="forceNumber"
                  value={formData.forceNumber}
                  onChange={(e) => {
                    const value = e.target.value.toUpperCase();
                    if (/^\d{0,8}[A-Z]{0,2}$/.test(value)) {
                      setFormData({ ...formData, forceNumber: value });
                    }
                  }}
                  className="auth-input"
                  required
                  isInvalid={formData.forceNumber.length > 0 && !isForceNumberValid}
                />
                <Form.Control.Feedback type="invalid">
                  Force number should be 8 digits followed by MC/MI/PE/PV.
                </Form.Control.Feedback>
                <div className="text-white-50 small mt-1">
                  8 digits + suffix (MC, MI, PE, or PV)
                </div>
              </FloatingLabel>
            </Col>
  
            <Col md={3}>
              <FloatingLabel controlId="surname"  className="mb-2">
                <Form.Control
                  type="text"
                  name="surname"
                  value={formData.surname}
                  onChange={handleChange}
                  required
                  className="auth-input"
                />
                <div className="text-white-50 small mt-1">Family name</div>
              </FloatingLabel>
            </Col>
  
            {/* Row 2 */}
            <Col md={3}>
              <FloatingLabel controlId="cellphone"  className="mb-2">
                <Form.Control
                  type="tel"
                  name="cellphone"
                  value={formData.cellphone}
                  onChange={handleChange}
                  required
                  className="auth-input"
                />
                <div className="text-white-50 small mt-1">Mobile number</div>
              </FloatingLabel>
            </Col>
  
            <Col md={3}>
              <FloatingLabel controlId="rank"  className="mb-2">
                <Form.Select
                  name="rank"
                  value={formData.rank}
                  onChange={handleChange}
                  required
                  className="auth-input"
                >
                  <option value="">Select rank...</option>
                  {RANK_OPTIONS.map(r => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </Form.Select>
                <div className="text-white-50 small mt-1">Current rank</div>
              </FloatingLabel>
            </Col>
  
            {/* Row 3 */}
            <Col md={3}>
              <FloatingLabel controlId="idNumber"  className="mb-2">
                <Form.Control
                  type="text"
                  name="idNumber"
                  value={formData.idNumber}
                  onChange={handleChange}
                  required
                  className="auth-input"
                />
                <div className="text-white-50 small mt-1">Official ID number</div>
              </FloatingLabel>
            </Col>
  
            <Col md={3}>
              <FloatingLabel controlId="unit"  className="mb-2">
                <Form.Select
                  name="unit"
                  value={formData.unit}
                  onChange={handleChange}
                  required
                  className="auth-input"
                >
                  <option value="">Select unit...</option>
                  {(mockUnits || []).map(u => (
                    <option key={u.unit_id} value={u.name}>{u.name}</option>
                  ))}
                </Form.Select>
                <div className="text-white-50 small mt-1">Current unit</div>
              </FloatingLabel>
            </Col>
  
            {/* Row 4 */}
            <Col md={3}>
              <FloatingLabel controlId="firstName"  className="mb-2">
                <Form.Control
                  type="text"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleChange}
                  required
                  className="auth-input"
                />
                <div className="text-white-50 small mt-1">Given name(s)</div>
              </FloatingLabel>
            </Col>
  
            <Col md={3}>
              <FloatingLabel controlId="email"  className="mb-2">
                <Form.Control
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className="auth-input"
                />
                <div className="text-white-50 small mt-1">ICENET email</div>
              </FloatingLabel>
            </Col>
  
            {/* Row 5 */}
            <Col md={3}>
              <FloatingLabel controlId="workTel"  className="mb-2">
                <Form.Control
                  type="tel"
                  name="workTel"
                  value={formData.workTel}
                  onChange={handleChange}
                  required
                  className="auth-input"
                />
                <div className="text-white-50 small mt-1">Office telephone</div>
              </FloatingLabel>
            </Col>
  
            <Col md={3}>
              <FloatingLabel controlId="mustering"  className="mb-2">
                <Form.Select
                  name="mustering"
                  value={formData.mustering}
                  onChange={handleChange}
                  required
                  className="auth-input"
                >
                  <option value="">Select mustering...</option>
                  {(mockMusterings || []).map(m => (
                    <option key={m.code} value={m.code}>{m.code} — {m.name}</option>
                  ))}
                </Form.Select>
                <div className="text-white-50 small mt-1">Mustering information</div>
              </FloatingLabel>
            </Col>
  
            {/* Row 6 */}
            <Col md={3}>
              <FloatingLabel controlId="department" label="Department" className="mb-2">
                <Form.Select
                  name="department"
                  value={formData.department}
                  onChange={handleChange}
                  className="auth-input"
                >
                  <option value="">Select department...</option>
                  {DEPARTMENT_OPTIONS.map(d => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </Form.Select>
                <div className="text-white-50 small mt-1">Department/Section</div>
              </FloatingLabel>
            </Col>
  
            <Col md={3}>
              <FloatingLabel controlId="securityClearance" label="Security Clearance" className="mb-2">
                <Form.Control
                  type="text"
                  name="securityClearance"
                  value={formData.securityClearance}
                  onChange={handleChange}
                  className="auth-input"
                />
                <div className="text-white-50 small mt-1">Clearance level</div>
              </FloatingLabel>
            </Col>
          </Row>
  
          {/* Submit */}
          <div className="d-grid mb-2 mt-4">
            <Button
              type="submit"
              disabled={loading}
              className="btn-auth py-2"
              style={{ fontSize: '1.05rem' }}
            >
              {loading ? (
                <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" />
              ) : (
                <>Register</>
              )}
            </Button>
          </div>
  
          {/* Links */}
          <div className="auth-links">
            <span>
              Already have an account? <Link to="/auth/login">Login here</Link>
            </span>
          </div>
        </Form>
      </div>
  
      <footer className="auth-footer">
        © {new Date().getFullYear()} StaffSync. All rights reserved.
      </footer>
    </div>
  );
};

export default RegisterForm;
