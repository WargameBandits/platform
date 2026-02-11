import { create } from "zustand";
import type { User } from "../types/user";
import { getMe, postLogin, postRefresh, postRegister } from "../services/auth";

interface AuthState {
  user: User | null;
  isLoading: boolean;

  login: (email: string, password: string) => Promise<void>;
  register: (
    username: string,
    email: string,
    password: string
  ) => Promise<void>;
  logout: () => void;
  fetchUser: () => Promise<void>;
  refresh: () => Promise<boolean>;
}

const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isLoading: false,

  login: async (email, password) => {
    const tokens = await postLogin(email, password);
    localStorage.setItem("access_token", tokens.access_token);
    localStorage.setItem("refresh_token", tokens.refresh_token);
    const user = await getMe();
    set({ user });
  },

  register: async (username, email, password) => {
    await postRegister(username, email, password);
    const tokens = await postLogin(email, password);
    localStorage.setItem("access_token", tokens.access_token);
    localStorage.setItem("refresh_token", tokens.refresh_token);
    const user = await getMe();
    set({ user });
  },

  logout: () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    set({ user: null });
  },

  fetchUser: async () => {
    const token = localStorage.getItem("access_token");
    if (!token) return;
    set({ isLoading: true });
    try {
      const user = await getMe();
      set({ user });
    } catch {
      localStorage.removeItem("access_token");
      localStorage.removeItem("refresh_token");
      set({ user: null });
    } finally {
      set({ isLoading: false });
    }
  },

  refresh: async () => {
    const refreshToken = localStorage.getItem("refresh_token");
    if (!refreshToken) return false;
    try {
      const tokens = await postRefresh(refreshToken);
      localStorage.setItem("access_token", tokens.access_token);
      localStorage.setItem("refresh_token", tokens.refresh_token);
      return true;
    } catch {
      localStorage.removeItem("access_token");
      localStorage.removeItem("refresh_token");
      set({ user: null });
      return false;
    }
  },
}));

export default useAuthStore;
