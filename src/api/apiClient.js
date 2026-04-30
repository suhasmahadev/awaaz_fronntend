// src/api/apiClient.js

import axios from "axios";
import { API_BASE_URL } from "../config/constants";

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// --- Request interceptor: attach access token ---
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("accessToken");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      // DEBUG LOGGING (MANDATORY)
      console.log(`[REQ] ${config.method.toUpperCase()} ${config.baseURL}${config.url}`);
      console.log(`[Token] Bearer ${token.substring(0, 15)}...`);
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// --- Response interceptor: auto-refresh on 401 ---
let isRefreshing = false;
let failedQueue = [];

function processQueue(error, token = null) {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
}

api.interceptors.response.use(
  (response) => {
    // DEBUG LOGGING (MANDATORY)
    console.log(`[RES] ${response.config.url} | Status: ${response.status}`, response.data);
    return response;
  },
  async (error) => {
    const originalRequest = error.config;
    
    // Log actual URL used and response
    console.error(`[ERR] URL: ${originalRequest?.baseURL}${originalRequest?.url} | Status: ${error.response?.status}`);

    if (error.response?.status === 404) {
      console.error(`[404 NOT FOUND] Actual URL used: ${originalRequest?.baseURL}${originalRequest?.url}`);
    }

    // Only attempt refresh for 401 and not already retried
    if (error.response?.status === 401 && !originalRequest._retry) {
      console.warn(`[401 UNAUTHORIZED] Triggering refresh token flow for ${originalRequest.url}...`);
      
      // Don't try to refresh the refresh endpoint itself
      if (originalRequest.url === "/auth/refresh" || originalRequest.url === "/auth/login") {
        return Promise.reject(error);
      }

      if (isRefreshing) {
        // Queue this request until refresh completes
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return api(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      const refreshToken = localStorage.getItem("refreshToken");
      if (!refreshToken) {
        isRefreshing = false;
        // Force logout
        localStorage.clear();
        window.location.href = "/login";
        return Promise.reject(error);
      }

      try {
        const { data } = await axios.post(`${API_BASE_URL}/auth/refresh`, {
          refresh_token: refreshToken,
        });

        const newAccessToken = data.access_token;
        localStorage.setItem("accessToken", newAccessToken);
        console.log(`[REFRESH SUCCESS] New access token acquired.`);

        // Update default header
        api.defaults.headers.common.Authorization = `Bearer ${newAccessToken}`;
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;

        processQueue(null, newAccessToken);
        // Retry request
        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        localStorage.clear();
        window.location.href = "/login";
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default api;

// Legacy helpers for existing code that might use them
export function buildURL(path) {
  if (!path.startsWith("/")) path = "/" + path;
  return `${API_BASE_URL}${path}`;
}

export async function apiRequest(endpoint, { method = "GET", body = null, token = null } = {}) {
  const config = { method, url: endpoint };
  if (body) config.data = body;
  if (token) config.headers = { Authorization: `Bearer ${token}` };
  const res = await api(config);
  return res.data;
}

export function apiGet(endpoint, token) {
  return apiRequest(endpoint, { method: "GET", token });
}

export function apiPost(endpoint, body, token) {
  return apiRequest(endpoint, { method: "POST", body, token });
}

export function apiPut(endpoint, body, token) {
  return apiRequest(endpoint, { method: "PUT", body, token });
}

export function apiDelete(endpoint, token) {
  return apiRequest(endpoint, { method: "DELETE", token });
}
