import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { localStore, type UserProfileLocal } from '@/lib/localStore';

export interface UserProfileData {
  age?: number | null;
  gender?: string | null;
  heightCm?: number | null;
  weightKg?: number | null;
  activityLevel?: string;
  healthGoal?: string;
  calorieTarget?: number | null;
}

export interface UserPreferencesData {
  dietaryTypes?: string[];
  allergies?: string[];
  restrictedFoods?: string[];
  cuisinePreferences?: string[];
  maxPrepTime?: number | null;
  mealsPerDay?: number;
}

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  profile?: UserProfileData | null;
  preferences?: UserPreferencesData | null;
  onboardingComplete?: boolean;
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

        const hasMetrics = Boolean(
          user.profile &&
          user.profile.heightCm &&
          user.profile.weightKg
        );

        if (user.profile) {
          const current = localStore.getUserProfile();
          const merged: UserProfileLocal = {
            ...current,
            firstName: user.firstName || current.firstName,
            lastName: user.lastName || current.lastName,
            email: user.email || current.email,
            age: user.profile.age ?? current.age,
            gender: user.profile.gender ?? current.gender,
            heightCm: user.profile.heightCm ?? current.heightCm,
            weightKg: user.profile.weightKg ?? current.weightKg,
            activityLevel: user.profile.activityLevel ?? current.activityLevel,
            healthGoal: user.profile.healthGoal ?? current.healthGoal,
            calorieTarget: user.profile.calorieTarget ?? current.calorieTarget,
            dietaryTypes: user.preferences?.dietaryTypes ?? current.dietaryTypes,
            allergies: user.preferences?.allergies ?? current.allergies,
            cuisinePreferences: user.preferences?.cuisinePreferences ?? current.cuisinePreferences,
          };
          localStore.setUserProfile(merged);
          if (hasMetrics) {
            localStore.setOnboardingComplete();
          }
        }

        const isComplete = Boolean(
          user.onboardingComplete ||
          hasMetrics ||
          localStore.isOnboardingComplete()
        );

        set({
          user,
          accessToken,
          refreshToken,
          isAuthenticated: true,
          onboardingComplete: isComplete,
        });
      },
      clearAuth: () => {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        // Clear user scope so no stale data is accessible
        localStore.setCurrentUser('');
        set({ user: null, accessToken: null, refreshToken: null, isAuthenticated: false, onboardingComplete: false });
      },
      setUser: (user) => set({ user }),
      setOnboardingComplete: () => {
        localStore.setOnboardingComplete();
        set({ onboardingComplete: true });
      },
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

