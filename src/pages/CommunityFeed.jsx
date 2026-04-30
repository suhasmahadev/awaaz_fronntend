import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { CommentBubble } from "../components/ComplaintPanel";
import UnifiedInput from "../components/UnifiedInput";
import { API_BASE, getOrCreateAnonId } from "../utils/identity";

const typeColor = (type) => ({
  pothole: "#ef4444",
  no_water: "#3b82f6",
  garbage: "#f59e0b",
  drain: "#8b5cf6",
  street_light: "#f97316",
}[type] || "#6b7280");

const confidenceColor = (score) =>
  score >= 0.75 ? "#22c55e" :
  score >= 0.55 ? "#3b82f6" :
  score >= 0.35 ? "#f59e0b" : "#9ca3af";

const confidenceTier = (score) =>
  score >= 0.75 ? "high" :
  score >= 0.55 ? "medium" :
  score >= 0.35 ? "low" : "unverified";

const timeAgo = (ts) => {
  if (!ts) return "now";
  const parsed = new Date(ts);
  if (Number.isNaN(parsed.getTime())) return "now";
  const diff = (Date.now() - parsed.getTime()) / 1000;
  if (diff < 60) return `${Math.max(0, Math.floor(diff))}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
};

function parseSignals(value) {
  if (!value) return {};
  if (typeof value === "string") {
    try {
      return JSON.parse(value);
    } catch {
      return {};
    }
  }
  return value;
}

function ComplaintCard({
  complaint,
  voted,
  vote,
  expandedComments,
  cardComments,
  commentInputs,
  toggleComments,
  setCommentInputs,
  submitCardComment,
  adminMode,
  onAdminResolve,
}) {
  const score = Number(complaint.confidence_score || 0);
  const signals = parseSignals(complaint.confidence_signals);
  const netVotes = Number(complaint.vote_count || 0);
  const corroborateCount = complaint.corroborate_count ?? Math.max(netVotes, 0);
  const disputeCount = complaint.dispute_count ?? Math.max(-netVotes, 0);
  const canRequestSolve =
    !adminMode &&
    localStorage.getItem("role") === "ngo" &&
    (localStorage.getItem("org_type") || "ngo") === "ngo";

  return (
    <div className="community-card" style={{
      margin: "12px 16px",
      background: "#fff",
      border: "1px solid #e2e8f0",
      borderRadius: 16,
      overflow: "hidden",
      boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
    }}>
      <div style={{ height: 4, background: typeColor(complaint.complaint_type) }} />

      <div style={{ padding: "14px 16px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
          <span style={{
            fontWeight: 700,
            fontSize: 15,
            textTransform: "uppercase",
            color: typeColor(complaint.complaint_type),
          }}>
            {(complaint.complaint_type || "complaint").replace("_", " ")}
          </span>
          <span style={{ fontSize: 11, color: "#9ca3af", whiteSpace: "nowrap" }}>
            {timeAgo(complaint.created_at)}
          </span>
        </div>

        {complaint.description && (
          <p style={{ margin: "8px 0 0", color: "#374151", fontSize: 13, lineHeight: 1.4 }}>
            {complaint.description}
          </p>
        )}

        {complaint.media_url && (
          <img
            src={complaint.media_url}
            alt="Complaint attachment"
            style={{
              width: "100%",
              maxHeight: 260,
              objectFit: "cover",
              borderRadius: 10,
              marginTop: 10,
              border: "1px solid #e2e8f0",
            }}
            onError={(e) => { e.currentTarget.style.display = "none"; }}
          />
        )}

        <div style={{
          margin: "10px 0 4px",
          fontSize: 11,
          color: "#6b7280",
          display: "flex",
          alignItems: "center",
          gap: 8,
        }}>
          <div style={{ flex: 1, height: 6, background: "#f1f5f9", borderRadius: 3, overflow: "hidden" }}>
            <div style={{
              width: `${Math.max(0, Math.min(score, 1)) * 100}%`,
              height: "100%",
              background: confidenceColor(score),
              borderRadius: 3,
              transition: "width 0.5s",
            }} />
          </div>
          <span style={{ fontWeight: 600, color: confidenceColor(score) }}>
            {confidenceTier(score).toUpperCase()}
          </span>
        </div>

        {complaint.warranty_breach && (
          <div style={{
            display: "inline-block",
            fontSize: 11,
            fontWeight: 600,
            background: "#fef2f2",
            color: "#dc2626",
            padding: "2px 8px",
            borderRadius: 10,
            marginBottom: 8,
          }}>
            <span style={{ marginRight: '6px' }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#DC2626" strokeWidth="2" style={{ verticalAlign: 'middle' }}>
                <circle cx="12" cy="12" r="10"/>
                <line x1="12" y1="8" x2="12" y2="12"/>
                <line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
            </span>
            WARRANTY BREACH · ₹{(Number(complaint.breach_value_inr || 0) / 100000).toFixed(1)}L
          </div>
        )}

        {Number(complaint.report_count || 1) > 1 && (
          <div style={{
            display: "inline-block",
            fontSize: 11,
            fontWeight: 700,
            background: "#ecfdf5",
            color: "#047857",
            padding: "3px 8px",
            borderRadius: 10,
            marginBottom: 8,
            marginLeft: complaint.warranty_breach ? 8 : 0,
          }}>
            +{Number(complaint.report_count || 1) - 1} more people reported this
          </div>
        )}

        <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginBottom: 12, marginTop: 8 }}>
          {Object.keys(signals).length > 0 ? Object.keys(signals).map((sig) => (
            <span key={sig} style={{
              fontSize: 10,
              padding: "2px 6px",
              borderRadius: 8,
              background: "#f0f9ff",
              color: "#0369a1",
              fontWeight: 500,
            }}>
              {sig.replace(/_/g, " ")}
            </span>
          )) : (
            <span style={{ fontSize: 11, color: "#9ca3af" }}>Awaiting more signals</span>
          )}
        </div>

        <div className="community-votes" style={{ display: "flex", gap: 8 }}>
          <button
            onClick={() => vote(complaint.id, "corroborate")}
            disabled={!!voted}
            style={{
              flex: 1,
              padding: 10,
              borderRadius: 10,
              border: "1.5px solid",
              borderColor: voted === "corroborate" ? "#22c55e" : "#e2e8f0",
              background: voted === "corroborate" ? "#f0fdf4" : "#fff",
              fontWeight: 600,
              fontSize: 13,
              cursor: voted ? "not-allowed" : "pointer",
            }}
          >
            {corroborateCount}
            {voted === "corroborate" && " ✓"}
          </button>
          <button
            onClick={() => vote(complaint.id, "dispute")}
            disabled={!!voted}
            style={{
              flex: 1,
              padding: 10,
              borderRadius: 10,
              border: "1.5px solid",
              borderColor: voted === "dispute" ? "#ef4444" : "#e2e8f0",
              background: voted === "dispute" ? "#fef2f2" : "#fff",
              fontWeight: 600,
              fontSize: 13,
              cursor: voted ? "not-allowed" : "pointer",
            }}
          >
            {disputeCount}
            {voted === "dispute" && " ✓"}
          </button>
        </div>

        <div style={{ borderTop: "0.5px solid #f1f5f9", marginTop: 10 }}>
          <button
            onClick={() => toggleComments(complaint.id)}
            style={{
              width: "100%",
              padding: "8px 0",
              background: "none",
              border: "none",
              cursor: "pointer",
              fontSize: 12,
              color: "#6b7280",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 6,
            }}
          >
            Comments
            {cardComments[complaint.id]?.length > 0 && ` (${cardComments[complaint.id].length})`}
            <span style={{ fontSize: 10 }}>
              {expandedComments[complaint.id] ? "up" : "down"}
            </span>
          </button>

          {expandedComments[complaint.id] && (
            <div style={{ padding: "0 4px 8px" }}>
              {(cardComments[complaint.id] || []).map((comment) => (
                <CommentBubble key={comment.id} comment={comment} />
              ))}

              <div style={{ marginTop: 8 }}>
                <div style={{ display: "flex", gap: 6, marginBottom: 6 }}>
                  {["support", "verification", "neutral"].map((type) => (
                    <button
                      key={type}
                      onClick={() => setCommentInputs((current) => ({
                        ...current,
                        [complaint.id]: { ...(current[complaint.id] || {}), type },
                      }))}
                      style={{
                        flex: 1,
                        padding: "4px 0",
                        borderRadius: 16,
                        fontSize: 11,
                        fontWeight: 500,
                        cursor: "pointer",
                        border: "1.5px solid",
                        borderColor: (commentInputs[complaint.id]?.type || "support") === type ? "#2563eb" : "#e2e8f0",
                        background: (commentInputs[complaint.id]?.type || "support") === type ? "#eff6ff" : "#fff",
                        color: (commentInputs[complaint.id]?.type || "support") === type ? "#2563eb" : "#9ca3af",
                      }}
                    >
                      {type === "support" ? "Support" : type === "verification" ? "Verify" : "Neutral"}
                    </button>
                  ))}
                </div>
                <UnifiedInput
                  compact
                  value={commentInputs[complaint.id]?.text || ""}
                  onChange={(e) => setCommentInputs((current) => ({
                    ...current,
                    [complaint.id]: { ...(current[complaint.id] || {}), text: e.target.value },
                  }))}
                  onSubmit={(e) => {
                    e.preventDefault();
                    submitCardComment(complaint.id);
                  }}
                  onMic={() => {}}
                  placeholder="Add your observation..."
                  fileInputId={`comment-photo-${complaint.id}`}
                  onFileSelect={(e) => setCommentInputs((current) => ({
                    ...current,
                    [complaint.id]: { ...(current[complaint.id] || {}), img: e.target.files?.[0] || null },
                  }))}
                  fileActive={Boolean(commentInputs[complaint.id]?.img)}
                  submitLabel="Post"
                />
                <div className="community-legacy-comment" style={{ display: "flex", gap: 6 }}>
                  <input
                    value={commentInputs[complaint.id]?.text || ""}
                    onChange={(e) => setCommentInputs((current) => ({
                      ...current,
                      [complaint.id]: { ...(current[complaint.id] || {}), text: e.target.value },
                    }))}
                    placeholder="Add your observation..."
                    style={{
                      flex: 1,
                      minWidth: 0,
                      padding: "8px 10px",
                      borderRadius: 8,
                      border: "1px solid #e2e8f0",
                      fontSize: 12,
                      fontFamily: "inherit",
                      outline: "none",
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") submitCardComment(complaint.id);
                    }}
                  />
                  <label style={{ cursor: "pointer", fontSize: 13, lineHeight: "34px", color: "#2563eb" }}>
                    Photo
                    <input
                      type="file"
                      accept="image/*"
                      style={{ display: "none" }}
                      onChange={(e) => setCommentInputs((current) => ({
                        ...current,
                        [complaint.id]: { ...(current[complaint.id] || {}), img: e.target.files?.[0] || null },
                      }))}
                    />
                  </label>
                  <button
                    onClick={() => submitCardComment(complaint.id)}
                    style={{
                      padding: "8px 14px",
                      borderRadius: 8,
                      background: "#1d4ed8",
                      color: "#fff",
                      border: "none",
                      cursor: "pointer",
                      fontSize: 12,
                      fontWeight: 600,
                    }}
                  >
                    Post
                  </button>
                </div>
                {commentInputs[complaint.id]?.img && (
                  <div style={{ fontSize: 11, color: "#2563eb", marginTop: 4, overflowWrap: "anywhere" }}>
                    {commentInputs[complaint.id].img.name}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
        {adminMode && (
          <div style={{ padding: "8px 0", borderTop: "1px solid #f1f5f9" }}>
            <button
              onClick={() => onAdminResolve && onAdminResolve(complaint.id)}
              style={{
                width: "100%", padding: 8, borderRadius: 8,
                background: "#16a34a", color: "#fff", border: "none",
                cursor: "pointer", fontWeight: 600, fontSize: 12,
              }}
            >Mark Resolved</button>
          </div>
        )}
        {canRequestSolve && (
          <div style={{ padding: "8px 0", borderTop: "1px solid #f1f5f9" }}>
            <button
              onClick={async () => {
                try {
                  const note = window.prompt("Optional note for admin") || "";
                  const ngoId = localStorage.getItem("user_id") || localStorage.getItem("ngo_user_id") || "";
                  if (!ngoId) {
                    alert("NGO user id is missing. Please log in again.");
                    return;
                  }
                  const r = await fetch(`${API_BASE}/complaints/${complaint.id}/request-solve`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ ngo_id: ngoId, note }),
                  });
                  const data = await r.json();
                  if (!r.ok) throw new Error(data?.detail || "Request failed");
                  alert(`Request submitted: ${data.status}`);
                } catch (err) {
                  alert(err.message || "Request failed");
                }
              }}
              style={{
                width: "100%", padding: 8, borderRadius: 8,
                background: "#2563eb", color: "#fff", border: "none",
                cursor: "pointer", fontWeight: 600, fontSize: 12,
              }}
            >Request to Solve</button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function CommunityFeed({ adminMode = false }) {
  const navigate = useNavigate();
  const [complaints, setComplaints] = useState([]);
  const [anonId, setAnonId] = useState(localStorage.getItem("anon_id") || "");
  const [lat] = useState(12.9716);
  const [lng] = useState(77.5946);
  const [loading, setLoading] = useState(false);
  const [voted, setVoted] = useState({});
  const [error, setError] = useState("");
  const [expandedComments, setExpandedComments] = useState({});
  const [cardComments, setCardComments] = useState({});
  const [commentInputs, setCommentInputs] = useState({});

  useEffect(() => {
    getOrCreateAnonId().then(setAnonId).catch((e) => setError(e.message));
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const r = await fetch(`${API_BASE}/community?all=true&lat=${lat}&lng=${lng}`);
      const data = await r.json();
      if (!r.ok) throw new Error(data.detail || data.message || `HTTP ${r.status}`);
      setComplaints(data.complaints || []);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [lat, lng]);

  useEffect(() => { load(); }, [load]);

  const sortedComplaints = useMemo(() => (
    [...complaints].sort((a, b) => Number(b.confidence_score || 0) - Number(a.confidence_score || 0))
  ), [complaints]);

  const toggleComments = async (complaintId) => {
    const next = !expandedComments[complaintId];
    setExpandedComments((current) => ({ ...current, [complaintId]: next }));
    if (next && !cardComments[complaintId]) {
      try {
        const r = await fetch(`${API_BASE}/complaints/${complaintId}/comments`);
        const d = await r.json();
        setCardComments((current) => ({ ...current, [complaintId]: d.comments || [] }));
      } catch {
        setCardComments((current) => ({ ...current, [complaintId]: [] }));
      }
    }
  };

  const submitCardComment = async (complaintId) => {
    const input = commentInputs[complaintId] || {};
    if (!input.text?.trim()) return;
    if (!anonId) {
      setError("Anonymous identity not ready yet");
      return;
    }

    const form = new FormData();
    form.append("anon_id", anonId);
    form.append("comment_type", input.type || "support");
    form.append("text", input.text);
    if (input.img) form.append("file", input.img);

    try {
      const r = await fetch(`${API_BASE}/complaints/${complaintId}/comment`, {
        method: "POST",
        body: form,
      });
      if (!r.ok) throw new Error("Comment failed");
      setCommentInputs((current) => ({
        ...current,
        [complaintId]: { text: "", type: "support", img: null },
      }));
      const refresh = await fetch(`${API_BASE}/complaints/${complaintId}/comments`);
      const d = await refresh.json();
      setCardComments((current) => ({ ...current, [complaintId]: d.comments || [] }));
    } catch (e) {
      setError(e.message || "Comment failed");
    }
  };

  const vote = async (complaintId, voteType) => {
    if (!anonId) {
      setError("Anonymous identity not ready yet");
      return;
    }
    if (voted[complaintId]) return;
    setError("");
    try {
      const r = await fetch(`${API_BASE}/complaints/${complaintId}/vote`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ anon_id: anonId, vote_type: voteType }),
      });
      const data = await r.json();
      if (!r.ok) {
        const detail = typeof data.detail === "string" ? data.detail : data.detail?.message;
        throw new Error(detail || data.message || `HTTP ${r.status}`);
      }
      setVoted((v) => ({ ...v, [complaintId]: voteType }));
      setComplaints((cs) => cs.map((c) =>
        c.id === complaintId
          ? {
              ...c,
              confidence_score: data.new_confidence ?? data.confidence_score ?? c.confidence_score,
              vote_count: Number(c.vote_count || 0) + (voteType === "corroborate" ? 1 : -1),
            }
          : c
      ));
    } catch (e) {
      setError(e.message);
    }
  };

  return (
    <main className="community-shell" style={{
      minHeight: "100vh",
      background: "#f8fafc",
      color: "#111827",
      paddingBottom: 24,
      fontFamily: "system-ui, sans-serif",
    }}>

      <div style={{ maxWidth: '900px', margin: "0 auto", padding: '40px 32px' }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          marginBottom: '24px',
        }}>
          <div>
            <h2 style={{ fontSize: '26px', fontWeight: '800', color: '#111827', letterSpacing: '-0.5px', marginBottom: '6px', margin: 0 }}>
              Community Grievances
            </h2>
            <p style={{ fontSize: '14px', color: '#6B7280', marginBottom: '28px', marginTop: 0 }}>
              Tap to corroborate what you've witnessed
            </p>
          </div>

        </div>

        {error && (
          <div style={{
            margin: "12px 16px",
            background: "#fee2e2",
            color: "#991b1b",
            border: "1px solid #fecaca",
            borderRadius: 10,
            padding: 10,
            fontSize: 13,
          }}>
            {error}
          </div>
        )}

        {loading && <div style={{ padding: 16, color: "#64748b" }}>Loading complaints...</div>}
        {!loading && sortedComplaints.map((complaint) => (
          <ComplaintCard
            key={complaint.id}
            complaint={complaint}
            voted={voted[complaint.id]}
            vote={vote}
            expandedComments={expandedComments}
            cardComments={cardComments}
            commentInputs={commentInputs}
            toggleComments={toggleComments}
            setCommentInputs={setCommentInputs}
            submitCardComment={submitCardComment}
            adminMode={adminMode}
            onAdminResolve={async (id) => {
              try {
                await fetch(`${API_BASE}/admin/complaints/${id}/resolve`, {
                  method: "PATCH",
                  headers: { "Content-Type": "application/json", Authorization: "Bearer " + localStorage.getItem("token") },
                  body: JSON.stringify({ resolved: true, admin_note: "" }),
                });
                load();
              } catch {}
            }}
          />
        ))}
        {!loading && sortedComplaints.length === 0 && (
          <div style={{
            margin: 16,
            background: "#fff",
            border: "1px solid #e2e8f0",
            borderRadius: 16,
            padding: 20,
            color: "#64748b",
            textAlign: "center",
          }}>
            No community grievances near Bengaluru yet.
          </div>
        )}
      </div>
    </main>

  );
}
