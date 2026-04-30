import { useEffect, useState } from "react";
import { API_BASE } from "../utils/identity";

const TIER_COLOR = {
  high: "#16a34a",
  medium: "#2563eb",
  low: "#d97706",
  unverified: "#9ca3af",
};

function assetUrl(path) {
  if (!path) return "";
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  return `${API_BASE}${path.startsWith("/") ? path : `/${path}`}`;
}

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);
  return isMobile;
}

export default function ComplaintPanel({ complaint, anonId, onClose, onUpdate, onRefresh }) {
  const [comments, setComments] = useState([]);
  const [commentText, setCommentText] = useState("");
  const [commentType, setCommentType] = useState("support");
  const [commentImg, setCommentImg] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [activeTab, setActiveTab] = useState("info");
  const [uploadMsg, setUploadMsg] = useState("");
  const isMobile = useIsMobile();

  useEffect(() => {
    setComments(complaint?.comments || []);
    if (complaint?.id) loadComments();
  }, [complaint?.id]);

  const loadComments = async () => {
    try {
      const r = await fetch(`${API_BASE}/complaints/${complaint.id}/comments`);
      const d = await r.json();
      setComments(d.comments || []);
    } catch {
      setComments(complaint?.comments || []);
    }
  };

  const refreshComplaint = async () => {
    await onRefresh?.(complaint.id);
    await onUpdate?.();
  };

  const uploadEvidence = async (endpoint) => {
    if (!anonId) {
      alert("No anonymous ID found. Refresh the page.");
      return;
    }
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.onchange = async (e) => {
      const file = e.target.files?.[0];
      if (!file) return;
      setUploading(true);
      setUploadMsg("");
      const form = new FormData();
      form.append("complaint_id", complaint.id);
      form.append("anon_id", anonId);
      form.append("file", file);
      try {
        const r = await fetch(`${API_BASE}${endpoint}`, { method: "POST", body: form });
        const d = await r.json();
        if (!r.ok) throw new Error(d.detail || d.message || "Upload failed");
        setUploadMsg(
          `Uploaded. New confidence: ${Math.round((d.new_confidence || 0) * 100)}% (${d.tier})`
        );
        await refreshComplaint();
      } catch {
        setUploadMsg("Upload failed. Please try again.");
      } finally {
        setUploading(false);
      }
    };
    input.click();
  };

  const submitComment = async () => {
    if (!commentText.trim()) return;
    if (!anonId) {
      alert("No anonymous ID. Refresh page.");
      return;
    }
    setUploading(true);
    const form = new FormData();
    form.append("anon_id", anonId);
    form.append("comment_type", commentType);
    form.append("text", commentText);
    if (commentImg) form.append("file", commentImg);
    try {
      const r = await fetch(`${API_BASE}/complaints/${complaint.id}/comment`, {
        method: "POST",
        body: form,
      });
      if (!r.ok) throw new Error("Comment failed");
      setCommentText("");
      setCommentImg(null);
      await loadComments();
      await refreshComplaint();
    } catch {
      setUploadMsg("Comment failed. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  if (!complaint) {
    return (
      <div style={panelStyle(isMobile)}>
        <PanelHeader onClose={onClose} title="Loading..." />
        <div style={{ padding: 24, textAlign: "center", color: "#9ca3af", fontSize: 13 }}>
          Fetching complaint details...
        </div>
      </div>
    );
  }

  const confidence = Number(complaint.confidence_score || 0);
  const tierColor = TIER_COLOR[
    confidence >= 0.75 ? "high" :
    confidence >= 0.55 ? "medium" :
    confidence >= 0.35 ? "low" : "unverified"
  ];
  const tier = confidence >= 0.75 ? "HIGH" :
    confidence >= 0.55 ? "MEDIUM" :
    confidence >= 0.35 ? "LOW" : "UNVERIFIED";

  const getStatusBadge = (status) => {
    const badges = {
      resolved: {
        backgroundColor: '#DCFCE7',
        color: '#16A34A',
        border: '1px solid #BBF7D0',
      },
      pending: {
        backgroundColor: '#FEF3C7',
        color: '#D97706',
        border: '1px solid #FDE68A',
      },
      error: {
        backgroundColor: '#FEF2F2',
        color: '#DC2626',
        border: '1px solid #FECACA',
      },
    };

    const base = {
      borderRadius: '20px',
      padding: '3px 12px',
      fontSize: '12px',
      fontWeight: '600',
      display: 'inline-flex',
      alignItems: 'center',
      gap: '4px',
    };

    return { ...base, ...(badges[status] || badges.pending) };
  };

  const cardStyle = {
    backgroundColor: '#FFFFFF',
    borderRadius: '14px',
    border: '1px solid #E5E7EB',
    boxShadow: '0 2px 16px rgba(109, 40, 217, 0.06)',
    padding: '20px',
    transition: 'box-shadow 0.2s',
    marginBottom: '12px',
  };

  return (
    <div style={panelStyle(isMobile)}>
      <PanelHeader
        onClose={onClose}
        title={(complaint.complaint_type || "complaint").replace("_", " ").toUpperCase()}
      />

      <div style={{ padding: "12px 16px 0", borderBottom: "1px solid #f1f5f9" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
          <div style={{ flex: 1, height: 8, background: "#f1f5f9", borderRadius: 4, overflow: "hidden" }}>
            <div style={{
              width: `${Math.round(Math.max(0, Math.min(confidence, 1)) * 100)}%`,
              height: "100%",
              background: tierColor,
              borderRadius: 4,
              transition: "width 0.5s ease",
            }} />
          </div>
          <span style={{ fontSize: 12, fontWeight: 600, color: tierColor }}>
            {tier} {Math.round(confidence * 100)}%
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
            WARRANTY BREACH - INR {((complaint.breach_value_inr || 0) / 100000).toFixed(1)}L
          </div>
        )}
      </div>

      <div style={{ display: "flex", borderBottom: "1px solid #e2e8f0", padding: "0 16px" }}>
        {["info", "evidence", "comments"].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              flex: 1,
              padding: "10px 0",
              border: "none",
              borderBottom: activeTab === tab ? "2px solid #1d4ed8" : "2px solid transparent",
              background: "none",
              cursor: "pointer",
              fontSize: 12,
              fontWeight: activeTab === tab ? 600 : 400,
              color: activeTab === tab ? "#1d4ed8" : "#6b7280",
              textTransform: "capitalize",
            }}
          >
            {tab}{tab === "comments" && comments.length > 0 ? ` (${comments.length})` : ""}
          </button>
        ))}
      </div>

      <div style={{ flex: 1, overflowY: "auto", padding: 16 }}>
        {activeTab === "info" && (
          <div>
            <InfoRow label="Type" value={(complaint.complaint_type || "").replace("_", " ")} />
            <InfoRow label="Reported" value={timeAgo(complaint.created_at)} />
            <InfoRow label="Contract" value={complaint.contract_number || complaint.contract_id || "No contract on record"} />
            <InfoRow label="Votes" value={`${complaint.vote_count || 0} community votes`} />
            {complaint.description && (
              <div style={{ marginTop: 12 }}>
                <SectionLabel>Description</SectionLabel>
                <div style={{ fontSize: 13, color: "#374151", lineHeight: 1.6 }}>
                  {complaint.description}
                </div>
              </div>
            )}
            {complaint.media_url && (
              <div style={{ marginTop: 12 }}>
                <SectionLabel>Photo</SectionLabel>
                <img
                  src={assetUrl(complaint.media_url)}
                  alt="Complaint attachment"
                  style={{ width: "100%", maxHeight: 240, objectFit: "cover", borderRadius: 10, border: "1px solid #e2e8f0" }}
                  onError={(e) => { e.currentTarget.style.display = "none"; }}
                />
              </div>
            )}
            {Number.isFinite(Number(complaint.lat)) && Number.isFinite(Number(complaint.lng)) && (
              <button
                type="button"
                onClick={() => window.open(`https://www.google.com/maps/dir/?api=1&destination=${Number(complaint.lat)},${Number(complaint.lng)}`, "_blank", "noopener,noreferrer")}
                style={{
                  marginTop: 14,
                  width: "100%",
                  padding: "10px 12px",
                  borderRadius: 10,
                  border: "none",
                  background: "#059669",
                  color: "#fff",
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                Open Google Maps Navigation
              </button>
            )}

            <div style={{ marginTop: 20 }}>
              <SectionLabel>Contribute Evidence</SectionLabel>
              <div style={{ display: "flex", gap: 8 }}>
                <UploadBtn
                  label="Upload Support"
                  sublabel="I saw this too"
                  color="#2563eb"
                  onClick={() => uploadEvidence("/evidence/support")}
                  disabled={uploading}
                />
                <UploadBtn
                  label="Upload Verification"
                  sublabel="Current status photo"
                  color="#059669"
                  onClick={() => uploadEvidence("/evidence/verify")}
                  disabled={uploading}
                />
              </div>
              {uploadMsg && (
                <div style={{
                  marginTop: 8,
                  fontSize: 12,
                  color: uploadMsg.startsWith("Upload failed") || uploadMsg.startsWith("Comment failed") ? "#dc2626" : "#16a34a",
                }}>
                  {uploadMsg}
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === "evidence" && (
          <EvidenceGallery
            evidence={complaint.evidence || []}
            onUpload={() => uploadEvidence("/evidence/support")}
            onVerify={() => uploadEvidence("/evidence/verify")}
          />
        )}

        {activeTab === "comments" && (
          <CommentsSection
            comments={comments}
            commentText={commentText}
            setCommentText={setCommentText}
            commentType={commentType}
            setCommentType={setCommentType}
            commentImg={commentImg}
            setCommentImg={setCommentImg}
            onSubmit={submitComment}
            uploading={uploading}
          />
        )}
      </div>
    </div>
  );
}

function PanelHeader({ onClose, title }) {
  return (
    <div style={{
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      padding: "14px 16px",
      borderBottom: "1px solid #e2e8f0",
      background: "#fff",
      flexShrink: 0,
    }}>
      <span style={{ fontWeight: 700, fontSize: 15 }}>{title}</span>
      <button onClick={onClose} style={{
        background: "none",
        border: "none",
        fontSize: 20,
        cursor: "pointer",
        color: "#6b7280",
        lineHeight: 1,
      }}>x</button>
    </div>
  );
}

function InfoRow({ label, value }) {
  return (
    <div style={{
      display: "flex",
      justifyContent: "space-between",
      gap: 12,
      padding: "8px 0",
      borderBottom: "0.5px solid #f1f5f9",
      fontSize: 13,
    }}>
      <span style={{ color: "#9ca3af" }}>{label}</span>
      <span style={{ color: "#374151", fontWeight: 500, textAlign: "right", maxWidth: "60%", overflowWrap: "anywhere" }}>
        {value}
      </span>
    </div>
  );
}

function SectionLabel({ children }) {
  return (
    <div style={{
      fontSize: 11,
      color: "#9ca3af",
      marginBottom: 8,
      textTransform: "uppercase",
      letterSpacing: "0.05em",
    }}>
      {children}
    </div>
  );
}

function UploadBtn({ label, sublabel, color, onClick, disabled }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        flex: 1,
        padding: "12px 8px",
        borderRadius: 10,
        border: `1.5px solid ${color}`,
        background: "#fff",
        cursor: disabled ? "wait" : "pointer",
        opacity: disabled ? 0.6 : 1,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 4,
      }}
    >
      <span style={{ fontSize: 13, fontWeight: 600, color }}>{label}</span>
      {sublabel && <span style={{ fontSize: 11, color: "#9ca3af" }}>{sublabel}</span>}
    </button>
  );
}

function EvidenceGallery({ evidence, onUpload, onVerify }) {
  const before = evidence.filter((e) => e.state_type === "before");
  const after = evidence.filter((e) => e.state_type === "after");
  const support = evidence.filter((e) => e.state_type === "support");

  const ImageGrid = ({ items, label }) => {
    if (!items.length) return null;
    return (
      <div style={{ marginBottom: 16 }}>
        <SectionLabel>{label} ({items.length})</SectionLabel>
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(100px, 1fr))",
          gap: 6,
        }}>
          {items.map((ev) => <EvidenceThumb key={ev.id} ev={ev} />)}
        </div>
      </div>
    );
  };

  return (
    <div>
      <ImageGrid items={before} label="Original complaint photos" />
      <ImageGrid items={support} label="Community support photos" />
      <ImageGrid items={after} label="Verification / after-state photos" />
      {evidence.length === 0 && (
        <div style={{ textAlign: "center", color: "#9ca3af", fontSize: 13, padding: "24px 0" }}>
          No photos yet. Be the first to add evidence.
        </div>
      )}
      <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
        <UploadBtn label="Add Support Photo" color="#2563eb" onClick={onUpload} />
        <UploadBtn label="Add Verification" color="#059669" onClick={onVerify} />
      </div>
    </div>
  );
}

function EvidenceThumb({ ev }) {
  const [full, setFull] = useState(false);
  const src = assetUrl(ev.file_path);
  if (!src) return null;

  return (
    <>
      <div
        onClick={() => setFull(true)}
        style={{
          aspectRatio: "1",
          borderRadius: 8,
          overflow: "hidden",
          cursor: "pointer",
          position: "relative",
          border: "1px solid #e2e8f0",
        }}
      >
        <img
          src={src}
          alt={ev.state_type}
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
          onError={(e) => { e.currentTarget.style.display = "none"; }}
        />
        <div style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          background: "linear-gradient(transparent, rgba(0,0,0,0.5))",
          padding: "4px 6px",
          fontSize: 9,
          color: "#fff",
          fontWeight: 600,
          textTransform: "uppercase",
        }}>
          {ev.state_type}
        </div>
      </div>

      {full && (
        <div
          onClick={() => setFull(false)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.9)",
            zIndex: 9999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <img src={src} alt={ev.state_type} style={{ maxWidth: "90vw", maxHeight: "90vh", borderRadius: 8 }} />
          <span style={{ position: "absolute", top: 20, right: 24, color: "#fff", fontSize: 28, cursor: "pointer" }}>
            x
          </span>
        </div>
      )}
    </>
  );
}

function CommentsSection({
  comments,
  commentText,
  setCommentText,
  commentType,
  setCommentType,
  commentImg,
  setCommentImg,
  onSubmit,
  uploading,
}) {
  const typeStyle = (t) => ({
    padding: "5px 12px",
    borderRadius: 16,
    border: "1.5px solid",
    cursor: "pointer",
    fontSize: 12,
    fontWeight: 500,
    borderColor: commentType === t ? "#2563eb" : "#e2e8f0",
    background: commentType === t ? "#eff6ff" : "#fff",
    color: commentType === t ? "#2563eb" : "#9ca3af",
  });

  return (
    <div>
      {comments.length === 0 ? (
        <div style={{ textAlign: "center", color: "#9ca3af", fontSize: 13, padding: "16px 0 20px" }}>
          No comments yet. Add yours.
        </div>
      ) : (
        <div style={{ marginBottom: 20 }}>
          {comments.map((c) => <CommentBubble key={c.id} comment={c} />)}
        </div>
      )}

      <div style={{ border: "1px solid #e2e8f0", borderRadius: 12, padding: 14, background: "#fafafa" }}>
        <SectionLabel>Add comment</SectionLabel>
        <div style={{ display: "flex", gap: 6, marginBottom: 10, flexWrap: "wrap" }}>
          {["support", "verification", "neutral"].map((t) => (
            <button key={t} onClick={() => setCommentType(t)} style={typeStyle(t)}>
              {t === "support" ? "Support" : t === "verification" ? "Verify" : "Neutral"}
            </button>
          ))}
        </div>

        <textarea
          value={commentText}
          onChange={(e) => setCommentText(e.target.value)}
          placeholder="What did you observe at this location?"
          rows={3}
          style={{
            width: "100%",
            boxSizing: "border-box",
            padding: "10px 12px",
            borderRadius: 8,
            border: "1px solid #e2e8f0",
            fontSize: 13,
            resize: "vertical",
            fontFamily: "inherit",
            outline: "none",
          }}
        />

        <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 8, flexWrap: "wrap" }}>
          <label style={{ fontSize: 12, color: "#2563eb", cursor: "pointer" }}>
            {commentImg ? commentImg.name : "Attach photo (optional)"}
            <input
              type="file"
              accept="image/*"
              style={{ display: "none" }}
              onChange={(e) => setCommentImg(e.target.files?.[0] || null)}
            />
          </label>
          {commentImg && (
            <>
              <img
                src={URL.createObjectURL(commentImg)}
                alt={commentImg.name}
                style={{ width: 40, height: 40, borderRadius: 6, objectFit: "cover" }}
              />
              <button
                onClick={() => setCommentImg(null)}
                style={{ fontSize: 11, color: "#9ca3af", background: "none", border: "none", cursor: "pointer" }}
              >
                remove
              </button>
            </>
          )}
        </div>

        <button
          onClick={onSubmit}
          disabled={uploading || !commentText.trim()}
          style={{
            marginTop: 10,
            width: "100%",
            padding: "10px",
            background: uploading || !commentText.trim() ? "#e2e8f0" : "#1d4ed8",
            color: uploading || !commentText.trim() ? "#9ca3af" : "#fff",
            border: "none",
            borderRadius: 8,
            fontWeight: 600,
            fontSize: 13,
            cursor: uploading || !commentText.trim() ? "not-allowed" : "pointer",
          }}
        >
          {uploading ? "Posting..." : "Post Comment"}
        </button>
      </div>
    </div>
  );
}

export function CommentBubble({ comment }) {
  const typeColor = {
    support: { bg: "#eff6ff", border: "#bfdbfe", text: "#1d4ed8", label: "Support" },
    verification: { bg: "#ecfdf5", border: "#a7f3d0", text: "#059669", label: "Verified" },
    neutral: { bg: "#f9fafb", border: "#e5e7eb", text: "#6b7280", label: "Comment" },
  }[comment.comment_type] || { bg: "#f9fafb", border: "#e5e7eb", text: "#6b7280", label: "Comment" };
  const imgSrc = assetUrl(comment.image_path);

  return (
    <div style={{
      marginBottom: 10,
      padding: "10px 12px",
      background: typeColor.bg,
      borderRadius: 10,
      border: `1px solid ${typeColor.border}`,
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 10, marginBottom: 4 }}>
        <span style={{ fontSize: 11, fontWeight: 600, color: typeColor.text }}>
          {typeColor.label}
        </span>
        <span style={{ fontSize: 10, color: "#9ca3af", whiteSpace: "nowrap" }}>
          {timeAgo(comment.created_at)}
        </span>
      </div>
      <div style={{ fontSize: 13, color: "#374151", lineHeight: 1.6, overflowWrap: "anywhere" }}>
        {comment.text}
      </div>
      {imgSrc && (
        <img
          src={imgSrc}
          alt="Comment attachment"
          style={{
            marginTop: 8,
            width: "100%",
            maxHeight: 200,
            objectFit: "cover",
            borderRadius: 8,
            cursor: "pointer",
          }}
          onClick={(e) => window.open(e.currentTarget.src)}
          onError={(e) => { e.currentTarget.style.display = "none"; }}
        />
      )}
    </div>
  );
}

const panelStyle = (isMobile) => ({
  width: isMobile ? "100vw" : 380,
  minWidth: isMobile ? "100vw" : 320,
  position: isMobile ? "fixed" : "relative",
  inset: isMobile ? 0 : "auto",
  zIndex: isMobile ? 2000 : 1,
  background: "#fff",
  borderLeft: isMobile ? "none" : "1px solid #e2e8f0",
  display: "flex",
  flexDirection: "column",
  overflow: "hidden",
  boxShadow: "-4px 0 20px rgba(0,0,0,0.08)",
});

const timeAgo = (ts) => {
  if (!ts) return "unknown";
  const parsed = new Date(ts);
  if (Number.isNaN(parsed.getTime())) return "unknown";
  const diff = (Date.now() - parsed.getTime()) / 1000;
  if (diff < 60) return `${Math.max(0, Math.floor(diff))}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
};
