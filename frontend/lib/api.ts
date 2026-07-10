// ─── Axios instance for backend API calls ────────────────────────────────────
import axios from "axios";

import { getApiUrl } from "@/lib/env";
import { logAuthError, logAuthWarn } from "@/lib/auth-errors";

export const api = axios.create({
  baseURL: getApiUrl(),
  headers: { "Content-Type": "application/json" },
  timeout: 10000,
  withCredentials: true,
});

api.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("access_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && typeof window !== "undefined") {
      const path = window.location.pathname;
      logAuthError("API returned 401", {
        path,
        hadToken: Boolean(localStorage.getItem("access_token")),
      });

      // Clear stale backend tokens but avoid redirect loops with an active NextAuth session.
      localStorage.removeItem("access_token");
      localStorage.removeItem("refresh_token");

      const hasNextAuthCookie =
        document.cookie.includes("__Secure-authjs.session-token") ||
        document.cookie.includes("authjs.session-token");

      if (!hasNextAuthCookie && !path.startsWith("/login")) {
        window.location.href = "/login";
      } else if (hasNextAuthCookie) {
        logAuthWarn(
          "NextAuth session exists but backend rejected the JWT — waiting for token sync",
          { path }
        );
      }
    }
    return Promise.reject(error);
  }
);

export default api;
