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
const SA_BOUNDS = { north: -22, south: -35, east: 33, west: 16 };

// Lightweight dark style if no MapID was provided
const DARK_STYLE = [
  { elementType: "geometry", stylers: [{ color: "#101820" }] },
  { elementType: "labels.icon", stylers: [{ visibility: "off" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#d8e3ec" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#071016" }, { weight: 2 }] },
  { featureType: "administrative", elementType: "geometry", stylers: [{ color: "#34495e" }] },
  { featureType: "administrative.country", elementType: "geometry.stroke", stylers: [{ color: "#6fa8bc" }, { weight: 1.1 }] },
  { featureType: "landscape", elementType: "geometry", stylers: [{ color: "#111d25" }] },
  { featureType: "poi", stylers: [{ visibility: "off" }] },
  { featureType: "road", elementType: "geometry", stylers: [{ color: "#1e2b34" }] },
  { featureType: "road", elementType: "geometry.stroke", stylers: [{ color: "#0b1218" }] },
  { featureType: "road", elementType: "labels.text.fill", stylers: [{ color: "#83929d" }] },
  { featureType: "transit", stylers: [{ visibility: "off" }] },
  { featureType: "water", elementType: "geometry", stylers: [{ color: "#071016" }] },
];

// Approx base coordinates by name
const BASE_COORDS = {
  'AFB Waterkloof': { lat: -25.83, lng: 28.22 },
  'AFB Swartkop': { lat: -25.80, lng: 28.17 },
  'AFB Bloemspruit': { lat: -29.10, lng: 26.30 },
  'AFB Ysterplaat': { lat: -33.90, lng: 18.50 },
  'AFB Hoedspruit': { lat: -24.36, lng: 31.05 },
  'AFB Langebaanweg': { lat: -32.97, lng: 18.16 },
  'AFB Durban': { lat: -29.97, lng: 30.95 },
  'AFS Port Elizabeth': { lat: -33.98, lng: 25.61 },
  'AFB Overberg': { lat: -34.55, lng: 20.25 },
};

// Optional short summaries per base (mock knowledge)
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

const LABEL_OFFSETS = {
  'AFB Waterkloof': { x: 18, y: -38 },
  'AFB Swartkop': { x: 18, y: 12 },
};

export default function BasesGoogleMap({ rows, height = 360, onSelect, fallback = null }) {
  const mapEl = useRef(null);
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
        // Restrict and fit to South Africa bounds on initial load
        try {
          const bounds = new google.maps.LatLngBounds(
            new google.maps.LatLng(SA_BOUNDS.south, SA_BOUNDS.west),
            new google.maps.LatLng(SA_BOUNDS.north, SA_BOUNDS.east)
          );
          map.fitBounds(bounds, 60);
          map.setOptions({ restriction: { latLngBounds: bounds, strictBounds: true } });
        } catch {}

        const info = new google.maps.InfoWindow();
        const mkLib = google.maps.marker;

        const chips = [];
        (mockBases || []).forEach((b) => {
          const pos = BASE_COORDS[b.name];
          if (!pos) return;
          const stats = countsByBase[b.name] || { total: 0, Ready: 0, Pending: 0, 'Not Ready': 0 };
          const extra = BASE_SUMMARY[b.name] ? `<div style="margin-top:6px;color:#cfd8dc"><span style="opacity:.8">Assets:</span> ${BASE_SUMMARY[b.name]}</div>` : '';
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
            el.className = 'sa-advanced-marker';
            el.innerHTML = '<span class="sa-marker-stem"></span><span class="sa-marker-core"></span><span class="sa-marker-pulse"></span>';
            marker = new mkLib.AdvancedMarkerElement({ map, position: pos, content: el, title: b.name });
            el.addEventListener('mouseenter', () => { el.classList.add('is-hovered'); });
            el.addEventListener('mouseleave', () => { el.classList.remove('is-hovered'); });
            el.addEventListener('click', () => { if (onSelect) onSelect(b.name); else { info.setContent(html); info.open({ map, anchor: marker }); } });

            // Label chip element (AdvancedMarker)
            const chip = document.createElement('div');
            chip.className = 'map-chip';
            chip.textContent = b.name;
            const offset = LABEL_OFFSETS[b.name] || { x: 18, y: -18 };
            chip.style.setProperty('--chip-x', `${offset.x}px`);
            chip.style.setProperty('--chip-y', `${offset.y}px`);
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
        map.addListener('zoom_changed', updateChips);

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
        addBtn('⟲0', 'Reset', () => {
          try {
            const bounds = new google.maps.LatLngBounds(
              new google.maps.LatLng(SA_BOUNDS.south, SA_BOUNDS.west),
              new google.maps.LatLng(SA_BOUNDS.north, SA_BOUNDS.east)
            );
            map.fitBounds(bounds, 60);
          } catch {
            map.setZoom(5); map.setHeading(20); map.setTilt(67.5); map.panTo(DEFAULT_CENTER);
          }
        });
        map.controls[google.maps.ControlPosition.RIGHT_BOTTOM].push(controls);

      })
      .catch((e) => { setError(e); });
    return () => { cancelled = true; };
  }, [apiKey, mapId, countsByBase, onSelect]);

  // Fallback wrapper with visible banner when Google Maps cannot load
  const renderFallback = (message) => (
    <div className="google-map-container locations-map-shell" style={{ position: 'relative', height: 360 }}>
      <div style={{ width: '100%', height: '100%' }}>{fallback}</div>
    </div>
  );

  if (error && fallback) return renderFallback();
  if (!apiKey && fallback) return renderFallback();

  return (
    <div className="google-map-container locations-map-shell" style={{ height }}>
      <div ref={mapEl} style={{ width: '100%', height: '100%' }} />
    </div>
  );
}
