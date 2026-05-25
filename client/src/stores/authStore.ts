import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { localStore } from '@/lib/localStore';

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
}

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  onboardingComplete: boolean;
  setAuth: (user: User, accessToken: string, refreshToken: string) => void;
  clearAuth: () => void;
  setUser: (user: User) => void;
  setOnboardingComplete: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      onboardingComplete: false,
      setAuth: (user, accessToken, refreshToken) => {
        localStorage.setItem('accessToken', accessToken);
        localStorage.setItem('refreshToken', refreshToken);
        // Scope all localStore data to this user
        localStore.setCurrentUser(user.id);
        set({ user, accessToken, refreshToken, isAuthenticated: true });
      },
      clearAuth: () => {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        // Clear user scope so no stale data is accessible
        localStore.setCurrentUser('');
        set({ user: null, accessToken: null, refreshToken: null, isAuthenticated: false, onboardingComplete: false });
      },
      setUser: (user) => set({ user }),
      setOnboardingComplete: () => set({ onboardingComplete: true }),
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ user: state.user, isAuthenticated: state.isAuthenticated, onboardingComplete: state.onboardingComplete }),
    }
  )
);

// Restore user scope on page reload from persisted state.
// This runs synchronously after the store is created and rehydrated.
const persisted = useAuthStore.getState();
if (persisted.user?.id) {
  localStore.setCurrentUser(persisted.user.id);
}
