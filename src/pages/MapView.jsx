import { useCallback, useEffect, useRef, useState } from "react";
import ComplaintPanel from "../components/ComplaintPanel";
import { API_BASE, getOrCreateAnonId } from "../utils/identity";

const DEFAULT_LAT = 12.9716;
const DEFAULT_LNG = 77.5946;
const LEAFLET_CSS = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
const LEAFLET_JS = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";

function loadLeaflet() {
  if (window.L) return Promise.resolve(window.L);

  return new Promise((resolve, reject) => {
    if (!document.querySelector(`link[href="${LEAFLET_CSS}"]`)) {
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = LEAFLET_CSS;
      document.head.appendChild(link);
    }

    const existing = document.querySelector(`script[src="${LEAFLET_JS}"]`);
    if (existing) {
      existing.addEventListener("load", () => resolve(window.L), { once: true });
      existing.addEventListener("error", reject, { once: true });
      return;
    }

    const script = document.createElement("script");
    script.src = LEAFLET_JS;
    script.async = true;
    script.onload = () => resolve(window.L);
    script.onerror = reject;
    document.body.appendChild(script);
  });
}

const pinColor = (confidence) =>
  confidence >= 0.75 ? "#16a34a" :
  confidence >= 0.55 ? "#2563eb" :
  confidence >= 0.35 ? "#d97706" : "#9ca3af";

const pinEmoji = (type) => ({
  pothole: "P",
  no_water: "W",
  garbage: "G",
  drain: "D",
  street_light: "L",
}[type] || "!");

function makeIcon(L, type, confidence) {
  const color = pinColor(Number(confidence || 0));
  const label = pinEmoji(type);
  return L.divIcon({
    className: "",
    html: `
      <div style="
        width:36px;height:36px;border-radius:50% 50% 50% 0;
        transform:rotate(-45deg);
        background:${color};
        border:2px solid white;
        box-shadow:0 2px 8px rgba(0,0,0,0.3);
        display:flex;align-items:center;justify-content:center;
      ">
        <span style="transform:rotate(45deg);font-size:13px;line-height:1;color:white;font-weight:800">
          ${label}
        </span>
      </div>`,
    iconSize: [36, 36],
    iconAnchor: [18, 36],
    popupAnchor: [0, -38],
  });
}

export default function MapView() {
  const [complaints, setComplaints] = useState([]);
  const [selected, setSelected] = useState(null);
  const [panelOpen, setPanelOpen] = useState(false);
  const [lat, setLat] = useState(DEFAULT_LAT);
  const [lng, setLng] = useState(DEFAULT_LNG);
  const [loading, setLoading] = useState(true);
  const [mapError, setMapError] = useState("");
  const [anonId, setAnonId] = useState(localStorage.getItem("anon_id") || "");
  const mapEl = useRef(null);
  const mapRef = useRef(null);
  const markerLayerRef = useRef(null);
  const leafletRef = useRef(null);

  const loadComplaints = useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch(`${API_BASE}/community?all=true&lat=${lat}&lng=${lng}`);
      const d = await r.json();
      setComplaints(d.complaints || []);
    } catch {
      setComplaints([]);
    } finally {
      setLoading(false);
    }
  }, [lat, lng]);

  const refreshSelected = useCallback(async (complaintId) => {
    if (!complaintId) return;
    try {
      const r = await fetch(`${API_BASE}/complaints/${complaintId}/detail`);
      const d = await r.json();
      if (r.ok) setSelected(d);
    } catch {
      // Keep the current panel data visible.
    }
  }, []);

  const openPanel = useCallback(async (complaint) => {
    setSelected(null);
    setPanelOpen(true);
    try {
      const r = await fetch(`${API_BASE}/complaints/${complaint.id}/detail`);
      const d = await r.json();
      setSelected(r.ok ? d : complaint);
    } catch {
      setSelected(complaint);
    }
  }, []);

  useEffect(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLat(position.coords.latitude);
        setLng(position.coords.longitude);
      },
      () => {},
      { enableHighAccuracy: true, timeout: 5000, maximumAge: 60000 }
    );
  }, []);

  useEffect(() => {
    let cancelled = false;
    loadLeaflet()
      .then((L) => {
        if (cancelled || !mapEl.current) return;
        leafletRef.current = L;
        if (!mapRef.current) {
          mapRef.current = L.map(mapEl.current, { zoomControl: true }).setView([lat, lng], 14);
          L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
            maxZoom: 19,
          }).addTo(mapRef.current);
          markerLayerRef.current = L.layerGroup().addTo(mapRef.current);
        }
        setMapError("");
      })
      .catch(() => setMapError("Map failed to load. Check internet access for OpenStreetMap tiles."));

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    loadComplaints();
    if (mapRef.current) mapRef.current.setView([lat, lng], 14);
  }, [lat, lng, loadComplaints]);

  useEffect(() => {
    if (anonId) return;
    getOrCreateAnonId()
      .then(setAnonId)
      .catch(() => setAnonId(""));
  }, [anonId]);

  useEffect(() => {
    const L = leafletRef.current;
    const layer = markerLayerRef.current;
    if (!L || !layer) return;
    layer.clearLayers();

    complaints
      .filter((c) => Number.isFinite(Number(c.lat)) && Number.isFinite(Number(c.lng)))
      .forEach((c) => {
        const btnId = `map-detail-${String(c.id).replace(/[^a-zA-Z0-9_-]/g, "")}`;
        const navId = `map-nav-${String(c.id).replace(/[^a-zA-Z0-9_-]/g, "")}`;
        const media = c.media_url
          ? `<img src="${c.media_url}" alt="" style="width:100%;height:84px;object-fit:cover;border-radius:6px;margin:6px 0" />`
          : "";
        const marker = L.marker([Number(c.lat), Number(c.lng)], {
          icon: makeIcon(L, c.complaint_type, c.confidence_score),
        });
        marker.bindPopup(`
          <div style="min-width:160px">
            <strong style="font-size:13px">${String(c.complaint_type || "complaint").replace("_", " ").toUpperCase()}</strong>
            <div style="font-size:11px;color:#6b7280;margin:4px 0">
              Confidence: ${Math.round(Number(c.confidence_score || 0) * 100)}%
            </div>
            ${media}
            ${c.warranty_breach ? '<div style="font-size:11px;color:#dc2626;font-weight:600">Warranty breach</div>' : ""}
            <button id="${btnId}" style="
              margin-top:8px;width:100%;padding:6px 0;
              background:#1d4ed8;color:#fff;border:none;border-radius:6px;
              font-size:12px;cursor:pointer;
            ">View details</button>
            <button id="${navId}" style="
              margin-top:6px;width:100%;padding:6px 0;
              background:#059669;color:#fff;border:none;border-radius:6px;
              font-size:12px;cursor:pointer;
            ">Navigate</button>
          </div>
        `);
        marker.on("click", () => openPanel(c));
        marker.on("popupopen", () => {
          const button = document.getElementById(btnId);
          const navButton = document.getElementById(navId);
          button?.addEventListener("click", () => openPanel(c), { once: true });
          navButton?.addEventListener("click", () => {
            window.open(`https://www.google.com/maps/dir/?api=1&destination=${Number(c.lat)},${Number(c.lng)}`, "_blank", "noopener,noreferrer");
          }, { once: true });
        });
        marker.addTo(layer);
      });
  }, [complaints, openPanel]);

  return (
    <div style={{ display: "flex", height: "calc(100vh - 64px)", position: "relative", overflow: "hidden" }}>

      <div style={{ flex: 1, position: "relative" }}>
        {loading && (
          <div style={{
            position: "absolute",
            top: 12,
            left: "50%",
            transform: "translateX(-50%)",
            zIndex: 1000,
            background: "#fff",
            padding: "6px 16px",
            borderRadius: 20,
            fontSize: 12,
            boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
          }}>
            Loading complaints...
          </div>
        )}

        {mapError && (
          <div style={{
            position: "absolute",
            top: 12,
            left: 12,
            right: 12,
            zIndex: 1000,
            background: "#fee2e2",
            color: "#991b1b",
            padding: 10,
            borderRadius: 8,
            fontSize: 13,
          }}>
            {mapError}
          </div>
        )}

        <div ref={mapEl} style={{ height: "100%", width: "100%" }} />

        <div style={{
          position: "absolute",
          bottom: 16,
          left: 16,
          zIndex: 1000,
          background: "#fff",
          borderRadius: 20,
          padding: "6px 14px",
          fontSize: 12,
          fontWeight: 500,
          boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
        }}>
          {complaints.length} complaints within 5km
        </div>
      </div>

      {panelOpen && (
        <ComplaintPanel
          complaint={selected}
          anonId={anonId}
          onClose={() => { setPanelOpen(false); setSelected(null); }}
          onUpdate={loadComplaints}
          onRefresh={refreshSelected}
        />
      )}
    </div>
  );
}
