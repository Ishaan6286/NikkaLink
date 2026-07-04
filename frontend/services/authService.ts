// ─── Authentication service ───────────────────────────────────────────────────
import api from "@/lib/api";
import { AuthTokens, User } from "@/types";

export const authService = {
  async register(data: {
    email: string;
    username: string;
    password: string;
  }): Promise<User> {
    const res = await api.post<User>("/api/v1/auth/register", data);
    return res.data;
  },

  async login(data: {
    email: string;
    password: string;
  }): Promise<AuthTokens> {
    const res = await api.post<AuthTokens>("/api/v1/auth/login", data);
    localStorage.setItem("access_token", res.data.access_token);
    localStorage.setItem("refresh_token", res.data.refresh_token);
    return res.data;
  },

  async refresh(refreshToken: string): Promise<AuthTokens> {
    const res = await api.post<AuthTokens>("/api/v1/auth/refresh", {
      refresh_token: refreshToken,
    });
    return res.data;
  },

  async me(): Promise<User> {
    const res = await api.get<User>("/api/v1/auth/me");
    return res.data;
  },

  logout() {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
  },

  isLoggedIn(): boolean {
    if (typeof window === "undefined") return false;
    return !!localStorage.getItem("access_token");
  },
};
