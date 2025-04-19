import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Form, 
  Button, 
  Alert,
  Spinner,
  FloatingLabel,
  Row,
  Col,
  Container
} from 'react-bootstrap';
import { FaUser, FaIdCard, FaPhone, FaEnvelope, FaBriefcase, FaBuilding, FaClipboardList, FaSignInAlt } from 'react-icons/fa';
import { useAuth } from '../../stores/authStore';
import logo from '../../assets/images/Logo2.png';
import logo2 from '../../assets/images/saafGold.png';

const RegisterForm = () => {
  const [formData, setFormData] = useState({
    employeeNumber: '',
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
  const { register } = useAuth();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await register(formData);
      navigate('/dashboard');
    } catch (err) {
      setError(err.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="register-container" style={{ 
      paddingTop: '80px', 
      paddingBottom: '80px',
      minHeight: '100vh'
    }}>
      {/* Header with Logo */}
      <header className="py-3 px-4 w-100 d-flex align-items-center fixed-top" style={{ 
        background: 'rgba(0, 0, 0, 0.2)',
        zIndex: 1000
      }}>
        <img 
          src={logo} 
          alt="StaffSync Logo" 
          style={{ 
            height: '40px', 
            marginRight: '10px',
            filter: 'brightness(0) invert(1)'
          }} 
        />
        <h1 className="text-white m-0">StaffSync</h1>
      </header>

      {/* Main Content with proper spacing */}
      <Container className="py-4">
        <div className="auth-card-wide mx-auto">
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
            <h2 className="text-white">Create Account</h2>
            <p className="text-white-50">Please fill in all required details</p>
          </div>

          {error && <Alert variant="danger">{error}</Alert>}

          <Form onSubmit={handleSubmit}>
            <Row className="g-3">
              {/* Column 1 */}
              <Col lg={4}>
                <FloatingLabel controlId="employeeNumber" label="Employee Number">
                  <Form.Control
                    type="text"
                    name="employeeNumber"
                    placeholder="Employee Number"
                    value={formData.employeeNumber}
                    onChange={handleChange}
                    required
                    className="bg-transparent text-white"
                  />
                  <div className="text-white-50 small mt-1">
                    <FaIdCard className="me-1" />
                    Official employee number
                  </div>
                </FloatingLabel>

                <FloatingLabel controlId="rank" label="Rank" className="mt-3">
                  <Form.Control
                    type="text"
                    name="rank"
                    placeholder="Rank"
                    value={formData.rank}
                    onChange={handleChange}
                    required
                    className="bg-transparent text-white"
                  />
                  <div className="text-white-50 small mt-1">
                    <FaUser className="me-1" />
                    Current rank
                  </div>
                </FloatingLabel>

                <FloatingLabel controlId="firstName" label="First Name(s)" className="mt-3">
                  <Form.Control
                    type="text"
                    name="firstName"
                    placeholder="First Name(s)"
                    value={formData.firstName}
                    onChange={handleChange}
                    required
                    className="bg-transparent text-white"
                  />
                  <div className="text-white-50 small mt-1">
                    <FaUser className="me-1" />
                    Given name(s)
                  </div>
                </FloatingLabel>
              </Col>

              {/* Column 2 */}
              <Col lg={4}>
                <FloatingLabel controlId="surname" label="Surname">
                  <Form.Control
                    type="text"
                    name="surname"
                    placeholder="Surname"
                    value={formData.surname}
                    onChange={handleChange}
                    required
                    className="bg-transparent text-white"
                  />
                  <div className="text-white-50 small mt-1">
                    <FaUser className="me-1" />
                    Family name
                  </div>
                </FloatingLabel>

                <FloatingLabel controlId="idNumber" label="ID Number" className="mt-3">
                  <Form.Control
                    type="text"
                    name="idNumber"
                    placeholder="ID Number"
                    value={formData.idNumber}
                    onChange={handleChange}
                    required
                    className="bg-transparent text-white"
                  />
                  <div className="text-white-50 small mt-1">
                    <FaIdCard className="me-1" />
                    Official ID number
                  </div>
                </FloatingLabel>

                <FloatingLabel controlId="email" label="Email" className="mt-3">
                  <Form.Control
                    type="email"
                    name="email"
                    placeholder="Email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    className="bg-transparent text-white"
                  />
                  <div className="text-white-50 small mt-1">
                    <FaEnvelope className="me-1" />
                    ICENET email
                  </div>
                </FloatingLabel>
              </Col>

              {/* Column 3 */}
              <Col lg={4}>
                <FloatingLabel controlId="cellphone" label="Cellphone">
                  <Form.Control
                    type="tel"
                    name="cellphone"
                    placeholder="Cellphone"
                    value={formData.cellphone}
                    onChange={handleChange}
                    required
                    className="bg-transparent text-white"
                  />
                  <div className="text-white-50 small mt-1">
                    <FaPhone className="me-1" />
                    Mobile number
                  </div>
                </FloatingLabel>

                <FloatingLabel controlId="unit" label="Unit" className="mt-3">
                  <Form.Control
                    type="text"
                    name="unit"
                    placeholder="Unit"
                    value={formData.unit}
                    onChange={handleChange}
                    required
                    className="bg-transparent text-white"
                  />
                  <div className="text-white-50 small mt-1">
                    <FaBuilding className="me-1" />
                    Current unit
                  </div>
                </FloatingLabel>

                <FloatingLabel controlId="workTel" label="Work Telephone" className="mt-3">
                  <Form.Control
                    type="tel"
                    name="workTel"
                    placeholder="Work Telephone"
                    value={formData.workTel}
                    onChange={handleChange}
                    required
                    className="bg-transparent text-white"
                  />
                  <div className="text-white-50 small mt-1">
                    <FaPhone className="me-1" />
                    Office telephone
                  </div>
                </FloatingLabel>
              </Col>
            </Row>

            {/* Additional fields in a new row */}
            <Row className="g-3 mt-2">
              <Col lg={4}>
                <FloatingLabel controlId="mustering" label="Mustering">
                  <Form.Control
                    type="text"
                    name="mustering"
                    placeholder="Mustering"
                    value={formData.mustering}
                    onChange={handleChange}
                    required
                    className="bg-transparent text-white"
                  />
                  <div className="text-white-50 small mt-1">
                    <FaClipboardList className="me-1" />
                    Mustering information
                  </div>
                </FloatingLabel>
              </Col>
              <Col lg={4}>
                <FloatingLabel controlId="department" label="Department">
                  <Form.Control
                    type="text"
                    name="department"
                    placeholder="Department"
                    value={formData.department}
                    onChange={handleChange}
                    className="bg-transparent text-white"
                  />
                  <div className="text-white-50 small mt-1">
                    <FaBriefcase className="me-1" />
                    Department/Section
                  </div>
                </FloatingLabel>
              </Col>
              <Col lg={4}>
                <FloatingLabel controlId="securityClearance" label="Security Clearance">
                  <Form.Control
                    type="text"
                    name="securityClearance"
                    placeholder="Security Clearance"
                    value={formData.securityClearance}
                    onChange={handleChange}
                    className="bg-transparent text-white"
                  />
                  <div className="text-white-50 small mt-1">
                    <FaIdCard className="me-1" />
                    Clearance level
                  </div>
                </FloatingLabel>
              </Col>
            </Row>

            <div className="d-grid mb-3 mt-4">
              <Button 
                variant="primary" 
                type="submit"
                disabled={loading}
                className="btn-glass py-2"
                style={{ fontSize: '1.1rem' }}
              >
                {loading ? (
                  <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" />
                ) : (
                  <>
                    <FaSignInAlt className="me-2" />
                    Register
                  </>
                )}
              </Button>
            </div>

            <div className="text-center">
              <p className="mb-0 text-white-50">
                Already have an account?{' '}
                <a href="/auth/login" className="text-white">
                  Login here
                </a>
              </p>
            </div>
          </Form>
        </div>
      </Container>

      {/* Footer with proper spacing */}
      <footer className="py-4 text-center text-white-50 small w-100 fixed-bottom" style={{
        background: 'rgba(0, 0, 0, 0.2)'
      }}>
        © {new Date().getFullYear()} StaffSync. All rights reserved.
      </footer>
    </div>
  );
};

export default RegisterForm;