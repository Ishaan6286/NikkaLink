// ─── Axios instance for backend API calls ────────────────────────────────────
// Authentication is handled by NextAuth HTTP-only cookies (no localStorage JWT).
// Cookies are sent automatically with every same-origin request.
import axios from "axios";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export const api = axios.create({
  baseURL: API_URL,
  headers: { "Content-Type": "application/json" },
  timeout: 10000,
  // Include credentials (session cookies) on cross-origin requests if needed
  withCredentials: true,
});

// Redirect to login on 401 (session expired or invalid)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (
      error.response?.status === 401 &&
      typeof window !== "undefined" &&
      !window.location.pathname.startsWith("/login")
    ) {
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

export default api;
