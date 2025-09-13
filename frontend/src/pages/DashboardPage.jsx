import React, { useEffect, useMemo, useState } from "react";
import {
  Button, Image, Form, Table, InputGroup, FormControl, Badge, Modal
} from "react-bootstrap";
import {
  FaSignOutAlt, FaBell, FaUserCircle, FaClipboardList, FaUsers, FaMapMarkedAlt,
  FaTasks, FaBolt, FaSearch, FaFilter, FaFileExport, FaServer,
  FaHourglassHalf, FaExclamationTriangle, FaPlane, FaLayerGroup
} from "react-icons/fa";
import { GiRank3, GiCompass, GiSwordWound } from "react-icons/gi";
import defaultProfile from "../assets/images/default-profile.png";
import BasesGoogleMap from "../components/maps/BasesGoogleMap";
import BasesOSMMap from "../components/maps/BasesOSMMap";
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
      {item("overview", "Overview", GiCompass)}
      {item("personnel", "Personnel", GiCompass)}
      {item("mustering", "Mustering", FaClipboardList)}
      {item("bases", "Bases", FaMapMarkedAlt)}
      {item("units", "Units", FaUsers)}
      {item("profile", "My Profile", FaUserCircle)}
    </ul>
  );
}

function MusteringPanel({ rows, onRowsChange }) {

  const musterings = mockMusterings || [];

  const [selectedPosts, setSelectedPosts] = useState({}); // per-mustering post filter
  const [qa, setQa] = useState({ action: null, open: false, code: '', post: 'All', readiness: 'Ready', newPost: '' });

  // No per-mustering members list on this page (removed by request)

  // Aggregate per mustering for the Stats table (kept for Quick Actions post list)
  const statsByMustering = useMemo(() => {
    const by = {};
    for (const p of rows) {
      const code = p.musteringCode || p.mustering_code || (p.musteringName ? p.musteringName.slice(0,2).toUpperCase() : undefined);
      if (!code) continue;
      if (!by[code]) by[code] = { total: 0, deployable: 0, posts: new Set(), readiness: { Ready: 0, Pending: 0, 'Not Ready': 0 } };
      by[code].total++;
      if (p.is_deployable) by[code].deployable++;
      if (p.post_description) {
        String(p.post_description)
          .split(',')
          .map(t => t.trim())
          .filter(Boolean)
          .forEach(t => by[code].posts.add(t));
      }
      const st = (p.readinessStatus || '').toString();
      if (by[code].readiness[st] !== undefined) by[code].readiness[st]++; else by[code].readiness[st] = 1;
    }
    // finalize
    for (const k of Object.keys(by)) by[k].posts = Array.from(by[k].posts).sort();
    return by;
  }, [rows]);

  // Avatar helper removed together with members list

  return (
    <div id="mustering" className="glass-card">
      <h4><FaClipboardList className="me-2" />Musterings</h4>

      {/* Quick Actions for Mustering */}
      <div className="d-flex flex-wrap gap-2 mb-3 qa-bar">
        <Button size="sm" variant="outline-light" className="qa-btn qa-primary" onClick={() => setQa({ action: 'shortlist', open: true, code: qa.code || (musterings[0]?.code || ''), post: 'All', readiness: 'Ready', newPost: '' })}>Deployment Shortlist</Button>
        <Button size="sm" variant="outline-light" className="qa-btn" onClick={() => setQa({ action: 'bulkReady', open: true, code: qa.code || (musterings[0]?.code || ''), post: 'All', readiness: 'Ready', newPost: '' })}>Bulk Update Readiness</Button>
      </div>

      {/* Stats across all musterings */}
      <div className="mustering-stats-table mb-3">
        <div className="mst-row mst-header">
          <div className="mst-col name">Mustering</div>
          <div className="mst-col posts">Posts</div>
          <div className="mst-col deploy">Deployable</div>
          <div className="mst-col total">Total Members</div>
          <div className="mst-col chart">Combat Readiness over Time</div>
        </div>
        {musterings.map(m => {
          const code = m.code;
          const s = statsByMustering[code] || { total: 0, deployable: 0, posts: [], readiness: { Ready: 0, Pending: 0, 'Not Ready': 0 } };
          const postSel = selectedPosts[code] || 'All';
          // filter counts by selected post if not All
          const filteredMembers = rows.filter(p => {
            const c = p.musteringCode || p.mustering_code;
            if (c !== code) return false;
            if (postSel === 'All') return true;
            const tokens = String(p.post_description || '')
              .toLowerCase()
              .split(',')
              .map(t => t.trim());
            return tokens.includes(postSel.toLowerCase());
          });
          const deployable = filteredMembers.filter(p => p.is_deployable).length;
          const total = filteredMembers.length;
          const ready = filteredMembers.filter(p => String(p.readinessStatus).toLowerCase() === 'ready').length;
          const pending = filteredMembers.filter(p => String(p.readinessStatus).toLowerCase() === 'pending').length;
          const notReady = filteredMembers.filter(p => String(p.readinessStatus).toLowerCase() === 'not ready').length;
          const trend = [ready, ready + Math.round(pending/2), ready + pending, Math.max(ready - Math.round(notReady/3), 0), Math.max(ready - Math.round(notReady/4) + Math.round(pending/3), 0)];
          return (
            <div key={code} className="mst-row">
              <div className="mst-col name">
                <div className="mst-badge">{m.name?.[0] || code}</div>
                <div className="mst-title">{m.name}</div>
              </div>
              <div className="mst-col posts">
                <Form.Select size="sm" value={postSel} onChange={e => setSelectedPosts(prev => ({ ...prev, [code]: e.target.value }))} className="auth-input">
                  <option>All</option>
                  {s.posts.map(p => (<option key={p} value={p}>{p}</option>))}
                </Form.Select>
              </div>
              <div className="mst-col deploy">{deployable}</div>
              <div className="mst-col total">{total}</div>
              <div className="mst-col chart"><Sparkline data={trend} width={220} height={50} color="#1e90ff" /></div>
            </div>
          );
        })}
      </div>

      {/* Quick Actions Modal */}
      <Modal show={qa.open} onHide={() => setQa(prev => ({ ...prev, open: false }))} centered dialogClassName="glass-modal-dialog" contentClassName="glass-modal">
        <Modal.Header closeButton><Modal.Title>
          {qa.action === 'shortlist' && 'Create Deployment Shortlist'}
          {qa.action === 'bulkReady' && 'Bulk Update Readiness'}
          {qa.action === 'assignPost' && 'Assign/Change Posts'}
        </Modal.Title></Modal.Header>
        <Modal.Body>
          <div className="row g-2">
            <div className="col-md-6">
              <Form.Label className="text-white-50">Mustering</Form.Label>
              <Form.Select className="auth-input" value={qa.code} onChange={e => setQa(prev => ({ ...prev, code: e.target.value }))}>
                {musterings.map(m => (<option key={m.code} value={m.code}>{m.name}</option>))}
              </Form.Select>
            </div>
            <div className="col-md-6">
              <Form.Label className="text-white-50">Post</Form.Label>
              <Form.Select className="auth-input" value={qa.post} onChange={e => setQa(prev => ({ ...prev, post: e.target.value }))}>
                <option>All</option>
                {(statsByMustering[qa.code]?.posts || []).map(p => (<option key={p} value={p}>{p}</option>))}
              </Form.Select>
            </div>

            {qa.action === 'bulkReady' && (
              <div className="col-12">
                <Form.Label className="text-white-50">Set Readiness</Form.Label>
                <Form.Select className="auth-input" value={qa.readiness} onChange={e => setQa(prev => ({ ...prev, readiness: e.target.value }))}>
                  <option value="Ready">Ready</option>
                  <option value="Pending">Pending</option>
                  <option value="Not Ready">Not Ready</option>
                </Form.Select>
              </div>
            )}

            {qa.action === 'assignPost' && (
              <div className="col-12">
                <Form.Label className="text-white-50">New Post</Form.Label>
                <Form.Control className="auth-input" placeholder="e.g. Storeman" value={qa.newPost} onChange={e => setQa(prev => ({ ...prev, newPost: e.target.value }))} />
              </div>
            )}
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setQa(prev => ({ ...prev, open: false }))}>Cancel</Button>
          {qa.action === 'shortlist' && (
            <Button variant="primary" onClick={() => {
              const list = rows.filter(p => {
                const code = p.musteringCode || p.mustering_code;
                if (code !== qa.code) return false;
                if (qa.post !== 'All' && p.post_description !== qa.post) return false;
                const ready = String(p.readinessStatus).toLowerCase() === 'ready';
                return ready && p.is_deployable === true;
              });
              exportPersonnelToCSV(list, `shortlist_${qa.code}.csv`);
              setQa(prev => ({ ...prev, open: false }));
            }}>Export Shortlist</Button>
          )}
          {qa.action === 'bulkReady' && (
            <Button variant="success" onClick={() => {
              if (!onRowsChange) return setQa(prev => ({ ...prev, open: false }));
              onRowsChange(rows.map(p => {
                const code = p.musteringCode || p.mustering_code;
                if (code !== qa.code) return p;
                if (qa.post !== 'All' && p.post_description !== qa.post) return p;
                return { ...p, readinessStatus: qa.readiness };
              }));
              setQa(prev => ({ ...prev, open: false }));
              alert('Readiness updated');
            }}>Apply</Button>
          )}
          {qa.action === 'assignPost' && (
            <Button variant="success" onClick={() => {
              if (!qa.newPost) { alert('Enter new post'); return; }
              if (!onRowsChange) return setQa(prev => ({ ...prev, open: false }));
              const newLabel = qa.newPost.trim();
              onRowsChange(rows.map(p => {
                const code = p.musteringCode || p.mustering_code;
                if (code !== qa.code) return p;
                // when a specific post is chosen, limit to members that include it (supports multi-post strings)
                if (qa.post !== 'All') {
                  const tokens = String(p.post_description || '')
                    .toLowerCase()
                    .split(',')
                    .map(t => t.trim());
                  if (!tokens.includes(qa.post.toLowerCase())) return p;
                }
                const current = String(p.post_description || '').trim();
                const curTokens = current
                  ? current.split(',').map(t => t.trim()).filter(Boolean)
                  : [];
                const exists = curTokens.map(t => t.toLowerCase()).includes(newLabel.toLowerCase());
                const next = exists ? current : (curTokens.length ? `${current}, ${newLabel}` : newLabel);
                return { ...p, post_description: next };
              }));
              setQa(prev => ({ ...prev, open: false }));
              alert('Posts updated');
            }}>Apply</Button>
          )}
        </Modal.Footer>
      </Modal>
    </div>
  );
}

// Lightweight dark "globe" map focusing on South Africa with base markers
function BasesGlobeCard({ rows }) {
  const bases = mockBases || [];
  const [selected, setSelected] = useState(null);
  const [hovered, setHovered] = useState(null);
  const [scale, setScale] = useState(1);
  const [tx, setTx] = useState(0);
  const [ty, setTy] = useState(0);
  const [panning, setPanning] = useState(false);
  const panRef = React.useRef({ startX: 0, startY: 0, startTx: 0, startTy: 0 });
  const svgRef = React.useRef(null);

  // rough lat/lon for S.A. bases (approximate; fine for schematic map)
  const coords = {
    'AFB Waterkloof': { lat: -25.83, lon: 28.22 },
    'AFB Swartkop': { lat: -25.80, lon: 28.17 },
    'AFB Bloemspruit': { lat: -29.10, lon: 26.30 },
    'AFB Ysterplaat': { lat: -33.90, lon: 18.50 },
    'AFB Hoedspruit': { lat: -24.36, lon: 31.05 },
    'AFB Langebaanweg': { lat: -32.97, lon: 18.16 },
  };

  // South Africa bounding box for projection
  const minLat = -35, maxLat = -22; // south to north
  const minLon = 16, maxLon = 33;   // west to east

  const countsByReady = useMemo(() => {
    const by = {};
    for (const p of rows) {
      const base = p.baseName || 'Unknown';
      if (!by[base]) by[base] = { total: 0, Ready: 0, Pending: 0, 'Not Ready': 0 };
      by[base].total++;
      const st = String(p.readinessStatus || 'Unknown');
      if (by[base][st] !== undefined) by[base][st]++;
    }
    return by;
  }, [rows]);

  const W = 640, H = 360;
  const MARGIN = 30; // inner padding around map

  const project = (lon, lat) => {
    const x = (lon - minLon) / (maxLon - minLon);
    const y = (lat - minLat) / (maxLat - minLat); // 0..1 bottom->top
    const px = MARGIN + x * (W - 2 * MARGIN);
    const py = MARGIN + (1 - y) * (H - 2 * MARGIN);
    return { x: px, y: py };
  };

  // South Africa silhouette path (normalized 0..1 points, stylized)
  const saPoints = [
    [0.15, 0.75], [0.22, 0.80], [0.30, 0.84], [0.42, 0.86], [0.55, 0.83], [0.67, 0.79],
    [0.78, 0.72], [0.86, 0.63], [0.84, 0.52], [0.81, 0.44], [0.77, 0.37], [0.70, 0.31],
    [0.62, 0.28], [0.52, 0.26], [0.43, 0.27], [0.35, 0.31], [0.29, 0.37], [0.24, 0.46],
    [0.21, 0.55], [0.18, 0.64], [0.15, 0.75]
  ];
  const saPath = saPoints.map((p, i) => `${i === 0 ? 'M' : 'L'} ${MARGIN + p[0]*(W-2*MARGIN)} ${MARGIN + p[1]*(H-2*MARGIN)}`).join(' ') + ' Z';

  const toSvgCoords = (evt) => {
    const rect = svgRef.current?.getBoundingClientRect();
    if (!rect) return { x: 0, y: 0 };
    const x = ((evt.clientX - rect.left) / rect.width) * W;
    const y = ((evt.clientY - rect.top) / rect.height) * H;
    return { x, y };
  };

  const onWheel = (e) => {
    e.preventDefault?.();
    const { x: mx, y: my } = toSvgCoords(e);
    const k = Math.exp(-e.deltaY * 0.0015);
    const newScale = Math.min(3.2, Math.max(0.8, scale * k));
    const sx = newScale / scale;
    // zoom towards cursor
    setTx(mx - (mx - tx) * sx);
    setTy(my - (my - ty) * sx);
    setScale(newScale);
  };

  const onMouseDown = (e) => {
    setPanning(true);
    const { x, y } = toSvgCoords(e);
    panRef.current = { startX: x, startY: y, startTx: tx, startTy: ty };
  };
  const onMouseMove = (e) => {
    if (!panning) return;
    const { x, y } = toSvgCoords(e);
    const dx = x - panRef.current.startX;
    const dy = y - panRef.current.startY;
    setTx(panRef.current.startTx + dx);
    setTy(panRef.current.startTy + dy);
  };
  const endPan = () => setPanning(false);

  return (
    <div className="glass-card globe-card">
      <h4 className="mb-2">Bases — South Africa</h4>
      <svg
        ref={svgRef}
        viewBox={`0 0 ${W} ${H}`}
        className={`globe-svg ${panning ? 'panning' : ''}`}
        onWheel={onWheel}
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={endPan}
        onMouseLeave={endPan}
      >
        <defs>
          <radialGradient id="glow" cx="50%" cy="45%" r="60%">
            <stop offset="0%" stopColor="#1a1f2a" />
            <stop offset="70%" stopColor="#0f141b" />
            <stop offset="100%" stopColor="#0b0f14" />
          </radialGradient>
          <linearGradient id="grid" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="rgba(255,255,255,0.08)" />
            <stop offset="100%" stopColor="rgba(255,255,255,0.04)" />
          </linearGradient>
          <filter id="softShadow" x="-50%" y="-50%" width="200%" height="200%">
            <feDropShadow dx="0" dy="8" stdDeviation="12" floodOpacity="0.35" floodColor="#000" />
          </filter>
        </defs>

        <g transform={`translate(${tx} ${ty}) scale(${scale})`}>
          {/* map background */}
          <rect x="0" y="0" width={W} height={H} fill="url(#glow)" />
          {/* South Africa silhouette */}
          <path d={saPath} fill="rgba(255,255,255,0.06)" stroke="rgba(255,255,255,0.22)" strokeWidth="1.2" filter="url(#softShadow)" />

          {/* markers */}
          {bases.map((b) => {
            const c = coords[b.name];
            if (!c) return null;
            const { x, y } = project(c.lon, c.lat);
            // leader line direction points outward from centroid of silhouette
            const centerX = W/2, centerY = H/2;
            const angle = Math.atan2(y - centerY, x - centerX);
            const lx = x + 12 * Math.cos(angle);
            const ly = y + 12 * Math.sin(angle);
            const info = countsByReady[b.name] || { total: 0, Ready: 0, Pending: 0, 'Not Ready': 0 };
            return (
            <g
              key={b.name}
              className="marker"
              onClick={() => setSelected(b.name)}
              onMouseEnter={() => setHovered(b.name)}
              onMouseLeave={() => setHovered(null)}
            >
              {hovered === b.name || selected === b.name ? (
                <circle cx={x} cy={y} r={9} fill="none" stroke="#00e676" strokeWidth="2" opacity="0.9" />
              ) : null}
              <circle cx={x} cy={y} r={6} fill={hovered === b.name || selected === b.name ? '#00e676' : '#30d158'} stroke="#0b0f14" strokeWidth="2" filter="url(#softShadow)" />
              <line x1={x} y1={y} x2={lx} y2={ly} stroke="rgba(255,255,255,0.25)" />
              <text x={lx + 6} y={ly + 4} fill="#fff" fontSize="12" className="marker-label" style={{ fontWeight: hovered === b.name || selected === b.name ? 700 : 500 }}>{b.name}</text>
              <title>{`${b.name}\nTotal: ${info.total}\nReady: ${info.Ready}  Pending: ${info.Pending}  Not Ready: ${info['Not Ready']}`}</title>
            </g>
            );
          })}
        </g>
      </svg>

      {selected && (() => {
        const info = countsByReady[selected] || { total: 0, Ready: 0, Pending: 0, 'Not Ready': 0 };
        return (
          <div className="globe-selected mt-2">
            <span className="me-2 text-white-50">Selected:</span>
            <strong>{selected}</strong>
            <span className="ms-3">Total: {info.total}</span>
            <span className="ms-3 text-success">Ready: {info.Ready}</span>
            <span className="ms-3 text-warning">Pending: {info.Pending}</span>
            <span className="ms-3 text-danger">Not Ready: {info['Not Ready']}</span>
          </div>
        );
      })()}
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

  const [selectedBase, setSelectedBase] = useState(null);

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

  // Detailed readiness counts per base (for the summary banner)
  const countsByBaseDetailed = useMemo(() => {
    const by = {};
    for (const p of rows || []) {
      const name = p.baseName || 'Unknown';
      if (!by[name]) by[name] = { total: 0, Ready: 0, Pending: 0, 'Not Ready': 0 };
      by[name].total++;
      const st = String(p.readinessStatus || 'Ready');
      if (by[name][st] !== undefined) by[name][st]++;
    }
    return by;
  }, [rows]);

  const BASE_SUMMARY = {
    'AFB Bloemspruit': 'Rooivalk, Oryx, Agusta',
    'AFB Waterkloof': 'Transport hub: VIP, C-130, C-47TP',
    'AFB Swartkop': 'Heritage & rotary ops',
    'AFB Ysterplaat': 'Maritime/heli support',
    'AFB Hoedspruit': 'Limpopo air ops & support',
    'AFB Langebaanweg': 'Pilot training (PC-7 MkII)',
  };

  return (
    <div id="bases" className="glass-card">
      <h4><FaMapMarkedAlt className="me-2" />Bases</h4>

      {/* Google vector/tilt map (with fallback to SVG if key is missing) */}
      {/* Try Google Maps if API key present; otherwise OSM (Leaflet) fallback, then globe */}
      <BasesGoogleMap
        rows={rows}
        height={'70vh'}
        onSelect={(name) => setSelectedBase(name)}
        fallback={<BasesOSMMap rows={rows} height={'70vh'} onSelect={(name) => setSelectedBase(name)} fallback={<BasesGlobeCard rows={rows} />} />}
      />

      {selectedBase && (() => {
        const stats = countsByBaseDetailed[selectedBase] || { total: 0, Ready: 0, Pending: 0, 'Not Ready': 0 };
        const assets = BASE_SUMMARY[selectedBase];
        return (
          <div className="base-info-banner mt-3">
            <span className="base-info-name">{selectedBase}</span>
            {assets && <span className="base-info-assets">Assets: <strong>{assets}</strong></span>}
            <span className="base-info-metric">Total: <strong>{stats.total}</strong></span>
            <span className="base-info-metric text-success">Ready: <strong>{stats.Ready}</strong></span>
            <span className="base-info-metric text-warning">Pending: <strong>{stats.Pending}</strong></span>
            <span className="base-info-metric text-danger">Not Ready: <strong>{stats['Not Ready']}</strong></span>
          </div>
        );
      })()}

      {/* Map-only view: base selector and charts removed */}
    </div>
  );
}

function UnitsPanel({ rows }) {
  const units = mockUnits || [];
  const bases = mockBases || [];
  const baseById = useMemo(() => Object.fromEntries(bases.map(b => [b.base_id, b])), [bases]);

  const [query, setQuery] = useState("");
  const [selectedUnit, setSelectedUnit] = useState(null);

  const filteredUnits = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return units;
    return units.filter(u => (u.name || "").toLowerCase().includes(q));
  }, [units, query]);

  const activeUnit = useMemo(() => selectedUnit || filteredUnits[0] || null, [selectedUnit, filteredUnits]);

  const stats = useMemo(() => {
    if (!activeUnit) return null;
    const members = rows.filter(p => (p.unitName || "") === activeUnit.name);
    const total = members.length;
    const ready = members.filter(p => String(p.readinessStatus).toLowerCase() === 'ready').length;
    const pending = members.filter(p => String(p.readinessStatus).toLowerCase() === 'pending').length;
    const notReady = members.filter(p => String(p.readinessStatus).toLowerCase() === 'not ready').length;
    return { total, ready, pending, notReady };
  }, [rows, activeUnit]);

  const UNIT_ASSETS = {
    '17 Squadron': 'Oryx, Rooivalk, Agusta',
    'Command and Control School': 'C2, Training Simulators',
    'Logistics Support Wing': 'Ground Support, Supply',
    'Intelligence Wing': 'ISR, EW Support',
    'Protection Services Unit': 'VIP, Access Control',
    'Air Force Band': 'Ceremonial',
    'Technical Maintenance Wing': 'Aircraft Maintenance',
    'Engineering Directorate': 'Aviation/Software Engineering',
    'Armoury Section': 'Armourers',
    'Legal Services': 'Legal Advisory',
    'Chaplaincy': 'Spiritual Support',
    'Finance Division': 'Finance/Payroll',
    'Corporate Communications': 'Media & Public Affairs',
    'Human Resources': 'HR & Adjutant',
    'Environmental Affairs': 'Environmental Management'
  };

  const location = useMemo(() => {
    if (!activeUnit) return null;
    const base = baseById[activeUnit.base_id];
    if (!base) return null;
    return { base: base.name, city: base.city, province: base.province };
  }, [activeUnit, baseById]);

  return (
    <div id="units" className="glass-card">
      <h4><FaUsers className="me-2" />Units</h4>

      <InputGroup className="mb-3">
        <InputGroup.Text><FaSearch /></InputGroup.Text>
        <FormControl
          placeholder="Search units by name..."
          value={query}
          onChange={(e) => { setQuery(e.target.value); setSelectedUnit(null); }}
        />
      </InputGroup>

      <div className="d-flex flex-wrap gap-2 mb-3">
        {filteredUnits.slice(0, 8).map(u => (
          <button
            key={u.unit_id || u.name}
            className={`btn btn-sm ${activeUnit?.name === u.name ? 'btn-primary' : 'btn-outline-light'}`}
            onClick={() => setSelectedUnit(u)}
          >
            {u.name}
          </button>
        ))}
        {filteredUnits.length === 0 && (
          <span className="text-muted">No units match that search.</span>
        )}
      </div>

      {activeUnit && (
        <div className="unit-info-banner">
          <span className="unit-info-name">{activeUnit.name}</span>
          {location && (
            <span className="unit-info-loc">Location: <strong>{location.city}, {location.province}</strong> <span className="text-white-50">({location.base})</span></span>
          )}
          {stats && (
            <>
              <span className="unit-info-metric">Members: <strong>{stats.total}</strong></span>
              <span className="unit-info-metric text-success">Ready: <strong>{stats.ready}</strong></span>
              <span className="unit-info-metric text-warning">Pending: <strong>{stats.pending}</strong></span>
              <span className="unit-info-metric text-danger">Not Ready: <strong>{stats.notReady}</strong></span>
            </>
          )}
          <span className="unit-info-assets">Specialty/Air Assets: <strong>{UNIT_ASSETS[activeUnit.name] || '—'}</strong></span>
        </div>
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
  const [isEditing, setIsEditing] = useState(false);

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
    setIsEditing(false);
  };
  const onCancel = () => { setForm(initial); setIsEditing(false); };

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
            <Form.Select name="rank" value={form.rank} onChange={onChange} className="auth-input" disabled={!isEditing}>
              <option value="">Select...</option>
              {rankOptions.map(r => (<option key={r} value={r}>{r}</option>))}
            </Form.Select>
          </div>
          <div className="col-md-4">
            <Form.Label className="text-white-50">Readiness</Form.Label>
            <Form.Select name="readinessStatus" value={form.readinessStatus} onChange={onChange} className="auth-input" disabled={!isEditing}>
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
            <Form.Control name="surname" value={form.surname} onChange={onChange} className="auth-input" disabled={!isEditing} />
          </div>

          <div className="col-md-6">
            <Form.Label className="text-white-50">Email</Form.Label>
            <Form.Control type="email" name="email" value={form.email} onChange={onChange} className="auth-input" disabled={!isEditing} />
          </div>
          <div className="col-md-6">
            <Form.Label className="text-white-50">Cellphone</Form.Label>
            <Form.Control name="cellphone" value={form.cellphone} onChange={onChange} className="auth-input" disabled={!isEditing} />
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
              disabled={!isEditing}
            >
              <option value="">Select...</option>
              {mockMusterings.map(m => (<option key={m.code} value={m.code}>{m.name}</option>))}
            </Form.Select>
          </div>
          <div className="col-md-6">
            <Form.Label className="text-white-50">Post Description</Form.Label>
            <Form.Select name="postDescription" value={form.postDescription} onChange={onChange} className="auth-input" disabled={!isEditing}>
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
              disabled={!isEditing}
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
              disabled={!isEditing}
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
            {!isEditing && (
              <Button variant="primary" onClick={() => setIsEditing(true)}>Edit Profile</Button>
            )}
            {isEditing && (
              <>
                <Button variant="primary" onClick={onSave}>Save Changes</Button>
                <Button variant="outline-light" onClick={onCancel}>Cancel</Button>
              </>
            )}
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

        {/* Proposed changes table removed per request */}
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
      <div className="d-flex justify-content-between align-items-center">
        <h4 className="mb-0"><FaUsers className="me-2" />Personnel</h4>
        <Button variant="outline-light" size="sm" onClick={() => {}}>
          Overview
        </Button>
      </div>

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

function DonutChart({ size = 160, thickness = 14, segments = [], label, sublabel }) {
  const radius = (size / 2) - (thickness / 2);
  const circumference = 2 * Math.PI * radius;
  const total = segments.reduce((s, x) => s + x.value, 0) || 1;
  let acc = 0;
  return (
    <div className="donut-chart">
      <svg width={size} height={size} className="chart-svg">
        <g transform={`rotate(-90 ${size / 2} ${size / 2})`}>
          {segments.map((seg, i) => {
            const p = seg.value / total;
            const dash = p * circumference;
            const gap = circumference - dash;
            const offset = -acc * circumference;
            acc += p;
            return (
              <circle
                key={i}
                cx={size / 2}
                cy={size / 2}
                r={radius}
                fill="transparent"
                stroke={seg.color}
                strokeWidth={thickness}
                strokeDasharray={`${dash} ${gap}`}
                strokeDashoffset={offset}
                strokeLinecap="round"
              />
            );
          })}
          {/* track */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="transparent"
            stroke="rgba(255,255,255,0.08)"
            strokeWidth={thickness}
          />
        </g>
        <text x="50%" y="48%" dominantBaseline="middle" textAnchor="middle" fill="#fff" fontSize="22" fontWeight="800">
          {label}
        </text>
        {sublabel && (
          <text x="50%" y="62%" dominantBaseline="middle" textAnchor="middle" fill="rgba(255,255,255,0.7)" fontSize="12">
            {sublabel}
          </text>
        )}
      </svg>
    </div>
  );
}

function Sparkline({ data = [], width = 280, height = 80, color = '#4cafef' }) {
  if (!data.length) data = [0];
  const max = Math.max(...data);
  const min = Math.min(...data);
  const dx = width / Math.max(1, data.length - 1);
  const norm = (v) => {
    if (max === min) return height / 2;
    return height - ((v - min) / (max - min)) * height;
  };
  const d = data.map((v, i) => `${i === 0 ? 'M' : 'L'} ${i * dx} ${norm(v)}`).join(' ');
  const area = `${d} L ${width} ${height} L 0 ${height} Z`;
  return (
    <svg width={width} height={height} className="chart-svg">
      <path d={area} fill={color + '33'} />
      <path d={d} stroke={color} strokeWidth="2" fill="none" />
    </svg>
  );
}

function OverviewPanel({ rows }) {
  const total = rows.length;
  const ready = rows.filter(r => String(r.readinessStatus).toLowerCase() === 'ready').length;
  const pending = rows.filter(r => String(r.readinessStatus).toLowerCase() === 'pending').length;
  const notReady = rows.filter(r => String(r.readinessStatus).toLowerCase() === 'not ready').length;
  const readyPct = total ? Math.round((ready / total) * 100) : 0;
  const deployable = rows.filter(r => r.is_deployable === true).length;
  const activeMusterings = new Set(rows.map(r => r.musteringCode).filter(Boolean)).size;

  // counts by base and by unit
  const countsBy = (key) => rows.reduce((acc, r) => { const k = r[key]; if (!k) return acc; acc[k] = (acc[k] || 0) + 1; return acc; }, {});
  const readyBy = (key) => rows.reduce((acc, r) => { const k = r[key]; if (!k) return acc; if (!acc[k]) acc[k] = { total: 0, ready: 0 }; acc[k].total++; if (String(r.readinessStatus).toLowerCase() === 'ready') acc[k].ready++; return acc; }, {});
  const baseCounts = countsBy('baseName');
  const unitStats = readyBy('unitName');
  const topUnits = Object.entries(unitStats)
    .map(([name, v]) => ({ name, total: v.total, readyPct: v.total ? Math.round((v.ready / v.total) * 100) : 0 }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 6);

  const sparkData = Object.values(baseCounts);

  return (
    <div className="overview-grid">
      {/* Colorful metric tiles (alternate summaries) */}
      <div className="glass-card metric-card metric-amber">
        <div className="d-flex justify-content-between align-items-center">
          <div>
            <div className="metric-label">Pending Readiness</div>
            <div className="metric-value">{pending}</div>
            <div className="metric-sub">Awaiting clearance</div>
          </div>
          <FaHourglassHalf className="metric-icon" />
        </div>
      </div>
      <div className="glass-card metric-card metric-red">
        <div className="d-flex justify-content-between align-items-center">
          <div>
            <div className="metric-label">Not Ready</div>
            <div className="metric-value">{notReady}</div>
            <div className="metric-sub">Requires action</div>
          </div>
          <FaExclamationTriangle className="metric-icon" />
        </div>
      </div>
      <div className="glass-card metric-card metric-green">
        <div className="d-flex justify-content-between align-items-center">
          <div>
            <div className="metric-label">Deployable</div>
            <div className="metric-value">{deployable}</div>
            <div className="metric-sub">Available for deployment</div>
          </div>
          <FaPlane className="metric-icon" />
        </div>
      </div>
      <div className="glass-card metric-card metric-purple">
        <div className="d-flex justify-content-between align-items-center">
          <div>
            <div className="metric-label">Active Musterings</div>
            <div className="metric-value">{activeMusterings}</div>
            <div className="metric-sub">Specializations</div>
          </div>
          <FaLayerGroup className="metric-icon" />
        </div>
      </div>

      {/* Donut + legend */}
      <div className="glass-card donut-card">
        <h4 className="mb-3"><FaBolt className="me-2" />Readiness Overview</h4>
        <div className="chart-row">
          <DonutChart
            size={180}
            thickness={16}
            label={`${readyPct}%`}
            sublabel="Ready"
            segments={[
              { value: ready, color: '#2ecc71' },
              { value: pending, color: '#f1c40f' },
              { value: notReady, color: '#e74c3c' },
            ]}
          />
          <div className="legend">
            <div className="legend-item"><span className="legend-dot" style={{ background: '#2ecc71' }}></span> Ready: {ready}</div>
            <div className="legend-item"><span className="legend-dot" style={{ background: '#f1c40f' }}></span> Pending: {pending}</div>
            <div className="legend-item"><span className="legend-dot" style={{ background: '#e74c3c' }}></span> Not Ready: {notReady}</div>
          </div>
        </div>
      </div>

      {/* Sparkline card */}
      <div className="glass-card sparkline-card">
        <h4 className="mb-3"><GiCompass className="me-2" />Strength by Base</h4>
        <Sparkline data={sparkData} width={320} height={96} color="#1e90ff" />
      </div>

      {/* Top units as cards with readiness bar */}
      <div className="glass-card unit-list-card">
        <h4 className="mb-3"><FaUsers className="me-2" />Top Units</h4>
        {topUnits.length === 0 ? (
          <div className="text-center text-muted">No data</div>
        ) : (
          <div className="unit-card-list">
            {topUnits.map((u) => {
              const barColor = u.readyPct >= 75 ? '#2ecc71' : u.readyPct >= 50 ? '#f1c40f' : '#e74c3c';
              return (
                <div className="unit-card" key={u.name}>
                  <div className="d-flex justify-content-between align-items-center unit-header">
                    <div className="unit-name text-truncate" title={u.name}>{u.name}</div>
                    <div className="unit-strength">{u.total}</div>
                  </div>
                  <div className="unit-bar">
                    <div className="unit-bar-fill" style={{ width: `${u.readyPct}%`, background: barColor }} />
                  </div>
                  <div className="d-flex justify-content-between unit-meta">
                    <span className="text-muted">Readiness</span>
                    <Badge bg={u.readyPct >= 75 ? 'success' : u.readyPct >= 50 ? 'warning' : 'danger'}>{u.readyPct}%</Badge>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { user, logout, isLoading, updateProfile } = useAuth();
  const [profilePic, setProfilePic] = useState(null);
  const [activeFilters, setActiveFilters] = useState({ mustering: [], rank: [], readiness: [] });
  // Default landing tab should be Overview
  const [activeSection, setActiveSection] = useState("overview");

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
            <img src={saafGold} alt="SAAF Logo" className="header-logo" style={{ height: 51, width: "auto", maxWidth: "100%" }}/>
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
          {activeSection === "overview" && (
            <>
              <OverviewPanel rows={rows} />
            </>
          )}

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
            </>
          )}

          {activeSection === "mustering" && (
            <MusteringPanel rows={rows} onRowsChange={setRows} />
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
