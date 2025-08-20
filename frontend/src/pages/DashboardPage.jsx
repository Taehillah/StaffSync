import React, { useState, useMemo } from 'react';
import { 
  Button, 
  Image,
  Form,
  Table,
  InputGroup,
  FormControl,
  Badge
} from 'react-bootstrap';
import { 
  FaSignOutAlt, 
  FaBell, 
  FaUserCircle,
  FaClipboardList,
  FaUsers,
  FaMapMarkedAlt,
  FaTasks,
  FaBolt,
  FaSearch,
  FaFilter,
  FaFileExport,
  FaServer
} from 'react-icons/fa';
import { 
  mockMembers,
  mockMusterings,
  mockUnits,
  mockBases,
  mockCombatReadiness
} from '../data/mockData';
import defaultProfile from '../assets/images/default-profile.png';
import { GiRank3, GiCompass, GiSwordWound } from 'react-icons/gi';
import { useAuth } from '../stores/authStore';
import '../assets/css/Dashboard.css';

// Helper functions
const getTierName = (tier) => {
  const tiers = {
    1: 'TIER 1 SYS_ADMIN',
    2: 'TIER 2 COMMANDER',
    3: 'TIER 3 DIRECTORATE',
    4: 'TIER 4 LANA'
  };
  return tiers[tier] || 'USER';
};

const getTierBadgeColor = (tier) => {
  const colors = {
    1: 'danger',
    2: 'warning',
    3: 'primary',
    4: 'info'
  };
  return colors[tier] || 'dark';
};

// Component Definitions
const RecentActivities = () => (
  <div className="glass-card">
    <h4><FaClipboardList className="me-2" />Recent Activities</h4>
    <p className="text-muted">No recent activities</p>
  </div>
);

const QuickActionsPanel = ({ onFilterChange }) => {
  const [showFilters, setShowFilters] = useState(false);
  const [selectedFilters, setSelectedFilters] = useState({
    mustering: [],
    rank: [],
    readiness: []
  });

  const filterOptions = {
    mustering: ['P', 'C2', 'SS'],
    rank: ['General', 'Major', 'Captain', 'Corporal'],
    readiness: ['Ready', 'Not Ready', 'Pending']
  };

  const handleFilterToggle = (type, value) => {
    setSelectedFilters(prev => ({
      ...prev,
      [type]: prev[type].includes(value) 
        ? prev[type].filter(item => item !== value)
        : [...prev[type], value]
    }));
  };

  const applyFilters = () => {
    onFilterChange(selectedFilters);
    setShowFilters(false);
  };

  const resetFilters = () => {
    const emptyFilters = {
      mustering: [],
      rank: [],
      readiness: []
    };
    setSelectedFilters(emptyFilters);
    onFilterChange(emptyFilters);
  };

  return (
    <div className="glass-card quick-actions-panel">
      <h4><FaBolt className="me-2" />Quick Actions</h4>
      
      <div className="d-grid gap-2 mb-3">
        <Button 
          variant="outline-light" 
          size="sm"
          onClick={() => setShowFilters(!showFilters)}
        >
          <FaFilter className="me-1" /> {showFilters ? 'Hide Filters' : 'Show Filters'}
        </Button>
        <Button variant="outline-light" size="sm">
          <FaFileExport className="me-1" /> Export
        </Button>
      </div>

      {showFilters && (
        <div className="filter-section">
          {Object.entries(filterOptions).map(([filterType, options]) => (
            <div key={filterType} className="filter-group">
              <div className="filter-title">
                {filterType.charAt(0).toUpperCase() + filterType.slice(1)}
              </div>
              <div className="filter-options">
                {options.map(option => (
                  <Form.Check
                    key={option}
                    type="checkbox"
                    id={`${filterType}-${option}`}
                    label={option}
                    checked={selectedFilters[filterType].includes(option)}
                    onChange={() => handleFilterToggle(filterType, option)}
                    className="filter-checkbox"
                  />
                ))}
              </div>
            </div>
          ))}

          <div className="d-flex justify-content-between mt-3">
            <Button variant="outline-secondary" size="sm" onClick={resetFilters}>
              Reset
            </Button>
            <Button variant="primary" size="sm" onClick={applyFilters}>
              Apply
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

const SidebarNavigation = () => (
  <ul className="sidebar-nav glass-card">
    <li className="nav-item">
      <a href="#personnel" className="nav-link">
        <GiCompass className="nav-icon" /> Personnel Overview
      </a>
    </li>
    <li className="nav-item">
      <a href="#mustering" className="nav-link">
        <FaClipboardList className="nav-icon" /> Mustering
      </a>
    </li>
    <li className="nav-item">
      <a href="#bases" className="nav-link">
        <FaMapMarkedAlt className="nav-icon" /> Bases
      </a>
    </li>
    <li className="nav-item">
      <a href="#units" className="nav-link">
        <FaUsers className="nav-icon" /> Units
      </a>
    </li>
    <li className="nav-item">
      <a href="#profile" className="nav-link">
        <FaUserCircle className="nav-icon" /> My Profile
      </a>
    </li>
  </ul>
);

const PersonnelOverview = ({ activeFilters }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [sortConfig, setSortConfig] = useState({ 
    key: 'surname', 
    direction: 'asc' 
  });
  
  const itemsPerPage = 5;

  const processedData = useMemo(() => mockMembers.map(member => {
    const mustering = mockMusterings.find(m => m.code === member.mustering_code);
    const unit = mockUnits.find(u => u.unit_id === member.unit_id);
    const base = mockBases.find(b => b.base_id === (unit?.base_id || null));
    const readiness = mockCombatReadiness.find(r => r.member_id === member.member_id);

    return {
      ...member,
      musteringName: mustering?.name || 'N/A',
      unitName: unit?.name || 'N/A',
      baseName: base?.name || 'N/A',
      readinessStatus: readiness?.overall_status || 'Unknown'
    };
  }), []);

  const filteredData = useMemo(() => {
    let result = [...processedData];
    
    if (activeFilters.mustering.length > 0) {
      result = result.filter(person => 
        activeFilters.mustering.includes(person.mustering_code)
      );
    }
    
    if (activeFilters.rank.length > 0) {
      result = result.filter(person => 
        activeFilters.rank.includes(person.rank)
      );
    }
    
    if (activeFilters.readiness.length > 0) {
      result = result.filter(person => 
        activeFilters.readiness.includes(person.readinessStatus)
      );
    }
    
    if (searchTerm) {
      result = result.filter(person => 
        person.force_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
        person.surname.toLowerCase().includes(searchTerm.toLowerCase()) ||
        person.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        person.musteringName.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    return result;
  }, [processedData, searchTerm, activeFilters]);

  const sortedData = useMemo(() => {
    let sortableData = [...filteredData];
    if (sortConfig.key) {
      sortableData.sort((a, b) => {
        if (a[sortConfig.key] < b[sortConfig.key]) {
          return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (a[sortConfig.key] > b[sortConfig.key]) {
          return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
      });
    }
    return sortableData;
  }, [filteredData, sortConfig]);

  const totalPages = Math.ceil(sortedData.length / itemsPerPage);
  const paginatedData = sortedData.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const requestSort = (key) => {
    setSortConfig({
      key,
      direction: sortConfig.key === key && sortConfig.direction === 'asc' 
        ? 'desc' 
        : 'asc'
    });
  };

  return (
    <div className="glass-card">
      <h4><FaUsers className="me-2" />Personnel Overview</h4>
      
      <div className="mb-3">
        <InputGroup>
          <FormControl
            placeholder="Search personnel..."
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
          />
          <Button variant="outline-secondary">
            <FaSearch />
          </Button>
        </InputGroup>
      </div>

      <div className="table-responsive mt-3">
        <Table hover className="table-dark">
          <thead>
            <tr>
              <th onClick={() => requestSort('force_number')}>Force #</th>
              <th onClick={() => requestSort('rank')}>Rank</th>
              <th onClick={() => requestSort('surname')}>Name</th>
              <th onClick={() => requestSort('musteringName')}>Mustering</th>
              <th onClick={() => requestSort('unitName')}>Unit</th>
              <th onClick={() => requestSort('baseName')}>Base</th>
              <th>Readiness</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {paginatedData.map((person) => (
              <tr key={person.member_id}>
                <td>{person.force_number}</td>
                <td>{person.rank}</td>
                <td>{person.surname}, {person.first_name}</td>
                <td>{person.musteringName}</td>
                <td>{person.unitName}</td>
                <td>{person.baseName}</td>
                <td>
                  <Badge 
                    bg={person.readinessStatus === 'Ready' ? 'success' : 'danger'}
                    className="text-uppercase"
                  >
                    {person.readinessStatus}
                  </Badge>
                </td>
                <td>
                  <Button variant="outline-light" size="sm">
                    <FaUserCircle /> View
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      </div>
      
      <div className="d-flex justify-content-between align-items-center mt-3">
        <div className="text-muted">
          Showing {paginatedData.length} of {filteredData.length} records
        </div>
        
        <div>
          <Button 
            variant="outline-light" 
            size="sm" 
            disabled={currentPage === 1}
            onClick={() => setCurrentPage(p => p - 1)}
            className="me-2"
          >
            Previous
          </Button>
          
          <span className="mx-2">
            Page {currentPage} of {totalPages}
          </span>
          
          <Button 
            variant="outline-light" 
            size="sm" 
            disabled={currentPage === totalPages}
            onClick={() => setCurrentPage(p => p + 1)}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
};

const NotificationsPanel = () => (
  <div className="glass-card">
    <h4><FaBell className="me-2" />Notifications</h4>
    <p className="text-muted">No new notifications</p>
  </div>
);

const SystemStatusPanel = () => (
  <div className="glass-card">
    <h4><FaServer className="me-2" />System Status</h4>
    <div className="system-status">
      <div className="status-item online">
        <span className="status-dot"></span>
        <span>All Systems Operational</span>
      </div>
    </div>
  </div>
);

// Main Dashboard Component
const Dashboard = () => {
  const { user, logout, isLoading } = useAuth();
  const [profilePic, setProfilePic] = useState(null);
  const [activeFilters, setActiveFilters] = useState({
    mustering: [],
    rank: [],
    readiness: []
  });

  const handlePicUpload = (e) => {
    const file = e.target.files[0];
    if (file && file.size <= 2 * 1024 * 1024) {
      const reader = new FileReader();
      reader.onload = (event) => setProfilePic(event.target.result);
      reader.readAsDataURL(file);
    } else {
      alert('Maximum file size is 2MB (JPEG/PNG only)');
    }
  };

  const UserProfileCard = () => (
    <div className="user-profile-card glass-card">
      <div className="profile-pic-container">
        <Image 
          src={profilePic || user?.photo || defaultProfile} 
          roundedCircle 
          className="profile-pic"
        />
        {user?.tier === 0 && (
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
          </Form.Group>
        )}
      </div>
      <div className="user-info">
        <h5><GiRank3 /> {user?.rank || 'Rank'}</h5>
        <h4>{(user?.surname || 'User').toUpperCase()}</h4>
        <Badge bg={getTierBadgeColor(user?.tier)} className="tier-badge">
          {getTierName(user?.tier)}
        </Badge>
      </div>
    </div>
  );

  const statsData = [
    { title: "Active Personnel", value: "3.9k", change: "+2.4%", icon: <FaUsers />, variant: "success" },
    { title: "Combat Ready", value: "87%", change: "-1.2%", icon: <GiSwordWound />, variant: "warning" },
    { title: "Active Bases", value: "13", change: "+2", icon: <FaMapMarkedAlt />, variant: "info" },
    { title: "Active Missions", value: "24", change: "+8", icon: <FaTasks />, variant: "danger" }
  ];

  if (isLoading) {
    return <div className="loading-spinner">Loading...</div>;
  }

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <div className="d-flex justify-content-between align-items-center">
          <div className="d-flex align-items-center">
            <img 
              src="/assets/images/saafGold.png" 
              alt="SAAF Logo"
              className="header-logo"
            />
            <h2 className="ms-2 mb-0">STAFFSYNC DASHBOARD</h2>
          </div>
          
          <div className="d-flex align-items-center gap-3">
            <Button variant="danger" onClick={logout}>
              <FaSignOutAlt className="me-1" /> Sign Out
            </Button>
          </div>
        </div>
        
        <div className="stats-container">
          {statsData.map((stat, index) => (
            <div key={index} className="stat-card">
              <div className="d-flex align-items-center">
                <span className="stat-icon me-2">{stat.icon}</span>
                <div>
                  <h6 className="card-title mb-0">{stat.title}</h6>
                  <div className="d-flex align-items-baseline">
                    <h2 className="mb-0 me-2">{stat.value}</h2>
                    <Badge bg={stat.variant}>{stat.change}</Badge>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </header>

      <aside className="dashboard-left">
        <div className="glass-panel">
          <UserProfileCard />
          <SidebarNavigation />
        </div>
      </aside>

      <main className="dashboard-main">
        <div className="glass-panel">
          <PersonnelOverview activeFilters={activeFilters} />
          <RecentActivities />
        </div>
      </main>

      <aside className="dashboard-right">
        <div className="glass-panel">
          <QuickActionsPanel onFilterChange={setActiveFilters} />
          <NotificationsPanel />
          <SystemStatusPanel />
        </div>
      </aside>
    </div>
  );
};

export default Dashboard;
