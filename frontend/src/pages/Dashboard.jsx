import React, { useState, useEffect } from 'react';
import { 
  Container, 
  Row, 
  Col, 
  Card, 
  Button, 
  Image,
  Dropdown,
  Badge,
  Form
} from 'react-bootstrap';
import { 
  FaSignOutAlt, 
  FaBell, 
  FaUserCircle,
  FaShieldAlt,
  FaClipboardList,
  FaCog,
  FaUserCog,
  FaLockOpen
} from 'react-icons/fa';
import { GiRank3, GiCompass, GiSwordWound } from 'react-icons/gi';
import { useAuth } from '../../stores/authStore';
import './Dashboard.css'; // Reuses login page styles

const Dashboard = () => {
  const { user, logout } = useAuth();
  const [profilePic, setProfilePic] = useState(null);
  const [activeMustering, setActiveMustering] = useState(null);
  const [pagination, setPagination] = useState(10);
  const [notifications, setNotifications] = useState([]);

  // Sample mustering data - replace with API calls
  const musterings = [
    { code: 'C2', name: 'Command & Control', personnel: [] },
    { code: 'P', name: 'Pilot', personnel: [] },
    // Add all musterings
  ];

  // Handle profile picture upload
  const handlePicUpload = (e) => {
    const file = e.target.files[0];
    if (file && file.size <= 2 * 1024 * 1024) { // 2MB check
      const reader = new FileReader();
      reader.onload = (event) => {
        setProfilePic(event.target.result);
        // API call to update profile would go here
      };
      reader.readAsDataURL(file);
    } else {
      alert('Maximum file size is 2MB (JPEG/PNG only)');
    }
  };

  // Tier-based dashboard rendering
  const renderTierDashboard = () => {
    switch(user.tier) {
      case 1: // System Admiral
        return (
          <Tier1Dashboard musterings={musterings} />
        );
      case 2: // Mustering Commander
        return (
          <MusteringDashboard 
            musteringCode={user.mustering_code} 
            pagination={pagination}
          />
        );
      case 4: // Support Corporal
        return <Tier4Dashboard />;
      default: // Regular user
        return <UserDashboard user={user} />;
    }
  };

  return (
    <div className="dashboard-container">
      {/* Header - Fixed */}
      <header className="dashboard-header">
        <div className="d-flex align-items-center">
          <img 
            src="/assets/images/saafGold.png" 
            alt="SAAF Logo"
            className="header-logo"
          />
          <h2 className="ms-2 mb-0">STAFFSYNC DASHBOARD</h2>
        </div>
        
        <div className="d-flex align-items-center">
          <Dropdown className="notification-dropdown me-3">
            <Dropdown.Toggle variant="dark">
              <FaBell />
              {notifications.length > 0 && (
                <Badge pill bg="danger" className="notification-badge">
                  {notifications.length}
                </Badge>
              )}
            </Dropdown.Toggle>
            <Dropdown.Menu>
              {notifications.map(n => (
                <Dropdown.Item key={n.id}>{n.message}</Dropdown.Item>
              ))}
            </Dropdown.Menu>
          </Dropdown>
          
          <Button 
            variant="danger" 
            onClick={logout}
            className="logout-btn"
          >
            <FaSignOutAlt className="me-1" /> Sign Out
          </Button>
        </div>
      </header>

      <div className="dashboard-body">
        {/* Sidebar - Collapsible */}
        <nav className="dashboard-sidebar">
          <div className="user-profile-card">
            <div className="profile-pic-container">
              <Image 
                src={profilePic || user.photo || '/assets/images/default-profile.png'} 
                roundedCircle 
                className="profile-pic"
              />
              {user.tier === 0 && ( // Regular users can edit
                <Form.Group controlId="formFile" className="mt-2">
                  <Form.Label className="upload-label">
                    <FaUserCircle className="me-1" /> Update Photo
                  </Form.Label>
                  <Form.Control 
                    type="file" 
                    accept="image/jpeg,image/png" 
                    onChange={handlePicUpload}
                    size="sm"
                  />
                  <Form.Text className="text-white-50">
                    Max 2MB (.jpg/.png)
                  </Form.Text>
                </Form.Group>
              )}
            </div>
            
            <div className="user-info">
              <h5><GiRank3 /> {user.rank}</h5>
              <h4>{user.surname.toUpperCase()}</h4>
              <div className="force-number">{user.force_number}</div>
              <Badge bg={getTierBadgeColor(user.tier)} className="tier-badge">
                {getTierName(user.tier)}
              </Badge>
            </div>
          </div>

          <hr className="sidebar-divider" />

          {/* Tier-Based Navigation */}
          <ul className="sidebar-nav">
            {user.tier <= 3 && (
              <li className="nav-item">
                <a href="#personnel" className="nav-link">
                  <GiCompass className="nav-icon" />
                  Personnel Overview
                </a>
              </li>
            )}
            
            {user.tier === 1 && (
              <li className="nav-item">
                <a href="#system" className="nav-link">
                  <FaCog className="nav-icon" />
                  System Configuration
                </a>
              </li>
            )}

            {user.tier === 4 && (
              <li className="nav-item">
                <a href="#password-reset" className="nav-link">
                  <FaLockOpen className="nav-icon" />
                  Password Assistance
                </a>
              </li>
            )}

            <li className="nav-item">
              <a href="#profile" className="nav-link">
                <FaUserCircle className="nav-icon" />
                My Profile
              </a>
            </li>
          </ul>
        </nav>

        {/* Main Content Area */}
        <main className="dashboard-main">
          <Container fluid>
            {/* Tier-Specific Dashboard */}
            {renderTierDashboard()}

            {/* Mustering Drill-Down (Example for Tier 2) */}
            {user.tier === 2 && (
              <MusteringUnitView 
                mustering={user.mustering_code}
                pagination={pagination}
                onPaginationChange={setPagination}
              />
            )}
          </Container>
        </main>
      </div>
    </div>
  );
};

// Sub-components
const Tier1Dashboard = ({ musterings }) => (
  <Row>
    <Col md={12}>
      <h3 className="dashboard-title">
        <FaShieldAlt className="me-2" /> System Admiral Dashboard
      </h3>
      <MusteringLogoGrid musterings={musterings} />
    </Col>
  </Row>
);

const MusteringLogoGrid = ({ musterings }) => (
  <Row className="logo-grid">
    {musterings.map(mustering => (
      <Col key={mustering.code} xs={6} md={4} lg={3} className="mb-4">
        <Card className="mustering-card">
          <Card.Body className="text-center">
            <img 
              src={`/assets/mustering-logos/${mustering.code}.svg`} 
              alt={mustering.name}
              className="mustering-logo"
            />
            <h5>{mustering.name}</h5>
            <Button 
              variant="outline-light" 
              size="sm"
              onClick={() => setActiveMustering(mustering.code)}
            >
              View Unit
            </Button>
          </Card.Body>
        </Card>
      </Col>
    ))}
  </Row>
);

// Helper functions
const getTierName = (tier) => {
  const tiers = {
    0: 'PERSONNEL',
    1: 'TIER 1 ADMIRAL',
    2: 'TIER 2 COMMANDER',
    3: 'TIER 3 OVERSEER',
    4: 'TIER 4 SUPPORT'
  };
  return tiers[tier] || 'USER';
};

const getTierBadgeColor = (tier) => {
  const colors = {
    0: 'secondary',
    1: 'danger',
    2: 'warning',
    3: 'primary',
    4: 'info'
  };
  return colors[tier] || 'dark';
};

export default Dashboard;