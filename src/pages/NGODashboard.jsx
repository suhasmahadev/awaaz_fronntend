import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { API_BASE } from "../utils/identity";

const confidenceColor = (score) => score >= 0.75 ? "#dc2626" : score >= 0.55 ? "#2563eb" : "#f59e0b";

const timeAgo = (ts) => {
  if (!ts) return "just now";
  const diff = (Date.now() - new Date(ts).getTime()) / 1000;
  if (Number.isNaN(diff)) return "just now";
  if (diff < 3600) return `${Math.max(1, Math.floor(diff / 60))}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
};

const wardLabel = (item) => item.ward_id || item.ward || `Ward ${String(item.geohash || "").slice(0, 4) || "Unknown"}`;
const contractLabel = (item) => item.contract_number || item.contract_id || "Pending match";

export default function NGODashboard() {
  const navigate = useNavigate();
  const [complaints, setComplaints] = useState([]);
  const [requests, setRequests] = useState([]);
  const [ward, setWard] = useState("All");
  const [loading, setLoading] = useState(false);
  const [requesting, setRequesting] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const token = localStorage.getItem("token") || localStorage.getItem("ngo_token") || "";
  const role = localStorage.getItem("role") || "";
  const backendRole = localStorage.getItem("backend_role") || role;
  const region = localStorage.getItem("org_region") || "Bengaluru";

  const load = useCallback(async () => {
    if (!token) {
      navigate("/ngo-login");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const [complaintsRes, requestsRes] = await Promise.all([
        fetch(`${API_BASE}/complaints/area?lat=12.9716&lng=77.5946&radius_km=5`),
        fetch(`${API_BASE}/ngo/my-requests`, { headers: { Authorization: `Bearer ${token}` } }),
      ]);
      const complaintsData = await complaintsRes.json();
      const requestsData = await requestsRes.json();
      if (!complaintsRes.ok) throw new Error(complaintsData.detail || "Unable to load complaints");
      if (!requestsRes.ok) throw new Error(requestsData.detail || "Unable to load requests");
      setComplaints(complaintsData.complaints || []);
      setRequests(requestsData.requests || []);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [navigate, token]);

  useEffect(() => { load(); }, [load]);

  const highConfidence = useMemo(() => (
    complaints
      .filter((c) => Number(c.confidence_score || 0) >= 0.75 || c.status === "high_confidence")
      .sort((a, b) => Number(b.confidence_score || 0) - Number(a.confidence_score || 0))
  ), [complaints]);

  const wards = useMemo(() => ["All", ...new Set(highConfidence.map(wardLabel))], [highConfidence]);

  const filteredComplaints = ward === "All"
    ? highConfidence
    : highConfidence.filter((c) => wardLabel(c) === ward);

  const counts = requests.reduce((acc, req) => {
    acc[req.status] = (acc[req.status] || 0) + 1;
    return acc;
  }, { pending: 0, approved: 0, rejected: 0 });

  async function requestDetails(complaint) {
    setRequesting(complaint.id);
    setError("");
    setMessage("");
    try {
      const reason = `Requesting verified NGO access for ${complaint.complaint_type} complaint ${complaint.id}`;
      const r = await fetch(`${API_BASE}/ngo/request-access`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ complaint_id: complaint.id, ngo_token: token, reason }),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.detail || data.message || `HTTP ${r.status}`);
      setMessage(`Request ${data.request_id} submitted`);
      await load();
    } catch (e) {
      setError(e.message);
    } finally {
      setRequesting("");
    }
  }

  async function connectContractor(complaint) {
    setRequesting(complaint.id);
    setError("");
    setMessage("");
    try {
      const r = await fetch(`${API_BASE}/ngo/connect-request`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          complaint_id: complaint.id,
          message: `Contractor connect request for ${contractLabel(complaint)} in ${wardLabel(complaint)}`,
        }),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.detail || data.message || `HTTP ${r.status}`);
      setMessage(`Connection request ${data.request_id} is pending`);
      await load();
    } catch (e) {
      setError(e.message);
    } finally {
      setRequesting("");
    }
  }

  if (backendRole === "moderator") {
    return (
      <main className="ngo-dashboard page-shell" style={pageStyle}>
        <div style={{ maxWidth: 920, margin: "0 auto" }}>
          <header style={headerStyle}>
            <div>
              <h1 style={titleStyle}>Contractor Connect Dashboard</h1>
              <p style={subtitleStyle}>High-confidence complaints in your region: {region}</p>
            </div>
            <button onClick={load} style={buttonStyle("#0f172a")}>{loading ? "Loading..." : "Refresh"}</button>
          </header>

          {error && <div style={errorStyle}>{error}</div>}
          {message && <div style={successStyle}>{message}</div>}

          <section style={panelStyle}>
            <h2 style={panelTitleStyle}>High-confidence complaints in your region</h2>
            {filteredComplaints.length === 0 && <div style={emptyStyle}>No high-confidence complaints available.</div>}
            {filteredComplaints.map((complaint) => {
              const score = Number(complaint.confidence_score || 0);
              const areaMatch = !region || [wardLabel(complaint), complaint.city, complaint.geohash].some((value) =>
                String(value || "").toLowerCase().includes(region.toLowerCase())
              );
              return (
                <div key={complaint.id} style={itemStyle}>
                  <div style={{ fontSize: 14, fontWeight: 900, color: confidenceColor(score), textTransform: "uppercase" }}>
                    {(complaint.complaint_type || "complaint").replace("_", " ")} - {wardLabel(complaint)} - Confidence {score.toFixed(2)}
                  </div>
                  <div style={mutedLineStyle}>
                    Contract: {contractLabel(complaint)} {areaMatch && <strong style={{ color: "#16a34a" }}>YOUR AREA</strong>}
                  </div>
                  <button
                    onClick={() => connectContractor(complaint)}
                    disabled={requesting === complaint.id}
                    style={{ ...buttonStyle("#1d4ed8"), marginTop: 10 }}
                  >
                    {requesting === complaint.id ? "Sending..." : "Send Connection Request"}
                  </button>
                </div>
              );
            })}
          </section>

          <section style={panelStyle}>
            <h2 style={panelTitleStyle}>Your Requests</h2>
            {requests.length === 0 && <div style={emptyStyle}>No requests sent yet.</div>}
            {requests.map((req) => (
              <div key={req.id} style={requestRowStyle}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
                  <strong>{req.complaint_id}</strong>
                  <span style={statusStyle(req.status)}>{String(req.status || "pending").toUpperCase()}</span>
                </div>
                <div style={mutedLineStyle}>sent {timeAgo(req.created_at)}</div>
                {req.status === "approved" && req.complaint_details && (
                  <div style={{ marginTop: 8, color: "#334155", fontSize: 13 }}>
                    <div>Complaint address: {req.complaint_details.address || req.complaint_details.ward}</div>
                    <div>Contact admin: {req.complaint_details.admin_contact || "admin@awaaz.in"}</div>
                    <div>Reporter contact: {req.complaint_details.reporter_contact || "anonymous"}</div>
                  </div>
                )}
              </div>
            ))}
          </section>
        </div>
      </main>
    );
  }

  return (
    <main className="ngo-dashboard page-shell" style={pageStyle}>
      <div style={{ maxWidth: 1120, margin: "0 auto" }}>
        <header style={headerStyle}>
          <div>
            <h1 style={titleStyle}>NGO Dashboard</h1>
            <p style={subtitleStyle}>High-confidence grievances and assignment requests</p>
          </div>
          <button onClick={load} style={buttonStyle("#0f172a")}>{loading ? "Loading..." : "Refresh"}</button>
        </header>

        {error && <div style={errorStyle}>{error}</div>}
        {message && <div style={successStyle}>{message}</div>}

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 16 }}>
          <section style={panelStyle}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center", marginBottom: 14 }}>
              <h2 style={panelTitleStyle}>High Confidence Breaches</h2>
              <label style={{ color: "#64748b", fontSize: 12 }}>
                Filter by ward:{" "}
                <select value={ward} onChange={(e) => setWard(e.target.value)} style={selectStyle}>
                  {wards.map((w) => <option key={w} value={w}>{w}</option>)}
                </select>
              </label>
            </div>

            {filteredComplaints.length === 0 && <div style={emptyStyle}>No high-confidence breaches in this area yet.</div>}
            {filteredComplaints.map((complaint) => {
              const score = Number(complaint.confidence_score || 0);
              return (
                <div key={complaint.id} style={itemStyle}>
                  <div style={{ fontSize: 14, fontWeight: 800, color: confidenceColor(score), textTransform: "uppercase" }}>
                    {(complaint.complaint_type || "complaint").replace("_", " ")} - {wardLabel(complaint)} - Confidence {score.toFixed(2)}
                  </div>
                  <div style={mutedLineStyle}>Contract: {contractLabel(complaint)}</div>
                  <div style={mutedLineStyle}>Breach value: INR {(Number(complaint.breach_value_inr || 0) / 100000).toFixed(1)}L</div>
                  <button
                    onClick={() => requestDetails(complaint)}
                    disabled={requesting === complaint.id}
                    style={{ ...buttonStyle("#1d4ed8"), marginTop: 10 }}
                  >
                    {requesting === complaint.id ? "Requesting..." : "Request Details from Admin"}
                  </button>
                </div>
              );
            })}
          </section>

          <section style={panelStyle}>
            <h2 style={panelTitleStyle}>My Assignment Requests</h2>
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap", color: "#475569", fontSize: 13, marginBottom: 14 }}>
              <strong>Pending: {counts.pending || 0}</strong>
              <strong>Approved: {counts.approved || 0}</strong>
              <strong>Rejected: {counts.rejected || 0}</strong>
            </div>

            {requests.length === 0 && <div style={emptyStyle}>No requests sent yet.</div>}
            {requests.map((req) => (
              <div key={req.id} style={requestRowStyle}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
                  <strong>{req.complaint_id} - {req.complaint_type || "Complaint"}</strong>
                  <span style={statusStyle(req.status)}>{String(req.status || "pending").toUpperCase()}</span>
                </div>
                <div style={mutedLineStyle}>Submitted {timeAgo(req.created_at)}</div>
                {req.admin_note && <div style={{ color: "#475569", marginTop: 4 }}>Admin note: {req.admin_note}</div>}
              </div>
            ))}
          </section>
        </div>
      </div>
    </main>
  );
}

const pageStyle = {
  minHeight: "100vh",
  background: "#f8fafc",
  color: "#0f172a",
  padding: "18px 16px 88px",
  fontFamily: "system-ui, sans-serif",
};

const headerStyle = {
  display: "flex",
  justifyContent: "space-between",
  gap: 12,
  alignItems: "center",
  marginBottom: 16,
};

const titleStyle = { margin: 0, fontSize: 22, letterSpacing: 0 };
const subtitleStyle = { margin: "4px 0 0", color: "#64748b", fontSize: 13 };

const panelStyle = {
  background: "#fff",
  border: "1px solid #e2e8f0",
  borderRadius: 12,
  padding: 16,
  boxShadow: "0 1px 6px rgba(15,23,42,0.06)",
  marginBottom: 16,
};

const panelTitleStyle = { margin: "0 0 12px", fontSize: 17, letterSpacing: 0 };

const itemStyle = {
  border: "1px solid #e2e8f0",
  borderRadius: 10,
  padding: 14,
  marginBottom: 12,
  background: "#fff",
};

const requestRowStyle = {
  borderTop: "1px solid #e2e8f0",
  padding: "10px 0",
  fontSize: 13,
};

const mutedLineStyle = { color: "#475569", fontSize: 13, marginTop: 6 };
const emptyStyle = { color: "#64748b", fontSize: 13 };

const selectStyle = {
  border: "1px solid #cbd5e1",
  borderRadius: 8,
  padding: "6px 8px",
  background: "#fff",
};

const buttonStyle = (bg) => ({
  background: bg,
  color: "#fff",
  border: 0,
  borderRadius: 8,
  padding: "8px 12px",
  cursor: "pointer",
  fontWeight: 700,
  fontSize: 12,
});

const statusStyle = (status) => ({
  color: status === "approved" ? "#16a34a" : status === "rejected" ? "#dc2626" : "#f59e0b",
  fontWeight: 800,
});

const errorStyle = {
  background: "#fee2e2",
  color: "#991b1b",
  border: "1px solid #fecaca",
  borderRadius: 10,
  padding: 10,
  marginBottom: 12,
  fontSize: 13,
};

const successStyle = {
  background: "#f0fdf4",
  color: "#166534",
  border: "1px solid #bbf7d0",
  borderRadius: 10,
  padding: 10,
  marginBottom: 12,
  fontSize: 13,
};
