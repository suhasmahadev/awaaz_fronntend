export const API_BASE = "https://awaaz-backend-6.onrender.com";

const DEVICE_ID_KEY = "awaaz_device_id";
const ANON_ID_KEY = "anon_id";

function makeDeviceId() {
  if (crypto?.randomUUID) return crypto.randomUUID();
  return `dev_${Date.now()}_${Math.random().toString(36).slice(2)}`;
}

export function getPermanentDeviceId() {
  const stored = localStorage.getItem(DEVICE_ID_KEY);
  if (stored) return stored;

  const existingAnonId = localStorage.getItem(ANON_ID_KEY);
  const deviceId = existingAnonId
    ? `legacy:${existingAnonId}`
    : makeDeviceId();
  localStorage.setItem(DEVICE_ID_KEY, deviceId);
  return deviceId;
}

export function getDeviceFingerprint(deviceHint = getPermanentDeviceId()) {
  return btoa(`awaaz-device:${deviceHint}`);
}

export async function getOrCreateAnonId(deviceHint = getPermanentDeviceId()) {
  const stored = localStorage.getItem(ANON_ID_KEY);
  if (stored) return stored;

  const fingerprint = getDeviceFingerprint(deviceHint);

  const r = await fetch(`${API_BASE}/auth/anon`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ fingerprint }),
  });
  const data = await r.json();
  if (!data.anon_id) throw new Error(data.error || "anon_id_not_returned");
  localStorage.setItem(ANON_ID_KEY, data.anon_id);
  return data.anon_id;
}
