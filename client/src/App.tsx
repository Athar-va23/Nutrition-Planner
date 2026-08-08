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

function App() {
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

