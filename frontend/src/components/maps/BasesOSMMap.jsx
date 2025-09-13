import React, { useEffect, useMemo, useRef, useState } from "react";
import { mockBases } from "../../data/mockData";

// Lazy loader for Leaflet JS + CSS from CDN
function loadLeaflet() {
  if (window.L) return Promise.resolve(window.L);
  const existing = document.querySelector("script[data-leaflet]");
  const existingCss = document.querySelector("link[data-leaflet]");
  if (!existingCss) {
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
    link.integrity = "sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=";
    link.crossOrigin = "";
    link.dataset.leaflet = "1";
    document.head.appendChild(link);
  }
  if (existing) {
    return new Promise((resolve, reject) => {
      existing.addEventListener("load", () => resolve(window.L));
      existing.addEventListener("error", reject);
    });
  }
  const s = document.createElement("script");
  s.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
  s.integrity = "sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo=";
  s.crossOrigin = "";
  s.async = true; s.defer = true; s.dataset.leaflet = "1";
  document.head.appendChild(s);
  return new Promise((resolve, reject) => {
    s.onload = () => resolve(window.L);
    s.onerror = (e) => reject(e);
  });
}

const DEFAULT_CENTER = [ -28.5, 24.7 ]; // South Africa
const BASE_COORDS = {
  'AFB Waterkloof': { lat: -25.83, lng: 28.22 },
  'AFB Swartkop': { lat: -25.80, lng: 28.17 },
  'AFB Bloemspruit': { lat: -29.10, lng: 26.30 },
  'AFB Ysterplaat': { lat: -33.90, lng: 18.50 },
  'AFB Hoedspruit': { lat: -24.36, lng: 31.05 },
  'AFB Langebaanweg': { lat: -32.97, lng: 18.16 },
};

const BASE_SUMMARY = {
  'AFB Bloemspruit': 'Rooivalk, Oryx, Agusta',
  'AFB Waterkloof': 'Transport hub: VIP, C-130, C-47TP',
  'AFB Swartkop': 'Heritage & rotary ops',
  'AFB Ysterplaat': 'Maritime/heli support',
  'AFB Hoedspruit': 'Limpopo air ops & support',
  'AFB Langebaanweg': 'Pilot training (PC-7 MkII)',
};

export default function BasesOSMMap({ rows, height = 360, onSelect, fallback = null }) {
  const ref = useRef(null);
  const mapRef = useRef(null);
  const [error, setError] = useState(null);
  const provincesLayerRef = useRef(null);

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
    loadLeaflet().then((L) => {
      if (cancelled) return;
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
      const map = L.map(ref.current, { zoomControl: false }).setView(DEFAULT_CENTER, 5);
      mapRef.current = map;

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; OpenStreetMap contributors'
      }).addTo(map);

      // Add markers
      const markers = [];
      const mkIcon = (label) => L.divIcon({
        className: 'sa-marker-wrapper',
        html: '<div class="sa-marker"></div>',
        iconSize: [16, 16],
        iconAnchor: [8, 8],
        tooltipAnchor: [10, -10],
      });
      (mockBases || []).forEach((b) => {
        const pos = BASE_COORDS[b.name];
        if (!pos) return;
        const stats = countsByBase[b.name] || { total: 0, Ready: 0, Pending: 0, 'Not Ready': 0 };
        const m = L.marker([pos.lat, pos.lng], { icon: mkIcon(b.name), zIndexOffset: 1000 }).addTo(map);
        if (onSelect) {
          m.on('click', () => onSelect(b.name));
        } else {
          const extra = BASE_SUMMARY[b.name] ? `<div style="margin-top:6px;color:#455a64"><span style=\"opacity:.85\">Assets:</span> ${BASE_SUMMARY[b.name]}</div>` : '';
          m.bindPopup(`
            <div style="min-width:220px">
              <div style="font-weight:700;margin-bottom:4px">${b.name}</div>
              <div>Total: ${stats.total}</div>
              <div style="color:#2ecc71">Ready: ${stats.Ready}</div>
              <div style="color:#f1c40f">Pending: ${stats.Pending}</div>
              <div style="color:#e74c3c">Not Ready: ${stats['Not Ready']}</div>
              ${extra}
            </div>
          `);
        }
        markers.push(m);
      });

      if (markers.length) {
        const group = L.featureGroup(markers);
        map.fitBounds(group.getBounds().pad(0.2));
      }

      // Custom dark controls for consistency
      const ctrl = L.control({ position: 'bottomright' });
      ctrl.onAdd = function() {
        const div = L.DomUtil.create('div', 'gm-dark-controls');
        const mkBtn = (label, title, onClick) => {
          const b = L.DomUtil.create('button', 'gm-dark-btn', div);
          b.type = 'button'; b.title = title; b.textContent = label;
          L.DomEvent.on(b, 'click', (e) => { L.DomEvent.stopPropagation(e); onClick(); });
          return b;
        };
        mkBtn('+', 'Zoom in', () => map.zoomIn());
        mkBtn('−', 'Zoom out', () => map.zoomOut());
        mkBtn('Fit', 'Fit to bases', () => map.fitBounds(L.featureGroup(markers).getBounds().pad(0.2)));
        return div;
      };
      ctrl.addTo(map);

      // Load South Africa provincial boundaries (GeoJSON, ADM1)
      const url = 'https://raw.githubusercontent.com/wmgeolab/geoBoundaries/master/release/gbOpen/ZAF/ADM1/geoBoundaries-ZAF-ADM1.geojson';
      fetch(url)
        .then(r => r.ok ? r.json() : Promise.reject(new Error('Failed to fetch provinces')))
        .then(geojson => {
          if (cancelled) return;
          if (provincesLayerRef.current) {
            provincesLayerRef.current.remove();
            provincesLayerRef.current = null;
          }
          const layer = L.geoJSON(geojson, {
            style: {
              color: '#3ec5a1',
              weight: 1,
              opacity: 0.6,
              fillColor: '#1a2b2b',
              fillOpacity: 0.08,
            }
          }).addTo(map);
          provincesLayerRef.current = layer;
          // Keep polygons behind markers
          layer.bringToBack();
        })
        .catch(() => { /* ignore; map still works */ });
    }).catch((e) => setError(e));
    return () => { cancelled = true; if (mapRef.current) { mapRef.current.remove(); mapRef.current = null; } };
  }, [countsByBase]);

  if (error && fallback) return (
    <div className="google-map-container" style={{ position: 'relative', height, borderRadius: 12, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.12)', marginBottom: 12 }}>
      <div className="map-fallback-banner">Map failed to load — showing fallback</div>
      <div style={{ width: '100%', height: '100%' }}>{fallback}</div>
    </div>
  );

  return (
    <div className="google-map-container" style={{ height, borderRadius: 12, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.12)', marginBottom: 12 }}>
      <div ref={ref} style={{ width: '100%', height: '100%' }} />
    </div>
  );
}
