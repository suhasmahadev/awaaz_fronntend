// src/api/authApi.js

import api from "./apiClient";

export async function loginRequest(email, password) {
  const res = await api.post("/auth/login", { email, password });
  return res.data;
}

export async function registerRequest(email, password, name, role = "student") {
  const res = await api.post("/auth/register", { email, password, name, role });
  return res.data;
}

export async function refreshTokenRequest(refreshToken) {
  const res = await api.post("/auth/refresh", { refresh_token: refreshToken });
  return res.data;
}

export async function fetchCurrentUser() {
  const res = await api.get("/auth/me");
  return res.data;
}
