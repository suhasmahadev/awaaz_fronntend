import { BrowserRouter, Link, Route, Routes, useLocation } from "react-router-dom";
import AdminPanel from "./pages/AdminPanel.jsx";
import ChatPage from "./pages/ChatPage.jsx";
import CommunityFeed from "./pages/CommunityFeed.jsx";
import ContractorLedger from "./pages/ContractorLedger.jsx";
import NGODashboard from "./pages/NGODashboard.jsx";
import NGOLogin from "./pages/NGOLogin.jsx";
import TextUI from "./pages/TextUI.jsx";
import LandingPage from "./pages/LandingPage.jsx";

function NavBar() {
  const showAdmin = Boolean(localStorage.getItem("token") || localStorage.getItem("ap_admin_token"));
  const location = useLocation();
  
  // Don't show app navbar on landing page
  if (location.pathname === "/") return null;

  const links = [
    ["/app", "Chat"],
    ["/community", "Community"],
    ["/ngo-login", "Partners"],
    ["/ledger", "Ledger"],
    ["/text-ui", "Text UI"],
    ...(showAdmin ? [["/admin", "Admin"]] : []),
  ];

  return (
    <nav style={{ height: 42, display: "flex", alignItems: "center", gap: 8, padding: "0 12px", background: "#0f172a", borderBottom: "1px solid #1e293b", position: "sticky", top: 0, zIndex: 1000 }}>
      <strong style={{ color: "#f8fafc", marginRight: 8 }}>AWAAZ</strong>
      {links.map(([href, label]) => (
        <Link 
          key={href} 
          to={href} 
          style={{ 
            color: location.pathname === href ? "#3b82f6" : "#cbd5e1", 
            textDecoration: "none", 
            fontSize: 13, 
            padding: "6px 8px", 
            borderRadius: 6,
            fontWeight: location.pathname === href ? "600" : "400"
          }}
        >
          {label}
        </Link>
      ))}
    </nav>
  );
}

function ChatShell() {
  return (
    <div style={{ width: "100%", height: "calc(100vh - 42px)", overflow: "hidden", display: "flex" }}>
      <ChatPage />
    </div>
  );
}

import SplashScreen from './pages/SplashScreen';

export default function App() {
  return (
    <BrowserRouter>
      <NavBar />
      <Routes>
        <Route path="/" element={<SplashScreen />} />
        <Route path="/home" element={<LandingPage />} />
        <Route path="/chat" element={<ChatShell />} />
        <Route path="/app" element={<ChatShell />} />
        <Route path="/community" element={<CommunityFeed />} />
        <Route path="/ngo-login" element={<NGOLogin />} />
        <Route path="/ngo-dashboard" element={<NGODashboard />} />
        <Route path="/ledger" element={<ContractorLedger />} />
        <Route path="/text-ui" element={<TextUI />} />
        <Route path="/admin" element={<AdminPanel />} />
      </Routes>
    </BrowserRouter>
  );
}

