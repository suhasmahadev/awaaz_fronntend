import { API_BASE } from "./identity";

export async function safeFetch(url, options = {}) {
  try {
    const token = localStorage.getItem("token");
    const isFormData = options?.body instanceof FormData;
    const res = await fetch(url, {
      ...options,
      headers: {
        ...(isFormData ? {} : { "Content-Type": "application/json" }),
        ...(options?.headers || {}),
        ...(token && { Authorization: `Bearer ${token}` }),
      },
    });

    if (!res.ok) throw new Error("API Error");

    const text = await res.text();
    return text ? JSON.parse(text) : {};
  } catch (err) {
    console.warn("API failed:", err);
    return null;
  }
}

export async function initAnonSession() {
  try {
    const fingerprint = navigator.userAgent + "-" + window.innerWidth;
    const res = await fetch(`${API_BASE}/auth/anon`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fingerprint })
    });
    if (!res.ok) return null;
    return await res.json();
  } catch (err) {
    console.warn("Backend not available, continuing without session");
    return null;
  }
}
