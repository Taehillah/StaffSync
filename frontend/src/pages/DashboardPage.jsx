import React, { useEffect, useMemo, useState } from "react";
import {
  Button, Image, Form, Table, InputGroup, FormControl, Badge, Modal
} from "react-bootstrap";
import {
  FaSignOutAlt, FaUserCircle, FaClipboardList, FaUsers, FaMapMarkedAlt,
  FaBolt, FaSearch, FaFileExport, FaPlane, FaCalendarAlt,
  FaUserCheck, FaExchangeAlt
} from "react-icons/fa";
import { GiRank3, GiCompass } from "react-icons/gi";
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

const formatDate = (value) => {
  if (!value) return "Now";
  const d = new Date(`${value}T00:00:00`);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleDateString(undefined, { day: "2-digit", month: "short", year: "numeric" });
};

const daysUntil = (value) => {
  if (!value) return 0;
  const target = new Date(`${value}T00:00:00`);
  if (Number.isNaN(target.getTime())) return 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.max(0, Math.ceil((target - today) / 86400000));
};

const competencyTokens = (person) => (
  person.competencies?.length
    ? person.competencies
    : String(person.post_description || "").split(",")
).map((item) => String(item).trim()).filter(Boolean);

const matchesCompetency = (person, requiredSkill) => {
  const skill = requiredSkill.trim().toLowerCase();
  if (!skill) return true;
  return competencyTokens(person).some((token) => token.toLowerCase().includes(skill));
};

const getUnitCategory = (unitName = "") => {
  if (/2 Squadron|85 Combat Flying School|60 Squadron/i.test(unitName)) return "Combat Systems";
  if (/15 Squadron|16 Squadron|17 Squadron|19 Squadron|22 Squadron|87 Helicopter/i.test(unitName)) return "Helicopter Systems";
  if (/21 Squadron|28 Squadron|35 Squadron|41 Squadron|44 Squadron|C Flight|10 Squadron|10 Squadron/i.test(unitName)) return "Transport, Maritime & Reconnaissance";
  if (/Central Flying|80 Air Navigation|Air Force College|Gymnasium|School|68 Air School/i.test(unitName)) return "Education, Training & Development";
  if (/140 Squadron|142 Squadron|Airspace|Lowveld|Bushveld|Ellisras|JTAC|Terminal Attack|Command and Control/i.test(unitName)) return "Command and Control / Air Defence";
  if (/500 Squadron|501 Squadron|502 Squadron|503 Squadron|504 Squadron|505 Squadron|506 Squadron|508 Squadron|514 Squadron|515 Squadron|516 Squadron|525 Squadron|526 Squadron|Police/i.test(unitName)) return "Security Services";
  if (/Air Servicing|Air Depot|Deployment Support|Tactical Airfield|Mobile Communications|Rapid Deployment|Publications|Photographic|Auction|Band|Procurement|Telecommunications|Electronic Warfare|Cookery|Logistics/i.test(unitName)) return "Logistic Support Services";
  if (/Intelligence|Reconnaissance/i.test(unitName)) return "Operational Support & Intelligence";
  return "Base Support / Administration";
};

const getUnitFunction = (unitName = "") => ({
  "2 Squadron": "Air Superiority | Gripen C/D",
  "15 Squadron": "Rotary | A109 LUH, BK 117, Oryx",
  "15 Squadron - 'C' Flight": "Rotary | BK 117",
  "16 Squadron": "Rotary Attack | Rooivalk",
  "17 Squadron": "Rotary | A109 LUH, Oryx",
  "19 Squadron": "Rotary | A109 LUH, Oryx",
  "21 Squadron": "VIP Transport | BBJ, Falcon, Citation",
  "22 Squadron": "Rotary / Maritime | Oryx, Super Lynx 300",
  "28 Squadron": "Medium Transport | C-130B/BZ Hercules",
  "35 Squadron": "Maritime | C47-TP Turbo Dakota",
  "41 Squadron": "Light Transport | Caravan, King Air, PC-12",
  "44 Squadron": "Light Transport | C 212 Aviocar",
  "60 Squadron": "Heavy Transport",
  "80 Air Navigation School": "Training | Air Navigation",
  "85 Combat Flying School": "Training | Hawk Mk 120",
  "87 Helicopter Flying School": "Training | A109 LUH, BK 117, Oryx",
  "Central Flying School": "Training | PC-7 Mk II",
  "Test Flight and Development Centre": "Logistic Support | Flight test and development",
  "Air Force Command and Control School": "Training | C2, airspace control, telecommunications",
  "Command and Control School": "Training | C2",
  "SA Air Force College": "Training | Air power development",
  "Rapid Deployment Air Operations Team 43": "Logistic Support | Deployable air operations",
  "Rapid Deployment Air Operations Team 46": "Logistic Support | Deployable air operations",
  "Mobile Communications Unit": "Logistic Support | Mobile C2 communications",
  "92 Tactical Airfield Unit": "Logistic Support | Tactical airfield support",
  "Airspace Control Unit": "Air Defence | Airspace control",
  "Lowveld Airspace Control Sector": "Air Defence | Airspace sector control",
  "Bushveld Airspace Control Sector": "Air Defence | Airspace sector control",
  "Electronic Warfare Centre": "Logistic Support | EW capability",
  "Joint Air Reconnaissance Intelligence Centre": "Operational Support & Intelligence",
  "SAAF Telecommunications Centre": "Logistic Support | Telecommunications",
  "SAAF Police": "Security Services",
  "SAAF Band": "Logistic Support | Ceremonial",
  "School of Cookery": "Training | Catering support",
})[unitName] || getUnitCategory(unitName);

const ASSET_CATALOG = {
  aircraft: {
    label: "Current Aircraft",
    type: "SAAF Aircraft",
    icon: FaPlane,
    items: [
      { name: "Oryx", role: "Utility helicopter", squadron: "15, 17, 19, 22 Sqn", posts: ["Pilot Commander", "Co-Pilot", "Armourer", "Aircraft Mechanics", "Avionics", "MSC Tech"] },
      { name: "A109 LUH", role: "Utility helicopter", squadron: "15, 17, 19 Sqn", posts: ["Pilot or Navigator", "Co-Pilot", "Aircraft Mechanic", "Mission Commander"] },
      { name: "BK 117", role: "Utility helicopter", squadron: "15 Sqn / 87 HFS", posts: ["Pilot or Navigator", "Co-Pilot", "Aircraft Mechanic", "Medic"] },
      { name: "Rooivalk", role: "Attack helicopter", squadron: "16 Sqn", posts: ["Pilot or Navigator", "Weapons Systems Operator", "Aircraft Mechanic", "Armourer"] },
      { name: "Super Lynx 300", role: "Maritime / ASW helicopter", squadron: "22 Sqn", posts: ["Pilot or Navigator", "Co-Pilot", "Electronic Warfare", "Aircraft Mechanic"] },
      { name: "Gripen C", role: "Multi-role fighter", squadron: "2 Sqn", posts: ["Pilot or Navigator", "Aircraft Mechanic", "Armourer", "Mission Control"] },
      { name: "Gripen D", role: "Multi-role fighter / trainer", squadron: "2 Sqn", posts: ["Pilot or Navigator", "Co-Pilot", "Aircraft Mechanic", "Armourer"] },
      { name: "C-130B/BZ Hercules", role: "Medium transport", squadron: "28 Sqn", posts: ["Pilot or Navigator", "Co-Pilot", "Flight Engineer", "Loadmaster", "Aircraft Mechanic"] },
      { name: "C47-TP Turbo Dakota", role: "Light transport", squadron: "35 Sqn", posts: ["Pilot or Navigator", "Co-Pilot", "Flight Engineer", "Aircraft Mechanic"] },
      { name: "C 212 Aviocar", role: "Light transport", squadron: "44 Sqn", posts: ["Pilot or Navigator", "Co-Pilot", "Aircraft Mechanic", "Loadmaster"] },
      { name: "208 Caravan", role: "Light transport", squadron: "41 Sqn", posts: ["Pilot or Navigator", "Co-Pilot", "Aircraft Mechanic"] },
      { name: "PC-12", role: "Light transport", squadron: "41 Sqn", posts: ["Pilot or Navigator", "Co-Pilot", "Aircraft Mechanic"] },
      { name: "B200C Super King Air", role: "Transport", squadron: "41 Sqn", posts: ["Pilot or Navigator", "Co-Pilot", "Aircraft Mechanic"] },
      { name: "300 Super King Air", role: "Transport", squadron: "41 Sqn", posts: ["Pilot or Navigator", "Co-Pilot", "Aircraft Mechanic"] },
      { name: "PC-7 Mk II Astra", role: "Training", squadron: "Central Flying School", posts: ["Pilot or Navigator", "Instructor", "Aircraft Mechanic"] },
      { name: "Hawk Mk 120", role: "Training", squadron: "85 CFS / TFDC", posts: ["Pilot or Navigator", "Instructor", "Aircraft Mechanic", "Armourer"] },
      { name: "Boeing 737-7ED BBJ", role: "VIP transport", squadron: "21 Sqn", posts: ["Pilot or Navigator", "Co-Pilot", "Aircraft Mechanic", "VIP protector"] },
      { name: "Falcon 50", role: "VIP transport", squadron: "21 Sqn", posts: ["Pilot or Navigator", "Co-Pilot", "Aircraft Mechanic", "VIP protector"] },
      { name: "Falcon 900B", role: "VIP transport", squadron: "21 Sqn", posts: ["Pilot or Navigator", "Co-Pilot", "Aircraft Mechanic", "VIP protector"] },
      { name: "550/1 Citation II", role: "VIP transport", squadron: "21 Sqn", posts: ["Pilot or Navigator", "Co-Pilot", "Aircraft Mechanic", "VIP protector"] },
    ],
  },
  land: {
    label: "Ground Support Vehicles",
    type: "Airfield / Base Support",
    icon: FaMapMarkedAlt,
    items: [
      { name: "Supreme Buffalo 6x6 Fire Tender", role: "Emergency response", squadron: "Base Support / Fire Section", posts: ["Driver", "Fire Fighter", "Vehicle Mechanic"] },
      { name: "Supreme Buffalo 8x8 Fire Tender", role: "Emergency response", squadron: "Base Support / Fire Section", posts: ["Driver", "Fire Fighter", "Vehicle Mechanic"] },
      { name: "Bush Panther 6x6 Fire Tender", role: "Emergency response", squadron: "Base Support / Fire Section", posts: ["Driver", "Fire Fighter", "Vehicle Mechanic"] },
      { name: "Bush Panther 8x8 Fire Tender", role: "Emergency response", squadron: "Base Support / Fire Section", posts: ["Driver", "Fire Fighter", "Vehicle Mechanic"] },
      { name: "Cobra 6x6 Fire Tender", role: "Emergency response", squadron: "Base Support / Fire Section", posts: ["Driver", "Fire Fighter", "Vehicle Mechanic"] },
      { name: "Jumbo Cheetah 4x4 Fire Tender", role: "Emergency response", squadron: "Base Support / Fire Section", posts: ["Driver", "Fire Fighter", "Vehicle Mechanic"] },
      { name: "Mercedes Rescue Vehicle", role: "Emergency rescue", squadron: "Base Support / Fire Section", posts: ["Driver", "Fire Fighter", "Vehicle Mechanic"] },
      { name: "Magirus Response Vehicle", role: "Emergency response", squadron: "Base Support / Fire Section", posts: ["Driver", "Fire Fighter", "Vehicle Mechanic"] },
      { name: "Nissan Emergency Bakkie", role: "Emergency response", squadron: "Base Support / Fire Section", posts: ["Driver", "Fire Fighter"] },
      { name: "Mercedes Fuel Bowser", role: "Aviation fuel support", squadron: "Air Servicing Unit", posts: ["Driver", "Vehicle Mechanic", "Storeman", "Fire Fighter"] },
      { name: "Aircraft Tug", role: "Aircraft ground movement", squadron: "Air Servicing Unit", posts: ["Driver", "Aircraft Mechanic", "Flightline Controller"] },
      { name: "Clark Tractor", role: "Ground handling", squadron: "Air Servicing Unit", posts: ["Driver", "Vehicle Mechanic", "Aircraft Mechanic"] },
      { name: "Ford Tractor", role: "Ground handling", squadron: "Air Servicing Unit", posts: ["Driver", "Vehicle Mechanic", "Aircraft Mechanic"] },
      { name: "Bomb Loader", role: "Weapons loading support", squadron: "Armament / Weapons Section", posts: ["Armourer", "Driver", "Aircraft Mechanic"] },
      { name: "SAMIL 20", role: "Security / light support", squadron: "Security Services", posts: ["Driver", "Vehicle Mechanic", "Military Police"] },
      { name: "TC 4", role: "Troop / utility vehicle", squadron: "Ground support", posts: ["Driver", "Vehicle Mechanic", "Logcell", "Military Police"] },
      { name: "TC 2", role: "Troop / utility vehicle", squadron: "Ground support", posts: ["Driver", "Vehicle Mechanic", "Logcell"] },
      { name: "SAMIL 100", role: "Heavy logistics truck", squadron: "Logistics", posts: ["Driver", "Vehicle Mechanic", "Storeman", "Logcell"] },
      { name: "Kwe", role: "Protected mobility / support", squadron: "Protection", posts: ["Driver", "Vehicle Mechanic", "Access Control", "VIP protector"] },
    ],
  },
  deployment: {
    label: "Deployment Support",
    type: "18 DSU / Mobile Deployment",
    icon: FaClipboardList,
    items: [
      { name: "Low-bed Trailer", role: "Heavy equipment movement", squadron: "18 Deployment Support Unit", posts: ["Driver", "Vehicle Mechanic", "Logcell", "Storeman"] },
      { name: "10 t Truck", role: "Deployable transport", squadron: "18 Deployment Support Unit", posts: ["Driver", "Vehicle Mechanic", "Logcell"] },
      { name: "20 t Truck", role: "Deployable transport", squadron: "18 Deployment Support Unit", posts: ["Driver", "Vehicle Mechanic", "Logcell"] },
      { name: "30 t Truck", role: "Heavy deployable transport", squadron: "18 Deployment Support Unit", posts: ["Driver", "Vehicle Mechanic", "Logcell"] },
      { name: "Water Tanker", role: "Field water sustainment", squadron: "18 Deployment Support Unit", posts: ["Driver", "Vehicle Mechanic", "Logcell", "Storeman"] },
      { name: "Light Pick-up Vehicle", role: "Light field movement", squadron: "18 Deployment Support Unit", posts: ["Driver", "Vehicle Mechanic", "Logcell"] },
      { name: "Trailer Fleet", role: "Field stores movement", squadron: "18 Deployment Support Unit", posts: ["Driver", "Vehicle Mechanic", "Storeman"] },
      { name: "Mobile Pantry", role: "Deployable feeding support", squadron: "18 Deployment Support Unit", posts: ["Catering", "Storeman", "Driver"] },
      { name: "Containerised Refrigerated Facility", role: "Cold-chain field stores", squadron: "18 Deployment Support Unit", posts: ["Storeman", "Catering", "Driver", "Vehicle Mechanic"] },
      { name: "Mobile Toilets", role: "Field sanitation", squadron: "18 Deployment Support Unit", posts: ["Logcell", "Storeman", "Driver"] },
      { name: "Tentage and Bedding Pack", role: "Deployable accommodation", squadron: "18 Deployment Support Unit", posts: ["Storeman", "Logcell", "Driver"] },
      { name: "Field Kitchen and Mess Capability", role: "Sustainment and feeding", squadron: "18 Deployment Support Unit", posts: ["Catering", "Storeman", "Procurement", "Driver"] },
      { name: "Freezer and Basic Stores Pack", role: "Field stores sustainment", squadron: "18 Deployment Support Unit", posts: ["Storeman", "Catering", "Logcell"] },
    ],
  },
  uav: {
    label: "UAV / Reconnaissance",
    type: "Reconnaissance / Targeting",
    icon: FaUserCheck,
    items: [
      { name: "Seeker 400", role: "Reconnaissance / utility UAV", squadron: "10 Sqn", posts: ["UAV Operator", "Mission Control", "Electronic Warfare", "Int", "Software Engineer"] },
      { name: "Tactical Mini UAV", role: "Forward reconnaissance", squadron: "Deployable detachment", posts: ["UAV Operator", "Int", "Electronic Warfare", "Comms"] },
      { name: "Training UAV", role: "Operator training", squadron: "Training", posts: ["UAV Operator", "Instructor", "Software Engineer"] },
    ],
  },
  assets: {
    label: "Air Defence & C2 Assets",
    type: "Command and Control",
    icon: FaClipboardList,
    items: [
      { name: "Mobile Radar", role: "Air picture / surveillance", squadron: "Radar / C2", posts: ["Radar", "Mission Control", "Comms", "Electronic Warfare"] },
      { name: "Air Defence Radar", role: "Air defence sensor", squadron: "C2", posts: ["Radar", "Mission Control", "Electronic Warfare", "Software Engineer"] },
      { name: "Deployable Comms Node", role: "Command communications", squadron: "C2 / Comms", posts: ["Telecommunications Operator", "Comms", "Mission Control", "Software Engineer"] },
      { name: "Mobile Operations Centre", role: "Forward command post", squadron: "C2", posts: ["Mission Control", "OPS", "Telecommunications Operator", "Comms", "Int"] },
      { name: "Ground Support Equipment", role: "Flightline support", squadron: "Air servicing", posts: ["Aircraft Mechanic", "Flight Engineer", "Storeman"] },
      { name: "Field Catering Pack", role: "Sustainment", squadron: "Supply support", posts: ["Catering", "Storeman", "Procurement"] },
    ],
  },
};

const postAliases = {
  "Pilot Commander": ["pilot", "navigator", "mission commander"],
  "Pilot or Navigator": ["pilot", "navigator"],
  "Co-Pilot": ["pilot", "navigator", "co-pilot"],
  "Aircraft Engineer": ["aircraft mechanic", "aeronotical engineer", "flight engineer"],
  "Aircraft Mechanic": ["aircraft mechanic", "motor mechanic", "flight engineer"],
  "Aircraft Mechanics": ["aircraft mechanic", "aircraft mechanics", "flight engineer", "motor mechanic"],
  "Avionics": ["avionics", "electronic warfare", "comms", "radar", "software engineer"],
  "MSC Tech": ["msc tech", "aircraft mechanic", "flight engineer", "storeman", "technical"],
  "Telecommunications Operator": ["telecommunications operator", "telecommunications", "comms", "mission control"],
  "Flight Engineer": ["flight engineer", "aircraft mechanic"],
  "Mission Commander": ["mission control", "ops", "career management"],
  "Weapons Systems Operator": ["armourer", "electronic warfare", "mission control"],
  "Loadmaster": ["storeman", "logcell", "procurement"],
  "Medic": ["fire fighter", "catering"],
  "Driver": ["driver", "military police", "access control"],
  "Vehicle Mechanic": ["motor mechanic", "aircraft mechanic"],
  "UAV Operator": ["int", "electronic warfare", "software engineer", "mission control"],
  "Flightline Controller": ["aircraft mechanic", "flight engineer", "mission control"],
};

const memberMatchesPost = (member, post) => {
  const haystack = competencyTokens(member).join(" ").toLowerCase();
  const aliases = [post, ...(postAliases[post] || [])].map(item => item.toLowerCase());
  return aliases.some(alias => haystack.includes(alias) || alias.includes(haystack));
};

function SidebarNavigation({ active, onNavigate }) {
  const item = (key, label, Icon) => (
    <li className="nav-item">
      <button
        type="button"
        className={`nav-link ${active === key ? "active" : ""}`}
        onClick={() => onNavigate(key)}
      >
        <Icon className="nav-icon" /> {label}
      </button>
    </li>
  );
  return (
    <ul className="sidebar-nav glass-card">
      {item("overview", "Force Prep", GiCompass)}
      {item("availability", "Deployment", FaUserCheck)}
      {item("assets", "Assets", FaPlane)}
      {item("personnel", "Muster Roll", GiCompass)}
      {item("mustering", "Mustering", FaClipboardList)}
      {item("bases", "Bases", FaMapMarkedAlt)}
      {item("units", "SAAF Units", FaUsers)}
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
      <h4><FaClipboardList className="me-2" />Mustering and Proficiency</h4>

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
          <div className="mst-col total">Ready</div>
          <div className="mst-col deploy">Deployable</div>
          <div className="mst-col total">Total Members</div>
          <div className="mst-col chart">Availability</div>
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
          const availableCount = filteredMembers.filter(p => (
            p.is_deployable === true
            && String(p.readinessStatus).toLowerCase() === 'ready'
            && String(p.availabilityStatus || 'Available').toLowerCase() === 'available'
          )).length;
          const availablePct = total ? Math.round((availableCount / total) * 100) : 0;
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
              <div className="mst-col total">{ready}</div>
              <div className="mst-col deploy">{deployable}</div>
              <div className="mst-col total">{total}</div>
              <div className="mst-col chart">
                <div className="capacity-bar" aria-label={`${availablePct}% available`}>
                  <span style={{ width: `${availablePct}%` }} />
                </div>
                <small>{availableCount} available</small>
              </div>
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
    'AFB Durban': { lat: -29.97, lon: 30.95 },
    'AFS Port Elizabeth': { lat: -33.98, lon: 25.61 },
    'AFB Overberg': { lat: -34.55, lon: 20.25 },
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
      <div className="locations-title-row">
        <div>
          <h4 className="mb-1">South Africa Air Bases</h4>
          <div className="text-muted">Dark terrain fallback with operational readiness markers.</div>
        </div>
      </div>
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
          <radialGradient id="glow" cx="48%" cy="35%" r="72%">
            <stop offset="0%" stopColor="#172d38" />
            <stop offset="64%" stopColor="#0a141b" />
            <stop offset="100%" stopColor="#05090d" />
          </radialGradient>
          <linearGradient id="landShade" x1="0" x2="1" y1="0" y2="1">
            <stop offset="0%" stopColor="#1e4752" />
            <stop offset="48%" stopColor="#17323c" />
            <stop offset="100%" stopColor="#0b1a22" />
          </linearGradient>
          <pattern id="terrainGrid" width="34" height="34" patternUnits="userSpaceOnUse">
            <path d="M 34 0 L 0 0 0 34" fill="none" stroke="rgba(120,190,210,0.08)" strokeWidth="1" />
          </pattern>
          <filter id="softShadow" x="-50%" y="-50%" width="200%" height="200%">
            <feDropShadow dx="0" dy="18" stdDeviation="18" floodOpacity="0.55" floodColor="#000" />
          </filter>
          <filter id="markerLift" x="-100%" y="-100%" width="300%" height="300%">
            <feDropShadow dx="0" dy="9" stdDeviation="6" floodOpacity="0.58" floodColor="#000" />
          </filter>
        </defs>

        <g transform={`translate(${tx} ${ty}) scale(${scale})`}>
          <rect x="0" y="0" width={W} height={H} fill="url(#glow)" />
          <rect x="0" y="0" width={W} height={H} fill="url(#terrainGrid)" opacity="0.9" />
          <ellipse cx={W / 2} cy={H - 24} rx="230" ry="24" fill="rgba(0,0,0,0.34)" />
          <path d={saPath} transform="translate(10 14)" fill="#061016" opacity="0.82" />
          <path d={saPath} transform="translate(5 7)" fill="#0b1b22" opacity="0.95" />
          <path d={saPath} fill="url(#landShade)" stroke="rgba(126,214,232,0.55)" strokeWidth="1.4" filter="url(#softShadow)" />
          <path d={saPath} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="5" />

          {bases.map((b) => {
            const c = coords[b.name];
            if (!c) return null;
            const { x, y } = project(c.lon, c.lat);
            const labelOffset = {
              'AFB Waterkloof': { dx: 18, dy: -34 },
              'AFB Swartkop': { dx: 18, dy: 18 },
            }[b.name];
            // leader line direction points outward from centroid of silhouette
            const centerX = W/2, centerY = H/2;
            const angle = Math.atan2(y - centerY, x - centerX);
            const lx = labelOffset ? x + labelOffset.dx : x + 12 * Math.cos(angle);
            const ly = labelOffset ? y + labelOffset.dy : y + 12 * Math.sin(angle);
            const info = countsByReady[b.name] || { total: 0, Ready: 0, Pending: 0, 'Not Ready': 0 };
            return (
            <g
              key={b.name}
              className="marker"
              onClick={() => setSelected(b.name)}
              onMouseEnter={() => setHovered(b.name)}
              onMouseLeave={() => setHovered(null)}
            >
              <line x1={x} y1={y + 20} x2={x} y2={y + 5} stroke="rgba(94,234,212,0.52)" strokeWidth="2" />
              <ellipse cx={x} cy={y + 22} rx="14" ry="5" fill="rgba(0,0,0,0.38)" />
              <circle cx={x} cy={y} r={hovered === b.name || selected === b.name ? 15 : 12} fill="rgba(79,195,247,0.18)" stroke="rgba(129,212,250,0.25)" />
              <circle cx={x} cy={y} r="6.5" fill={hovered === b.name || selected === b.name ? '#80deea' : '#4fc3f7'} stroke="#071016" strokeWidth="2" filter="url(#markerLift)" />
              <circle cx={x - 2} cy={y - 2} r="2.2" fill="rgba(255,255,255,0.85)" />
              <line x1={x} y1={y} x2={lx} y2={ly} stroke="rgba(180,230,245,0.35)" />
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
  const [selectedBase, setSelectedBase] = useState(null);

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
    'AFB Durban': 'Coastal support & air movement',
    'AFS Port Elizabeth': 'Eastern Cape air support',
    'AFB Overberg': 'TFDC: test, development & evaluation',
  };

  return (
    <div id="bases" className="glass-card">
      <h4><FaMapMarkedAlt className="me-2" />Current SAAF Bases and Stations</h4>

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
  const units = useMemo(() => mockUnits || [], []);
  const bases = useMemo(() => mockBases || [], []);
  const baseById = useMemo(() => Object.fromEntries(bases.map(b => [b.base_id, b])), [bases]);

  const [query, setQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [selectedUnit, setSelectedUnit] = useState(null);

  const unitCategories = useMemo(() => (
    ["All", ...Array.from(new Set(units.map(unit => getUnitCategory(unit.name)))).sort()]
  ), [units]);

  const filteredUnits = useMemo(() => {
    const q = query.trim().toLowerCase();
    return units.filter(u => {
      if (categoryFilter !== "All" && getUnitCategory(u.name) !== categoryFilter) return false;
      if (!q) return true;
      return [u.name, getUnitCategory(u.name), getUnitFunction(u.name)]
        .join(" ")
        .toLowerCase()
        .includes(q);
    });
  }, [units, query, categoryFilter]);

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

  const location = useMemo(() => {
    if (!activeUnit) return null;
    const base = baseById[activeUnit.base_id];
    if (!base) return null;
    return { base: base.name, city: base.city, province: base.province };
  }, [activeUnit, baseById]);

  return (
    <div id="units" className="glass-card">
      <h4><FaUsers className="me-2" />Current SAAF Units</h4>

      <div className="unit-category-tabs mb-3">
        {unitCategories.map(category => (
          <button
            key={category}
            className={`unit-category-tab ${categoryFilter === category ? "active" : ""}`}
            onClick={() => { setCategoryFilter(category); setSelectedUnit(null); }}
            type="button"
          >
            {category}
          </button>
        ))}
      </div>

      <InputGroup className="mb-3">
        <InputGroup.Text><FaSearch /></InputGroup.Text>
        <FormControl
          placeholder="Search by unit, role, aircraft, or function..."
          value={query}
          onChange={(e) => { setQuery(e.target.value); setSelectedUnit(null); }}
        />
      </InputGroup>

      <div className="d-flex flex-wrap gap-2 mb-3">
        {filteredUnits.map(u => (
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
          <span className="unit-info-assets">System Group: <strong>{getUnitCategory(activeUnit.name)}</strong></span>
          <span className="unit-info-assets">Role / Aircraft / Function: <strong>{getUnitFunction(activeUnit.name)}</strong></span>
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

  const initial = useMemo(() => ({
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
  }), [user, match]);

  const [form, setForm] = useState(initial);
  useEffect(() => { setForm(initial); }, [initial]);
  const [isEditing, setIsEditing] = useState(false);

  // Rank options (as requested)
  const rankOptions = [
    "Gen", "Lt Gen", "Maj Gen", "Brig Gen", "Col", "Lt Col", "Maj", "Capt", "Lt", "2Lt",
    "SCMWO", "CMWO", "MWO", "WO1", "WO2", "FSgt", "Sgt", "Cpl", "LCpl", "Amn",
    "Mrs", "Mr", "Ms"
  ];

  // Post Description options (global list as requested)
  const postDescriptionOptions = [
    "Pilot or Navigator", "OPS", "Comms", "Radar", "ATC", "Mission Control", "Telecommunications Operator", "Career Management",
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

function AvailabilityPanel({ rows, onOpen }) {
  const skillOptions = useMemo(() => {
    const values = new Set();
    rows.forEach((person) => competencyTokens(person).forEach((token) => values.add(token)));
    return Array.from(values).sort((a, b) => a.localeCompare(b));
  }, [rows]);

  const [filters, setFilters] = useState({
    skill: "",
    mustering: "All",
    base: "All",
    duration: 14,
    neededFrom: new Date().toISOString().slice(0, 10),
  });

  const baseOptions = useMemo(() => Array.from(new Set(rows.map(r => r.baseName).filter(Boolean))).sort(), [rows]);

  const filteredRows = useMemo(() => {
    return rows.filter((person) => {
      if (filters.mustering !== "All" && (person.musteringCode || person.mustering_code) !== filters.mustering) return false;
      if (filters.base !== "All" && person.baseName !== filters.base) return false;
      return matchesCompetency(person, filters.skill);
    });
  }, [rows, filters]);

  const available = useMemo(() => {
    const requestedStart = new Date(`${filters.neededFrom}T00:00:00`);
    return filteredRows
      .filter((person) => {
        const availableFrom = new Date(`${person.availableFrom || filters.neededFrom}T00:00:00`);
        return person.is_deployable === true
          && String(person.readinessStatus).toLowerCase() === "ready"
          && availableFrom <= requestedStart
          && Number(person.maxDeploymentDays || 0) >= Number(filters.duration || 0);
      })
      .sort((a, b) => String(a.baseName).localeCompare(String(b.baseName)) || String(a.surname).localeCompare(String(b.surname)));
  }, [filteredRows, filters]);

  const unavailable = useMemo(() => {
    return filteredRows
      .filter((person) => !available.includes(person))
      .sort((a, b) => daysUntil(a.availableFrom) - daysUntil(b.availableFrom))
      .slice(0, 10);
  }, [filteredRows, available]);

  const standInsByMember = useMemo(() => {
    const availablePool = rows.filter((candidate) => (
      candidate.is_deployable === true
      && String(candidate.readinessStatus).toLowerCase() === "ready"
      && Number(candidate.maxDeploymentDays || 0) >= Number(filters.duration || 0)
    ));

    const scoreCandidate = (member, candidate) => {
      if (member.force_number === candidate.force_number) return -1;
      const memberSkills = competencyTokens(member).map((item) => item.toLowerCase());
      const candidateSkills = competencyTokens(candidate).map((item) => item.toLowerCase());
      const skillOverlap = candidateSkills.filter((skill) => memberSkills.some((required) => skill.includes(required) || required.includes(skill))).length;
      let score = skillOverlap * 4;
      if ((member.musteringCode || member.mustering_code) === (candidate.musteringCode || candidate.mustering_code)) score += 3;
      if (member.baseName === candidate.baseName) score += 2;
      if (matchesCompetency(candidate, filters.skill)) score += 2;
      return score;
    };

    return Object.fromEntries(unavailable.map((member) => {
      const standIns = availablePool
        .map((candidate) => ({ ...candidate, matchScore: scoreCandidate(member, candidate) }))
        .filter((candidate) => candidate.matchScore > 0)
        .sort((a, b) => b.matchScore - a.matchScore || String(a.surname).localeCompare(String(b.surname)))
        .slice(0, 3);
      return [member.force_number, standIns];
    }));
  }, [rows, unavailable, filters]);

  const updateFilter = (name, value) => setFilters(prev => ({ ...prev, [name]: value }));

  return (
    <div id="availability" className="glass-card availability-panel">
      <div className="availability-header">
        <div>
          <h4 className="mb-1"><FaUserCheck className="me-2" />Deployment Availability</h4>
          <div className="text-muted">Find combat-ready members by mustering, base, deployment window, and post competency.</div>
        </div>
        <div className="availability-metrics">
          <div><strong>{available.length}</strong><span>Available</span></div>
          <div><strong>{unavailable.length}</strong><span>Returning</span></div>
        </div>
      </div>

      <div className="availability-filters">
        <div>
          <Form.Label>Post Competency</Form.Label>
          <Form.Select value={filters.skill} onChange={(e) => updateFilter("skill", e.target.value)}>
            <option value="">Any competency</option>
            {skillOptions.map(skill => <option key={skill} value={skill}>{skill}</option>)}
          </Form.Select>
        </div>
        <div>
          <Form.Label>Mustering / Proficiency</Form.Label>
          <Form.Select value={filters.mustering} onChange={(e) => updateFilter("mustering", e.target.value)}>
            <option value="All">All musterings</option>
            {mockMusterings.map(m => <option key={m.code} value={m.code}>{m.name}</option>)}
          </Form.Select>
        </div>
        <div>
          <Form.Label>Base / Station</Form.Label>
          <Form.Select value={filters.base} onChange={(e) => updateFilter("base", e.target.value)}>
            <option value="All">All bases</option>
            {baseOptions.map(base => <option key={base} value={base}>{base}</option>)}
          </Form.Select>
        </div>
        <div>
          <Form.Label>Needed From</Form.Label>
          <Form.Control type="date" value={filters.neededFrom} onChange={(e) => updateFilter("neededFrom", e.target.value)} />
        </div>
        <div>
          <Form.Label>Days</Form.Label>
          <Form.Control type="number" min="1" max="180" value={filters.duration} onChange={(e) => updateFilter("duration", e.target.value)} />
        </div>
      </div>

      <div className="availability-sections">
        <section>
          <div className="availability-section-title">
            <FaCalendarAlt /> Combat-ready for deployment
          </div>
          <div className="table-responsive">
            <Table hover variant="dark" className="availability-table">
              <thead>
                <tr>
                  <th>Member</th><th>Competencies</th><th>Base</th><th>Available</th><th>Duration</th><th></th>
                </tr>
              </thead>
              <tbody>
                {available.slice(0, 12).map((person) => (
                  <tr key={person.force_number}>
                    <td><strong>{person.rank} {person.surname}</strong><div className="text-muted">{person.force_number}</div></td>
                    <td>{competencyTokens(person).slice(0, 3).join(", ")}</td>
                    <td>{person.baseName}</td>
                    <td><Badge bg="success">Now</Badge></td>
                    <td>{person.maxDeploymentDays} days</td>
                    <td><Button variant="outline-light" size="sm" onClick={() => onOpen(person)}>View</Button></td>
                  </tr>
                ))}
                {available.length === 0 && (
                  <tr><td colSpan={6} className="text-center text-muted">No members match the requested deployment window.</td></tr>
                )}
              </tbody>
            </Table>
          </div>
        </section>

        <section>
          <div className="availability-section-title">
            <FaExchangeAlt /> Unavailable members and stand-ins
          </div>
          <div className="standin-list">
            {unavailable.map((member) => {
              const standIns = standInsByMember[member.force_number] || [];
              return (
                <div className="standin-row" key={member.force_number}>
                  <div className="standin-source">
                    <div className="standin-name">{member.rank} {member.surname}</div>
                    <div className="standin-meta">{member.post_description || member.musteringName} | {member.unavailableReason || member.readinessStatus}</div>
                    <Badge bg="warning" text="dark">Available {formatDate(member.availableFrom)} ({daysUntil(member.availableFrom)} days)</Badge>
                  </div>
                  <div className="standin-candidates">
                    {standIns.length ? standIns.map((candidate) => (
                      <button key={candidate.force_number} className="standin-chip" onClick={() => onOpen(candidate)}>
                        <strong>{candidate.rank} {candidate.surname}</strong>
                        <span>{candidate.post_description || candidate.musteringName}</span>
                        <small>{candidate.baseName} | score {candidate.matchScore}</small>
                      </button>
                    )) : (
                      <span className="text-muted">No suitable stand-in currently available.</span>
                    )}
                  </div>
                </div>
              );
            })}
            {unavailable.length === 0 && (
              <div className="text-center text-muted p-3">No unavailable members for this filter.</div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

function AssetsPlannerPanel({ rows, onOpen }) {
  const [categoryKey, setCategoryKey] = useState("aircraft");
  const category = ASSET_CATALOG[categoryKey];
  const [assetName, setAssetName] = useState(category.items[0]?.name || "");
  const [deploymentType, setDeploymentType] = useState("internal");
  const [assignments, setAssignments] = useState({});

  useEffect(() => {
    const next = ASSET_CATALOG[categoryKey].items[0]?.name || "";
    setAssetName(next);
    setAssignments({});
  }, [categoryKey]);

  const selectedAsset = useMemo(() => (
    category.items.find(item => item.name === assetName) || category.items[0]
  ), [category, assetName]);

  const eligibleMembers = useMemo(() => (
    rows
      .filter(member => {
        const ready = String(member.readinessStatus).toLowerCase() === "ready";
        const deployable = member.is_deployable === true;
        const available = String(member.availabilityStatus || "Available").toLowerCase() === "available";
        if (!(ready && deployable && available)) return false;
        if (deploymentType === "external" && member.is_area_bound) return false;
        return true;
      })
      .sort((a, b) => String(a.surname).localeCompare(String(b.surname)))
  ), [rows, deploymentType]);

  const suggestionsByPost = useMemo(() => {
    const map = {};
    (selectedAsset?.posts || []).forEach(post => {
      map[post] = eligibleMembers
        .map(member => {
          const matchedPost = memberMatchesPost(member, post);
          let score = matchedPost ? 8 : 0;
          if (String(member.post_description || "").toLowerCase() === post.toLowerCase()) score += 4;
          if (deploymentType === "external") {
            const clearance = String(member.security_clearance || member.security_dearance || "").toLowerCase();
            if (clearance.includes("secret")) score += 2;
          }
          if (String(member.baseName || "").toLowerCase().includes("waterkloof")) score += 1;
          return { ...member, matchScore: score };
        })
        .filter(member => member.matchScore > 0)
        .sort((a, b) => b.matchScore - a.matchScore || String(a.surname).localeCompare(String(b.surname)))
        .slice(0, 5);
    });
    return map;
  }, [eligibleMembers, selectedAsset, deploymentType]);

  const assignedMembers = useMemo(() => (
    Object.entries(assignments)
      .map(([post, forceNumber]) => {
        const member = rows.find(item => item.force_number === forceNumber);
        return member ? { post, member } : null;
      })
      .filter(Boolean)
  ), [assignments, rows]);

  const assignMember = (post, forceNumber) => {
    setAssignments(prev => ({ ...prev, [post]: forceNumber }));
  };

  const clearMember = (post) => {
    setAssignments(prev => {
      const next = { ...prev };
      delete next[post];
      return next;
    });
  };

  return (
    <div id="assets" className="asset-planner">
      <section className="glass-card asset-hero">
        <div>
          <div className="hero-kicker">SAAF Assets</div>
          <div className="hero-title">Aircraft, Vehicles and C2 Asset Planner</div>
          <div className="hero-sub">Select current aircraft, deployable support vehicles, UAV/reconnaissance platforms, or C2 assets and fill required posts with combat-ready members.</div>
        </div>
        <div className="deployment-toggle">
          <Button variant={deploymentType === "internal" ? "primary" : "outline-light"} onClick={() => setDeploymentType("internal")}>Internal</Button>
          <Button variant={deploymentType === "external" ? "primary" : "outline-light"} onClick={() => setDeploymentType("external")}>External</Button>
        </div>
      </section>

      <section className="asset-tabs">
        {Object.entries(ASSET_CATALOG).map(([key, item]) => {
          const Icon = item.icon;
          return (
            <button key={key} className={`asset-tab ${categoryKey === key ? "active" : ""}`} onClick={() => setCategoryKey(key)}>
              <Icon />
              <span>{item.label}</span>
              <small>{item.type}</small>
            </button>
          );
        })}
      </section>

      <section className="asset-layout">
        <div className="glass-card asset-list-panel">
          <div className="summary-card-header">
            <h4>{category.label}</h4>
            <span className="summary-chip">{category.items.length} listed</span>
          </div>
          <div className="asset-list">
            {category.items.map(item => (
              <button key={item.name} className={`asset-item ${selectedAsset?.name === item.name ? "active" : ""}`} onClick={() => { setAssetName(item.name); setAssignments({}); }}>
                <strong>{item.name}</strong>
                <span>{item.role}</span>
                <small>{item.squadron}</small>
              </button>
            ))}
          </div>
        </div>

        <div className="glass-card post-fill-panel">
          <div className="summary-card-header">
            <h4>{selectedAsset?.name}</h4>
            <span className="summary-chip">{selectedAsset?.posts.length || 0} posts</span>
          </div>
          <div className="asset-context">
            <span>Role: <strong>{selectedAsset?.role}</strong></span>
            <span>Unit: <strong>{selectedAsset?.squadron}</strong></span>
            <span>Deployment: <strong>{deploymentType}</strong></span>
          </div>

          <div className="post-grid">
            {(selectedAsset?.posts || []).map(post => {
              const suggestions = suggestionsByPost[post] || [];
              const assignedForce = assignments[post] || "";
              const assigned = rows.find(member => member.force_number === assignedForce);
              return (
                <div className="post-card" key={post}>
                  <div className="post-card-header">
                    <div>
                      <strong>{post}</strong>
                      <span>{assigned ? `${assigned.rank} ${assigned.surname}` : "Open post"}</span>
                    </div>
                    {assigned && <Button variant="outline-light" size="sm" onClick={() => clearMember(post)}>Clear</Button>}
                  </div>

                  <Form.Select value={assignedForce} onChange={(event) => assignMember(post, event.target.value)}>
                    <option value="">Nominate member...</option>
                    {eligibleMembers.map(member => (
                      <option key={member.force_number} value={member.force_number}>
                        {member.rank} {member.surname}, {member.first_name} - {member.post_description || member.musteringName}
                      </option>
                    ))}
                  </Form.Select>

                  <div className="suggestion-list">
                    {suggestions.map(member => (
                      <button key={member.force_number} className="suggestion-row" onClick={() => assignMember(post, member.force_number)}>
                        <span>
                          <strong>{member.rank} {member.surname}</strong>
                          <small>{member.post_description || member.musteringName} | {member.baseName}</small>
                        </span>
                        <Badge bg="success">score {member.matchScore}</Badge>
                      </button>
                    ))}
                    {!suggestions.length && <div className="text-muted">No combat-ready match for this post.</div>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="glass-card manifest-panel">
          <div className="summary-card-header">
            <h4>Deployment Nominal Roll</h4>
            <span className="summary-chip">{assignedMembers.length}/{selectedAsset?.posts.length || 0} filled</span>
          </div>
          <div className="manifest-list">
            {assignedMembers.map(({ post, member }) => (
              <button key={`${post}-${member.force_number}`} className="manifest-row" onClick={() => onOpen(member)}>
                <span>
                  <strong>{post}</strong>
                  <small>{member.rank} {member.surname}, {member.first_name}</small>
                </span>
                <Badge bg="info">{member.force_number}</Badge>
              </button>
            ))}
            {!assignedMembers.length && <div className="text-muted">No posts filled yet.</div>}
          </div>
        </div>
      </section>
    </div>
  );
}

function PersonnelOverview({ rows, onOpen, searchTerm, setSearchTerm, page, pageSize, setPage }) {
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

    return data;
  }, [rows, searchTerm]);

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
        <h4 className="mb-0"><FaUsers className="me-2" />Personnel Muster Roll</h4>
        <Button variant="outline-light" size="sm" onClick={() => exportPersonnelToCSV(filtered, "personnel_filtered.csv")} disabled={!filtered.length}>
          <FaFileExport className="me-1" /> Export
        </Button>
      </div>

      <InputGroup className="mb-3">
        <InputGroup.Text><FaSearch /></InputGroup.Text>
        <FormControl
          placeholder="Search force number, rank, mustering, unit, or base..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </InputGroup>

      <div className="table-responsive">
        <Table striped hover variant="dark" className="mb-0">
          <thead>
            <tr>
              <th>Force #</th><th>Rank</th><th>Name</th><th>Mustering</th><th>Unit</th><th>Base / Station</th><th>Combat Readiness</th><th>Actions</th>
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

function DonutChart({ size = 160, thickness = 14, segments = [], label, sublabel }) {
  const radius = (size / 2) - (thickness / 2);
  const circumference = 2 * Math.PI * radius;
  const total = segments.reduce((s, x) => s + x.value, 0) || 1;
  let acc = 0;
  return (
    <div className="donut-chart">
      <svg width={size} height={size} className="chart-svg donut-svg">
        <g transform={`rotate(-90 ${size / 2} ${size / 2})`}>
          <circle
            className="donut-track"
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="transparent"
            stroke="rgba(255,255,255,0.08)"
            strokeWidth={thickness}
          />
          {segments.map((seg, i) => {
            const p = seg.value / total;
            const dash = p * circumference;
            const gap = circumference - dash;
            const offset = -acc * circumference;
            acc += p;
            return (
              <circle
                key={i}
                className="donut-segment-base"
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
        </g>
        <text className="donut-label" x="50%" y="48%" dominantBaseline="middle" textAnchor="middle" fill="#fff" fontSize="22" fontWeight="800">
          {label}
        </text>
        {sublabel && (
          <text className="donut-sublabel" x="50%" y="62%" dominantBaseline="middle" textAnchor="middle" fill="rgba(255,255,255,0.7)" fontSize="12">
            {sublabel}
          </text>
        )}
      </svg>
    </div>
  );
}


function OverviewPanel({ rows, onNavigate, onOpen }) {
  const total = rows.length;
  const ready = rows.filter(r => String(r.readinessStatus).toLowerCase() === 'ready').length;
  const pending = rows.filter(r => String(r.readinessStatus).toLowerCase() === 'pending').length;
  const notReady = rows.filter(r => String(r.readinessStatus).toLowerCase() === 'not ready').length;
  const deployable = rows.filter(r => r.is_deployable === true).length;
  const availableNow = rows.filter(r => (
    r.is_deployable === true
    && String(r.readinessStatus).toLowerCase() === 'ready'
    && String(r.availabilityStatus || 'Available').toLowerCase() === 'available'
  )).length;
  const readyPct = total ? Math.round((ready / total) * 100) : 0;
  const availablePct = total ? Math.round((availableNow / total) * 100) : 0;

  const readinessRows = [
    { label: "Ready", value: ready, tone: "ready" },
    { label: "Pending", value: pending, tone: "pending" },
    { label: "Not Ready", value: notReady, tone: "not-ready" },
  ];

  const baseRows = useMemo(() => {
    const by = {};
    rows.forEach((member) => {
      const name = member.baseName || "Unknown";
      if (!by[name]) by[name] = { name, total: 0, available: 0, deployable: 0 };
      by[name].total++;
      if (member.is_deployable) by[name].deployable++;
      if (member.is_deployable && String(member.readinessStatus).toLowerCase() === "ready") by[name].available++;
    });
    return Object.values(by).sort((a, b) => b.available - a.available || b.total - a.total).slice(0, 6);
  }, [rows]);

  const competencyRows = useMemo(() => {
    const by = {};
    rows.forEach((member) => {
      competencyTokens(member).forEach((skill) => {
        if (!by[skill]) by[skill] = { skill, total: 0, available: 0 };
        by[skill].total++;
        if (member.is_deployable && String(member.readinessStatus).toLowerCase() === "ready") by[skill].available++;
      });
    });
    return Object.values(by).sort((a, b) => b.available - a.available || b.total - a.total).slice(0, 8);
  }, [rows]);

  const returnQueue = useMemo(() => (
    rows
      .filter(member => !(member.is_deployable && String(member.readinessStatus).toLowerCase() === "ready"))
      .sort((a, b) => daysUntil(a.availableFrom) - daysUntil(b.availableFrom))
      .slice(0, 5)
  ), [rows]);

  const noStandIn = useMemo(() => {
    const availablePool = rows.filter(member => member.is_deployable && String(member.readinessStatus).toLowerCase() === "ready");
    return returnQueue.filter(member => {
      const needed = competencyTokens(member).map(skill => skill.toLowerCase());
      return !availablePool.some(candidate => (
        candidate.force_number !== member.force_number
        && competencyTokens(candidate).some(skill => needed.some(required => skill.toLowerCase().includes(required) || required.includes(skill.toLowerCase())))
      ));
    });
  }, [rows, returnQueue]);

  return (
    <div className="command-grid">
      <section className="glass-card command-hero">
        <div>
          <div className="hero-kicker">Force Preparation</div>
          <div className="hero-title">SAAF Deployment Readiness</div>
          <div className="hero-sub">A force-preparation view of available personnel, base capacity, mustering coverage, and stand-in risk.</div>
        </div>
        <div className="command-actions">
          <Button variant="primary" onClick={() => onNavigate("availability")}><FaUserCheck className="me-1" /> Find Deployable Members</Button>
          <Button variant="outline-light" onClick={() => exportPersonnelToCSV(rows, "staffsync_personnel.csv")} disabled={!rows.length}><FaFileExport className="me-1" /> Export</Button>
        </div>
      </section>

      <section className="command-metrics">
        {[
          { label: "Muster Roll", value: total, icon: <FaUsers /> },
          { label: "Combat Ready", value: `${readyPct}%`, icon: <FaBolt /> },
          { label: "Deployable", value: deployable, icon: <FaPlane /> },
          { label: "Available Now", value: availableNow, icon: <FaUserCheck /> },
        ].map((metric) => (
          <div className="metric-tile" key={metric.label}>
            <span>{metric.icon}</span>
            <strong>{metric.value}</strong>
            <small>{metric.label}</small>
          </div>
        ))}
      </section>

      <section className="glass-card command-card readiness-card">
        <div className="summary-card-header">
          <h4>Combat Readiness Split</h4>
          <span className="summary-chip">{availablePct}% available now</span>
        </div>
        <div className="readiness-layout">
          <DonutChart
            size={160}
            thickness={13}
            label={`${readyPct}%`}
            sublabel="Ready"
            segments={[
              { value: ready, color: 'var(--ready-color)' },
              { value: pending, color: 'var(--pending-color)' },
              { value: notReady, color: 'var(--notready-color)' },
            ]}
          />
          <div className="readiness-bars">
            {readinessRows.map(item => {
              const pct = total ? Math.round((item.value / total) * 100) : 0;
              return (
                <div className="bar-row" key={item.label}>
                  <div><strong>{item.label}</strong><span>{item.value}</span></div>
                  <div className={`capacity-bar ${item.tone}`}><span style={{ width: `${pct}%` }} /></div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="glass-card command-card">
        <div className="summary-card-header">
          <h4>Base / Station Capacity</h4>
          <span className="summary-chip">Available / Total</span>
        </div>
        <div className="base-capacity-list">
          {baseRows.map(base => {
            const pct = base.total ? Math.round((base.available / base.total) * 100) : 0;
            return (
              <div className="base-capacity-row" key={base.name}>
                <div>
                  <strong>{base.name}</strong>
                  <span>{base.available} available of {base.total}</span>
                </div>
                <div className="capacity-bar"><span style={{ width: `${pct}%` }} /></div>
              </div>
            );
          })}
        </div>
      </section>

      <section className="glass-card command-card">
        <div className="summary-card-header">
          <h4>Mustering Coverage</h4>
          <span className="summary-chip">{competencyRows.length} top skills</span>
        </div>
        <div className="coverage-grid">
          {competencyRows.map(item => {
            const pct = item.total ? Math.round((item.available / item.total) * 100) : 0;
            return (
              <div className="coverage-row" key={item.skill}>
                <div>
                  <strong>{item.skill}</strong>
                  <span>{item.available}/{item.total}</span>
                </div>
                <div className="capacity-bar"><span style={{ width: `${pct}%` }} /></div>
              </div>
            );
          })}
        </div>
      </section>

      <section className="glass-card command-card">
        <div className="summary-card-header">
          <h4>Return-to-Availability Queue</h4>
          <span className="summary-chip">Earliest available</span>
        </div>
        <div className="return-list">
          {returnQueue.map(member => (
            <button className="return-row" key={member.force_number} onClick={() => onOpen(member)}>
              <span><strong>{member.rank} {member.surname}</strong><small>{member.post_description || member.musteringName}</small></span>
              <Badge bg="warning" text="dark">{formatDate(member.availableFrom)}</Badge>
            </button>
          ))}
          {!returnQueue.length && <div className="text-muted">No pending return items.</div>}
        </div>
      </section>

      <section className="glass-card command-card">
        <div className="summary-card-header">
          <h4>Stand-in Risk Watch</h4>
          <span className="summary-chip">{noStandIn.length} uncovered</span>
        </div>
        <div className="risk-list">
          {noStandIn.map(member => (
            <button className="risk-row" key={member.force_number} onClick={() => onOpen(member)}>
              <strong>{member.rank} {member.surname}</strong>
              <span>{competencyTokens(member).slice(0, 2).join(", ") || member.musteringName}</span>
            </button>
          ))}
          {!noStandIn.length && <div className="text-muted">Current stand-in coverage is adequate.</div>}
        </div>
      </section>
    </div>
  );
}

export default function DashboardPage() {
  const { user, logout, isLoading, updateProfile } = useAuth();
  const [profilePic, setProfilePic] = useState(null);
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
            <div className="ms-2">
              <h2 className="mb-0">STAFFSYNC</h2>
              <div className="header-subtitle">Deployment availability and competency planning</div>
            </div>
          </div>
          <div className="d-flex align-items-center gap-3">
            <Button variant="danger" onClick={logout}><FaSignOutAlt className="me-1" /> Sign Out</Button>
          </div>
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
            <OverviewPanel rows={rows} onNavigate={setActiveSection} onOpen={setViewItem} />
          )}

          {activeSection === "availability" && (
            <AvailabilityPanel rows={rows} onOpen={setViewItem} />
          )}

          {activeSection === "assets" && (
            <AssetsPlannerPanel rows={rows} onOpen={setViewItem} />
          )}

          {activeSection === "personnel" && (
            <>
              <PersonnelOverview
                rows={rows}
                onOpen={setViewItem}
                searchTerm={searchTerm}
                setSearchTerm={setSearchTerm}
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
                  <tr><th>Availability</th><td>{viewItem.availabilityStatus || "Available"}</td></tr>
                  <tr><th>Available From</th><td>{formatDate(viewItem.availableFrom)}</td></tr>
                  <tr><th>Competencies</th><td>{competencyTokens(viewItem).join(", ") || "N/A"}</td></tr>
                  <tr><th>Deployment Window</th><td>{viewItem.maxDeploymentDays ? `${viewItem.maxDeploymentDays} days` : "N/A"}</td></tr>
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
