import React, { useEffect, useMemo, useState } from "react";
import {
  Button, Image, Form, Table, InputGroup, FormControl, Badge, Modal
} from "react-bootstrap";
import {
  FaSignOutAlt, FaBell, FaUserCircle, FaClipboardList, FaUsers, FaMapMarkedAlt,
  FaTasks, FaBolt, FaSearch, FaFilter, FaFileExport, FaServer
} from "react-icons/fa";
import { GiRank3, GiCompass, GiSwordWound } from "react-icons/gi";
import defaultProfile from "../assets/images/default-profile.png";
import { useAuth } from "../stores/authStore";
import { fetchPersonnel, exportPersonnelToCSV } from "../services/dataService";
import { mockMusterings } from "../data/mockData";
import "../assets/css/Dashboard.css";
import saafGold from "../assets/images/saafGold.png";


// helpers you already had
const getTierName = (tier) => ({1:"TIER 1 SYS_ADMIN",2:"TIER 2 COMMANDER",3:"TIER 3 DIRECTORATE",4:"TIER 4 LANA"}[tier] || "USER");
const getTierBadgeColor = (tier) => ({1:"danger",2:"warning",3:"primary",4:"info"}[tier] || "dark");

function QuickActionsPanel({ onFilterChange, onExport, canExport }) {
  const [showFilters, setShowFilters] = useState(false);
  const [selectedFilters, setSelectedFilters] = useState({ mustering: [], rank: [], readiness: [] });

  const filterOptions = {
    mustering: ["P", "C2", "SS"],
    rank: ["General", "Major", "Captain", "Corporal"],
    readiness: ["Ready", "Not Ready", "Pending"],
  };

  const toggle = (type, value) => {
    setSelectedFilters((prev) => ({
      ...prev,
      [type]: prev[type].includes(value)
        ? prev[type].filter((v) => v !== value)
        : [...prev[type], value],
    }));
  };

  const reset = () => {
    const empty = { mustering: [], rank: [], readiness: [] };
    setSelectedFilters(empty);
    onFilterChange(empty);
  };

  return (
    <div className="glass-card quick-actions-panel">
      <h4><FaBolt className="me-2" />Quick Actions</h4>

      <div className="d-grid gap-2 mb-3">
        <Button variant="outline-light" size="sm" onClick={() => setShowFilters((s) => !s)}>
          <FaFilter className="me-1" /> {showFilters ? "Hide Filters" : "Show Filters"}
        </Button>
        <Button variant="outline-light" size="sm" onClick={onExport} disabled={!canExport}>
          <FaFileExport className="me-1" /> Export
        </Button>
      </div>

      {showFilters && (
        <div className="filter-section">
          {Object.entries(filterOptions).map(([type, options]) => (
            <div key={type} className="filter-group mb-2">
              <div className="filter-title">{type[0].toUpperCase() + type.slice(1)}</div>
              <div className="filter-options d-flex gap-3 flex-wrap">
                {options.map((opt) => (
                  <Form.Check
                    key={opt}
                    type="checkbox"
                    id={`${type}-${opt}`}
                    label={opt}
                    checked={selectedFilters[type].includes(opt)}
                    onChange={() => toggle(type, opt)}
                    className="filter-checkbox"
                  />
                ))}
              </div>
            </div>
          ))}
          <div className="d-flex justify-content-between mt-3">
            <Button variant="outline-secondary" size="sm" onClick={reset}>Reset</Button>
            <Button variant="primary" size="sm" onClick={() => onFilterChange(selectedFilters)}>Apply</Button>
          </div>
        </div>
      )}
    </div>
  );
}

function SidebarNavigation({ active, onNavigate }) {
  const item = (key, label, Icon) => (
    <li className="nav-item">
      <a
        href="#"
        className={`nav-link ${active === key ? "active" : ""}`}
        onClick={(e) => { e.preventDefault(); onNavigate(key); }}
      >
        <Icon className="nav-icon" /> {label}
      </a>
    </li>
  );
  return (
    <ul className="sidebar-nav glass-card">
      {item("personnel", "Personnel Overview", GiCompass)}
      {item("mustering", "Mustering", FaClipboardList)}
      {item("bases", "Bases", FaMapMarkedAlt)}
      {item("units", "Units", FaUsers)}
      {item("profile", "My Profile", FaUserCircle)}
    </ul>
  );
}

function MusteringPanel({ rows }) {
  // normalize helper: get member's mustering code and name
  const norm = (p) => ({
    code: p.musteringCode || p.mustering_code || (p.musteringName ? p.musteringName.slice(0,2).toUpperCase() : undefined),
    name: p.musteringName || p.mustering || p.mustering_code || "Unknown"
  });

  const musterings = mockMusterings || [];

  // Build counts per mustering code
  const countsByCode = rows.reduce((acc, p) => {
    const { code } = norm(p);
    if (!code) return acc;
    acc[code] = (acc[code] || 0) + 1;
    return acc;
  }, {});

  const [selected, setSelected] = useState(musterings[0]?.code || null);

  const membersForSelected = useMemo(() => {
    if (!selected) return [];
    return rows.filter((p) => {
      const c = p.musteringCode || p.mustering_code || (p.musteringName ? p.musteringName.slice(0,2).toUpperCase() : undefined);
      return c === selected;
    });
  }, [rows, selected]);

  // Group by rank for a simple chart
  const rankCounts = useMemo(() => {
    const by = {};
    for (const p of membersForSelected) {
      const r = p.rank || "Unknown";
      by[r] = (by[r] || 0) + 1;
    }
    // Convert to sorted entries (desc)
    return Object.entries(by).sort((a,b) => b[1]-a[1]);
  }, [membersForSelected]);

  const maxVal = Math.max(1, ...rankCounts.map(([,v]) => v));

  return (
    <div id="mustering" className="glass-card">
      <h4><FaClipboardList className="me-2" />Musterings</h4>

      <div className="d-flex flex-wrap gap-2 mb-3">
        {musterings.map((m) => (
          <button
            key={m.code}
            className={`btn btn-sm ${selected === m.code ? "btn-primary" : "btn-outline-light"}`}
            onClick={() => setSelected(m.code)}
            title={m.description}
          >
            {m.name} <span className="ms-1 badge bg-secondary">{countsByCode[m.code] || 0}</span>
          </button>
        ))}
      </div>

      {selected && (
        <div>
          <h6 className="text-white-50 mb-2">Rank distribution in {musterings.find(m=>m.code===selected)?.name || selected}</h6>
          {/* Simple SVG horizontal bar chart */}
          <div className="mb-2" style={{width: '100%', overflowX: 'auto'}}>
            <svg width="100%" height={Math.max(120, rankCounts.length * 28)} viewBox={`0 0 800 ${Math.max(120, rankCounts.length * 28)}`} preserveAspectRatio="none">
              {rankCounts.map(([label, value], idx) => {
                const y = idx * 28 + 6;
                const w = 700 * (value / maxVal);
                return (
                  <g key={label} transform={`translate(60, ${y})`}>
                    <rect x="0" y="0" width={w} height="18" fill="rgba(33,150,243,0.8)" rx="6" />
                    <text x={w + 8} y="13" fill="#fff" fontSize="12">{value}</text>
                    <text x={-8} y="13" fill="#fff" fontSize="12" textAnchor="end">{label}</text>
                  </g>
                );
              })}
            </svg>
          </div>

          <div className="text-muted small">Total members: {membersForSelected.length}</div>
        </div>
      )}
    </div>
  );
}

function PersonnelOverview({ rows, onOpen, searchTerm, setSearchTerm, activeFilters, page, pageSize, setPage }) {
  const filtered = useMemo(() => {
    let data = rows;

    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      data = data.filter(p =>
        [p.force_number, p.rank, p.surname, p.first_name, p.musteringName, p.unitName, p.baseName]
          .join(" ")
          .toLowerCase()
          .includes(q)
      );
    }

    // apply quick actions filters
    if (activeFilters.mustering.length) {
      data = data.filter(p => activeFilters.mustering.includes(p.musteringCode || p.musteringName?.slice(0,2)));
    }
    if (activeFilters.rank.length) {
      data = data.filter(p => activeFilters.rank.includes(p.rank));
    }
    if (activeFilters.readiness.length) {
      data = data.filter(p => activeFilters.readiness.includes(p.readinessStatus));
    }

    return data;
  }, [rows, searchTerm, activeFilters]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const pageSafe = Math.min(page, totalPages);
  const start = (pageSafe - 1) * pageSize;
  const paginated = filtered.slice(start, start + pageSize);

  useEffect(() => {
    if (page > totalPages) setPage(1);
  }, [page, totalPages, setPage]);

  return (
    <div id="personnel" className="glass-card">
      <h4><FaUsers className="me-2" />Personnel Overview</h4>

      <InputGroup className="mb-3">
        <InputGroup.Text><FaSearch /></InputGroup.Text>
        <FormControl
          placeholder="Search personnel..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </InputGroup>

      <div className="table-responsive">
        <Table striped hover variant="dark" className="mb-0">
          <thead>
            <tr>
              <th>Force #</th><th>Rank</th><th>Name</th><th>Mustering</th><th>Unit</th><th>Base</th><th>Readiness</th><th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {paginated.map((p) => (
              <tr key={p.force_number}>
                <td>{p.force_number}</td>
                <td>{p.rank}</td>
                <td>{p.surname}, {p.first_name}</td>
                <td>{p.musteringName}</td>
                <td>{p.unitName}</td>
                <td>{p.baseName}</td>
                <td>
                  <Badge bg={p.readinessStatus === "Ready" ? "success" : "danger"} className="text-uppercase">
                    {p.readinessStatus}
                  </Badge>
                </td>
                <td>
                  <Button variant="outline-light" size="sm" onClick={() => onOpen(p)}>
                    <FaUserCircle /> View
                  </Button>
                </td>
              </tr>
            ))}
            {paginated.length === 0 && (
              <tr><td colSpan={8} className="text-center text-muted">No results</td></tr>
            )}
          </tbody>
        </Table>
      </div>

      <div className="d-flex justify-content-between align-items-center mt-3">
        <div className="text-muted">Showing {paginated.length} of {filtered.length} records</div>
        <div>
          <Button variant="outline-light" size="sm" disabled={pageSafe === 1} onClick={() => setPage(p => p - 1)} className="me-2">Previous</Button>
          <span className="mx-2">Page {pageSafe} of {totalPages}</span>
          <Button variant="outline-light" size="sm" disabled={pageSafe === totalPages} onClick={() => setPage(p => p + 1)}>Next</Button>
        </div>
      </div>
    </div>
  );
}

function RecentActivities() {
  return (
    <div className="glass-card">
      <h4><FaClipboardList className="me-2" />Recent Activities</h4>
      <p className="text-muted">No recent activities</p>
    </div>
  );
}

function NotificationsPanel() {
  const [items, setItems] = useState([
    { id: 1, text: "System backup completed", read: false },
    { id: 2, text: "New personnel record imported", read: true },
  ]);
  return (
    <div className="glass-card">
      <h4><FaBell className="me-2" />Notifications</h4>
      <ul className="mb-0">
        {items.map(n => (
          <li key={n.id} className="d-flex justify-content-between">
            <span className={n.read ? "text-muted" : ""}>{n.text}</span>
            {!n.read && (
              <Button size="sm" variant="outline-light" onClick={() => setItems(prev => prev.map(x => x.id === n.id ? { ...x, read: true } : x))}>
                Mark read
              </Button>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

function SystemStatusPanel() {
  return (
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
}

export default function DashboardPage() {
  const { user, logout, isLoading } = useAuth();
  const [profilePic, setProfilePic] = useState(null);
  const [activeFilters, setActiveFilters] = useState({ mustering: [], rank: [], readiness: [] });
  const [activeSection, setActiveSection] = useState("personnel");

  const [rows, setRows] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 8;

  const [viewItem, setViewItem] = useState(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      const data = await fetchPersonnel();
      if (alive) setRows(data);
    })();
    return () => { alive = false; };
  }, []);

  const statsData = [
    { title: "Active Personnel", value: "3.9k", change: "+2.4%", icon: <FaUsers />, variant: "success" },
    { title: "Combat Ready", value: "87%", change: "-1.2%", icon: <GiSwordWound />, variant: "warning" },
    { title: "Active Bases", value: "13", change: "+2", icon: <FaMapMarkedAlt />, variant: "info" },
    { title: "Active Missions", value: "24", change: "+8", icon: <FaTasks />, variant: "danger" },
  ];

  const handlePicUpload = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (f.size > 2 * 1024 * 1024) return alert("Maximum file size is 2MB (JPEG/PNG only)");
    const reader = new FileReader();
    reader.onload = ev => setProfilePic(ev.target.result);
    reader.readAsDataURL(f);
  };

  if (isLoading) return <div className="loading-spinner">Loading...</div>;

  return (
    <div className="dashboard-container">
      {/* header */}
      <header className="dashboard-header">
        <div className="d-flex justify-content-between align-items-center">
          <div className="d-flex align-items-center">
            <img src={saafGold} alt="SAAF Logo" className="header-logo" style={{ height: 64, width: "auto", maxWidth: "100%" }}/>
            <h2 className="ms-2 mb-0">STAFFSYNC DASHBOARD</h2>
          </div>
          <div className="d-flex align-items-center gap-3">
            <Button variant="danger" onClick={logout}><FaSignOutAlt className="me-1" /> Sign Out</Button>
          </div>
        </div>

        <div className="stats-container">
          {statsData.map((s, i) => (
            <div key={i} className="stat-card">
              <div className="d-flex align-items-center">
                <span className="stat-icon me-2">{s.icon}</span>
                <div>
                  <h6 className="card-title mb-0">{s.title}</h6>
                  <div className="d-flex align-items-baseline">
                    <h2 className="mb-0 me-2">{s.value}</h2>
                    <Badge bg={s.variant}>{s.change}</Badge>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </header>

      {/* left column */}
      <aside className="dashboard-left">
        <div className="glass-panel">
          <div id="profile" className="user-profile-card glass-card">
            <div className="profile-pic-container">
              <Image src={profilePic || user?.photo || defaultProfile} roundedCircle className="profile-pic" />
              {/* allow upload for tier 0 if you ever use it, keep same logic as your file */}
              <Form.Group controlId="formFile" className="mt-2">
                <Form.Label className="upload-label"><FaUserCircle className="me-1" /> Update Photo</Form.Label>
                <Form.Control type="file" accept="image/jpeg,image/png" onChange={handlePicUpload} size="sm" />
              </Form.Group>
            </div>
            <div className="user-info">
              <h5><GiRank3 /> {user?.rank || "Rank"}</h5>
              <h4>{(user?.surname || "User").toUpperCase()}</h4>
              <Badge bg={getTierBadgeColor(user?.tier)} className="tier-badge">{getTierName(user?.tier)}</Badge>
            </div>
          </div>

          <SidebarNavigation active={activeSection} onNavigate={setActiveSection} />
        </div>
      </aside>

      {/* main column */}
      <main className="dashboard-main">
        <div className="glass-panel">
          {activeSection === "personnel" && (
            <>
              <PersonnelOverview
                rows={rows}
                onOpen={setViewItem}
                searchTerm={searchTerm}
                setSearchTerm={setSearchTerm}
                activeFilters={activeFilters}
                page={page}
                pageSize={pageSize}
                setPage={setPage}
              />
              <RecentActivities />
            </>
          )}

          {activeSection === "mustering" && (
            <MusteringPanel rows={rows} />
          )}
        </div>
      </main>

      {/* right column */}
      <aside className="dashboard-right">
        <div className="glass-panel">
          <QuickActionsPanel
            onFilterChange={(f) => { setActiveFilters(f); setPage(1); }}
            onExport={() => exportPersonnelToCSV(rows)}
            canExport={rows.length > 0}
          />
          <NotificationsPanel />
          <SystemStatusPanel />
        </div>
      </aside>

      {/* View modal */}
      <Modal show={!!viewItem} onHide={() => setViewItem(null)} centered>
        <Modal.Header closeButton><Modal.Title>Personnel Profile</Modal.Title></Modal.Header>
        <Modal.Body>
          {viewItem && (
            <>
              <div className="d-flex align-items-center gap-3 mb-3">
                <Image src={defaultProfile} roundedCircle width={64} height={64} />
                <div>
                  <div className="fw-bold">{viewItem.rank} {viewItem.surname}, {viewItem.first_name}</div>
                  <div className="text-muted small">{viewItem.force_number}</div>
                </div>
              </div>
              <Table size="sm" borderless>
                <tbody>
                  <tr><th>Mustering</th><td>{viewItem.musteringName}</td></tr>
                  <tr><th>Unit</th><td>{viewItem.unitName}</td></tr>
                  <tr><th>Base</th><td>{viewItem.baseName}</td></tr>
                  <tr><th>Readiness</th><td>{viewItem.readinessStatus}</td></tr>
                </tbody>
              </Table>
            </>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setViewItem(null)}>Close</Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}
