import React, { useState, useEffect } from "react";

// ── PWA install prompt ───────────────────────────────────────────────────────
window.__pwaInstallPrompt = null;
window.addEventListener("beforeinstallprompt", (e) => {
  e.preventDefault();
  window.__pwaInstallPrompt = e;
});

// ── Backend wake-up utility ──────────────────────────────────────────────────
const BACKEND = "https://awaaz-backend-6.onrender.com";

async function pingBackend(retries = 8, delayMs = 5000) {
  for (let i = 0; i < retries; i++) {
    try {
      const res = await fetch(`${BACKEND}/`, { method: "HEAD", signal: AbortSignal.timeout(8000) });
      if (res.ok || res.status === 405) return true; // 405 = HEAD not allowed but server is up
    } catch {
      // server still sleeping
    }
    if (i < retries - 1) await new Promise(r => setTimeout(r, delayMs));
  }
  return false; // gave up, let app load anyway
}

function BackendWakeUp({ children }) {
  const [ready, setReady] = useState(false);
  const [status, setStatus] = useState("Warming up server…");

  useEffect(() => {
    let dots = 0;
    const interval = setInterval(() => {
      dots = (dots + 1) % 4;
      setStatus("Warming up server" + ".".repeat(dots));
    }, 600);

    pingBackend().then((ok) => {
      clearInterval(interval);
      setStatus(ok ? "Connected!" : "Connecting in background…");
      setTimeout(() => setReady(true), 400);
    });

    return () => clearInterval(interval);
  }, []);

  if (!ready) {
    return (
      <div style={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, #1a1a2e 0%, #4C1D95 100%)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: "24px",
        fontFamily: "system-ui, sans-serif",
      }}>
        <div style={{ fontSize: "52px" }}>📡</div>
        <div style={{
          width: "48px", height: "48px",
          border: "4px solid rgba(255,255,255,0.2)",
          borderTop: "4px solid #8B5CF6",
          borderRadius: "50%",
          animation: "spin 1s linear infinite",
        }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        <p style={{ color: "#fff", fontSize: "18px", fontWeight: 600, margin: 0 }}>AWAAZ</p>
        <p style={{ color: "rgba(255,255,255,0.6)", fontSize: "14px", margin: 0 }}>{status}</p>
        <p style={{ color: "rgba(255,255,255,0.35)", fontSize: "12px", margin: 0 }}>
          Free tier servers sleep — this takes ~30s on first load
        </p>
      </div>
    );
  }

  return children;
}
import ReactDOM from "react-dom/client";
import { BrowserRouter, Route, Routes, useLocation, useNavigate } from "react-router-dom";

import AdminPanel from "./pages/AdminPanel.jsx";
import ChatPage from "./pages/ChatPage.jsx";
import CommunityFeed from "./pages/CommunityFeed.jsx";
import ContractorLedger from "./pages/ContractorLedger.jsx";
import MapView from "./pages/MapView.jsx";
import NGODashboard from "./pages/NGODashboard.jsx";
import NGOLogin from "./pages/NGOLogin.jsx";
import TextUI from "./pages/TextUI.jsx";
import LandingPage from "./pages/LandingPage.jsx";
import DashboardRoute from "./components/DashboardRoute.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";
import { LanguageProvider } from "./i18n/LanguageContext.jsx";

import "./styles/globals.css";
import "./styles/chat.css";
import "./styles/app-system.css";

function TopNavbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const hasAdminToken = Boolean(
    localStorage.getItem("token") ||
    localStorage.getItem("ngo_token") ||
    localStorage.getItem("ap_admin_token")
  );

  if (location.pathname === "/") return null;

  const items = [
    { label: "Dashboard", path: "/dashboard" },
    { label: "Community", path: "/community" },
    { label: "Map", path: "/map" },
    { label: "Contractor Ledger", path: "/ledger" },
    ...(hasAdminToken ? [{ label: "Admin", path: "/admin" }] : []),
  ];

  return (
    <nav className="desktop-nav">
      <div className="desktop-nav__content">
        <div className="desktop-nav__logo" style={{ cursor: 'pointer' }} onClick={() => navigate("/")}>
          AWAAZ
        </div>
        <div className="desktop-nav__links">
          {items.map((item) => (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={`desktop-nav__link ${location.pathname === item.path ? "is-active" : ""}`}
            >
              {item.label}
            </button>
          ))}
        </div>
        <div className="desktop-nav__user">
          <button className="desktop-nav__btn" onClick={() => navigate("/ngo-login")}>NGO? Login</button>
        </div>
      </div>
    </nav>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <div className="app-main-layout">
        <TopNavbar />
        <main className="app-content-area">
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/welcome" element={<LandingPage />} />
            <Route path="/dashboard" element={<ChatPage />} />
            
            {/* App Routes */}
            <Route path="/chat" element={<ChatPage />} />
            <Route path="/app" element={<ChatPage />} />
            <Route path="/community" element={<CommunityFeed />} />
            <Route path="/map" element={<MapView />} />
            <Route path="/ledger" element={<ContractorLedger />} />
            <Route path="/text-ui" element={<TextUI />} />
            
            {/* Auth / Admin Routes */}
            <Route path="/login" element={<NGOLogin />} />
            <Route path="/ngo-login" element={<NGOLogin />} />
            <Route
              path="/dashboard"
              element={(
                <ProtectedRoute allowedRoles={["ngo", "admin"]}>
                  <DashboardRoute />
                </ProtectedRoute>
              )}
            />
            <Route
              path="/admin"
              element={(
                <ProtectedRoute allowedRoles={["admin"]}>
                  <AdminPanel />
                </ProtectedRoute>
              )}
            />
            <Route
              path="/ngo"
              element={(
                <ProtectedRoute allowedRoles={["ngo", "admin"]}>
                  <NGODashboard />
                </ProtectedRoute>
              )}
            />
            <Route
              path="/ngo-dashboard"
              element={(
                <ProtectedRoute allowedRoles={["ngo", "admin"]}>
                  <NGODashboard />
                </ProtectedRoute>
              )}
            />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}



ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BackendWakeUp>
      <LanguageProvider>
        <App />
      </LanguageProvider>
    </BackendWakeUp>
  </React.StrictMode>
);
