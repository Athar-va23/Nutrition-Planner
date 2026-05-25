import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { User, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { userApi } from '@/lib/api';
import { calculateBMI, getBMICategory } from '@/lib/utils';

const activityLevels = [
  { value: 'sedentary', label: 'Sedentary (little to no exercise)' },
  { value: 'light', label: 'Light (exercise 1-3 days/week)' },
  { value: 'moderate', label: 'Moderate (exercise 3-5 days/week)' },
  { value: 'active', label: 'Active (exercise 6-7 days/week)' },
  { value: 'very_active', label: 'Very Active (physical job)' },
];

const healthGoals = [
  { value: 'lose_weight', label: 'Lose Weight' },
  { value: 'maintain', label: 'Maintain Weight' },
  { value: 'gain_muscle', label: 'Gain Muscle' },
  { value: 'improve_health', label: 'Improve Health' },
];

export function Profile() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const { data: profileData, isLoading } = useQuery({
    queryKey: ['profile'],
    queryFn: () => userApi.getProfile(),
  });

  const { data: preferencesData } = useQuery({
    queryKey: ['preferences'],
    queryFn: () => userApi.getPreferences(),
  });

  const updateProfileMutation = useMutation({
    mutationFn: (data: any) => userApi.updateProfile(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      toast({ title: 'Profile updated successfully' });
    },
    onError: (error: any) => {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.response?.data?.error?.message || 'Failed to update profile',
      });
    },
  });

  const updatePreferencesMutation = useMutation({
    mutationFn: (data: any) => userApi.updatePreferences(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['preferences'] });
      toast({ title: 'Preferences updated successfully' });
    },
  });

  const profile = profileData?.data.data.profile;
  const preferences = preferencesData?.data.data.preferences;
  const user = profileData?.data.data;

  const [profileForm, setProfileForm] = useState({
    age: profile?.age || '',
    gender: profile?.gender || '',
    heightCm: profile?.heightCm || '',
    weightKg: profile?.weightKg || '',
    activityLevel: profile?.activityLevel || 'moderate',
    healthGoal: profile?.healthGoal || 'maintain',
    calorieTarget: profile?.calorieTarget || '',
  });

  const handleProfileSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfileMutation.mutate({
      ...profileForm,
      age: profileForm.age ? parseInt(profileForm.age as string) : undefined,
      heightCm: profileForm.heightCm ? parseFloat(profileForm.heightCm as string) : undefined,
      weightKg: profileForm.weightKg ? parseFloat(profileForm.weightKg as string) : undefined,
      calorieTarget: profileForm.calorieTarget ? parseInt(profileForm.calorieTarget as string) : undefined,
    });
  };

  const bmi = profile?.weightKg && profile?.heightCm
    ? calculateBMI(profile.weightKg, profile.heightCm)
    : null;

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Profile</h1>
        <p className="text-muted-foreground">Manage your personal information and preferences</p>
      </div>

      {/* User Info Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="w-5 h-5" />
            Account Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <Label className="text-muted-foreground">Name</Label>
              <p className="font-medium">{user?.firstName} {user?.lastName}</p>
            </div>
            <div>
              <Label className="text-muted-foreground">Email</Label>
              <p className="font-medium">{user?.email}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* BMI Card */}
      {bmi && (
        <Card>
          <CardHeader>
            <CardTitle>Body Metrics</CardTitle>
            <CardDescription>Your calculated health metrics</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-8">
              <div className="text-center">
                <div className="text-4xl font-bold text-primary">{bmi}</div>
                <div className="text-sm text-muted-foreground">BMI</div>
              </div>
              <div>
                <div className="font-medium">{getBMICategory(bmi)}</div>
                <div className="text-sm text-muted-foreground">
                  Based on your height and weight
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Profile Form */}
      <Card>
        <CardHeader>
          <CardTitle>Health Profile</CardTitle>
          <CardDescription>Update your health information</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleProfileSubmit} className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="age">Age</Label>
                <Input
                  id="age"
                  type="number"
                  value={profileForm.age}
                  onChange={(e) => setProfileForm({ ...profileForm, age: e.target.value })}
                  placeholder="30"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="gender">Gender</Label>
                <Select
                  value={profileForm.gender}
                  onValueChange={(value) => setProfileForm({ ...profileForm, gender: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select gender" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">Male</SelectItem>
                    <SelectItem value="female">Female</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                    <SelectItem value="prefer_not_to_say">Prefer not to say</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="height">Height (cm)</Label>
                <Input
                  id="height"
                  type="number"
                  value={profileForm.heightCm}
                  onChange={(e) => setProfileForm({ ...profileForm, heightCm: e.target.value })}
                  placeholder="175"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="weight">Weight (kg)</Label>
                <Input
                  id="weight"
                  type="number"
                  value={profileForm.weightKg}
                  onChange={(e) => setProfileForm({ ...profileForm, weightKg: e.target.value })}
                  placeholder="70"
                />
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="activity">Activity Level</Label>
                <Select
                  value={profileForm.activityLevel}
                  onValueChange={(value) => setProfileForm({ ...profileForm, activityLevel: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {activityLevels.map((level) => (
                      <SelectItem key={level.value} value={level.value}>
                        {level.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="goal">Health Goal</Label>
                <Select
                  value={profileForm.healthGoal}
                  onValueChange={(value) => setProfileForm({ ...profileForm, healthGoal: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {healthGoals.map((goal) => (
                      <SelectItem key={goal.value} value={goal.value}>
                        {goal.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="calories">Daily Calorie Target</Label>
              <Input
                id="calories"
                type="number"
                value={profileForm.calorieTarget}
                onChange={(e) => setProfileForm({ ...profileForm, calorieTarget: e.target.value })}
                placeholder="Auto-calculated if empty"
              />
              <p className="text-sm text-muted-foreground">
                Leave empty to auto-calculate based on your profile
              </p>
            </div>

            <Button 
              type="submit" 
              className="gap-2"
              disabled={updateProfileMutation.isPending}
            >
              <Save className="w-4 h-4" />
              {updateProfileMutation.isPending ? 'Saving...' : 'Save Changes'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
