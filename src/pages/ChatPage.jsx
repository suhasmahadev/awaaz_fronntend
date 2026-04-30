import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  listSessions,
  createSession,
  deleteSession,
  sendMessageStream,
  uploadFile,
  BASE_URL,
} from "../api/chatApi";
import AgentPipeline from "../components/AgentPipeline";
import UnifiedInput from "../components/UnifiedInput";
import { getOrCreateAnonId } from "../utils/identity";
import { useLanguage, LANGUAGES } from "../i18n/LanguageContext.jsx";
import SplashScreen from "../components/SplashScreen";

const DEFAULT_LAT = 12.9716;
const DEFAULT_LNG = 77.5946;
const COMPLAINT_KEYWORDS = [
  "pothole",
  "road",
  "water",
  "garbage",
  "drain",
  "light",
  "sewage",
  "broken",
  "damaged",
  "leaking",
  "flooded",
  "smell",
  "dirty",
  "complaint",
  "problem",
  "issue",
  "repair",
  "fix",
  "hurt",
  "injury",
];

function isComplaintIntent(text) {
  const lower = (text || "").toLowerCase();
  return COMPLAINT_KEYWORDS.some((keyword) => lower.includes(keyword));
}

function isProcessableFile(file) {
  if (!file) return false;
  const t = (file.type || "").toLowerCase();
  const name = (file.name || "").toLowerCase();
  return (
    t.includes("excel") ||
    t.includes("spreadsheet") ||
    t.includes("csv") ||
    t === "application/pdf" ||
    name.endsWith(".xlsx") ||
    name.endsWith(".xls") ||
    name.endsWith(".csv") ||
    name.endsWith(".pdf")
  );
}

async function fileToInlineData(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target.result;
      const base64 = String(result).split(",")[1] || "";
      resolve({
        data: base64,
        displayName: file.name,
        mimeType: file.type || "application/octet-stream",
      });
    };
    reader.onerror = (err) => reject(err);
    reader.readAsDataURL(file);
  });
}

function ChatMessageText({ text }) {
  if (!text) return null;
  let displayText = text;
  try {
    const cleanedJson = text
      .replace(/^```json\s*/i, "")
      .replace(/^```\s*/i, "")
      .replace(/```$/i, "")
      .trim();
    const parsed = JSON.parse(cleanedJson);
    displayText =
      parsed?.data?.echo ||
      parsed?.data?.text_response ||
      parsed?.text_response ||
      parsed?.message ||
      parsed?.summary ||
      "";
  } catch {
    displayText = text;
  }
  if (!displayText) return null;

  const imageRegex = /\/service_images\/\S+\.(png|jpg|jpeg|gif|webp)/gi;
  const matches = displayText.match(imageRegex) || [];
  const cleanedText = displayText.replace(imageRegex, "").trim();

  const toAbsoluteUrl = (path) => {
    if (!path) return "";
    if (path.startsWith("http://") || path.startsWith("https://")) return path;
    return `${BASE_URL}${path}`;
  };

  return (
    <div>
      {cleanedText && <p style={{ margin: 0, whiteSpace: "pre-wrap" }}>{cleanedText}</p>}
      {matches.length > 0 && (
        <div style={{ display: "flex", gap: 8, marginTop: 8, flexWrap: "wrap" }}>
          {matches.map((src, idx) => (
            <img
              key={idx}
              src={toAbsoluteUrl(src)}
              alt={`Service ${idx + 1}`}
              style={{ width: 180, maxWidth: "100%", borderRadius: 8, objectFit: "cover" }}
            />
          ))}
        </div>
      )}
    </div>
  );
}

async function saveChatMessage(anonId, role, message) {
  if (!anonId || !message) return;

  const res = await fetch(`${BASE_URL}/chat/save`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      anon_id: anonId,
      role,
      message,
    }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(body || `Failed to save chat message (${res.status})`);
  }
}

async function fetchChatHistory(anonId) {
  const res = await fetch(`${BASE_URL}/chat/history/${encodeURIComponent(anonId)}`);
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(body || `Failed to load chat history (${res.status})`);
  }
  return res.json();
}

async function uploadComplaintMedia(file) {
  if (!file || !file.type?.startsWith("image/")) return null;
  const form = new FormData();
  form.append("file", file);
  const res = await fetch(`${BASE_URL}/media/upload`, {
    method: "POST",
    body: form,
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data?.detail || data?.message || "Image upload failed");
  }
  return data.media_url || null;
}

function mapHistoryToMessages(historyMessages = []) {
  return historyMessages.map((m) => ({
    role: m.role,
    text: m.message,
    attachments: [],
  }));
}

function absoluteBackendUrl(path) {
  if (!path) return "";
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  return `${BASE_URL}${path}`;
}

export default function ChatPage() {
  const { language, setLanguage, t, getSpeechCode } = useLanguage();
  const navigate = useNavigate();
  const videoRef = useRef(null);
  const cameraStreamRef = useRef(null);
  const [sessions, setSessions] = useState([]);
  const [activeSessionId, setActiveSessionId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [currentFile, setCurrentFile] = useState(null);
  const [filePreview, setFilePreview] = useState(null);
  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [raisedComplaint, setRaisedComplaint] = useState(null);
  const [anonId, setAnonId] = useState(localStorage.getItem("anon_id") || "");
  const [historyLoaded, setHistoryLoaded] = useState(false);
  const [showPipeline, setShowPipeline] = useState(false);
  const [pipelineMsg, setPipelineMsg] = useState("");
  const [pipelineMediaUrl, setPipelineMediaUrl] = useState(null);
  const [userLat, setUserLat] = useState(DEFAULT_LAT);
  const [userLng, setUserLng] = useState(DEFAULT_LNG);
  const [postedComplaint, setPostedComplaint] = useState(null);

  const [historyOpen, setHistoryOpen] = useState(false);
  const [complaintHistory, setComplaintHistory] = useState([]);
  const [historyLoadingComplaints, setHistoryLoadingComplaints] = useState(false);
  const [cameraOpen, setCameraOpen] = useState(false);
  const [cameraError, setCameraError] = useState("");
  const [splashLoading, setSplashLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setSplashLoading(false), 1500);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function init() {
      try {
        const sess = await listSessions();
        if (cancelled) return;

        if (sess && sess.length > 0) {
          setSessions(sess);
          setActiveSessionId(sess[0].id);
          return;
        }

        const created = await createSession();
        if (!cancelled) {
          setSessions([created]);
          setActiveSessionId(created.id);
        }
      } catch (err) {
        console.error("Failed to load sessions:", err);
        if (!cancelled) setErrorMsg("Failed to load chat sessions.");
      }
    }

    init();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    getOrCreateAnonId()
      .then(setAnonId)
      .catch((err) => {
        console.error("Failed to create anon id:", err);
        setErrorMsg("Citizen identity is not ready. Try again after auth is configured.");
      });
  }, []);

  useEffect(() => {
    if (!anonId) return;
    let cancelled = false;

    async function loadHistory() {
      setHistoryLoaded(false);
      try {
        const data = await fetchChatHistory(anonId);
        if (!cancelled) {
          setMessages(mapHistoryToMessages(data.messages || []));
        }
      } catch (err) {
        console.error("Failed to load chat history:", err);
        if (!cancelled) {
          setErrorMsg("Failed to load saved chat history.");
          setMessages([]);
        }
      } finally {
        if (!cancelled) setHistoryLoaded(true);
      }
    }

    loadHistory();

    return () => {
      cancelled = true;
    };
  }, [anonId]);

  useEffect(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUserLat(position.coords.latitude);
        setUserLng(position.coords.longitude);
      },
      () => {},
      { enableHighAccuracy: true, timeout: 5000, maximumAge: 60000 }
    );
  }, []);



  useEffect(() => {
    return () => stopCamera();
  }, []);

  async function handleSelectSession(id) {
    if (id === activeSessionId) return;
    setActiveSessionId(id);
    setErrorMsg("");
  }

  async function handleNewSession() {
    setErrorMsg("");
    try {
      const session = await createSession();
      setSessions((prev) => [session, ...prev]);
      setActiveSessionId(session.id);
    } catch (err) {
      console.error("Failed to create session:", err);
      setErrorMsg("Failed to create a new session.");
    }
  }

  async function handleDeleteSession(id, e) {
    e.stopPropagation();
    setErrorMsg("");
    try {
      await deleteSession(id);
      setSessions((prev) => prev.filter((s) => s.id !== id));

      if (id === activeSessionId) {
        const remaining = sessions.filter((s) => s.id !== id);
        if (remaining.length > 0) {
          const newId = remaining[0].id;
          setActiveSessionId(newId);
        } else {
          const session = await createSession();
          setSessions([session]);
          setActiveSessionId(session.id);
        }
      }
    } catch (err) {
      console.error("Failed to delete session:", err);
      setErrorMsg("Failed to delete session.");
    }
  }

  function startVoice() {
    if (!("webkitSpeechRecognition" in window || "SpeechRecognition" in window)) {
      alert("Voice not supported in this browser");
      return;
    }
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    const rec = new SR();
    rec.lang = getSpeechCode();
    rec.continuous = false;
    rec.interimResults = false;
    rec.onstart = () => setListening(true);
    rec.onresult = (e) => {
      const text = e.results[0][0].transcript;
      setTranscript(text);
      setInput(text);
      setListening(false);
    };
    rec.onerror = () => setListening(false);
    rec.onend = () => setListening(false);
    rec.start();
  }

  function handlePhotoSelect(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    attachImageFile(file);
    e.target.value = "";
  }

  function attachImageFile(file) {
    setCurrentFile(file);

    if (file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        setFilePreview({
          type: "image",
          src: ev.target?.result,
          name: file.name,
        });
      };
      reader.readAsDataURL(file);
    } else {
      setFilePreview({ type: "file", name: file.name });
    }

    if (isProcessableFile(file)) {
      processAndSendFile(file);
    }
  }

  async function openCamera() {
    setCameraError("");
    if (!navigator.mediaDevices?.getUserMedia) {
      setCameraError("Camera is not available in this browser.");
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: "environment" } },
        audio: false,
      });
      cameraStreamRef.current = stream;
      setCameraOpen(true);
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play().catch(() => {});
        }
      }, 0);
    } catch (err) {
      console.error("Camera open failed:", err);
      setCameraError("Camera permission was denied or no camera was found.");
    }
  }

  function stopCamera() {
    cameraStreamRef.current?.getTracks?.().forEach((track) => track.stop());
    cameraStreamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
    setCameraOpen(false);
  }

  function captureCameraFrame() {
    const video = videoRef.current;
    if (!video?.videoWidth || !video?.videoHeight) {
      setCameraError("Camera is still starting. Try again in a moment.");
      return;
    }
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    canvas.toBlob(async (blob) => {
      if (!blob) {
        setCameraError("Could not capture photo.");
        return;
      }
      const file = new File([blob], `camera-${Date.now()}.jpg`, { type: "image/jpeg" });
      attachImageFile(file);
      stopCamera();
      if (showPipeline) {
        try {
          setLoading(true);
          const mediaUrl = await uploadComplaintMedia(file);
          setPipelineMediaUrl(mediaUrl);
        } catch (err) {
          console.error("Pipeline photo upload failed:", err);
          setErrorMsg("Photo captured, but upload failed. Try again.");
        } finally {
          setLoading(false);
        }
      }
    }, "image/jpeg", 0.92);
  }

  function clearFile() {
    setCurrentFile(null);
    setFilePreview(null);
  }

  async function processAndSendFile(file) {
    try {
      setLoading(true);
      setErrorMsg("");
      const result = await uploadFile(file);

      if (!result) throw new Error("Empty response from file processor");

      const message = `I've uploaded a file: ${result.filename}\n\n${result.content}\n\nPlease analyze this civic evidence and help me add it to the system.`;

      await sendUserMessage(message, null);
      clearFile();
    } catch (err) {
      console.error("File processing error:", err);
      setErrorMsg("Failed to process file.");
    } finally {
      setLoading(false);
    }
  }

  function parseAgentResponse(responseText) {
    try {
      const cleaned = responseText
        .replace(/^```json\s*/i, "")
        .replace(/^```\s*/i, "")
        .replace(/```$/i, "")
        .trim();
      const json = JSON.parse(cleaned);
      const cmp = json?.data?.complaint_id
        ? json.data
        : json?.data?.data?.complaint_id
          ? json.data.data
          : json?.complaint_id
            ? json
            : null;

      if (cmp?.complaint_id || cmp?.id) {
        setRaisedComplaint({
          id: cmp.complaint_id || cmp.id,
          type: cmp.complaint_type || "Complaint",
          confidence: cmp.confidence_score ?? cmp.confidence ?? 0.3,
          ward: cmp.ward || "",
        });
      }
    } catch {
      // Agent text is allowed to be non-JSON while the model is warming up.
    }
  }

  async function persistMessage(role, message) {
    const currentAnonId = anonId || localStorage.getItem("anon_id") || "";
    if (!currentAnonId || !message) return;

    try {
      await saveChatMessage(currentAnonId, role, message);
    } catch (err) {
      console.error("Failed to save chat message:", err);
      setErrorMsg("Chat history save failed.");
    }
  }

  function speakText(text) {
    if (!text || !("speechSynthesis" in window)) return;
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = getSpeechCode();
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
  }

  function playResponseAudio(item) {
    const audioUrl = absoluteBackendUrl(item?.audio_url || "");
    if (audioUrl) {
      const audio = new Audio(audioUrl);
      audio.play().catch(() => speakText(item?.text_response || ""));
      return;
    }
    speakText(item?.text_response || "");
  }

  async function handleCheckComplaints() {
    setHistoryOpen(true);
    setHistoryLoadingComplaints(true);
    setErrorMsg("");

    try {
      const currentAnonId = anonId || localStorage.getItem("anon_id") || "";
      const res = await fetch(`${BASE_URL}/complaints/mine?anon_id=${encodeURIComponent(currentAnonId)}`, {
        headers: {
          "X-User-Language": language,
        },
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.detail || "Failed to load complaint history.");
      }
      const rows = data.complaints || [];
      setComplaintHistory(rows.map((row) => ({
        grievance_id: row.id,
        status: row.status,
        created_at: row.created_at,
      })));
    } catch (err) {
      console.error("Failed to load complaint history:", err);
      setErrorMsg("Failed to load complaint history.");
    } finally {
      setHistoryLoadingComplaints(false);
    }
  }

  async function sendUserMessage(text, fileForInline) {
    if (!activeSessionId) {
      setErrorMsg("No active session.");
      return;
    }
    if (!anonId && !localStorage.getItem("anon_id")) {
      setErrorMsg("Anonymous ID is not ready yet.");
      return;
    }
    if (!historyLoaded) {
      setErrorMsg("Chat history is still loading.");
      return;
    }
    if (!text && !fileForInline) return;

    const userMessage = {
      role: "user",
      text: text || (fileForInline ? `Sent file: ${fileForInline.name}` : ""),
      attachments: fileForInline
        ? [
            {
              displayName: fileForInline.name,
              mimeType: fileForInline.type,
            },
          ]
        : [],
    };

    setMessages((prev) => [...prev, userMessage]);
    await persistMessage("user", userMessage.text);

    setLoading(true);
    setErrorMsg("");

    try {
      let inlineData = null;
      if (fileForInline && !isProcessableFile(fileForInline)) {
        inlineData = await fileToInlineData(fileForInline);
      }

      const contents = await sendMessageStream({
        sessionId: activeSessionId,
        text: withCivicContext(text || (fileForInline ? "Citizen attached photo evidence." : "")),
        inlineData,
        language
      });

      const replyText = contents
        .flatMap((c) => c.parts || [])
        .map((p) => p.text || "")
        .join(" ")
        .trim();

      const replyAttachments = contents
        .flatMap((c) => c.parts || [])
        .filter((p) => p.inlineData)
        .map((p) => p.inlineData);

      if (replyText || replyAttachments.length > 0) {
        const assistantText = replyText || "[No text response]";
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            text: assistantText,
            attachments: replyAttachments,
          },
        ]);
        await persistMessage("assistant", assistantText);
        parseAgentResponse(replyText);
      } else {
        const assistantText = "No response content from agent.";
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            text: assistantText,
            attachments: [],
          },
        ]);
        await persistMessage("assistant", assistantText);
      }
    } catch (err) {
      console.error("Failed to send message:", err);
      const assistantText = "Error talking to agent. Check backend logs.";
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          text: assistantText,
          attachments: [],
        },
      ]);
      await persistMessage("assistant", assistantText);
      setErrorMsg("Chat request failed.");
    } finally {
      setLoading(false);
    }
  }

  function withCivicContext(text) {
    const id = anonId || localStorage.getItem("anon_id") || "anon_chat_default";
    return `${text}\n\nTool context only: anon_id=${id}; lat=${DEFAULT_LAT}; lng=${DEFAULT_LNG}. Never reveal anon_id.`;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const text = input.trim();
    if (!text && !currentFile) return;
    if (!anonId && !localStorage.getItem("anon_id")) {
      setErrorMsg("Anonymous ID is not ready yet.");
      return;
    }
    if (!historyLoaded) {
      setErrorMsg("Chat history is still loading.");
      return;
    }

    const nonProcessedFile =
      currentFile && isProcessableFile(currentFile) ? null : currentFile;

    setInput("");

    if (text && !nonProcessedFile && isComplaintIntent(text) && (anonId || localStorage.getItem("anon_id"))) {
      setErrorMsg("");
      setPostedComplaint(null);
      setPipelineMediaUrl(null);
      setPipelineMsg(text);
      setShowPipeline(true);
      setMessages((prev) => [...prev, { role: "user", text, attachments: [] }]);
      await persistMessage("user", text);
      return;
    }

    if (text && nonProcessedFile && nonProcessedFile.type?.startsWith("image/") && isComplaintIntent(text) && (anonId || localStorage.getItem("anon_id"))) {
      setErrorMsg("");
      setPostedComplaint(null);
      try {
        setLoading(true);
        const mediaUrl = await uploadComplaintMedia(nonProcessedFile);
        setPipelineMediaUrl(mediaUrl);
        setPipelineMsg(text);
        setShowPipeline(true);
        setMessages((prev) => [...prev, {
          role: "user",
          text,
          attachments: [{ displayName: nonProcessedFile.name, mimeType: nonProcessedFile.type }],
        }]);
        await persistMessage("user", text);
        clearFile();
      } catch (err) {
        console.error("Complaint image upload failed:", err);
        setErrorMsg("Image upload failed.");
      } finally {
        setLoading(false);
      }
      return;
    }

    await sendUserMessage(text, nonProcessedFile);

    if (nonProcessedFile) clearFile();
  }

  const postedComplaintId = postedComplaint?.complaint_id || postedComplaint?.id || "";
  const postedConfidence =
    postedComplaint?.confidence_score ?? postedComplaint?.confidence ?? 0.3;

  const chatStyles = {
    pageWrapper: {
      minHeight: 'calc(100vh - 64px)',
      backgroundColor: '#F3F4F6',
      display: 'flex',
      alignItems: 'flex-start',
      justifyContent: 'center',
      padding: '32px 24px',
    },
    innerContent: {
      width: '100%',
      maxWidth: '1200px',
      margin: '0 auto',
      backgroundColor: '#FFFFFF',
      borderRadius: '24px',
      border: '1px solid #E5E7EB',
      boxShadow: '0 8px 48px rgba(0,0,0,0.06)',
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column',
      minHeight: '85vh',
    },
    chatHeader: {
      background: 'linear-gradient(135deg, #4C1D95 0%, #6D28D9 100%)',
      padding: '20px 28px',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    headerTitle: {
      color: '#FFFFFF',
      fontSize: '20px',
      fontWeight: '700',
      letterSpacing: '-0.3px',
      display: 'flex',
      alignItems: 'center',
      gap: '10px',
    },
    onlineDot: {
      width: '10px',
      height: '10px',
      borderRadius: '50%',
      backgroundColor: '#22C55E',
      boxShadow: '0 0 8px #22C55E',
    },
    anonIdRow: {
      fontSize: '12px',
      color: '#6B7280',
      backgroundColor: '#FFFFFF',
    },
    topSection: {
      display: 'flex',
      flexDirection: 'column',
      gap: '16px',
      marginBottom: '20px',
      padding: '20px 28px 0',
    },
    languageRow: {
      display: 'flex',
      alignItems: 'center',
      gap: '10px',
      backgroundColor: '#FFFFFF',
      overflowX: 'auto',
      whiteSpace: 'nowrap',
      WebkitOverflowScrolling: 'touch',
      paddingBottom: '6px',
    },
    activeLangBtn: {
      backgroundColor: '#EFF6FF',
      color: '#1D4ED8',
      fontWeight: '600',
      border: '1px solid #1D4ED8',
      borderRadius: '20px',
      padding: '6px 18px',
      fontSize: '13px',
      cursor: 'pointer',
      flexShrink: 0,
      transition: 'all 0.2s ease',
    },
    inactiveLangBtn: {
      backgroundColor: '#FFFFFF',
      color: '#6B7280',
      fontWeight: '400',
      border: '1px solid #E5E7EB',
      borderRadius: '20px',
      padding: '6px 18px',
      fontSize: '13px',
      cursor: 'pointer',
      flexShrink: 0,
      transition: 'all 0.2s ease',
    },
    checkComplaintsBtn: {
      backgroundColor: '#FFFFFF',
      color: '#6D28D9',
      fontWeight: '700',
      border: 'none',
      borderRadius: '20px',
      padding: '6px 18px',
      fontSize: '13px',
      cursor: 'pointer',
      marginLeft: 'auto',
      boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
    },
    errorAlert: {
      margin: '16px 0',
      padding: '12px 16px',
      backgroundColor: '#FEF2F2',
      border: '1px solid #FECACA',
      borderLeft: '4px solid #DC2626',
      borderRadius: '10px',
      color: '#DC2626',
      fontSize: '13px',
      fontWeight: '500',
    },
    messagesArea: {
      flex: 1,
      overflowY: 'auto',
      padding: '24px 28px',
      backgroundColor: '#F9FAFB',
      display: 'flex',
      flexDirection: 'column',
      gap: '14px',
      minHeight: '400px',
    },
    loadingText: {
      color: '#9CA3AF',
      fontSize: '14px',
      textAlign: 'center',
      marginTop: '60px',
    },
    inputBarRow: {
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      padding: '16px 28px',
      backgroundColor: '#FFFFFF',
      borderTop: '1px solid #E5E7EB',
    },
    textInput: {
      flex: 1,
      border: '1.5px solid #E5E7EB',
      borderRadius: '28px',
      padding: '12px 20px',
      fontSize: '14px',
      outline: 'none',
      backgroundColor: '#F9FAFB',
      color: '#111827',
      fontFamily: 'inherit',
    },
    sendBtn: {
      width: '44px',
      height: '44px',
      background: 'linear-gradient(135deg, #6D28D9, #8B5CF6)',
      border: 'none',
      borderRadius: '50%',
      color: '#FFFFFF',
      fontSize: '18px',
      cursor: 'pointer',
      flexShrink: 0,
      boxShadow: '0 4px 14px rgba(109,40,217,0.35)',
    },
    cameraBtn: {
      width: '40px',
      height: '40px',
      backgroundColor: '#F3F4F6',
      border: 'none',
      borderRadius: '50%',
      cursor: 'pointer',
      fontSize: '16px',
      flexShrink: 0,
    },
    micBtn: {
      width: '56px',
      height: '56px',
      background: 'linear-gradient(135deg, #6D28D9, #8B5CF6)',
      border: 'none',
      borderRadius: '50%',
      color: '#FFFFFF',
      fontSize: '22px',
      cursor: 'pointer',
      display: 'block',
      boxShadow: '0 6px 24px rgba(109,40,217,0.4)',
    },
  };

  if (splashLoading) return <SplashScreen />;

  return (
    <main className="civic-chat dashboard-container" style={chatStyles.pageWrapper}>
      <div style={chatStyles.innerContent}>
        <header className="civic-chat-header" style={chatStyles.chatHeader}>
          <div style={chatStyles.headerTitle}>
            <span style={chatStyles.onlineDot}></span>
            AWAAZ-PROOF
          </div>

        </header>

        <div className="top-section" style={{ padding: '20px 28px 0' }}>
          <div style={chatStyles.anonIdRow}>
            <span>{t("anonId")} <strong>{anonId || "loading..."}</strong></span>
          </div>

          <div className="language-row hide-scrollbar" style={{ alignItems: 'center', backgroundColor: '#FFFFFF' }}>
            {LANGUAGES.map((lang) => (
              <button
                key={lang.code}
                type="button"
                onClick={() => setLanguage(lang.code)}
                style={language === lang.code ? chatStyles.activeLangBtn : chatStyles.inactiveLangBtn}
              >
                {lang.label}
              </button>
            ))}
            <button
              type="button"
              onClick={handleCheckComplaints}
              disabled={historyLoadingComplaints}
              style={{ ...chatStyles.checkComplaintsBtn, flexShrink: 0, marginLeft: '10px' }}
            >
              {historyLoadingComplaints ? "Checking..." : t("check")}
            </button>
          </div>
        </div>


        {errorMsg && (
          <div className="error-box" style={chatStyles.errorAlert}>
            {errorMsg}
          </div>
        )}

        {historyOpen && (
          <div style={historyPanelStyle}>
            <div style={historyHeaderStyle}>
              <strong>My Complaints</strong>
              <button type="button" onClick={() => setHistoryOpen(false)} style={smallTextButtonStyle}>
                close
              </button>
            </div>
            {historyLoadingComplaints ? (
              <div style={historyEmptyStyle}>Loading complaint history...</div>
            ) : complaintHistory.length === 0 ? (
              <div style={historyEmptyStyle}>No complaints found for this device.</div>
            ) : (
              complaintHistory.map((item) => (
                <div key={item.grievance_id} style={historyRowStyle}>
                  <div style={{ minWidth: 0, overflowWrap: "anywhere" }}>
                    <div style={{ fontWeight: 700, color: "#0f172a", fontSize: 13 }}>
                      {item.grievance_id}
                    </div>
                    <div style={{ color: "#64748b", fontSize: 12, marginTop: 2 }}>
                      {item.status} {item.created_at ? `- ${new Date(item.created_at).toLocaleString()}` : ""}
                    </div>
                    {item.text_response && (
                      <div style={{ color: "#334155", fontSize: 12, marginTop: 6 }}>
                        {item.text_response}
                      </div>
                    )}
                  </div>
                  <button type="button" onClick={() => playResponseAudio(item)} style={playButtonStyle}>
                    {t("play")}
                  </button>
                </div>
              ))
            )}
          </div>
        )}

        <div style={chatStyles.messagesArea}>
          {!historyLoaded ? (
            <div style={{
              marginTop: 38,
              textAlign: "center",
              color: "#64748b",
              padding: "0 22px",
              fontSize: 14,
            }}>
              Loading saved chat history...
            </div>
          ) : messages.length === 0 ? (
            <div style={{
              marginTop: 38,
              textAlign: "center",
              color: "#64748b",
              padding: "0 22px",
            }}>
              <h1 style={{ margin: 0, fontSize: 22, color: "#0f172a", letterSpacing: 0 }}>
                {t("report")}
              </h1>
              <p style={{ margin: "8px 0 0", fontSize: 14 }}>
                {t("subtitle")}
              </p>
            </div>
          ) : (
            messages.map((m, idx) => {
              const isUser = m.role === "user";
              return (
                <div
                  key={idx}
                  style={{
                    display: "flex",
                    justifyContent: isUser ? "flex-end" : "flex-start",
                  }}
                >
                  <div style={{
                    maxWidth: "82%",
                    background: isUser ? "#1d4ed8" : "#ffffff",
                    color: isUser ? "#ffffff" : "#111827",
                    border: isUser ? "none" : "1px solid #e2e8f0",
                    borderRadius: isUser ? "16px 16px 4px 16px" : "16px 16px 16px 4px",
                    padding: "10px 12px",
                    boxShadow: "0 1px 4px rgba(15,23,42,0.08)",
                    fontSize: 14,
                    lineHeight: 1.45,
                  }}>
                    {m.text && <ChatMessageText text={m.text} />}
                    {m.attachments?.map((att, i) => {
                      const name = att.displayName || att.name || "attachment";
                      return (
                        <div key={i} style={{
                          marginTop: 8,
                          fontSize: 12,
                          opacity: 0.85,
                        }}>
                          {name}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })
          )}

          {showPipeline && (
            <AgentPipeline
              message={pipelineMsg}
              anonId={anonId || localStorage.getItem("anon_id") || "anon_chat_default"}
              lat={userLat}
              lng={userLng}
              language={userLanguage}
              onConfirm={(complaint) => {
                setPostedComplaint(complaint);
                setShowPipeline(false);
                setPipelineMsg("");
                setPipelineMediaUrl(null);
              }}
              onCancel={() => {
                setShowPipeline(false);
                setPipelineMsg("");
                setPipelineMediaUrl(null);
              }}
              mediaUrl={pipelineMediaUrl}
              onAttachPhoto={openCamera}
            />
          )}

          {postedComplaint && (
            <div style={{
              margin: "12px 0",
              padding: "14px 16px",
              background: "#f0fdf4",
              border: "1.5px solid #22c55e",
              borderRadius: 12,
            }}>
              <div style={{ fontWeight: 700, color: "#15803d", marginBottom: 4 }}>
                Grievance posted to community
              </div>
              <div style={{ fontSize: 12, color: "#374151", marginBottom: 10 }}>
                Complaint #{postedComplaintId ? postedComplaintId.slice(-8) : "posted"} - Confidence: {Math.round(Number(postedConfidence || 0) * 100)}%
              </div>
              {postedComplaint.text_response && (
                <div style={{ fontSize: 13, color: "#166534", marginBottom: 10 }}>
                  {postedComplaint.text_response}
                </div>
              )}
              <button
                onClick={() => navigate("/community")}
                style={{
                  background: "#22c55e",
                  color: "#fff",
                  border: "none",
                  borderRadius: 8,
                  padding: "8px 16px",
                  fontWeight: 700,
                  fontSize: 13,
                  cursor: "pointer",
                }}
              >
                View in Community Feed &rarr;
              </button>
              {postedComplaint.text_response && (
                <button
                  type="button"
                  onClick={() => playResponseAudio(postedComplaint)}
                  style={{
                    marginLeft: 8,
                    background: "#ffffff",
                    border: "1px solid #86efac",
                    color: "#15803d",
                    borderRadius: 8,
                    padding: "8px 12px",
                    fontWeight: 700,
                    fontSize: 13,
                    cursor: "pointer",
                  }}
                >
                  {t("play")}
                </button>
              )}
              <button
                onClick={() => setPostedComplaint(null)}
                style={{
                  marginLeft: 8,
                  background: "none",
                  border: "none",
                  color: "#9ca3af",
                  fontSize: 12,
                  cursor: "pointer",
                }}
              >
                dismiss
              </button>
            </div>
          )}
        </div>

        {raisedComplaint && (
          <div style={{
            background: "#f0fdf4",
            border: "1.5px solid #22c55e",
            borderRadius: 12,
            padding: "14px 16px",
            margin: "12px 0",
          }}>
            <div style={{ fontWeight: 700, color: "#15803d", marginBottom: 4 }}>
              Grievance Posted to Community
            </div>
            <div style={{ fontSize: 13, color: "#374151" }}>
              {raisedComplaint.type} {raisedComplaint.ward ? `· ${raisedComplaint.ward}` : ""} · Confidence: {(Number(raisedComplaint.confidence || 0) * 100).toFixed(0)}%
            </div>
            <button
              onClick={() => navigate("/community")}
              style={{
                marginTop: 8,
                background: "#22c55e",
                color: "#fff",
                border: "none",
                borderRadius: 8,
                padding: "6px 14px",
                cursor: "pointer",
                fontSize: 12,
                fontWeight: 600,
              }}
            >
              View in Community Feed →
            </button>
          </div>
        )}

        {filePreview && (
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            background: "#fff",
            border: "1px solid #e2e8f0",
            borderRadius: 12,
            padding: 10,
            marginTop: 10,
          }}>
            {filePreview.type === "image" ? (
              <img
                src={filePreview.src}
                alt={filePreview.name}
                style={{ width: 48, height: 48, borderRadius: 8, objectFit: "cover" }}
              />
            ) : (
              <div style={{ fontSize: 13 }}>{filePreview.name}</div>
            )}
            <button
              type="button"
              onClick={clearFile}
              style={{ marginLeft: "auto", background: "none", border: 0, cursor: "pointer", fontSize: 18 }}
            >
              X
            </button>
          </div>
        )}

        <div className="bottom-input">
          <UnifiedInput
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onSubmit={handleSubmit}
            onMic={startVoice}
            micActive={listening}
            loading={loading}
            disabled={loading || !activeSessionId || !historyLoaded || !anonId}
            placeholder={t("description")}
            fileInputId="photo-upload-unified"
            onFileSelect={handlePhotoSelect}
            onCameraClick={openCamera}
            fileActive={Boolean(currentFile)}
          />
          {transcript && <div className="input-hint">Heard: {transcript}</div>}
        </div>

        {cameraError && (
          <div style={{
            marginTop: 8,
            background: "#fee2e2",
            color: "#991b1b",
            border: "1px solid #fecaca",
            borderRadius: 10,
            padding: "9px 12px",
            fontSize: 12,
          }}>
            {cameraError}
          </div>
        )}

        {cameraOpen && (
          <div style={{
            position: "fixed",
            inset: 0,
            zIndex: 5000,
            background: "rgba(15,23,42,0.92)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 16,
          }}>
            <div style={{
              width: "min(520px, 100%)",
              background: "#fff",
              borderRadius: 16,
              overflow: "hidden",
              boxShadow: "0 24px 60px rgba(0,0,0,0.35)",
            }}>
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                style={{ width: "100%", aspectRatio: "3 / 4", objectFit: "cover", background: "#020617" }}
              />
              <div style={{ display: "flex", gap: 10, padding: 12 }}>
                <button type="button" onClick={captureCameraFrame} style={{
                  flex: 1,
                  border: "none",
                  borderRadius: 10,
                  padding: "12px",
                  background: "#1d4ed8",
                  color: "#fff",
                  fontWeight: 800,
                  cursor: "pointer",
                }}>
                  {t("capture")}
                </button>
                <button type="button" onClick={stopCamera} style={{
                  border: "1px solid #cbd5e1",
                  borderRadius: 10,
                  padding: "12px 14px",
                  background: "#fff",
                  color: "#475569",
                  fontWeight: 700,
                  cursor: "pointer",
                }}>
                  {t("cancel")}
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="voice-section">
          <form className="legacy-composer-hidden" onSubmit={handleSubmit} style={{ width: '100%', border: 'none', padding: 0 }}>
            <div className="input-container">
              <input
                type="file"
                accept="image/*"
                capture="environment"
                id="photo-upload"
                style={{ display: "none" }}
                onChange={handlePhotoSelect}
              />
              <label className="icon-action" htmlFor="photo-upload" style={{
                padding: "10px 14px",
                borderRadius: 10,
                border: "1.5px solid #e2e8f0",
                cursor: "pointer",
                fontSize: 20,
                background: currentFile ? "#dbeafe" : "#f8fafc",
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
                  <circle cx="12" cy="13" r="4"/>
                </svg>
              </label>
              <input
                className="complaint-input"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={t("description")}
                style={chatStyles.textInput}
              />
              <button
                className="send-button"
                type="submit"
                disabled={loading || !activeSessionId || !historyLoaded || !anonId}
                style={chatStyles.sendBtn}
              >
                {loading ? "..." : t("submit")}
              </button>
            </div>
          </form>

          <div className="mic-container">
            <button
              className="mic-button"
              type="button"
              onClick={startVoice}
              style={chatStyles.micBtn}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
                  <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
                  <line x1="12" y1="19" x2="12" y2="23"/>
                  <line x1="8" y1="23" x2="16" y2="23"/>
                </svg>
              </div>
            </button>
          </div>

          <div className="voice-text">
            <h3>Tap the mic and speak</h3>
            <p>We will convert your voice to a complaint</p>
          </div>

          {transcript && (
            <div style={{ color: "#64748b", fontSize: 13, marginTop: 12, fontWeight: 500 }}>
              Heard: {transcript}
            </div>
          )}
        </div>

        {sessions.length > 1 && (
          <div style={{ marginTop: 12, paddingBottom: 8 }}>
            <button onClick={handleNewSession} style={sessionButtonStyle}>{t("newChat")}</button>
            {sessions.slice(0, 3).map((s) => (
              <button
                key={s.id}
                onClick={() => handleSelectSession(s.id)}
                style={{
                  ...sessionButtonStyle,
                  background: s.id === activeSessionId ? "#dbeafe" : "#fff",
                  color: s.id === activeSessionId ? "#1d4ed8" : "#64748b",
                }}
              >
                {s.id.slice(0, 8)}
                <span
                  onClick={(e) => handleDeleteSession(s.id, e)}
                  style={{ marginLeft: 6, color: "#ef4444" }}
                >
                  X
                </span>
              </button>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}

const sessionButtonStyle = {
  border: "1px solid #e2e8f0",
  borderRadius: 20,
  background: "#fff",
  color: "#64748b",
  padding: "6px 10px",
  marginRight: 6,
  cursor: "pointer",
  fontSize: 11,
};

const topButtonStyle = (border, background, color) => ({
  padding: "8px 12px",
  borderRadius: 20,
  border: `1.5px solid ${border}`,
  background,
  color,
  fontWeight: 800,
  fontSize: 12,
  cursor: "pointer",
  boxShadow: "0 8px 20px rgba(15,23,42,0.08)",
  transition: "transform 0.2s ease, box-shadow 0.2s ease, background 0.2s ease",
});

function languageButtonStyle(active) {
  return {
    border: active ? "1px solid #1d4ed8" : "1px solid #cbd5e1",
    borderRadius: 8,
    background: active ? "#dbeafe" : "#fff",
    color: active ? "#1d4ed8" : "#475569",
    padding: "6px 9px",
    cursor: "pointer",
    fontSize: 12,
    fontWeight: 700,
  };
}

function checkButtonStyle(loading) {
  return {
    border: "1px solid #0f172a",
    borderRadius: 8,
    background: loading ? "#94a3b8" : "#0f172a",
    color: "#fff",
    padding: "6px 10px",
    cursor: loading ? "wait" : "pointer",
    fontSize: 12,
    fontWeight: 700,
  };
}

const historyPanelStyle = {
  background: "#ffffff",
  border: "1px solid #e2e8f0",
  borderRadius: 10,
  marginBottom: 12,
  overflow: "hidden",
};

const historyHeaderStyle = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  padding: "10px 12px",
  borderBottom: "1px solid #e2e8f0",
  fontSize: 13,
};

const historyEmptyStyle = {
  padding: 12,
  color: "#64748b",
  fontSize: 13,
};

const historyRowStyle = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 12,
  padding: "12px",
  borderTop: "1px solid #f1f5f9",
};

const smallTextButtonStyle = {
  border: "none",
  background: "transparent",
  color: "#64748b",
  cursor: "pointer",
  fontSize: 12,
};

const playButtonStyle = {
  border: "1px solid #bfdbfe",
  borderRadius: 8,
  background: "#eff6ff",
  color: "#1d4ed8",
  padding: "7px 10px",
  cursor: "pointer",
  fontSize: 12,
  fontWeight: 700,
  flexShrink: 0,
};
