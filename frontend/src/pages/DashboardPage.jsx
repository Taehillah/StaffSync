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
import { mockMusterings, mockBases, mockUnits } from "../data/mockData";
import "../assets/css/Dashboard.css";
import saafGold from "../assets/images/saafGold.png";


// helpers you already had
const getTierName = (tier) => ({1:"TIER 1 SYS_ADMIN",2:"TIER 2 COMMANDER",3:"TIER 3 DIRECTORATE",4:"TIER 4 LANA"}[tier] || "USER");
const getTierBadgeColor = (tier) => ({1:"danger",2:"warning",3:"primary",4:"info"}[tier] || "dark");

// Shared rank list for filters and profile
const RANK_OPTIONS = [
  "Gen", "Lt Gen", "Maj Gen", "Brig Gen", "Col", "Lt Col", "Maj", "Capt", "Lt", "2Lt",
  "SCMWO", "CMWO", "MWO", "WO1", "WO2", "FSgt", "Sgt", "Cpl", "LCpl", "Amn",
  "Mrs", "Mr", "Ms"
];

function QuickActionsPanel({ rows, onFilterChange, onExport, canExport }) {
  const [showFilters, setShowFilters] = useState(false);
  const [selectedFilters, setSelectedFilters] = useState({ mustering: [], rank: [], readiness: [] });

  // Build dynamic options using mock sets
  const filterOptions = useMemo(() => ({
    mustering: (mockMusterings || []).map(m => m.code),
    rank: RANK_OPTIONS,
    readiness: ["Ready", "Pending", "Not Ready"],
  }), []);

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

  // Local filtering to power "Export filtered"
  const filteredRows = useMemo(() => {
    if (!Array.isArray(rows)) return [];
    let data = rows;
    if (selectedFilters.mustering.length) {
      data = data.filter(p => selectedFilters.mustering.includes(p.musteringCode || p.mustering_code || (p.musteringName ? p.musteringName.slice(0,2).toUpperCase() : "")));
    }
    if (selectedFilters.rank.length) {
      data = data.filter(p => selectedFilters.rank.includes(p.rank));
    }
    if (selectedFilters.readiness.length) {
      data = data.filter(p => selectedFilters.readiness.includes(p.readinessStatus));
    }
    return data;
  }, [rows, selectedFilters]);

  return (
    <div className="glass-card quick-actions-panel">
      <h4><FaBolt className="me-2" />Quick Actions</h4>

      <div className="d-grid gap-2 mb-3">
        <Button variant="outline-light" size="sm" onClick={() => setShowFilters((s) => !s)}>
          <FaFilter className="me-1" /> {showFilters ? "Hide Filters" : "Show Filters"}
        </Button>
        <Button variant="outline-light" size="sm" onClick={() => onExport(filteredRows.length ? filteredRows : rows)} disabled={!canExport}>
          <FaFileExport className="me-1" /> Export {filteredRows.length ? `(${filteredRows.length})` : "All"}
        </Button>
      </div>

      {showFilters && (
        <div className="filter-section">
          {Object.entries(filterOptions).map(([type, options]) => (
            <div key={type} className="filter-group mb-2">
              <div className="d-flex justify-content-between align-items-center mb-1">
                <div className="filter-title">{type[0].toUpperCase() + type.slice(1)}</div>
                <div className="d-flex gap-2">
                  <Button variant="outline-secondary" size="sm" onClick={() => setSelectedFilters(prev => ({ ...prev, [type]: options.slice() }))}>All</Button>
                  <Button variant="outline-secondary" size="sm" onClick={() => setSelectedFilters(prev => ({ ...prev, [type]: [] }))}>Clear</Button>
                </div>
              </div>
              <div className="filter-options d-flex gap-3 flex-wrap">
                {options.map((opt) => (
                  <Form.Check
                    key={opt}
                    type="checkbox"
                    id={`${type}-${opt}`}
                    label={type === 'mustering' ? `${opt} — ${(mockMusterings || []).find(m => m.code === opt)?.name || ''}` : opt}
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
          {/* Chart + big numbers column */}
          <div className="mb-2 chart-row" style={{width: '100%', overflowX: 'auto'}}>
            <div className="chart-svg">
              {(() => {
                const BAR_H = 26; const ROW_H = 34; const labelY = Math.round(BAR_H/2 + 6);
                const chartH = Math.max(120, rankCounts.length * ROW_H);
                const CHART_W = 800; const MARGIN = 0; const INNER_W = CHART_W;
                return (
                  <svg width="100%" height={chartH} viewBox={`0 0 ${CHART_W} ${chartH}`} preserveAspectRatio="xMinYMid meet">
                    <defs>
                      <linearGradient id="gradBlueRanks" x1="0" x2="1" y1="0" y2="0">
                        <stop offset="0%" stopColor="#64b5f6"/>
                        <stop offset="100%" stopColor="#2196f3"/>
                      </linearGradient>
                      <filter id="barShadow1" x="-10%" y="-50%" width="120%" height="200%">
                        <feDropShadow dx="0" dy="2" stdDeviation="2" floodColor="#000" floodOpacity="0.35"/>
                      </filter>
                    </defs>
                    {rankCounts.map(([label, value], idx) => {
                      const y = idx * ROW_H + MARGIN;
                      const w = INNER_W * (value / maxVal);
                      return (
                        <g key={label} transform={`translate(${MARGIN}, ${y})`}>
                          <rect x="0" y="0" width={w} height={BAR_H} fill="#2196f3" rx="6" filter="url(#barShadow1)" style={{ transition: 'width 600ms ease' }} />
                          <text x={4} y={labelY} fill="#fff" fontSize="12" textAnchor="start">{label}</text>
                          <title>{`${label}: ${value}`}</title>
                        </g>
                      );
                    })}
                  </svg>
                );
              })()}
            </div>
            <div className="chart-values">
              {rankCounts.map(([, value], idx) => (
                <div key={idx} className="chart-value">{value}</div>
              ))}
            </div>
          </div>

          <div className="text-muted small">Total members: {membersForSelected.length}</div>
        </div>
      )}
    </div>
  );
}

function BasesPanel({ rows }) {
  const bases = mockBases || [];

  // Count members per base name
  const countsByBase = useMemo(() => (
    rows.reduce((acc, p) => {
      const name = p.baseName || "Unknown";
      acc[name] = (acc[name] || 0) + 1;
      return acc;
    }, {})
  ), [rows]);

  const [selectedBase, setSelectedBase] = useState(bases[0]?.name || null);

  const membersAtBase = useMemo(() => {
    if (!selectedBase) return [];
    return rows.filter(p => (p.baseName || "Unknown") === selectedBase);
  }, [rows, selectedBase]);

  // Group by mustering for this base
  const musteringCounts = useMemo(() => {
    const by = {};
    for (const p of membersAtBase) {
      const key = p.musteringName || p.mustering_code || "Unknown";
      by[key] = (by[key] || 0) + 1;
    }
    return Object.entries(by).sort((a,b) => b[1]-a[1]);
  }, [membersAtBase]);

  // Group by readiness for this base
  const readinessCounts = useMemo(() => {
    const by = {};
    for (const p of membersAtBase) {
      const key = p.readinessStatus || "Unknown";
      by[key] = (by[key] || 0) + 1;
    }
    // Preserve a consistent order
    const order = ["Ready", "Pending", "Not Ready", "Unknown"]; 
    const sorted = Object.entries(by).sort((a,b) => order.indexOf(a[0]) - order.indexOf(b[0]));
    return sorted;
  }, [membersAtBase]);

  const maxMust = Math.max(1, ...musteringCounts.map(([,v]) => v));
  const maxReady = Math.max(1, ...readinessCounts.map(([,v]) => v));

  return (
    <div id="bases" className="glass-card">
      <h4><FaMapMarkedAlt className="me-2" />Bases</h4>

      {/* Base selector */}
      <div className="d-flex flex-wrap gap-2 mb-3">
        {bases.map(b => (
          <button
            key={b.base_id || b.id || b.name}
            className={`btn btn-sm ${selectedBase === b.name ? "btn-primary" : "btn-outline-light"}`}
            onClick={() => setSelectedBase(b.name)}
            title={`${b.city}, ${b.province}`}
          >
            {b.name} <span className="ms-1 badge bg-secondary">{countsByBase[b.name] || 0}</span>
          </button>
        ))}
      </div>

      {selectedBase && (
        <>
          <h6 className="text-white-50 mb-2">Mustering distribution at {selectedBase}</h6>
          <div className="mb-3 chart-row" style={{width: '100%', overflowX: 'auto'}}>
            <div className="chart-svg">
              {(() => {
                const BAR_H = 26; const ROW_H = 34; const labelY = Math.round(BAR_H/2 + 6);
                const chartH = Math.max(120, musteringCounts.length * ROW_H);
                const CHART_W = 800; const MARGIN = 0; const INNER_W = CHART_W;
                return (
                  <svg width="100%" height={chartH} viewBox={`0 0 ${CHART_W} ${chartH}`} preserveAspectRatio="xMinYMid meet">
                    <defs>
                      <linearGradient id="gradBlueMustBase" x1="0" x2="1" y1="0" y2="0">
                        <stop offset="0%" stopColor="#90caf9"/>
                        <stop offset="100%" stopColor="#1e88e5"/>
                      </linearGradient>
                      <filter id="barShadow2" x="-10%" y="-50%" width="120%" height="200%">
                        <feDropShadow dx="0" dy="2" stdDeviation="2" floodColor="#000" floodOpacity="0.35"/>
                      </filter>
                    </defs>
                    {musteringCounts.map(([label, value], idx) => {
                      const y = idx * ROW_H + MARGIN;
                      const w = INNER_W * (value / maxMust);
                      return (
                        <g key={label} transform={`translate(${MARGIN}, ${y})`}>
                          <rect x="0" y="0" width={w} height={BAR_H} fill="#1e88e5" rx="6" filter="url(#barShadow2)" style={{ transition: 'width 600ms ease' }} />
                          <text x={4} y={labelY} fill="#fff" fontSize="12" textAnchor="start">{label}</text>
                          <title>{`${label}: ${value}`}</title>
                        </g>
                      );
                    })}
                  </svg>
                );
              })()}
            </div>
            <div className="chart-values">
              {musteringCounts.map(([, value], idx) => (
                <div key={idx} className="chart-value">{value}</div>
              ))}
            </div>
          </div>

          <h6 className="text-white-50 mb-2">Readiness at {selectedBase}</h6>
          <div className="mb-2 chart-row" style={{width: '100%', overflowX: 'auto'}}>
            <div className="chart-svg">
              {(() => {
                const BAR_H = 26; const ROW_H = 34; const labelY = Math.round(BAR_H/2 + 6);
                const chartH = Math.max(90, readinessCounts.length * ROW_H);
                const CHART_W = 800; const MARGIN = 0; const INNER_W = CHART_W;
                return (
                  <svg width="100%" height={chartH} viewBox={`0 0 ${CHART_W} ${chartH}`} preserveAspectRatio="xMinYMid meet">
                    <defs>
                      <linearGradient id="gradGreen" x1="0" x2="1" y1="0" y2="0">
                        <stop offset="0%" stopColor="#81c784"/>
                        <stop offset="100%" stopColor="#2ecc71"/>
                      </linearGradient>
                      <linearGradient id="gradYellow" x1="0" x2="1" y1="0" y2="0">
                        <stop offset="0%" stopColor="#ffd54f"/>
                        <stop offset="100%" stopColor="#f1c40f"/>
                      </linearGradient>
                      <linearGradient id="gradRed" x1="0" x2="1" y1="0" y2="0">
                        <stop offset="0%" stopColor="#ef9a9a"/>
                        <stop offset="100%" stopColor="#e74c3c"/>
                      </linearGradient>
                      <filter id="barShadow3" x="-10%" y="-50%" width="120%" height="200%">
                        <feDropShadow dx="0" dy="2" stdDeviation="2" floodColor="#000" floodOpacity="0.35"/>
                      </filter>
                    </defs>
                    {readinessCounts.map(([label, value], idx) => {
                      const y = idx * ROW_H + MARGIN;
                      const w = INNER_W * (value / maxReady);
                      const grad = label === 'Ready' ? '#2ecc71' : (label === 'Pending' ? '#f1c40f' : '#e74c3c');
                      return (
                        <g key={label} transform={`translate(${MARGIN}, ${y})`}>
                          <rect x="0" y="0" width={w} height={BAR_H} fill={grad} rx="6" filter="url(#barShadow3)" style={{ transition: 'width 600ms ease' }} />
                          <text x={4} y={labelY} fill="#fff" fontSize="12" textAnchor="start">{label}</text>
                          <title>{`${label}: ${value}`}</title>
                        </g>
                      );
                    })}
                  </svg>
                );
              })()}
            </div>
            <div className="chart-values">
              {readinessCounts.map(([, value], idx) => (
                <div key={idx} className="chart-value">{value}</div>
              ))}
            </div>
          </div>

          <div className="text-muted small">Total members: {membersAtBase.length}</div>
        </>
      )}
    </div>
  );
}

function UnitsPanel({ rows }) {
  const units = mockUnits || [];

  // Count members per unit name
  const countsByUnit = useMemo(() => (
    rows.reduce((acc, p) => {
      const name = p.unitName || "Unknown";
      acc[name] = (acc[name] || 0) + 1;
      return acc;
    }, {})
  ), [rows]);

  const [selectedUnit, setSelectedUnit] = useState(units[0]?.name || null);

  const membersAtUnit = useMemo(() => {
    if (!selectedUnit) return [];
    return rows.filter(p => (p.unitName || "Unknown") === selectedUnit);
  }, [rows, selectedUnit]);

  // Group by mustering within the unit
  const musteringCounts = useMemo(() => {
    const by = {};
    for (const p of membersAtUnit) {
      const key = p.musteringName || p.mustering_code || "Unknown";
      by[key] = (by[key] || 0) + 1;
    }
    return Object.entries(by).sort((a,b) => b[1]-a[1]);
  }, [membersAtUnit]);

  // Group by rank within the unit
  const rankCounts = useMemo(() => {
    const by = {};
    for (const p of membersAtUnit) {
      const key = p.rank || "Unknown";
      by[key] = (by[key] || 0) + 1;
    }
    return Object.entries(by).sort((a,b) => b[1]-a[1]);
  }, [membersAtUnit]);

  const maxMust = Math.max(1, ...musteringCounts.map(([,v]) => v));
  const maxRank = Math.max(1, ...rankCounts.map(([,v]) => v));

  return (
    <div id="units" className="glass-card">
      <h4><FaUsers className="me-2" />Units</h4>

      {/* Unit selector */}
      <div className="d-flex flex-wrap gap-2 mb-3">
        {units.map(u => (
          <button
            key={u.unit_id || u.id || u.name}
            className={`btn btn-sm ${selectedUnit === u.name ? "btn-primary" : "btn-outline-light"}`}
            onClick={() => setSelectedUnit(u.name)}
            title={u.mustering_code ? `Mustering: ${u.mustering_code}` : ''}
          >
            {u.name} <span className="ms-1 badge bg-secondary">{countsByUnit[u.name] || 0}</span>
          </button>
        ))}
      </div>

      {selectedUnit && (
        <>
          <h6 className="text-white-50 mb-2">Mustering distribution in {selectedUnit}</h6>
          <div className="mb-3 chart-row" style={{width: '100%', overflowX: 'auto'}}>
            <div className="chart-svg">
              {(() => {
                const BAR_H = 26; const ROW_H = 34; const labelY = Math.round(BAR_H/2 + 6);
                const chartH = Math.max(120, musteringCounts.length * ROW_H);
                const CHART_W = 800; const MARGIN = 0; const INNER_W = CHART_W;
                return (
                  <svg width="100%" height={chartH} viewBox={`0 0 ${CHART_W} ${chartH}`} preserveAspectRatio="xMinYMid meet">
                    <defs>
                      <linearGradient id="gradBlueUnits" x1="0" x2="1" y1="0" y2="0">
                        <stop offset="0%" stopColor="#90caf9"/>
                        <stop offset="100%" stopColor="#1e88e5"/>
                      </linearGradient>
                      <filter id="barShadow4" x="-10%" y="-50%" width="120%" height="200%">
                        <feDropShadow dx="0" dy="2" stdDeviation="2" floodColor="#000" floodOpacity="0.35"/>
                      </filter>
                    </defs>
                    {musteringCounts.map(([label, value], idx) => {
                      const y = idx * ROW_H + MARGIN;
                      const w = INNER_W * (value / maxMust);
                      return (
                        <g key={label} transform={`translate(${MARGIN}, ${y})`}>
                          <rect x="0" y="0" width={w} height={BAR_H} fill="#1e88e5" rx="6" filter="url(#barShadow4)" style={{ transition: 'width 600ms ease' }} />
                          <text x={4} y={labelY} fill="#fff" fontSize="12" textAnchor="start">{label}</text>
                          <title>{`${label}: ${value}`}</title>
                        </g>
                      );
                    })}
                  </svg>
                );
              })()}
            </div>
            <div className="chart-values">
              {musteringCounts.map(([, value], idx) => (
                <div key={idx} className="chart-value">{value}</div>
              ))}
            </div>
          </div>

          <h6 className="text-white-50 mb-2">Rank distribution in {selectedUnit}</h6>
          <div className="mb-2 chart-row" style={{width: '100%', overflowX: 'auto'}}>
            <div className="chart-svg">
              {(() => {
                const BAR_H = 26; const ROW_H = 34; const labelY = Math.round(BAR_H/2 + 6);
                const chartH = Math.max(120, rankCounts.length * ROW_H);
                const CHART_W = 800; const MARGIN = 0; const INNER_W = CHART_W;
                return (
                  <svg width="100%" height={chartH} viewBox={`0 0 ${CHART_W} ${chartH}`} preserveAspectRatio="xMinYMid meet">
                    <defs>
                      <linearGradient id="gradGreenUnits" x1="0" x2="1" y1="0" y2="0">
                        <stop offset="0%" stopColor="#80e7b9"/>
                        <stop offset="100%" stopColor="#00c853"/>
                      </linearGradient>
                      <filter id="barShadow5" x="-10%" y="-50%" width="120%" height="200%">
                        <feDropShadow dx="0" dy="2" stdDeviation="2" floodColor="#000" floodOpacity="0.35"/>
                      </filter>
                    </defs>
                    {rankCounts.map(([label, value], idx) => {
                      const y = idx * ROW_H + MARGIN;
                      const w = INNER_W * (value / maxRank);
                      return (
                        <g key={label} transform={`translate(${MARGIN}, ${y})`}>
                          <rect x="0" y="0" width={w} height={BAR_H} fill="#00c853" rx="6" filter="url(#barShadow5)" style={{ transition: 'width 600ms ease' }} />
                          <text x={4} y={labelY} fill="#fff" fontSize="12" textAnchor="start">{label}</text>
                          <title>{`${label}: ${value}`}</title>
                        </g>
                      );
                    })}
                  </svg>
                );
              })()}
            </div>
            <div className="chart-values">
              {rankCounts.map(([, value], idx) => (
                <div key={idx} className="chart-value">{value}</div>
              ))}
            </div>
          </div>

          <div className="text-muted small">Total members: {membersAtUnit.length}</div>
        </>
      )}
    </div>
  );
}

function ProfilePanel({ rows }) {
  const { user, updateProfile, pendingProfileChange, submitProfileChange, recommendProfileChange, finalizeProfileChange } = useAuth();

  // Try to find a matching personnel record for richer defaults
  const match = useMemo(() => {
    if (!user) return null;
    return (
      rows.find(p => (p.email && user.email && p.email === user.email)) ||
      rows.find(p => (p.force_number && (p.force_number === user.id || p.force_number === user.forceNumber))) ||
      null
    );
  }, [rows, user]);

  const initial = {
    forceNumber: user?.forceNumber || match?.force_number || "",
    rank: user?.rank || match?.rank || "",
    firstName: user?.firstName || match?.first_name || "",
    surname: user?.surname || match?.surname || "",
    email: user?.email || match?.email || "",
    cellphone: user?.cell_number || match?.cell_number || "",
    unitName: user?.unitName || match?.unitName || "",
    baseName: user?.baseName || match?.baseName || "",
    musteringCode: user?.musteringCode || match?.musteringCode || match?.mustering_code || "",
    musteringName: user?.musteringName || match?.musteringName || "",
    postDescription: user?.post_description || match?.post_description || "",
    readinessStatus: user?.readinessStatus || match?.readinessStatus || "Ready",
  };

  const [form, setForm] = useState(initial);
  useEffect(() => { setForm(initial); }, [match]);

  // Rank options (as requested)
  const rankOptions = [
    "Gen", "Lt Gen", "Maj Gen", "Brig Gen", "Col", "Lt Col", "Maj", "Capt", "Lt", "2Lt",
    "SCMWO", "CMWO", "MWO", "WO1", "WO2", "FSgt", "Sgt", "Cpl", "LCpl", "Amn",
    "Mrs", "Mr", "Ms"
  ];

  // Post Description options (global list as requested)
  const postDescriptionOptions = [
    "Pilot or Navigator", "OPS", "Comms", "Radar", "ATC", "Mission Control", "Career Management",
    "Catering", "Air hostenss", "Storeman", "Fire Fighter", "Logcell", "Tailor", "Procurement",
    "Int", "Electronic Warfare", "Counter Int", "Access Control", "VIP protector", "Task Force", "Instructor",
    "Military Police", "Band", "Aircraft Mechanic", "Flight Engineer", "Photographer", "Motor Mechanic",
    "Civil Engineer", "Aeronotical Engineer", "Software Engineer", "Armourer", "Judge", "Advocate", "Lawyer",
    "Chaplain", "Biudget Manager", "Cashier", "Corporate Communications", "HR", "Adjutant", "Environmental"
  ];

  const onChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const payloadFromForm = () => ({
    // Force Number and First Name are intentionally excluded from updates
    rank: form.rank,
    surname: form.surname,
    email: form.email,
    phone: form.cellphone,
    unitName: form.unitName,
    baseName: form.baseName,
    musteringCode: form.musteringCode,
    musteringName: form.musteringName,
    post_description: form.postDescription,
    readinessStatus: form.readinessStatus,
  });

  const onSave = async () => {
    if ((user?.tier || 0) >= 3) {
      await updateProfile(payloadFromForm());
      alert("Profile updated (Tier 3+ immediate).");
    } else {
      await submitProfileChange(payloadFromForm());
      alert("Changes submitted for approval.");
    }
  };

  return (
    <div id="profile-panel" className="glass-card">
      <h4><FaUserCircle className="me-2" />My Profile</h4>

      <Form className="mt-2">
        <div className="row g-3">
          <div className="col-md-4">
            <Form.Label className="text-white-50">Force Number</Form.Label>
            <Form.Control name="forceNumber" value={form.forceNumber} disabled readOnly className="auth-input" placeholder="e.g. 90119292MI" />
          </div>
          <div className="col-md-4">
            <Form.Label className="text-white-50">Rank</Form.Label>
            <Form.Select name="rank" value={form.rank} onChange={onChange} className="auth-input">
              <option value="">Select...</option>
              {rankOptions.map(r => (<option key={r} value={r}>{r}</option>))}
            </Form.Select>
          </div>
          <div className="col-md-4">
            <Form.Label className="text-white-50">Readiness</Form.Label>
            <Form.Select name="readinessStatus" value={form.readinessStatus} onChange={onChange} className="auth-input">
              <option value="Ready">Ready</option>
              <option value="Pending">Pending</option>
              <option value="Not Ready">Not Ready</option>
            </Form.Select>
          </div>

          <div className="col-md-6">
            <Form.Label className="text-white-50">First Name(s)</Form.Label>
            <Form.Control name="firstName" value={form.firstName} disabled readOnly className="auth-input" />
          </div>
          <div className="col-md-6">
            <Form.Label className="text-white-50">Surname</Form.Label>
            <Form.Control name="surname" value={form.surname} onChange={onChange} className="auth-input" />
          </div>

          <div className="col-md-6">
            <Form.Label className="text-white-50">Email</Form.Label>
            <Form.Control type="email" name="email" value={form.email} onChange={onChange} className="auth-input" />
          </div>
          <div className="col-md-6">
            <Form.Label className="text-white-50">Cellphone</Form.Label>
            <Form.Control name="cellphone" value={form.cellphone} onChange={onChange} className="auth-input" />
          </div>

          <div className="col-md-6">
            <Form.Label className="text-white-50">Mustering</Form.Label>
            <Form.Select
              name="musteringCode"
              value={form.musteringCode}
              onChange={(e) => {
                const code = e.target.value;
                const found = mockMusterings.find(m => m.code === code);
                setForm(prev => ({ ...prev, musteringCode: code, musteringName: found?.name || prev.musteringName, postDescription: "" }));
              }}
              className="auth-input"
            >
              <option value="">Select...</option>
              {mockMusterings.map(m => (<option key={m.code} value={m.code}>{m.name}</option>))}
            </Form.Select>
          </div>
          <div className="col-md-6">
            <Form.Label className="text-white-50">Post Description</Form.Label>
            <Form.Select name="postDescription" value={form.postDescription} onChange={onChange} className="auth-input">
              <option value="">Select...</option>
              {postDescriptionOptions.map(opt => (<option key={opt} value={opt}>{opt}</option>))}
            </Form.Select>
          </div>

          <div className="col-md-6">
            <Form.Label className="text-white-50">Unit</Form.Label>
            <Form.Select
              name="unitName"
              value={form.unitName}
              onChange={onChange}
              className="auth-input"
            >
              <option value="">Select...</option>
              {mockUnits.map(u => (<option key={u.unit_id} value={u.name}>{u.name}</option>))}
            </Form.Select>
          </div>
          <div className="col-md-6">
            <Form.Label className="text-white-50">Base</Form.Label>
            <Form.Select
              name="baseName"
              value={form.baseName}
              onChange={onChange}
              className="auth-input"
            >
              <option value="">Select...</option>
              {mockBases.map(b => (<option key={b.base_id} value={b.name}>{b.name}</option>))}
            </Form.Select>
          </div>
        </div>

        <div className="d-flex justify-content-between align-items-center mt-3">
          {pendingProfileChange && (
            <div className="text-white-50 small">
              Request status: {pendingProfileChange.status}
              {pendingProfileChange.recommendedBy ? ` (recommended by ${pendingProfileChange.recommendedBy})` : ''}
            </div>
          )}
          <div className="d-flex gap-2">
            <Button variant="primary" onClick={onSave}>Save Changes</Button>
            {/* Reviewer actions */}
            {pendingProfileChange && (user?.tier === 1 || user?.tier === 2) && pendingProfileChange.status === 'pending' && (
              <>
                <Button variant="outline-light" onClick={() => recommendProfileChange(true)}>Recommend Approve</Button>
                <Button variant="outline-danger" onClick={() => recommendProfileChange(false)}>Reject</Button>
              </>
            )}
            {pendingProfileChange && (user?.tier || 0) >= 3 && (
              <>
                <Button variant="success" onClick={() => finalizeProfileChange(true)}>Final Approve</Button>
                <Button variant="outline-danger" onClick={() => finalizeProfileChange(false)}>Reject</Button>
              </>
            )}
          </div>
        </div>

        {pendingProfileChange && (
          <div className="mt-3">
            <h6 className="text-white-50">Proposed changes</h6>
            <Table size="sm" variant="dark">
              <thead>
                <tr><th>Field</th><th>Current</th><th>Proposed</th></tr>
              </thead>
              <tbody>
                {Object.entries(pendingProfileChange.updates || {}).map(([k,v]) => (
                  <tr key={k}><td>{k}</td><td>{String(user?.[k] ?? '')}</td><td>{String(v)}</td></tr>
                ))}
              </tbody>
            </Table>
          </div>
        )}
      </Form>
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
  const { user, logout, isLoading, updateProfile } = useAuth();
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

  const statsData = useMemo(() => {
    const total = rows.length;
    const ready = rows.filter(r => String(r.readinessStatus).toLowerCase() === 'ready').length;
    const readyPct = total ? Math.round((ready / total) * 100) : 0;
    const basesCount = (mockBases && mockBases.length) ? mockBases.length : new Set(rows.map(r => r.baseName)).size;
    const unitsCount = (mockUnits && mockUnits.length) ? mockUnits.length : new Set(rows.map(r => r.unitName)).size;

    return [
      { title: "Active Personnel", value: String(total), icon: <FaUsers />, variant: "success" },
      { title: "Combat Ready", value: `${readyPct}%`, icon: <GiSwordWound />, variant: readyPct >= 75 ? "success" : readyPct >= 50 ? "warning" : "danger" },
      { title: "Active Bases", value: String(basesCount), icon: <FaMapMarkedAlt />, variant: "info" },
      { title: "Active Units", value: String(unitsCount), icon: <FaTasks />, variant: "primary" },
    ];
  }, [rows]);

  const handlePicUpload = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (f.size > 2 * 1024 * 1024) return alert("Maximum file size is 2MB (JPEG/PNG only)");
    const reader = new FileReader();
    reader.onload = ev => { setProfilePic(ev.target.result); updateProfile({ photo: ev.target.result }); };
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
                    {s.change ? (<Badge bg={s.variant}>{s.change}</Badge>) : null}
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

          {activeSection === "bases" && (
            <BasesPanel rows={rows} />
          )}

          {activeSection === "units" && (
            <UnitsPanel rows={rows} />
          )}

          {activeSection === "profile" && (
            <ProfilePanel rows={rows} />
          )}
        </div>
      </main>

      {/* right column */}
      <aside className="dashboard-right">
        <div className="glass-panel">
          <QuickActionsPanel
            rows={rows}
            onFilterChange={(f) => { setActiveFilters(f); setPage(1); }}
            onExport={(list) => exportPersonnelToCSV(list)}
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
