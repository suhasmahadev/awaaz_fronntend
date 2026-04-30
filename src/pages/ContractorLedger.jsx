import { useCallback, useEffect, useState } from "react";
import { API_BASE } from "../utils/identity";

const scoreColor = (score) => score < 0.3 ? "#16a34a" : score < 0.6 ? "#f59e0b" : "#dc2626";
const money = (value) => Number(value || 0) >= 100000 ? `Rs ${(Number(value) / 100000).toFixed(1)}L` : `Rs ${Number(value || 0).toLocaleString("en-IN")}`;

export default function ContractorLedger() {
  const [rows, setRows] = useState([]);
  const [selected, setSelected] = useState(null);
  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [updatedAt, setUpdatedAt] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const r = await fetch(`${API_BASE}/ledger`);
      const data = await r.json();
      const contractors = Array.isArray(data) ? data : data.contractors || [];
      setRows(contractors);
      setUpdatedAt(new Date().toLocaleString());
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const openDetail = async (contractor) => {
    const contractorId = contractor.contractor_id || contractor.id;
    setSelected(contractorId);
    setError("");
    try {
      const r = await fetch(`${API_BASE}/ledger/${contractorId}`);
      const data = await r.json();
      setDetail(data);
    } catch (e) {
      setError(e.message);
    }
  };

  const copyApi = async () => navigator.clipboard?.writeText(`${API_BASE}/ledger`);
  const copyJson = async () => navigator.clipboard?.writeText(JSON.stringify(detail || rows.find((r) => (r.contractor_id || r.id) === selected), null, 2));

  return (
    <main style={{ minHeight: "100vh", background: "#f8fafc", color: "#111827" }}>
      <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '40px 32px' }}>

        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
          <div>
            <h1 style={{ fontSize: '26px', fontWeight: '800', color: '#111827', letterSpacing: '-0.5px', marginBottom: '4px' }}>
              PUBLIC CONTRACTOR ACCOUNTABILITY LEDGER
            </h1>
            <p style={{ fontSize: '13px', color: '#6B7280', marginBottom: '28px' }}>
              Last updated: {updatedAt || "not loaded"}
            </p>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button 
              onClick={copyApi} 
              style={{ backgroundColor: '#FFFFFF', border: '1.5px solid #D1D5DB', color: '#374151', borderRadius: '10px', padding: '9px 18px', fontSize: '14px', fontWeight: '500', cursor: 'pointer', transition: 'all 0.2s' }}
            >
              Copy API URL
            </button>
            <button 
              onClick={load} 
              style={{ background: 'linear-gradient(135deg, #6D28D9, #8B5CF6)', color: '#FFFFFF', border: 'none', borderRadius: '10px', padding: '9px 20px', fontSize: '14px', fontWeight: '600', cursor: 'pointer', boxShadow: '0 4px 14px rgba(109,40,217,0.3)', marginLeft: '10px' }}
            >
              {loading ? "Loading" : "Refresh"}
            </button>
          </div>
        </header>
        {error && <div style={{ background: "#fee2e2", color: "#991b1b", padding: 10, borderRadius: 6, marginBottom: 12 }}>{error}</div>}
        <div style={{ backgroundColor: '#FFFFFF', borderRadius: '14px', border: '1px solid #E5E7EB', boxShadow: '0 2px 16px rgba(109,40,217,0.06)', overflow: 'hidden' }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ backgroundColor: '#F5F3FF', borderBottom: '2px solid #E5E7EB' }}>
                <th style={{ padding: '14px 20px', fontSize: '13px', fontWeight: '700', color: '#6D28D9', textTransform: 'uppercase', letterSpacing: '0.5px', textAlign: 'left' }}>Rank</th>
                <th style={{ padding: '14px 20px', fontSize: '13px', fontWeight: '700', color: '#6D28D9', textTransform: 'uppercase', letterSpacing: '0.5px', textAlign: 'left' }}>Contractor</th>
                <th style={{ padding: '14px 20px', fontSize: '13px', fontWeight: '700', color: '#6D28D9', textTransform: 'uppercase', letterSpacing: '0.5px', textAlign: 'left' }}>Score</th>
                <th style={{ padding: '14px 20px', fontSize: '13px', fontWeight: '700', color: '#6D28D9', textTransform: 'uppercase', letterSpacing: '0.5px', textAlign: 'left' }}>Breaches</th>
                <th style={{ padding: '14px 20px', fontSize: '13px', fontWeight: '700', color: '#6D28D9', textTransform: 'uppercase', letterSpacing: '0.5px', textAlign: 'left' }}>Rs Exp</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 && (
                <tr>
                  <td colSpan="5" style={{ textAlign: 'center', padding: '60px 20px', color: '#9CA3AF', fontSize: '15px' }}>
                    {loading ? "Loading data..." : "No data available."}
                  </td>
                </tr>
              )}
              {rows.map((row, index) => {
                const rowId = row.contractor_id || row.id;
                return (
                <tr 
                  key={rowId} 
                  onClick={() => openDetail(row)} 
                  style={{ cursor: "pointer", background: selected === rowId ? "#fef3c7" : "#fff", borderBottom: '1px solid #F3F4F6', transition: 'background 0.15s' }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#FAFAFA'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = selected === rowId ? '#fef3c7' : '#fff'}
                >
                  <td style={{ padding: '14px 20px', fontSize: '14px', color: '#111827' }}>{index + 1}</td>
                  <td style={{ padding: '14px 20px', fontSize: '14px', color: '#111827' }}><strong>{row.name}</strong><div style={{ color: "#64748b", fontSize: 12 }}>{row.registration_no || "no registration"}</div></td>
                  <td style={{ padding: '14px 20px', fontSize: '14px', color: scoreColor(Number(row.failure_score || 0)), fontWeight: 800 }}>{Number(row.failure_score || 0).toFixed(2)}</td>
                  <td style={{ padding: '14px 20px', fontSize: '14px', color: '#111827' }}>{row.active_breach_count || 0}</td>
                  <td style={{ padding: '14px 20px', fontSize: '14px', color: '#111827' }}>{money(row.total_breach_value_inr)}</td>
                </tr>
              );})}
            </tbody>
          </table>
        </div>

        {detail && (
          <section style={{ marginTop: 16, background: "#fff", border: "1px solid #cbd5e1", borderRadius: 8, padding: 16 }}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
              <div>
                <h2 style={{ margin: 0, fontSize: 18 }}>{detail.contractor?.name || detail.name}</h2>
                <p style={{ margin: "6px 0", color: "#64748b" }}>{detail.contractor?.registration_no || detail.registration_no}</p>
              </div>
              <button onClick={copyJson} style={buttonStyle("#2563eb")}>Copy as JSON</button>
            </div>
            <h3 style={{ fontSize: 14, marginTop: 16 }}>Breach history</h3>
            {(detail.breach_history || []).length === 0 && <p style={{ color: "#64748b" }}>No breach complaints linked yet.</p>}
            {(detail.breach_history || []).map((item) => (
              <div key={item.complaint_id || item.id} style={{ borderTop: "1px solid #e5e7eb", padding: "10px 0", display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 8 }}>
                <span>{item.ward || item.ward_id || "Ward unknown"}</span>
                <span>{item.complaint_type}</span>
                <span>{money(item.breach_value_inr)}</span>
                <span>{Number(item.confidence_score || 0).toFixed(2)} confidence</span>
              </div>
            ))}
          </section>
        )}
      </div>
    </main>
  );
}

const th = { textAlign: "left", padding: 10, borderBottom: "1px solid #cbd5e1" };
const td = { padding: 10, borderBottom: "1px solid #e5e7eb" };
const buttonStyle = (bg) => ({ background: bg, color: "#fff", border: 0, borderRadius: 6, padding: "8px 10px", cursor: "pointer", fontWeight: 700 });
