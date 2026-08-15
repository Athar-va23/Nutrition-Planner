import { useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import { Toaster } from '@/components/ui/toaster';
import { Layout } from '@/components/Layout';
import { Home } from '@/pages/Home';
import { Login } from '@/pages/Login';
import { OnboardingQuiz } from '@/pages/OnboardingQuiz';
import { Dashboard } from '@/pages/Dashboard';
import { Profile } from '@/pages/Profile';
import { MealPlan } from '@/pages/MealPlan';
import { RecipeGenerator } from '@/pages/RecipeGenerator';
import { GroceryList } from '@/pages/GroceryList';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { useAuthStore } from '@/stores/authStore';
import { userApi } from '@/lib/api';
import { localStore } from '@/lib/localStore';

function App() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const user = useAuthStore((s) => s.user);
  const setOnboardingComplete = useAuthStore((s) => s.setOnboardingComplete);

  useEffect(() => {
    if (!isAuthenticated || !user?.id) return;

    localStore.setCurrentUser(user.id);

    // Sync latest profile from server
    userApi
      .getProfile()
      .then((res) => {
        const p = res.data?.data?.profile;
        const u = res.data?.data;
        if (p) {
          const current = localStore.getUserProfile();
          localStore.setUserProfile({
            ...current,
            firstName: u?.firstName || user.firstName || current.firstName,
            lastName: u?.lastName || user.lastName || current.lastName,
            email: u?.email || user.email || current.email,
            age: p.age ?? current.age,
            gender: p.gender ?? current.gender,
            heightCm: p.heightCm ?? current.heightCm,
            weightKg: p.weightKg ?? current.weightKg,
            activityLevel: p.activityLevel ?? current.activityLevel,
            healthGoal: p.healthGoal ?? current.healthGoal,
            calorieTarget: p.calorieTarget ?? current.calorieTarget,
          });

          if (p.heightCm && p.weightKg) {
            localStore.setOnboardingComplete();
            setOnboardingComplete();
          }
        }
      })
      .catch(() => {
        // Fallback silently if offline or backend is booting
      });
  }, [isAuthenticated, user?.id, setOnboardingComplete]);

  return (
    <>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route
          path="/onboarding"
          element={
            <ProtectedRoute>
              <OnboardingQuiz />
            </ProtectedRoute>
          }
        />
        <Route
          path="/*"
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        >
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="profile" element={<Profile />} />
          <Route path="meal-plans" element={<MealPlan />} />
          <Route path="recipes" element={<RecipeGenerator />} />
          <Route path="grocery-list" element={<GroceryList />} />
        </Route>
      </Routes>
      <Toaster />
    </>
  );
}

export default App;

