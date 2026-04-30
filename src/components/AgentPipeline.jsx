import { useCallback, useEffect, useRef, useState } from "react";
import { BASE_URL } from "../api/chatApi";

const AGENT_META = {
  validation: { icon: "V", label: "Validation Agent", color: "#7c3aed" },
  structuring: { icon: "S", label: "Structuring Agent", color: "#0369a1" },
  confidence: { icon: "C", label: "Confidence Agent", color: "#065f46" },
};

const TIER_COLOR = {
  high: "#16a34a",
  medium: "#2563eb",
  low: "#d97706",
  unverified: "#9ca3af",
};

export default function AgentPipeline({
  message,
  anonId,
  lat = 12.9716,
  lng = 77.5946,
  language = "en",
  mediaUrl = null,
  onAttachPhoto,
  onConfirm,
  onCancel,
}) {
  const [agents, setAgents] = useState({});
  const [order, setOrder] = useState([]);
  const [done, setDone] = useState(null);
  const [posting, setPosting] = useState(false);
  const [error, setError] = useState(null);
  const bottomRef = useRef(null);

  const handleEvent = useCallback((event, payload) => {
    if (event === "agent_start") {
      const id = payload.agent;
      setOrder((current) => (current.includes(id) ? current : [...current, id]));
      setAgents((current) => ({
        ...current,
        [id]: {
          status: "running",
          label: payload.label,
          description: payload.description,
          tokens: [],
          result: null,
        },
      }));
      return;
    }

    if (event === "agent_token") {
      const id = payload.agent;
      setAgents((current) => ({
        ...current,
        [id]: {
          ...current[id],
          tokens: [...(current[id]?.tokens || []), payload.text],
        },
      }));
      return;
    }

    if (event === "agent_done") {
      const id = payload.agent;
      setAgents((current) => ({
        ...current,
        [id]: {
          ...current[id],
          status: "done",
          result: payload.result,
        },
      }));
      return;
    }

    if (event === "pipeline_done") {
      setDone(payload);
    }
  }, []);

  useEffect(() => {
    const ctrl = new AbortController();
    const reporterId = anonId || localStorage.getItem("anon_id") || "anon_chat_default";

    async function connect() {
      try {
        const res = await fetch(`${BASE_URL}/pipeline/analyze`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message,
            anon_id: reporterId,
            lat,
            lng,
            language,
          }),
          signal: ctrl.signal,
        });

        if (!res.ok || !res.body) {
          throw new Error(`Pipeline failed: ${res.status}`);
        }

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";

        while (true) {
          const { done: streamDone, value } = await reader.read();
          if (streamDone) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() || "";

          for (const line of lines) {
            if (!line.startsWith("data: ")) continue;
            try {
              const { event, payload } = JSON.parse(line.slice(6));
              handleEvent(event, payload);
            } catch {
              // Ignore malformed SSE chunks and keep reading.
            }
          }
        }
      } catch (err) {
        if (err.name !== "AbortError") {
          setError("Connection lost. Please try again.");
        }
      }
    }

    connect();
    return () => ctrl.abort();
  }, [anonId, handleEvent, lat, lng, message]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [agents, done]);

  const handlePost = async () => {
    const payload = getPostablePayload(done, agents);
    if (!payload?.complaint_preview) return;
    setPosting(true);
    setError(null);

    try {
      const res = await fetch(`${BASE_URL}/pipeline/confirm`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          anon_id: anonId || localStorage.getItem("anon_id") || "anon_chat_default",
          complaint_preview: payload.complaint_preview,
          language,
          media_url: mediaUrl,
        }),
      });
      const data = await res.json();

      if (data.success) {
        onConfirm(data.data);
      } else {
        setError(data.message || "Failed to post complaint.");
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setPosting(false);
    }
  };

  const postable = getPostablePayload(done, agents);
  const validationSaysNo = done?.ready_to_post === false && agents.validation?.result?.is_genuine === false;

  return (
    <div style={pipelineShellStyle}>
      <div style={pipelineHeaderStyle}>
        <PulsingDot active={!done} />
        <span style={pipelineHeaderTextStyle}>
          {done ? "Analysis complete" : "Analyzing complaint..."}
        </span>
      </div>

      <div style={{ padding: "8px 0" }}>
        {order.map((id) => {
          const agent = agents[id];
          const meta = AGENT_META[id] || { icon: "O", label: id, color: "#6b7280" };
          return (
            <AgentStep
              key={id}
              id={id}
              meta={meta}
              agent={agent}
              status={agent?.status || "waiting"}
            />
          );
        })}
      </div>

      {!done && order.length < 3 && (
        <div style={{ padding: "4px 16px 8px" }}>
          {Object.entries(AGENT_META)
            .filter(([id]) => !order.includes(id))
            .map(([id, meta]) => (
              <div key={id} style={waitingAgentStyle}>
                <span style={{ ...agentIconStyle, color: meta.color }}>{meta.icon}</span>
                <span style={waitingAgentLabelStyle}>{meta.label}</span>
                <span style={waitingAgentStatusStyle}>waiting</span>
              </div>
            ))}
        </div>
      )}

      {postable && (
        <ConfirmCard
          done={postable}
          mediaUrl={mediaUrl}
          posting={posting}
          onPost={handlePost}
          onAttachPhoto={onAttachPhoto}
          onCancel={onCancel}
        />
      )}

      {validationSaysNo && (
        <div style={notGenuineStyle}>
          {done.reason || "Could not classify this as a civic complaint."}
          <button type="button" onClick={onCancel} style={textButtonStyle}>
            Cancel
          </button>
        </div>
      )}

      {error && <div style={errorStyle}>{error}</div>}
      <div ref={bottomRef} />
    </div>
  );
}

function getPostablePayload(done, agents) {
  if (done?.ready_to_post && done?.complaint_preview) return done;

  const validationOk = agents.validation?.result?.is_genuine === true;
  const structured = agents.structuring?.result?.structured;
  const confidence = agents.confidence?.result;
  if (validationOk && structured && confidence) {
    return {
      ...(done || {}),
      ready_to_post: true,
      complaint_preview: structured,
      confidence: confidence.score,
      confidence_tier: confidence.tier,
    };
  }

  return null;
}

function AgentStep({ id, meta, agent, status }) {
  return (
    <div style={agentStepStyle}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <span style={{ ...agentIconStyle, color: meta.color }}>{meta.icon}</span>
        <span style={agentLabelStyle}>{meta.label}</span>
        <ProgressBar status={status} color={meta.color} />
        <span
          style={{
            ...agentStatusStyle,
            color: status === "done" ? "#16a34a" : status === "running" ? meta.color : "#9ca3af",
          }}
        >
          {status === "done" ? "done" : status === "running" ? "running" : "waiting"}
        </span>
      </div>

      {agent?.tokens?.length > 0 && status === "running" && (
        <div style={{ marginTop: 8, paddingLeft: 28 }}>
          {agent.tokens.slice(-3).map((token, idx) => (
            <div
              key={`${token}-${idx}`}
              style={{
                ...tokenLineStyle,
                opacity: idx === agent.tokens.slice(-3).length - 1 ? 1 : 0.5,
              }}
            >
              &gt; {token}
            </div>
          ))}
        </div>
      )}

      {status === "done" && agent?.result && (
        <AgentResult agentId={id} result={agent.result} color={meta.color} />
      )}
    </div>
  );
}

function AgentResult({ agentId, result }) {
  if (agentId === "validation") {
    return (
      <div style={{ marginTop: 8, paddingLeft: 28 }}>
        {(result.checks || []).filter(Boolean).map((check, idx) => (
          <div key={`${check.label}-${idx}`} style={resultLineStyle}>
            <span style={{ color: check.pass ? "#16a34a" : "#9ca3af" }}>
              {check.pass ? "ok" : "--"}
            </span>
            {" "}{check.label}
          </div>
        ))}
      </div>
    );
  }

  if (agentId === "structuring") {
    return (
      <div style={structuringGridStyle}>
        {(result.fields || []).map((field, idx) => (
          <div key={`${field.label}-${idx}`} style={{ fontSize: 12, lineHeight: 1.8 }}>
            <span style={{ color: "#9ca3af" }}>{field.label}: </span>
            <span
              style={{
                color:
                  field.label === "Warranty breach" && String(field.value).startsWith("YES")
                    ? "#dc2626"
                    : "#374151",
                fontWeight: field.label === "Warranty breach" ? 600 : 400,
              }}
            >
              {field.value}
            </span>
          </div>
        ))}
      </div>
    );
  }

  if (agentId === "confidence") {
    const tierColor = TIER_COLOR[result.tier] || "#9ca3af";
    return (
      <div style={{ marginTop: 8, paddingLeft: 28 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
          <div style={confidenceTrackStyle}>
            <div
              style={{
                width: `${Math.round((result.score || 0) * 100)}%`,
                height: "100%",
                background: tierColor,
                borderRadius: 3,
                transition: "width 0.8s ease",
              }}
            />
          </div>
          <span style={{ fontSize: 12, fontWeight: 600, color: tierColor }}>
            {((result.score || 0) * 100).toFixed(0)}% - {String(result.tier || "").toUpperCase()}
          </span>
        </div>
        <div style={confidenceMessageStyle}>{result.message}</div>
        {result.missing_signals?.length > 0 && (
          <div style={confidenceMissingStyle}>
            Boost with: {result.missing_signals.slice(0, 3).map((item) => item.replace(/_/g, " ")).join(" | ")}
          </div>
        )}
      </div>
    );
  }

  return null;
}

function ConfirmCard({ done, mediaUrl, posting, onPost, onAttachPhoto, onCancel }) {
  const preview = done.complaint_preview || {};
  const tierColor = TIER_COLOR[done.confidence_tier] || "#9ca3af";

  return (
    <div style={confirmShellStyle}>
      <div style={confirmHeaderStyle}>Structured complaint - ready to post</div>
      <div style={{ padding: 14 }}>
        <div style={{ display: "flex", gap: 8, marginBottom: 10, flexWrap: "wrap" }}>
          <span style={typePillStyle}>
            {String(preview.complaint_type || "complaint").toUpperCase().replace("_", " ")}
          </span>
          <span style={severityPillStyle(preview.severity)}>
            {String(preview.severity || "medium").toUpperCase()} severity
          </span>
          {preview.warranty_breach && <span style={warrantyPillStyle}>Warranty breach</span>}
        </div>

        <div style={confirmDetailsStyle}>
          {preview.contractor_name && (
            <div>
              Contractor: <strong>{preview.contractor_name}</strong>
              {preview.warranty_breach && preview.breach_value_inr > 0
                ? ` | INR ${(preview.breach_value_inr / 100000).toFixed(1)}L exposed`
                : ""}
            </div>
          )}
          <div>
            Initial confidence:{" "}
            <span style={{ color: tierColor, fontWeight: 600 }}>
              {Math.round((done.confidence || 0.3) * 100)}% ({done.confidence_tier})
            </span>
          </div>
          <div style={{ fontSize: 11, color: "#9ca3af" }}>
            Add a photo to raise confidence with stronger evidence.
          </div>
          <div style={{ marginTop: 8, fontWeight: 700, color: "#111827" }}>
            Would you like to attach a photo, or shall I post this now?
          </div>
          {mediaUrl && (
            <div style={{ marginTop: 6, color: "#15803d", fontWeight: 700 }}>
              Photo attached. Ready to post.
            </div>
          )}
        </div>

        {done.tee_attestation && (
          <div style={{
            marginTop: 10, padding: "8px 12px",
            background: "#f0fdf4", border: "1px solid #bbf7d0",
            borderRadius: 8, fontSize: 11,
            display: "flex", alignItems: "center", gap: 8,
          }}>
            <span>🔒</span>
            <div>
              <div style={{ fontWeight: 600, color: "#15803d" }}>
                TEE-Verified AI Analysis
              </div>
              <div style={{ color: "#166534" }}>
                {done.tee_attestation.provider} · {done.tee_attestation.tee_type}
              </div>
            </div>
            <a
              href={done.tee_attestation.verification_url}
              target="_blank"
              rel="noreferrer"
              style={{ marginLeft: "auto", fontSize: 10, color: "#2563eb" }}
            >
              Verify →
            </a>
          </div>
        )}

        <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
          <button type="button" onClick={onAttachPhoto} disabled={posting || !onAttachPhoto} style={attachButtonStyle}>
            Attach Photo
          </button>
          <button type="button" onClick={onPost} disabled={posting} style={postButtonStyle(posting)}>
            {posting ? "Posting..." : "Post This"}
          </button>
          <button type="button" onClick={onCancel} style={cancelButtonStyle}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

function ProgressBar({ status, color }) {
  const pct = status === "done" ? 100 : status === "running" ? 60 : 0;
  return (
    <div style={progressTrackStyle}>
      <div
        style={{
          width: `${pct}%`,
          height: "100%",
          background: status === "done" ? "#16a34a" : color,
          borderRadius: 2,
          transition: status === "running" ? "width 2s ease" : "width 0.3s ease",
        }}
      />
    </div>
  );
}

function PulsingDot({ active }) {
  return (
    <div
      style={{
        width: 8,
        height: 8,
        borderRadius: "50%",
        flexShrink: 0,
        background: active ? "#2563eb" : "#16a34a",
        boxShadow: active ? "0 0 0 0 rgba(37,99,235,0.4)" : "none",
        animation: active ? "pipeline-pulse 1.2s infinite" : "none",
      }}
    >
      <style>{`@keyframes pipeline-pulse {
        0% { box-shadow: 0 0 0 0 rgba(37,99,235,0.4); }
        70% { box-shadow: 0 0 0 6px rgba(37,99,235,0); }
        100% { box-shadow: 0 0 0 0 rgba(37,99,235,0); }
      }`}</style>
    </div>
  );
}

const pipelineShellStyle = {
  fontFamily: "system-ui, sans-serif",
  borderRadius: 16,
  border: "1px solid #e2e8f0",
  overflow: "hidden",
  background: "#fff",
  margin: "12px 0",
};

const pipelineHeaderStyle = {
  padding: "12px 16px",
  borderBottom: "1px solid #e2e8f0",
  background: "#f8fafc",
  display: "flex",
  alignItems: "center",
  gap: 8,
};

const pipelineHeaderTextStyle = {
  fontSize: 13,
  fontWeight: 600,
  color: "#111827",
};

const waitingAgentStyle = {
  display: "flex",
  alignItems: "center",
  gap: 10,
  padding: "8px 0",
  borderTop: "1px solid #e2e8f0",
  opacity: 0.4,
};

const waitingAgentLabelStyle = {
  fontSize: 13,
  color: "#6b7280",
};

const waitingAgentStatusStyle = {
  marginLeft: "auto",
  fontSize: 11,
  color: "#9ca3af",
};

const agentStepStyle = {
  borderTop: "1px solid #e2e8f0",
  padding: "10px 16px",
};

const agentIconStyle = {
  width: 20,
  height: 20,
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  flexShrink: 0,
  fontSize: 12,
  fontWeight: 800,
};

const agentLabelStyle = {
  fontSize: 13,
  fontWeight: 600,
  flex: 1,
  color: "#111827",
};

const agentStatusStyle = {
  fontSize: 11,
  marginLeft: 8,
  minWidth: 50,
  textAlign: "right",
};

const tokenLineStyle = {
  fontSize: 12,
  color: "#6b7280",
  lineHeight: 1.7,
};

const resultLineStyle = {
  fontSize: 12,
  lineHeight: 1.8,
  color: "#6b7280",
};

const structuringGridStyle = {
  marginTop: 8,
  paddingLeft: 28,
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  gap: "2px 16px",
};

const confidenceTrackStyle = {
  flex: 1,
  height: 6,
  background: "#f1f5f9",
  borderRadius: 3,
  overflow: "hidden",
};

const confidenceMessageStyle = {
  fontSize: 11,
  color: "#9ca3af",
  lineHeight: 1.6,
};

const confidenceMissingStyle = {
  marginTop: 4,
  fontSize: 11,
  color: "#9ca3af",
};

const confirmShellStyle = {
  margin: 16,
  border: "1.5px solid #e2e8f0",
  borderRadius: 12,
  overflow: "hidden",
};

const confirmHeaderStyle = {
  padding: "10px 14px",
  background: "#f8fafc",
  borderBottom: "1px solid #e2e8f0",
  fontSize: 12,
  fontWeight: 700,
  color: "#6b7280",
  textTransform: "uppercase",
  letterSpacing: "0.05em",
};

const typePillStyle = {
  fontSize: 13,
  fontWeight: 700,
  padding: "3px 10px",
  borderRadius: 20,
  background: "#fee2e2",
  color: "#991b1b",
};

function severityPillStyle(severity) {
  return {
    fontSize: 13,
    fontWeight: 700,
    padding: "3px 10px",
    borderRadius: 20,
    background: severity === "high" ? "#fef2f2" : severity === "medium" ? "#fffbeb" : "#f0fdf4",
    color: severity === "high" ? "#b91c1c" : severity === "medium" ? "#92400e" : "#166534",
  };
}

const warrantyPillStyle = {
  fontSize: 13,
  fontWeight: 700,
  padding: "3px 10px",
  borderRadius: 20,
  background: "#fef2f2",
  color: "#b91c1c",
};

const confirmDetailsStyle = {
  fontSize: 12,
  color: "#6b7280",
  lineHeight: 2,
  marginBottom: 10,
};

function postButtonStyle(posting) {
  return {
    flex: 1,
    padding: "12px 16px",
    background: posting ? "#9ca3af" : "#1d4ed8",
    color: "#fff",
    border: "none",
    borderRadius: 10,
    fontWeight: 700,
    fontSize: 14,
    cursor: posting ? "wait" : "pointer",
  };
}

const attachButtonStyle = {
  flex: 1,
  padding: "12px 16px",
  background: "#f8fafc",
  color: "#1d4ed8",
  border: "1px solid #bfdbfe",
  borderRadius: 10,
  fontWeight: 700,
  fontSize: 14,
  cursor: "pointer",
};

const cancelButtonStyle = {
  flex: "0 0 auto",
  padding: "12px 16px",
  background: "none",
  border: "1px solid #cbd5e1",
  borderRadius: 10,
  fontWeight: 600,
  fontSize: 13,
  cursor: "pointer",
  color: "#6b7280",
};

const progressTrackStyle = {
  width: 80,
  height: 4,
  background: "#f1f5f9",
  borderRadius: 2,
  overflow: "hidden",
};

const notGenuineStyle = {
  margin: 16,
  padding: 14,
  background: "#fffbeb",
  border: "1px solid #fde68a",
  borderRadius: 10,
  fontSize: 13,
  color: "#92400e",
};

const textButtonStyle = {
  marginLeft: 12,
  fontSize: 12,
  cursor: "pointer",
  background: "none",
  border: "none",
  color: "#6b7280",
  textDecoration: "underline",
};

const errorStyle = {
  margin: "8px 16px 16px",
  fontSize: 12,
  color: "#dc2626",
};
