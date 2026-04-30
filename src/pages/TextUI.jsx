import { useEffect, useMemo, useRef, useState } from "react";
import { API_BASE, getOrCreateAnonId } from "../utils/identity";

const TIER_COLOR = { high: "#22c55e", medium: "#3b82f6", low: "#f59e0b", unverified: "#6b7280" };

export default function TextUI() {
  const [lines, setLines] = useState([{ text: "AWAAZ-PROOF Terminal. Type help.", color: "#22c55e" }]);
  const [input, setInput] = useState("");
  const [anonId, setAnonId] = useState(localStorage.getItem("anon_id") || "");
  const [token, setToken] = useState(localStorage.getItem("token") || "");
  const bottomRef = useRef(null);

  useEffect(() => {
    getOrCreateAnonId().then(setAnonId).catch((e) => push(`anon init error: ${e.message}`, "#ef4444"));
  }, []);

  const push = (text, color = "#e5e7eb") => {
    setLines((prev) => [...prev, { text, color }]);
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 20);
  };

  const pushJson = (obj) => {
    const tier = obj?.data?.threshold_tier || obj?.threshold_tier;
    const color = obj?.status === "error" || obj?.error ? "#ef4444" : tier ? TIER_COLOR[tier] || "#e5e7eb" : "#22c55e";
    push(JSON.stringify(obj, null, 2), color);
  };

  const headers = () => ({
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  });

  const get = async (path) => {
    const r = await fetch(`${API_BASE}${path}`, { headers: headers() });
    return r.json();
  };

  const post = async (path, body = {}) => {
    const r = await fetch(`${API_BASE}${path}`, { method: "POST", headers: headers(), body: JSON.stringify(body) });
    return r.json();
  };

  const commands = useMemo(() => ({
    help: async () => ({
      commands: "help, anon, login <email> <pass>, ping [msg], seed, complaint <type> <lat> <lng>, status <id>, vote <id> <corroborate|dispute>, verify <id>, ledger, area <lat> <lng>, feed, cluster <geohash>, audit, clear",
    }),
    anon: async () => {
      const id = await getOrCreateAnonId();
      setAnonId(id);
      return { anon_id: id, note: "Stored in localStorage" };
    },
    login: async (args) => {
      const data = await post("/auth/login", { email: args[0], password: args[1] });
      if (data.access_token) {
        localStorage.setItem("token", data.access_token);
        localStorage.setItem("ap_admin_token", data.access_token);
        setToken(data.access_token);
      }
      return data;
    },
    ping: async (args) => post("/agent/chat", { message: args.join(" ") || "ping" }),
    seed: async () => post("/admin/seed", {}),
    complaint: async (args) => post("/complaints/new", {
      anon_id: anonId,
      complaint_type: args[0] || "pothole",
      lat: parseFloat(args[1] || "12.9716"),
      lng: parseFloat(args[2] || "77.5946"),
      description: "",
    }),
    status: async (args) => get(`/complaints/${args[0]}`),
    vote: async (args) => post(`/complaints/${args[0]}/vote`, { anon_id: anonId, vote_type: args[1] || "corroborate" }),
    verify: async (args) => post(`/verify/confidence/${args[0]}`, {}),
    ledger: async () => get("/ledger"),
    area: async (args) => get(`/complaints/area?lat=${args[0] || 12.9716}&lng=${args[1] || 77.5946}&radius_km=5`),
    feed: async () => get("/complaints/area?lat=12.9716&lng=77.5946&radius_km=5"),
    cluster: async (args) => get(`/verify/cluster/${args[0]}`),
    audit: async () => get("/admin/audit-log"),
    clear: async () => {
      setLines([]);
      return null;
    },
  }), [anonId, token]);

  const run = async (cmd) => {
    const [name, ...args] = cmd.trim().split(/\s+/);
    push(`> ${cmd}`, "#60a5fa");
    try {
      const handler = commands[name?.toLowerCase()];
      if (!handler) return push(`Unknown command: ${name}`, "#ef4444");
      const data = await handler(args);
      if (data) pushJson(data);
    } catch (e) {
      push(`Error: ${e.message}`, "#ef4444");
    }
  };

  return (
    <div style={{ background: "#050805", color: "#e5e7eb", fontFamily: "Consolas, monospace", height: "100vh", display: "flex", flexDirection: "column", padding: 14, paddingBottom: 88, boxSizing: "border-box" }}>
      <div style={{ color: "#86efac", borderBottom: "1px solid #14532d", paddingBottom: 8 }}>
        AWAAZ-PROOF / anon {anonId ? anonId.slice(0, 12) : "none"} / token {token ? "set" : "none"}
      </div>
      <div style={{ flex: 1, overflowY: "auto", paddingTop: 12 }}>
        {lines.map((line, i) => <pre key={i} style={{ color: line.color, margin: 0, whiteSpace: "pre-wrap", wordBreak: "break-word", lineHeight: 1.45 }}>{line.text}</pre>)}
        <div ref={bottomRef} />
      </div>
      <div style={{ display: "flex", borderTop: "1px solid #1f2937", paddingTop: 8 }}>
        <span style={{ color: "#22c55e", marginRight: 8 }}>$</span>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && input.trim()) {
              run(input.trim());
              setInput("");
            }
          }}
          autoFocus
          style={{ flex: 1, background: "transparent", border: 0, outline: "none", color: "#f9fafb", font: "inherit" }}
        />
      </div>
    </div>
  );
}
