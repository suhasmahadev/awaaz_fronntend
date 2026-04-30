import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { API_BASE } from "../utils/identity";

const REGIONS = ["Bengaluru", "Ward 42", "Ward 43", "Ward 44", "Zone-tdr1", "Zone-tdr3"];

export default function NGOLogin() {
  const navigate = useNavigate();
  const [mode, setMode] = useState("login");
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    org_name: "",
    org_type: "ngo",
    region: REGIONS[0],
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const update = (key, value) => setForm((current) => ({ ...current, [key]: value }));

  async function postJson(path, body) {
    const response = await fetch(`${API_BASE}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const text = await response.text();
    const data = text ? JSON.parse(text) : {};
    if (!response.ok) throw new Error(data?.detail || data?.message || "Login failed");
    return data;
  }

  async function handleLogin(e) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");
    try {
      let data = null;
      try {
        data = await postJson("/auth/ngo-login", { email: form.email, password: form.password });
      } catch (primaryError) {
        console.warn("NGO login endpoint unavailable, trying legacy login:", primaryError);
        data = await postJson("/auth/login", { email: form.email, password: form.password });
      }

      const backendRole = data?.role || "ngo";
      const allowedRoles = ["ngo", "admin", "moderator", "faculty"];
      if (!data?.access_token || !allowedRoles.includes(backendRole)) {
        throw new Error("Invalid credentials or NGO access not granted");
      }

      const appRole = backendRole === "admin" ? "admin" : "ngo";
      localStorage.setItem("token", data.access_token);
      localStorage.setItem("ngo_token", data.access_token);
      localStorage.setItem("role", appRole);
      localStorage.setItem("backend_role", backendRole);
      if (data?.user_id) {
        localStorage.setItem("user_id", data.user_id);
        localStorage.setItem("ngo_user_id", data.user_id);
      }
      if (data?.org_name) localStorage.setItem("org_name", data.org_name);
      if (data?.org_type) localStorage.setItem("org_type", data.org_type);
      if (data?.region) localStorage.setItem("org_region", data.region);
      navigate("/dashboard");
    } catch (err) {
      setError(err.message || "Invalid credentials or NGO access not granted");
    } finally {
      setLoading(false);
    }
  }

  async function handleRegister(e) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");
    try {
      const r = await fetch(`${API_BASE}/auth/ngo-register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data?.detail || data?.message || `HTTP ${r.status}`);
      setMessage("Registration complete. Sign in with the same email and password.");
      setMode("login");
    } catch (err) {
      setError(err.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="ngo-login-page" style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#F3F4F6',
      padding: '100px 24px 40px',
    }}>
      <div style={{
        height: '200px',
        background: 'linear-gradient(135deg, #4C1D95 0%, #6D28D9 60%, #8B5CF6 100%)',
        width: '100%',
        position: 'absolute',
        top: '64px',
        left: 0,
        zIndex: 0,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        <div style={{color:'#FFFFFF', fontSize:'28px', fontWeight:'800', letterSpacing:'-0.5px'}}>
          Partner Portal
        </div>
        <div style={{color:'rgba(255,255,255,0.7)', fontSize:'14px', marginTop:'6px'}}>
          Secure Civic Operations
        </div>
      </div>

      <section style={panelStyle}>
        <div style={eyebrowStyle}>Secure Civic Operations</div>
        <h1 style={titleStyle}>Partner Portal</h1>
        <p style={subtitleStyle}>
          NGOs and contractors can coordinate on verified civic complaints.
        </p>

        <div style={toggleStyle}>
          <button type="button" onClick={() => setMode("login")} style={tabStyle(mode === "login")}>Login</button>
          <button type="button" onClick={() => setMode("register")} style={tabStyle(mode === "register")}>Register as NGO/Contractor</button>
        </div>

        <form onSubmit={mode === "login" ? handleLogin : handleRegister}>
          {mode === "register" && (
            <>
              <label style={labelStyle}>Name</label>
              <input value={form.name} onChange={(e) => update("name", e.target.value)} required style={inputStyle} />

              <label style={labelStyle}>Organization name</label>
              <input value={form.org_name} onChange={(e) => update("org_name", e.target.value)} required style={inputStyle} />

              <label style={labelStyle}>Organization type</label>
              <div style={{ display: "flex", gap: 10, marginBottom: 14 }}>
                {[
                  ["ngo", "NGO"],
                  ["contractor", "Contractor"],
                ].map(([value, label]) => (
                  <label key={value} style={radioStyle(form.org_type === value)}>
                    <input
                      type="radio"
                      name="org_type"
                      checked={form.org_type === value}
                      onChange={() => update("org_type", value)}
                      style={{ display: 'none' }}
                    />
                    <div style={{
                      width: '14px', height: '14px', borderRadius: '50%',
                      border: `2px solid ${form.org_type === value ? '#6D28D9' : '#D1D5DB'}`,
                      background: form.org_type === value ? '#6D28D9' : 'transparent',
                      marginRight: '6px'
                    }}></div>
                    {label}
                  </label>
                ))}
              </div>

              <label style={labelStyle}>Region</label>
              <select value={form.region} onChange={(e) => update("region", e.target.value)} style={inputStyle}>
                {REGIONS.map((region) => <option key={region} value={region}>{region}</option>)}
              </select>
            </>
          )}

          <label style={labelStyle}>Email</label>
          <input
            type="email"
            value={form.email}
            onChange={(e) => update("email", e.target.value)}
            required
            style={inputStyle}
            onFocus={(e) => { e.target.style.borderColor = '#8B5CF6'; e.target.style.boxShadow = '0 0 0 3px rgba(139,92,246,0.15)'; }}
            onBlur={(e) => { e.target.style.borderColor = '#E5E7EB'; e.target.style.boxShadow = 'none'; }}
          />

          <label style={labelStyle}>Password</label>
          <input
            type="password"
            value={form.password}
            onChange={(e) => update("password", e.target.value)}
            required
            style={inputStyle}
            onFocus={(e) => { e.target.style.borderColor = '#8B5CF6'; e.target.style.boxShadow = '0 0 0 3px rgba(139,92,246,0.15)'; }}
            onBlur={(e) => { e.target.style.borderColor = '#E5E7EB'; e.target.style.boxShadow = 'none'; }}
          />

          {error && <div style={errorStyle}>{error}</div>}
          {message && <div style={successStyle}>{message}</div>}

          <button 
            type="submit" 
            disabled={loading} 
            style={submitStyle}
            onMouseEnter={(e) => { e.currentTarget.style.opacity = '0.92'; e.currentTarget.style.transform = 'scale(1.01)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.opacity = '1'; e.currentTarget.style.transform = 'scale(1)'; }}
          >
            {loading ? "Please wait..." : mode === "login" ? "Sign in" : "Create account"}
          </button>
        </form>
      </section>
    </main>
  );
}

const panelStyle = {
  width: '100%',
  maxWidth: '480px',
  margin: '0 auto',
  marginTop: '-40px',
  backgroundColor: '#FFFFFF',
  borderRadius: '20px',
  border: '1px solid #E5E7EB',
  boxShadow: '0 8px 40px rgba(109, 40, 217, 0.12)',
  padding: '36px 40px',
  position: 'relative',
  zIndex: 10,
};

const eyebrowStyle = {
  color: '#7C3AED',
  fontSize: '11px',
  fontWeight: '700',
  letterSpacing: '1.5px',
  textTransform: 'uppercase',
  marginBottom: '8px',
};

const titleStyle = {
  fontSize: '26px',
  fontWeight: '800',
  color: '#111827',
  letterSpacing: '-0.5px',
  marginBottom: '6px',
};

const subtitleStyle = {
  fontSize: '14px',
  color: '#6B7280',
  marginBottom: '28px',
  lineHeight: '1.5',
};

const toggleStyle = {
  display: 'flex',
  backgroundColor: '#F3F4F6',
  borderRadius: '10px',
  padding: '4px',
  marginBottom: '24px',
};

const tabStyle = (active) => ({
  flex: 1,
  backgroundColor: active ? '#FFFFFF' : 'transparent',
  color: active ? '#6D28D9' : '#6B7280',
  fontWeight: active ? '700' : '500',
  fontSize: '14px',
  border: 'none',
  borderRadius: '8px',
  padding: '10px',
  cursor: 'pointer',
  boxShadow: active ? '0 1px 4px rgba(0,0,0,0.08)' : 'none',
  transition: 'all 0.2s',
});

const labelStyle = {
  display: 'block',
  fontSize: '13px',
  fontWeight: '600',
  color: '#374151',
  marginBottom: '6px',
};

const inputStyle = {
  width: '100%',
  border: '1.5px solid #E5E7EB',
  borderRadius: '10px',
  padding: '11px 14px',
  fontSize: '14px',
  color: '#111827',
  backgroundColor: '#F9FAFB',
  outline: 'none',
  marginBottom: '16px',
  fontFamily: 'inherit',
  transition: 'border-color 0.2s, box-shadow 0.2s',
};

const radioStyle = (active) => ({
  flex: 1,
  border: `1.5px solid ${active ? "#6D28D9" : "#E5E7EB"}`,
  color: active ? "#6D28D9" : "#374151",
  background: active ? "rgba(109,40,217,0.05)" : "#F9FAFB",
  borderRadius: '10px',
  padding: "9px 10px",
  display: "flex",
  alignItems: "center",
  fontWeight: 600,
  fontSize: 13,
  cursor: 'pointer',
  transition: 'all 0.2s',
});

const errorStyle = {
  backgroundColor: '#FEF2F2',
  color: '#DC2626',
  border: '1px solid #FECACA',
  borderRadius: '8px',
  padding: '10px',
  marginBottom: '16px',
  fontSize: '13px',
  fontWeight: '500',
};

const successStyle = {
  background: "#f0fdf4",
  color: "#166534",
  borderRadius: '8px',
  padding: '10px',
  marginBottom: '16px',
  fontSize: '13px',
};

const submitStyle = {
  width: '100%',
  background: 'linear-gradient(135deg, #6D28D9, #8B5CF6)',
  color: '#FFFFFF',
  border: 'none',
  borderRadius: '12px',
  padding: '13px',
  fontSize: '15px',
  fontWeight: '700',
  cursor: 'pointer',
  marginTop: '8px',
  boxShadow: '0 4px 16px rgba(109,40,217,0.3)',
  transition: 'opacity 0.2s, transform 0.2s',
};
