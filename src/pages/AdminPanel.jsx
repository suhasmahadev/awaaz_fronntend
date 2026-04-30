import React, { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { API_BASE } from "../utils/identity";
import MapView from "./MapView";
import CommunityFeed from "./CommunityFeed";

const API = API_BASE;
function hdr() {
  return { "Content-Type": "application/json", Authorization: "Bearer " + localStorage.getItem("token") };
}
const TABS = [
  { id: "home", label: "Home" },
  { id: "map", label: "Map" },
  { id: "community", label: "Community" },
  { id: "complaints", label: "Complaints" },
  { id: "schedule", label: "Schedule" },
  { id: "ngo", label: "Requests" },
  { id: "audit", label: "Audit Log" },
];
const RISK_BG = { critical: "#991b1b", high: "#92400e", medium: "#1e3a5f", low: "#374151" };
const RISK_FG = { critical: "#fca5a5", high: "#fbbf24", medium: "#93c5fd", low: "#d1d5db" };
function RiskBadge({ level }) {
  if (!level) return null;
  return <span style={{ background: RISK_BG[level] || "#374151", color: RISK_FG[level] || "#d1d5db", padding: "2px 8px", borderRadius: 4, fontSize: 11, fontWeight: 700 }}>{level}</span>;
}

// ── TAB 1: Home ──
function HomeTab() {
  const [d, setD] = useState(null);
  const [loading, setL] = useState(true);
  const [summaries, setSummaries] = useState({});
  const [sumLoading, setSumLoading] = useState({});
  const load = useCallback(async () => { setL(true); try { const r = await fetch(`${API}/admin/dashboard`, { headers: hdr() }); setD(await r.json()); } catch {} setL(false); }, []);
  useEffect(() => { load(); }, [load]);

  async function aiSummary(id) {
    setSumLoading(p => ({ ...p, [id]: true }));
    try {
      const r = await fetch(`${API}/admin/complaints/${id}/summarise`, { method: "POST", headers: hdr() });
      const j = await r.json(); setSummaries(p => ({ ...p, [id]: j }));
    } catch {} setSumLoading(p => ({ ...p, [id]: false }));
  }
  async function resolveC(id) {
    await fetch(`${API}/admin/complaints/${id}/resolve`, { method: "PATCH", headers: hdr(), body: JSON.stringify({ resolved: true, admin_note: "" }) });
    load();
  }

  if (loading) return <p style={{ color: "#9ca3af" }}>Loading dashboard…</p>;
  if (!d) return <p style={{ color: "#f87171" }}>Failed to load dashboard</p>;
  const stats = [
    ["Total Complaints", d.total_complaints],
    ["High Confidence", d.high_confidence],
    ["Critical Risk", d.critical_risk],
    ["Pending NGO", d.pending_ngo_requests],
    ["Resolved This Week", d.resolved_this_week],
    ["Breach ₹", "₹" + (d.total_breach_value_inr || 0).toLocaleString()],
  ];
  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(150px,1fr))", gap: 12, marginBottom: 24 }}>
        {stats.map(([l, v]) => (
          <div key={l} style={{ background: "#1f2937", borderRadius: 8, padding: 16 }}>
            <div style={{ color: "#9ca3af", fontSize: 11, marginBottom: 4 }}>{l}</div>
            <div style={{ color: "#f9fafb", fontSize: 22, fontWeight: 700 }}>{v ?? "—"}</div>
          </div>
        ))}
      </div>
      <h3 style={{ color: "#f9fafb", marginBottom: 8 }}>Top Risk Complaints</h3>
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
          <thead><tr style={{ borderBottom: "1px solid #374151" }}>
            {["Type", "Ward", "Risk", "Confidence", "Warranty", "Actions"].map(h => <th key={h} style={{ textAlign: "left", color: "#9ca3af", padding: "6px 8px" }}>{h}</th>)}
          </tr></thead>
          <tbody>
            {(d.top_risk_complaints || []).map(c => (
              <React.Fragment key={c.id}>
                <tr style={{ borderBottom: "1px solid #1f2937" }}>
                  <td style={{ color: "#e5e7eb", padding: "6px 8px" }}>{c.complaint_type}</td>
                  <td style={{ color: "#9ca3af", padding: "6px 8px" }}>{c.ward_id || "—"}</td>
                  <td style={{ padding: "6px 8px" }}><RiskBadge level={c.risk_level} /></td>
                  <td style={{ color: "#60a5fa", padding: "6px 8px" }}>{((c.confidence_score || 0) * 100).toFixed(0)}%</td>
                  <td style={{ color: c.warranty_breach ? "#f87171" : "#6b7280", padding: "6px 8px" }}>{c.warranty_breach ? "Yes" : "No"}</td>
                  <td style={{ padding: "6px 8px" }}>
                    <div style={{ display: "flex", gap: 4 }}>
                      <button onClick={() => aiSummary(c.id)} style={mbtn("#2563eb")}>{sumLoading[c.id] ? "…" : "AI Summary"}</button>
                      <button onClick={() => resolveC(c.id)} style={mbtn("#16a34a")}>Resolve</button>
                    </div>
                  </td>
                </tr>
                {summaries[c.id] && (
                  <tr><td colSpan={6} style={{ padding: "8px 16px", background: "#0f172a" }}>
                    <div style={{ fontSize: 12 }}>
                      <div style={{ color: "#e5e7eb", marginBottom: 4 }}><b>Summary:</b> {summaries[c.id].summary}</div>
                      <div style={{ color: "#fbbf24" }}><b>Risk:</b> {summaries[c.id].risk_level} — {summaries[c.id].risk_reason}</div>
                      <div style={{ color: "#93c5fd" }}><b>Action:</b> {summaries[c.id].recommended_action}</div>
                      {summaries[c.id].tee_attestation && (
                        <div style={{
                          marginTop: 10, padding: "8px 12px",
                          background: "#022c22", border: "1px solid #064e3b",
                          borderRadius: 8, fontSize: 11,
                          display: "inline-flex", alignItems: "center", gap: 8,
                        }}>
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                            <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                          </svg>
                          <div>
                            <div style={{ fontWeight: 600, color: "#34d399" }}>TEE-Verified AI Analysis</div>
                            <div style={{ color: "#6ee7b7" }}>{summaries[c.id].tee_attestation.provider} · {summaries[c.id].tee_attestation.tee_type}</div>
                          </div>
                          <a href={summaries[c.id].tee_attestation.verification_url} target="_blank" rel="noreferrer" style={{ marginLeft: 16, fontSize: 10, color: "#60a5fa" }}>Verify →</a>
                        </div>
                      )}
                    </div>
                  </td></tr>
                )}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>
      <h3 style={{ color: "#f9fafb", margin: "20px 0 8px" }}>Pending Assignments</h3>
      {(d.pending_assignments || []).length === 0 ? <p style={{ color: "#6b7280", fontSize: 12 }}>All complaints assigned.</p> : (
        <div>{(d.pending_assignments || []).map(c => (
          <div key={c.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "6px 0", borderBottom: "1px solid #1f2937" }}>
            <span style={{ color: "#e5e7eb", fontSize: 12 }}>{c.complaint_type} — {c.ward_id || "—"}</span>
          </div>
        ))}</div>
      )}
    </div>
  );
}

// ── TAB 4: Complaints ──
function ComplaintsTab() {
  const [data, setData] = useState([]);
  const [loading, setL] = useState(true);
  const [sf, setSf] = useState("");
  const [rf, setRf] = useState("");
  const [af, setAf] = useState("");
  const [summaries, setSummaries] = useState({});
  const [sumLoading, setSumLoading] = useState({});
  const [assignModal, setAssignModal] = useState(null);
  const [contractors, setContractors] = useState([]);
  const [selContractor, setSelContractor] = useState("");
  const [dueDate, setDueDate] = useState("");

  const load = useCallback(async () => {
    setL(true);
    let url = `${API}/admin/complaints-list?`;
    if (sf) url += `status=${sf}&`;
    if (rf) url += `risk=${rf}&`;
    if (af) url += `assigned=${af}&`;
    try { const r = await fetch(url, { headers: hdr() }); const j = await r.json(); setData(j.complaints || []); } catch {}
    setL(false);
  }, [sf, rf, af]);

  useEffect(() => { load(); }, [load]);

  async function aiSummary(id) {
    setSumLoading(p => ({ ...p, [id]: true }));
    try { const r = await fetch(`${API}/admin/complaints/${id}/summarise`, { method: "POST", headers: hdr() }); const j = await r.json(); setSummaries(p => ({ ...p, [id]: j })); } catch {}
    setSumLoading(p => ({ ...p, [id]: false }));
  }
  async function resolveC(id, resolved) {
    await fetch(`${API}/admin/complaints/${id}/resolve`, { method: "PATCH", headers: hdr(), body: JSON.stringify({ resolved, admin_note: "" }) });
    load();
  }
  async function openAssign(id) {
    setAssignModal(id);
    try { const r = await fetch(`${API}/admin/contractors-list`, { headers: hdr() }); const j = await r.json(); setContractors(j.contractors || []); } catch {}
  }
  async function submitAssign() {
    if (!selContractor || !dueDate) return;
    await fetch(`${API}/admin/complaints/${assignModal}/assign`, { method: "POST", headers: hdr(), body: JSON.stringify({ contractor_user_id: selContractor, due_date: dueDate }) });
    setAssignModal(null); setSelContractor(""); setDueDate(""); load();
  }

  return (
    <div>
      <div style={{ display: "flex", gap: 8, marginBottom: 12, flexWrap: "wrap" }}>
        <select value={sf} onChange={e => setSf(e.target.value)} style={sel}>
          <option value="">All Status</option>
          {["unverified","low_confidence","medium_confidence","high_confidence","assigned","resolved","disputed"].map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <select value={rf} onChange={e => setRf(e.target.value)} style={sel}>
          <option value="">All Risk</option>
          {["critical","high","medium","low"].map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <select value={af} onChange={e => setAf(e.target.value)} style={sel}>
          <option value="">All</option><option value="true">Assigned</option><option value="false">Unassigned</option>
        </select>
      </div>
      {loading && <p style={{ color: "#9ca3af" }}>Loading…</p>}
      {!loading && data.length === 0 && <p style={{ color: "#6b7280", fontSize: 12 }}>No complaints.</p>}
      {!loading && data.length > 0 && (
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
            <thead><tr style={{ borderBottom: "1px solid #374151" }}>
              {["ID","Type","Confidence","Risk","Assigned To","Status","Actions"].map(h => <th key={h} style={{ textAlign: "left", color: "#9ca3af", padding: "4px 8px" }}>{h}</th>)}
            </tr></thead>
            <tbody>{data.map(c => (
              <React.Fragment key={c.id}>
                <tr style={{ borderBottom: "1px solid #1f2937" }}>
                  <td style={{ color: "#6b7280", padding: "6px 8px" }}>{c.id?.slice(0, 8)}</td>
                  <td style={{ color: "#e5e7eb", padding: "6px 8px" }}>{c.complaint_type}</td>
                  <td style={{ color: "#60a5fa", padding: "6px 8px" }}>{((c.confidence_score || 0) * 100).toFixed(0)}%</td>
                  <td style={{ padding: "6px 8px" }}><RiskBadge level={c.risk_level} /></td>
                  <td style={{ color: "#e5e7eb", padding: "6px 8px" }}>{c.contractor_name || "—"}</td>
                  <td style={{ color: "#9ca3af", padding: "6px 8px" }}>{c.status}</td>
                  <td style={{ padding: "6px 8px" }}>
                    <div style={{ display: "flex", gap: 4 }}>
                      <button onClick={() => aiSummary(c.id)} style={mbtn("#2563eb")}>{sumLoading[c.id] ? "…" : "AI Summary"}</button>
                      <button onClick={() => openAssign(c.id)} style={mbtn("#7c3aed")}>Assign</button>
                      <button onClick={() => resolveC(c.id, true)} style={mbtn("#16a34a")}>Resolve</button>
                      <button onClick={() => resolveC(c.id, false)} style={mbtn("#dc2626")}>Dispute</button>
                    </div>
                  </td>
                </tr>
                {summaries[c.id] && (
                  <tr><td colSpan={7} style={{ padding: "8px 16px", background: "#0f172a" }}>
                    <div style={{ fontSize: 12 }}>
                      <div style={{ color: "#e5e7eb", marginBottom: 4 }}><b>Summary:</b> {summaries[c.id].summary}</div>
                      <div style={{ color: "#fbbf24" }}><b>Risk:</b> {summaries[c.id].risk_level} — {summaries[c.id].risk_reason}</div>
                      <div style={{ color: "#93c5fd" }}><b>Action:</b> {summaries[c.id].recommended_action}</div>
                      {summaries[c.id].tee_attestation && (
                        <div style={{
                          marginTop: 10, padding: "8px 12px",
                          background: "#022c22", border: "1px solid #064e3b",
                          borderRadius: 8, fontSize: 11,
                          display: "inline-flex", alignItems: "center", gap: 8,
                        }}>
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                            <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                          </svg>
                          <div>
                            <div style={{ fontWeight: 600, color: "#34d399" }}>TEE-Verified AI Analysis</div>
                            <div style={{ color: "#6ee7b7" }}>{summaries[c.id].tee_attestation.provider} · {summaries[c.id].tee_attestation.tee_type}</div>
                          </div>
                          <a href={summaries[c.id].tee_attestation.verification_url} target="_blank" rel="noreferrer" style={{ marginLeft: 16, fontSize: 10, color: "#60a5fa" }}>Verify →</a>
                        </div>
                      )}
                    </div>
                  </td></tr>
                )}
              </React.Fragment>
            ))}</tbody>
          </table>
        </div>
      )}
      {assignModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 999 }}>
          <div style={{ background: "#111827", borderRadius: 12, padding: 24, width: 360, border: "1px solid #374151" }}>
            <h3 style={{ color: "#f9fafb", marginTop: 0 }}>Assign Contractor</h3>
            <select value={selContractor} onChange={e => setSelContractor(e.target.value)} style={{ ...sel, width: "100%", marginBottom: 12 }}>
              <option value="">Select contractor</option>
              {contractors.map(c => <option key={c.user_id} value={c.user_id}>{c.org_name}</option>)}
            </select>
            <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} style={{ ...sel, width: "100%", marginBottom: 12, boxSizing: "border-box" }} />
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={submitAssign} style={mbtn("#16a34a")}>Assign</button>
              <button onClick={() => setAssignModal(null)} style={mbtn("#6b7280")}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── TAB 5: Schedule ──
function ScheduleTab() {
  const [d, setD] = useState(null);
  const [loading, setL] = useState(true);
  const load = useCallback(async () => { setL(true); try { const r = await fetch(`${API}/admin/schedule`, { headers: hdr() }); setD(await r.json()); } catch {} setL(false); }, []);
  useEffect(() => { load(); }, [load]);
  async function markResolved(id) {
    await fetch(`${API}/admin/complaints/${id}/resolve`, { method: "PATCH", headers: hdr(), body: JSON.stringify({ resolved: true, admin_note: "" }) });
    load();
  }
  if (loading) return <p style={{ color: "#9ca3af" }}>Loading…</p>;
  if (!d) return <p style={{ color: "#f87171" }}>Failed</p>;
  const sections = [
    { title: "OVERDUE", color: "#dc2626", items: d.overdue || [] },
    { title: "DUE TODAY", color: "#d97706", items: d.due_today || [] },
    { title: "UPCOMING", color: "#16a34a", items: d.upcoming || [] },
  ];
  return (
    <div>{sections.map(s => (
      <div key={s.title} style={{ marginBottom: 20 }}>
        <h3 style={{ color: s.color, fontSize: 14, marginBottom: 8 }}>{s.title} ({s.items.length})</h3>
        {s.items.length === 0 ? <p style={{ color: "#6b7280", fontSize: 12 }}>None</p> : s.items.map(item => (
          <div key={item.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: "1px solid #1f2937", fontSize: 12 }}>
            <div><span style={{ color: "#e5e7eb" }}>{item.complaint_type}</span> <span style={{ color: "#6b7280" }}>| {item.ward_id || "—"} | {item.contractor_name}</span> <span style={{ color: "#9ca3af" }}>| Due: {item.due_date}</span> <span style={{ color: "#60a5fa" }}>| {item.status}</span></div>
            <button onClick={() => markResolved(item.complaint_id)} style={mbtn("#16a34a")}>Mark Resolved</button>
          </div>
        ))}
      </div>
    ))}</div>
  );
}

// ── TAB 6: NGO Requests ──
function NgoTab() {
  const [data, setData] = useState([]);
  const [loading, setL] = useState(true);
  const [subTab, setSubTab] = useState("ngo");
  const load = useCallback(async () => { setL(true); try { const r = await fetch(`${API}/admin/ngo-requests-list`, { headers: hdr() }); const j = await r.json(); setData(j.requests || []); } catch {} setL(false); }, []);
  useEffect(() => { load(); }, [load]);
  async function approve(id) {
    try { await fetch(`${API}/admin/ngo-requests-list/${id}/approve`, { method: "PATCH", headers: hdr() }); load(); } catch {}
  }
  async function reject(id) {
    const reason = window.prompt("Reason for rejection?") || "";
    try { await fetch(`${API}/admin/ngo-requests-list/${id}/reject`, { method: "PATCH", headers: hdr(), body: JSON.stringify({ reason }) }); load(); } catch {}
  }
  const filtered = data.filter(r => {
    const ot = r.org_type || "ngo";
    return subTab === "ngo" ? ot === "ngo" || ot === "faculty" : ot === "contractor" || ot === "moderator";
  });
  return (
    <div>
      <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
        <button onClick={() => setSubTab("ngo")} style={{ ...mbtn(subTab === "ngo" ? "#2563eb" : "#374151"), padding: "6px 16px" }}>NGO Requests</button>
        <button onClick={() => setSubTab("contractor")} style={{ ...mbtn(subTab === "contractor" ? "#2563eb" : "#374151"), padding: "6px 16px" }}>Contractor Requests</button>
      </div>
      {loading && <p style={{ color: "#9ca3af" }}>Loading…</p>}
      {!loading && filtered.length === 0 && <p style={{ color: "#6b7280", fontSize: 12 }}>No requests.</p>}
      {!loading && filtered.map(req => (
        <div key={req.id} style={{ background: "#1f2937", borderRadius: 8, padding: 14, marginBottom: 10 }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
            <span style={{ color: "#e5e7eb", fontWeight: 600, fontSize: 13 }}>{req.org_name || req.user_name || "Unknown"}</span>
            <span style={{ fontSize: 11, color: req.status === "pending" ? "#fbbf24" : req.status === "approved" ? "#4ade80" : "#f87171", fontWeight: 700 }}>{req.status}</span>
          </div>
          <div style={{ fontSize: 11, color: "#9ca3af", marginBottom: 6 }}>
            <span style={{ background: "#374151", padding: "2px 6px", borderRadius: 4, marginRight: 6 }}>{req.org_type || "ngo"}</span>
            Complaint: {req.complaint_id} | {req.reason || req.message || "—"} | {req.created_at ? new Date(req.created_at).toLocaleDateString() : "—"}
          </div>
          {req.status === "pending" && (
            <div style={{ display: "flex", gap: 6 }}>
              <button onClick={() => approve(req.id)} style={mbtn("#16a34a")}>Approve</button>
              <button onClick={() => reject(req.id)} style={mbtn("#dc2626")}>Reject</button>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// ── TAB 7: Audit Log ──
function AuditTab() {
  const [data, setData] = useState([]);
  const [loading, setL] = useState(true);
  const load = useCallback(async () => { setL(true); try { const r = await fetch(`${API}/admin/audit-log?limit=100`, { headers: hdr() }); const j = await r.json(); setData(j.audit_log || []); } catch {} setL(false); }, []);
  useEffect(() => { load(); }, [load]);
  if (loading) return <p style={{ color: "#9ca3af" }}>Loading…</p>;
  return (
    <div style={{ overflowX: "auto" }}>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
        <thead><tr style={{ borderBottom: "1px solid #374151" }}>
          {["Action","Entity","Actor","Timestamp","Sig Valid"].map(h => <th key={h} style={{ textAlign: "left", color: "#9ca3af", padding: "4px 8px" }}>{h}</th>)}
        </tr></thead>
        <tbody>{data.map(e => (
          <tr key={e.id} style={{ borderBottom: "1px solid #1f2937" }}>
            <td style={{ color: "#60a5fa", padding: "6px 8px", fontWeight: 600 }}>{e.action}</td>
            <td style={{ color: "#9ca3af", padding: "6px 8px" }}>{e.entity_type} {e.entity_id?.slice(0, 12)}</td>
            <td style={{ color: "#e5e7eb", padding: "6px 8px" }}>{(e.actor_anon_id || "system").slice(0, 10)}</td>
            <td style={{ color: "#6b7280", padding: "6px 8px" }}>{e.created_at ? new Date(e.created_at).toLocaleString() : "—"}</td>
            <td style={{ padding: "6px 8px", color: e.signature_valid ? "#4ade80" : "#f87171", fontWeight: 700 }}>{e.signature_valid ? "✓ Valid" : "✗ Invalid"}</td>
          </tr>
        ))}</tbody>
      </table>
    </div>
  );
}

// ── Style helpers ──
const mbtn = (bg) => ({ background: bg, color: "#fff", border: "none", borderRadius: 4, padding: "4px 10px", cursor: "pointer", fontSize: 11, fontWeight: 700 });
const sel = { background: "#1f2937", border: "1px solid #374151", borderRadius: 4, color: "#e5e7eb", padding: "4px 8px", fontSize: 12 };

// ── Root ──
export default function AdminPanel() {
  const navigate = useNavigate();
  const [tab, setTab] = useState("home");

  useEffect(() => {
    const role = localStorage.getItem("role");
    const token = localStorage.getItem("token");
    if (!token) { navigate("/login"); return; }
    if (role !== "admin") { navigate("/"); return; }
  }, [navigate]);

  return (
    <div className="admin-dashboard page-shell" style={{ display: "flex", minHeight: "100vh", fontFamily: "system-ui, sans-serif", background: "#0a0a0a" }}>
      {/* Sidebar */}
      <div style={{ width: 200, background: "#111827", borderRight: "1px solid #1f2937", position: "fixed", top: 0, left: 0, bottom: 0, display: "flex", flexDirection: "column", zIndex: 50 }}>
        <div style={{ padding: "20px 16px", borderBottom: "1px solid #1f2937" }}>
          <h1 style={{ color: "#f9fafb", fontSize: 18, fontWeight: 800, margin: 0 }}>⚖️ AWAAZ ADMIN</h1>
        </div>
        <div style={{ flex: 1, padding: "8px 0" }}>
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)} style={{
              display: "block", width: "100%", textAlign: "left",
              background: tab === t.id ? "#1f2937" : "transparent",
              border: "none", borderLeft: tab === t.id ? "3px solid #2563eb" : "3px solid transparent",
              color: tab === t.id ? "#f9fafb" : "#9ca3af",
              padding: "10px 16px", cursor: "pointer", fontSize: 13, fontWeight: tab === t.id ? 700 : 400,
            }}>{t.label}</button>
          ))}
        </div>
        <div style={{ padding: 12, borderTop: "1px solid #1f2937" }}>
          <button onClick={() => { localStorage.removeItem("token"); localStorage.removeItem("ngo_token"); localStorage.removeItem("role"); localStorage.removeItem("backend_role"); navigate("/login"); }} style={{ ...mbtn("#dc2626"), width: "100%", padding: "8px 0" }}>Logout</button>
        </div>
      </div>
      {/* Main */}
      <div style={{ marginLeft: 200, flex: 1, padding: 24, paddingBottom: 88, minHeight: "100vh" }}>
        {tab === "home" && <HomeTab />}
        {tab === "map" && <div style={{ height: "calc(100vh - 48px)", marginTop: -24, marginLeft: -24, marginRight: -24 }}><MapView /></div>}
        {tab === "community" && <CommunityFeed adminMode />}
        {tab === "complaints" && <ComplaintsTab />}
        {tab === "schedule" && <ScheduleTab />}
        {tab === "ngo" && <NgoTab />}
        {tab === "audit" && <AuditTab />}
      </div>
    </div>
  );
}
