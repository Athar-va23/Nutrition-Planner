import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ChefHat, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import { authApi, userApi } from '@/lib/api';
import { localStore } from '@/lib/localStore';
import { useAuthStore } from '@/stores/authStore';

export function Login() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const setAuth = useAuthStore((state) => state.setAuth);
  const clearAuth = useAuthStore((state) => state.clearAuth);

  // Clear any stale auth tokens when explicitly visiting the login page
  useEffect(() => {
    clearAuth();
  }, [clearAuth]);
  
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (isLogin) {
        const response = await authApi.login(formData.email, formData.password);
        const { user, tokens } = response.data.data;
        setAuth(user, tokens.accessToken, tokens.refreshToken);

        // Check if onboarding is completed based on backend response or localStore
        let quizDone = Boolean(
          user.onboardingComplete ||
          (user.profile?.heightCm && user.profile?.weightKg) ||
          localStore.isOnboardingComplete()
        );

        // Fallback check against server profile if needed
        if (!quizDone) {
          try {
            const profRes = await userApi.getProfile();
            const p = profRes.data?.data?.profile;
            if (p && p.heightCm && p.weightKg) {
              quizDone = true;
              const currentLocal = localStore.getUserProfile();
              localStore.setUserProfile({
                ...currentLocal,
                firstName: user.firstName || currentLocal.firstName,
                lastName: user.lastName || currentLocal.lastName,
                email: user.email || currentLocal.email,
                age: p.age ?? currentLocal.age,
                gender: p.gender ?? currentLocal.gender,
                heightCm: p.heightCm ?? currentLocal.heightCm,
                weightKg: p.weightKg ?? currentLocal.weightKg,
                activityLevel: p.activityLevel ?? currentLocal.activityLevel,
                healthGoal: p.healthGoal ?? currentLocal.healthGoal,
                calorieTarget: p.calorieTarget ?? currentLocal.calorieTarget,
              });
              localStore.setOnboardingComplete();
            }
          } catch {
            // best-effort check
          }
        }

        toast({
          title: 'Welcome back!',
          description: `Logged in as ${user.email}`,
        });
        
        navigate(quizDone ? '/dashboard' : '/onboarding');
      } else {
        const response = await authApi.register({
          email: formData.email,
          password: formData.password,
          firstName: formData.firstName,
          lastName: formData.lastName,
        });
        const { user, tokens } = response.data.data;
        setAuth(user, tokens.accessToken, tokens.refreshToken);
        toast({
          title: 'Account created!',
          description: 'Let\'s set up your profile.',
        });
        // Always redirect new users to onboarding
        navigate('/onboarding');
      }
    } catch (error: any) {
      console.error('Auth error:', error);
      const serverMessage = error.response?.data?.error?.message;
      const validationDetails = error.response?.data?.error?.details;
      let description = serverMessage || error.message || 'Something went wrong. Please check your credentials.';

      if (validationDetails && Array.isArray(validationDetails) && validationDetails.length > 0) {
        description = validationDetails.map((d: any) => d.message).join('. ');
      }

      toast({
        variant: 'destructive',
        title: isLogin ? 'Sign In Failed' : 'Registration Failed',
        description,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-muted/50">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2">
            <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
              <ChefHat className="w-6 h-6 text-primary-foreground" />
            </div>
            <span className="font-bold text-xl">Nutrition AI</span>
          </Link>
        </div>

        <Card>
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl">
              {isLogin ? 'Sign in' : 'Create account'}
            </CardTitle>
            <CardDescription>
              {isLogin
                ? 'Enter your credentials to access your account'
                : 'Fill in your details to get started'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {!isLogin && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">First Name</Label>
                    <Input
                      id="firstName"
                      value={formData.firstName}
                      onChange={(e) =>
                        setFormData({ ...formData, firstName: e.target.value })
                      }
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input
                      id="lastName"
                      value={formData.lastName}
                      onChange={(e) =>
                        setFormData({ ...formData, lastName: e.target.value })
                      }
                      required
                    />
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={(e) =>
                      setFormData({ ...formData, password: e.target.value })
                    }
                    required
                    minLength={8}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading
                  ? 'Loading...'
                  : isLogin
                  ? 'Sign In'
                  : 'Create Account'}
              </Button>
            </form>

            <div className="mt-4 text-center text-sm">
              {isLogin ? (
                <p>
                  Don't have an account?{' '}
                  <button
                    onClick={() => setIsLogin(false)}
                    className="text-primary hover:underline"
                  >
                    Sign up
                  </button>
                </p>
              ) : (
                <p>
                  Already have an account?{' '}
                  <button
                    onClick={() => setIsLogin(true)}
                    className="text-primary hover:underline"
                  >
                    Sign in
                  </button>
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        <p className="mt-4 text-center text-sm text-muted-foreground">
          <Link to="/" className="hover:underline">
            ← Back to home
          </Link>
        </p>
      </div>
    </div>
  );
}
