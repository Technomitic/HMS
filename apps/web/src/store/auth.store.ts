import { create } from 'zustand';
import { authApi } from '@/lib/api';

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  avatarUrl?: string;
}

interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: any) => Promise<void>;
  logout: () => Promise<void>;
  loadProfile: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isLoading: true,
  isAuthenticated: false,

  login: async (email, password) => {
    const { data } = await authApi.login(email, password);
    const { user, accessToken, refreshToken } = data.data;
    localStorage.setItem('medix_access_token', accessToken);
    localStorage.setItem('medix_refresh_token', refreshToken);
    set({ user, isAuthenticated: true, isLoading: false });
  },

  register: async (registerData) => {
    const { data } = await authApi.register(registerData);
    const { user, accessToken, refreshToken } = data.data;
    localStorage.setItem('medix_access_token', accessToken);
    localStorage.setItem('medix_refresh_token', refreshToken);
    set({ user, isAuthenticated: true, isLoading: false });
  },

  logout: async () => {
    try {
      const refreshToken = localStorage.getItem('medix_refresh_token');
      if (refreshToken) await authApi.logout(refreshToken);
    } catch {
      // Ignore errors on logout
    }
    localStorage.removeItem('medix_access_token');
    localStorage.removeItem('medix_refresh_token');
    set({ user: null, isAuthenticated: false, isLoading: false });
  },

  loadProfile: async () => {
    try {
      const token = localStorage.getItem('medix_access_token');
      if (!token) {
        set({ isLoading: false });
        return;
      }
      const { data } = await authApi.profile();
      set({ user: data.data, isAuthenticated: true, isLoading: false });
    } catch {
      localStorage.removeItem('medix_access_token');
      localStorage.removeItem('medix_refresh_token');
      set({ user: null, isAuthenticated: false, isLoading: false });
    }
  },
}));