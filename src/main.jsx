import React from "react";
// Capture PWA install prompt globally so any component can trigger it
window.__pwaInstallPrompt = null;
window.addEventListener("beforeinstallprompt", (e) => {
  e.preventDefault();
  window.__pwaInstallPrompt = e;
});
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
    <LanguageProvider>
      <App />
    </LanguageProvider>
  </React.StrictMode>
);
