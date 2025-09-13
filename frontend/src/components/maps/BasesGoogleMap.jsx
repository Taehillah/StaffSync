import React, { useEffect, useMemo, useRef, useState } from "react";
import { mockBases } from "../../data/mockData";

// Small script loader for Google Maps JS API
function loadGoogle(apiKey) {
  if (!apiKey) return Promise.reject(new Error("Missing API key"));
  if (window.google && window.google.maps) return Promise.resolve(window.google);
  const existing = document.querySelector("script[data-google-maps]");
  if (existing) {
    return new Promise((resolve, reject) => {
      existing.addEventListener("load", () => resolve(window.google));
      existing.addEventListener("error", reject);
    });
  }
  const s = document.createElement("script");
  s.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&v=weekly&libraries=marker`;
  s.async = true; s.defer = true; s.dataset.googleMaps = "1";
  document.head.appendChild(s);
  return new Promise((resolve, reject) => {
    s.onload = () => resolve(window.google);
    s.onerror = (e) => reject(e);
  });
}

const DEFAULT_CENTER = { lat: -28.5, lng: 24.7 };

// Lightweight dark style if no MapID was provided
const DARK_STYLE = [
  { elementType: "geometry", stylers: [{ color: "#1a1f2a" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#e8eaed" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#1a1f2a" }] },
  { featureType: "administrative", elementType: "geometry", stylers: [{ color: "#3a475a" }] },
  { featureType: "poi", elementType: "labels.text.fill", stylers: [{ color: "#cfcfcf" }] },
  { featureType: "poi.park", elementType: "geometry", stylers: [{ color: "#193d3d" }] },
  { featureType: "road", elementType: "geometry", stylers: [{ color: "#263238" }] },
  { featureType: "road", elementType: "labels.text.fill", stylers: [{ color: "#9e9e9e" }] },
  { featureType: "transit", elementType: "geometry", stylers: [{ color: "#2b3943" }] },
  { featureType: "water", elementType: "geometry", stylers: [{ color: "#0b1a24" }] }
];

// Approx base coordinates by name
const BASE_COORDS = {
  'AFB Waterkloof': { lat: -25.83, lng: 28.22 },
  'AFB Swartkop': { lat: -25.80, lng: 28.17 },
  'AFB Bloemspruit': { lat: -29.10, lng: 26.30 },
  'AFB Ysterplaat': { lat: -33.90, lng: 18.50 },
  'AFB Hoedspruit': { lat: -24.36, lng: 31.05 },
  'AFB Langebaanweg': { lat: -32.97, lng: 18.16 },
};

// Optional short summaries per base (mock knowledge)
const BASE_SUMMARY = {
  'AFB Bloemspruit': 'Rooivalk, Oryx, Agusta',
  'AFB Waterkloof': 'Transport hub: VIP, C-130, C-47TP',
  'AFB Swartkop': 'Heritage & rotary ops',
  'AFB Ysterplaat': 'Maritime/heli support',
  'AFB Hoedspruit': 'Limpopo air ops & support',
  'AFB Langebaanweg': 'Pilot training (PC-7 MkII)',
};

export default function BasesGoogleMap({ rows, height = 360, onSelect, fallback = null }) {
  const mapEl = useRef(null);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState(null);
  const mapRef = useRef(null);

  const apiKey = process.env.REACT_APP_GOOGLE_MAPS_API_KEY;
  const mapId = process.env.REACT_APP_GOOGLE_MAP_ID; // optional, use a dark vector style if you have one

  const countsByBase = useMemo(() => {
    const by = {};
    for (const p of rows || []) {
      const name = p.baseName || 'Unknown';
      if (!by[name]) by[name] = { total: 0, Ready: 0, Pending: 0, 'Not Ready': 0 };
      by[name].total++;
      const s = String(p.readinessStatus || 'Ready');
      if (by[name][s] !== undefined) by[name][s]++;
    }
    return by;
  }, [rows]);

  useEffect(() => {
    let cancelled = false;
    loadGoogle(apiKey)
      .then((google) => {
        if (cancelled) return;
        const map = new google.maps.Map(mapEl.current, {
          center: DEFAULT_CENTER,
          zoom: 5,
          tilt: 67.5,
          heading: 20,
          disableDefaultUI: true,
          gestureHandling: 'greedy',
          mapId: mapId || undefined,
          styles: mapId ? undefined : DARK_STYLE,
        });
        mapRef.current = map;

        const info = new google.maps.InfoWindow();
        const mkLib = google.maps.marker;

        const chips = [];
        (mockBases || []).forEach((b) => {
          const pos = BASE_COORDS[b.name];
          if (!pos) return;
          const stats = countsByBase[b.name] || { total: 0, Ready: 0, Pending: 0, 'Not Ready': 0 };
          const extra = BASE_SUMMARY[b.name] ? `<div style="margin-top:6px;color:#cfd8dc"><span style=\"opacity:.8\">Assets:</span> ${BASE_SUMMARY[b.name]}</div>` : '';
          const html = `
            <div style="min-width:220px;color:#fff">
              <div style="font-weight:700;margin-bottom:4px">${b.name}</div>
              <div>Total: ${stats.total}</div>
              <div style="color:#2ecc71">Ready: ${stats.Ready}</div>
              <div style="color:#f1c40f">Pending: ${stats.Pending}</div>
              <div style="color:#e74c3c">Not Ready: ${stats['Not Ready']}</div>
              ${extra}
            </div>`;

          let marker;
          if (mkLib && mkLib.AdvancedMarkerElement) {
            const el = document.createElement('div');
            el.style.cssText = 'background:#30d158;border:2px solid #0b0f14;width:14px;height:14px;border-radius:50%;box-shadow:0 6px 18px rgba(0,0,0,0.35)';
            marker = new mkLib.AdvancedMarkerElement({ map, position: pos, content: el, title: b.name });
            el.addEventListener('mouseenter', () => { el.style.background = '#00e676'; });
            el.addEventListener('mouseleave', () => { el.style.background = '#30d158'; });
            el.addEventListener('click', () => { if (onSelect) onSelect(b.name); else { info.setContent(html); info.open({ map, anchor: marker }); } });

            // Label chip element (AdvancedMarker)
            const chip = document.createElement('div');
            chip.className = 'map-chip';
            chip.textContent = b.name;
            chip.style.transform = 'translate(14px, -12px)';
            const chipMarker = new mkLib.AdvancedMarkerElement({ map, position: pos, content: chip, title: b.name, zIndex: 2 });
            chip.addEventListener('click', () => { if (onSelect) onSelect(b.name); else { info.setContent(html); info.open({ map, anchor: chipMarker }); } });
            chips.push(chip);
          } else {
            marker = new google.maps.Marker({ map, position: pos, title: b.name });
            marker.addListener('click', () => { if (onSelect) onSelect(b.name); else { info.setContent(html); info.open(map, marker); } });
          }
        });

        // Show/hide chips based on zoom level
        const updateChips = () => {
          const z = map.getZoom() || 0;
          const show = z >= 6;
          chips.forEach(ch => { ch.style.display = show ? 'inline-flex' : 'none'; });
        };
        updateChips();
        const zm = map.addListener('zoom_changed', updateChips);

        // Dark control buttons for zoom/rotate/tilt
        const controls = document.createElement('div');
        controls.className = 'gm-dark-controls';
        const addBtn = (label, title, onClick) => {
          const b = document.createElement('button');
          b.className = 'gm-dark-btn';
          b.type = 'button'; b.title = title; b.textContent = label;
          b.addEventListener('click', (e) => { e.preventDefault(); onClick(); });
          controls.appendChild(b);
          return b;
        };
        addBtn('+', 'Zoom in', () => map.setZoom((map.getZoom() || 5) + 1));
        addBtn('−', 'Zoom out', () => map.setZoom((map.getZoom() || 5) - 1));
        addBtn('⟲', 'Rotate left', () => map.setHeading(((map.getHeading() || 0) - 20 + 360) % 360));
        addBtn('⟲', 'Rotate right', () => map.setHeading(((map.getHeading() || 0) + 20) % 360)).style.transform = 'scaleX(-1)';
        addBtn('⤢', 'Tilt up', () => map.setTilt(Math.min(67.5, (map.getTilt() || 0) + 15)));
        addBtn('⤡', 'Tilt down', () => map.setTilt(Math.max(0, (map.getTilt() || 0) - 15)));
        // Fit to bases bounds
        const fitToBases = () => {
          const bounds = new google.maps.LatLngBounds();
          (mockBases || []).forEach(b => {
            const p = BASE_COORDS[b.name];
            if (p) bounds.extend(p);
          });
          if (!bounds.isEmpty()) map.fitBounds(bounds, 60);
        };
        addBtn('Fit', 'Fit to bases', fitToBases);
        addBtn('⟲0', 'Reset', () => { map.setZoom(5); map.setHeading(20); map.setTilt(67.5); map.panTo(DEFAULT_CENTER); });
        map.controls[google.maps.ControlPosition.RIGHT_BOTTOM].push(controls);

        setReady(true);
      })
      .catch((e) => { setError(e); setReady(false); });
    return () => { cancelled = true; };
  }, [apiKey, mapId, countsByBase]);

  // Fallback wrapper with visible banner when Google Maps cannot load
  const renderFallback = (message) => (
    <div className="google-map-container" style={{ position: 'relative', height: 360, borderRadius: 12, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.12)', marginBottom: 12 }}>
      <div className="map-fallback-banner">{message}</div>
      <div style={{ width: '100%', height: '100%' }}>{fallback}</div>
    </div>
  );

  if (error && fallback) return renderFallback('Google Maps failed to load — showing fallback map');
  if (!apiKey && fallback) return renderFallback('Missing Google Maps API key — showing fallback map');

  return (
    <div className="google-map-container" style={{ height, borderRadius: 12, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.12)', marginBottom: 12 }}>
      <div ref={mapEl} style={{ width: '100%', height: '100%' }} />
    </div>
  );
}
