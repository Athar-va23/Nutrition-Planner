import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Target, Ruler, Utensils, AlertTriangle, Activity, CheckCircle2,
  ChevronRight, ChevronLeft, Sparkles, ChefHat,
} from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { localStore } from '@/lib/localStore';
import { useAuthStore } from '@/stores/authStore';
import { userApi } from '@/lib/api';
import '@/styles/onboarding.css';

/* ── Step data ── */

const GOALS = [
  { value: 'lose_weight', label: 'Lose Weight', emoji: '🔥', desc: 'Burn fat and get lean' },
  { value: 'gain_muscle', label: 'Gain Muscle', emoji: '💪', desc: 'Build strength and mass' },
  { value: 'maintain', label: 'Maintain Weight', emoji: '⚖️', desc: 'Stay at your current weight' },
  { value: 'improve_health', label: 'Improve Health', emoji: '🌿', desc: 'Eat cleaner, feel better' },
];

const DIET_TYPES = [
  { value: 'none', label: 'No Restrictions', emoji: '🍽️' },
  { value: 'vegetarian', label: 'Vegetarian', emoji: '🥬' },
  { value: 'vegan', label: 'Vegan', emoji: '🌱' },
  { value: 'keto', label: 'Keto', emoji: '🥑' },
  { value: 'paleo', label: 'Paleo', emoji: '🦴' },
  { value: 'mediterranean', label: 'Mediterranean', emoji: '🫒' },
  { value: 'pescatarian', label: 'Pescatarian', emoji: '🐟' },
  { value: 'gluten_free', label: 'Gluten-Free', emoji: '🌾' },
];

const CUISINES = [
  { value: 'indian', label: 'Indian', emoji: '🇮🇳' },
  { value: 'italian', label: 'Italian', emoji: '🇮🇹' },
  { value: 'mexican', label: 'Mexican', emoji: '🇲🇽' },
  { value: 'chinese', label: 'Chinese', emoji: '🇨🇳' },
  { value: 'japanese', label: 'Japanese', emoji: '🇯🇵' },
  { value: 'thai', label: 'Thai', emoji: '🇹🇭' },
  { value: 'american', label: 'American', emoji: '🇺🇸' },
  { value: 'middle_eastern', label: 'Middle Eastern', emoji: '🧆' },
  { value: 'korean', label: 'Korean', emoji: '🇰🇷' },
  { value: 'french', label: 'French', emoji: '🇫🇷' },
];

const ALLERGENS = [
  { value: 'nuts', label: 'Nuts', emoji: '🥜' },
  { value: 'dairy', label: 'Dairy', emoji: '🥛' },
  { value: 'gluten', label: 'Gluten', emoji: '🌾' },
  { value: 'shellfish', label: 'Shellfish', emoji: '🦐' },
  { value: 'eggs', label: 'Eggs', emoji: '🥚' },
  { value: 'soy', label: 'Soy', emoji: '🫘' },
  { value: 'fish', label: 'Fish', emoji: '🐠' },
  { value: 'sesame', label: 'Sesame', emoji: '🌿' },
];

const ACTIVITY_LEVELS = [
  { value: 'sedentary', label: 'Sedentary', desc: 'Desk job, little exercise', icon: '🪑' },
  { value: 'light', label: 'Lightly Active', desc: 'Exercise 1-3 days/week', icon: '🚶' },
  { value: 'moderate', label: 'Moderately Active', desc: 'Exercise 3-5 days/week', icon: '🏃' },
  { value: 'active', label: 'Very Active', desc: 'Exercise 6-7 days/week', icon: '🏋️' },
  { value: 'very_active', label: 'Extremely Active', desc: 'Physical job + training', icon: '⚡' },
];

const GENDERS = [
  { value: 'male', label: 'Male' },
  { value: 'female', label: 'Female' },
  { value: 'other', label: 'Other' },
  { value: 'prefer_not_to_say', label: 'Prefer not to say' },
];

const STEPS = [
  { icon: Target, label: 'Your Goal' },
  { icon: Ruler, label: 'Body Metrics' },
  { icon: Utensils, label: 'Diet & Cuisine' },
  { icon: AlertTriangle, label: 'Allergies' },
  { icon: Activity, label: 'Activity Level' },
  { icon: CheckCircle2, label: 'Summary' },
];

/* ── Calorie calculator (Mifflin-St Jeor) ── */
function calcCalories(
  weight: number, height: number, age: number,
  gender: string, activity: string, goal: string,
): number {
  let bmr = 10 * weight + 6.25 * height - 5 * age;
  bmr += gender === 'male' ? 5 : -161;

  const mult: Record<string, number> = {
    sedentary: 1.2, light: 1.375, moderate: 1.55, active: 1.725, very_active: 1.9,
  };
  let tdee = bmr * (mult[activity] || 1.55);

  const adj: Record<string, number> = {
    lose_weight: -500, maintain: 0, gain_muscle: 300, improve_health: -200,
  };
  return Math.round(tdee + (adj[goal] || 0));
}

/* ══════════════ Component ══════════════ */

export function OnboardingQuiz() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const user = useAuthStore((s) => s.user);
  const setOnboardingComplete = useAuthStore((s) => s.setOnboardingComplete);

  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [animDir, setAnimDir] = useState<'next' | 'prev'>('next');

  // Form state
  const [goal, setGoal] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState('');
  const [heightCm, setHeightCm] = useState('');
  const [weightKg, setWeightKg] = useState('');
  const [dietaryTypes, setDietaryTypes] = useState<string[]>([]);
  const [cuisinePrefs, setCuisinePrefs] = useState<string[]>([]);
  const [allergies, setAllergies] = useState<string[]>([]);
  const [activityLevel, setActivityLevel] = useState('');

  const totalSteps = STEPS.length;

  const toggleArr = (arr: string[], val: string, setter: (v: string[]) => void) => {
    setter(arr.includes(val) ? arr.filter((v) => v !== val) : [...arr, val]);
  };

  /* ── Validation ── */
  const canAdvance = useCallback((): boolean => {
    switch (step) {
      case 0: return !!goal;
      case 1: return !!age && !!gender && !!heightCm && !!weightKg;
      case 2: return dietaryTypes.length > 0;
      case 3: return true; // allergies are optional
      case 4: return !!activityLevel;
      case 5: return true;
      default: return false;
    }
  }, [step, goal, age, gender, heightCm, weightKg, dietaryTypes, activityLevel]);

  /* ── Navigation ── */
  const goNext = () => {
    if (!canAdvance()) return;
    setAnimDir('next');
    setStep((s) => Math.min(s + 1, totalSteps - 1));
  };

  const goBack = () => {
    setAnimDir('prev');
    setStep((s) => Math.max(s - 1, 0));
  };

  /* ── Computed ── */
  const calorieTarget = calcCalories(
    parseFloat(weightKg) || 70,
    parseFloat(heightCm) || 170,
    parseInt(age) || 25,
    gender || 'other',
    activityLevel || 'moderate',
    goal || 'maintain',
  );

  /* ── Submit ── */
  const handleComplete = async () => {
    setSaving(true);
    const profileData = {
      age: parseInt(age),
      gender,
      heightCm: parseFloat(heightCm),
      weightKg: parseFloat(weightKg),
      activityLevel,
      healthGoal: goal,
      calorieTarget,
    };

    const prefsData = {
      dietaryTypes: dietaryTypes.filter((d) => d !== 'none'),
      allergies,
      restrictedFoods: [],
      cuisinePreferences: cuisinePrefs,
      mealsPerDay: 3,
    };

    // Option B: Write to BOTH localStore AND server API
    const localProfile = {
      firstName: user?.firstName || 'User',
      lastName: user?.lastName || '',
      email: user?.email || '',
      age: parseInt(age),
      gender,
      heightCm: parseFloat(heightCm),
      weightKg: parseFloat(weightKg),
      activityLevel,
      healthGoal: goal,
      calorieTarget,
      dietaryTypes: dietaryTypes.filter((d) => d !== 'none'),
      allergies,
      cuisinePreferences: cuisinePrefs,
    };
    localStore.setUserProfile(localProfile);
    localStore.setOnboardingComplete();

    // Server sync (best-effort, don't block)
    try {
      await Promise.all([
        userApi.updateProfile(profileData),
        userApi.updatePreferences(prefsData),
      ]);
    } catch (err) {
      console.warn('Server sync failed — data saved locally:', err);
    }

    setOnboardingComplete();
    setSaving(false);

    toast({
      title: '🎉 Profile complete!',
      description: `Your ${calorieTarget} kcal/day plan is ready.`,
    });

    navigate('/dashboard', { replace: true });
  };

  /* ── Step Renderers ── */

  const renderGoalStep = () => (
    <div className="quiz-options quiz-options--2col">
      {GOALS.map((g) => (
        <button
          key={g.value}
          className={`quiz-option-card ${goal === g.value ? 'quiz-option-card--active' : ''}`}
          onClick={() => setGoal(g.value)}
        >
          <span className="quiz-option-card__emoji">{g.emoji}</span>
          <span className="quiz-option-card__label">{g.label}</span>
          <span className="quiz-option-card__desc">{g.desc}</span>
        </button>
      ))}
    </div>
  );

  const renderMetricsStep = () => (
    <div className="quiz-metrics">
      <div className="quiz-metrics__row">
        <div className="quiz-field">
          <label className="quiz-field__label">Age</label>
          <input
            type="number"
            className="quiz-field__input"
            placeholder="25"
            value={age}
            onChange={(e) => setAge(e.target.value)}
            min={10}
            max={120}
          />
        </div>
        <div className="quiz-field">
          <label className="quiz-field__label">Gender</label>
          <div className="quiz-gender-pills">
            {GENDERS.map((g) => (
              <button
                key={g.value}
                className={`quiz-pill ${gender === g.value ? 'quiz-pill--active' : ''}`}
                onClick={() => setGender(g.value)}
              >
                {g.label}
              </button>
            ))}
          </div>
        </div>
      </div>
      <div className="quiz-metrics__row">
        <div className="quiz-field">
          <label className="quiz-field__label">Height (cm)</label>
          <input
            type="number"
            className="quiz-field__input"
            placeholder="170"
            value={heightCm}
            onChange={(e) => setHeightCm(e.target.value)}
            min={100}
            max={250}
          />
        </div>
        <div className="quiz-field">
          <label className="quiz-field__label">Weight (kg)</label>
          <input
            type="number"
            className="quiz-field__input"
            placeholder="70"
            value={weightKg}
            onChange={(e) => setWeightKg(e.target.value)}
            min={30}
            max={300}
          />
        </div>
      </div>
    </div>
  );

  const renderDietStep = () => (
    <div className="quiz-section-split">
      <div>
        <h4 className="quiz-section-title">Diet Type</h4>
        <div className="quiz-chip-grid">
          {DIET_TYPES.map((d) => (
            <button
              key={d.value}
              className={`quiz-chip ${dietaryTypes.includes(d.value) ? 'quiz-chip--active' : ''}`}
              onClick={() => toggleArr(dietaryTypes, d.value, setDietaryTypes)}
            >
              <span>{d.emoji}</span> {d.label}
            </button>
          ))}
        </div>
      </div>
      <div>
        <h4 className="quiz-section-title">Favorite Cuisines <span className="quiz-optional">(optional)</span></h4>
        <div className="quiz-chip-grid">
          {CUISINES.map((c) => (
            <button
              key={c.value}
              className={`quiz-chip ${cuisinePrefs.includes(c.value) ? 'quiz-chip--active' : ''}`}
              onClick={() => toggleArr(cuisinePrefs, c.value, setCuisinePrefs)}
            >
              <span>{c.emoji}</span> {c.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );

  const renderAllergyStep = () => (
    <div>
      <p className="quiz-allergy-note">Select any allergens that apply. Skip if none.</p>
      <div className="quiz-chip-grid quiz-chip-grid--center">
        {ALLERGENS.map((a) => (
          <button
            key={a.value}
            className={`quiz-chip quiz-chip--warn ${allergies.includes(a.value) ? 'quiz-chip--active-warn' : ''}`}
            onClick={() => toggleArr(allergies, a.value, setAllergies)}
          >
            <span>{a.emoji}</span> {a.label}
          </button>
        ))}
      </div>
    </div>
  );

  const renderActivityStep = () => (
    <div className="quiz-activity-list">
      {ACTIVITY_LEVELS.map((a) => (
        <button
          key={a.value}
          className={`quiz-activity-card ${activityLevel === a.value ? 'quiz-activity-card--active' : ''}`}
          onClick={() => setActivityLevel(a.value)}
        >
          <span className="quiz-activity-card__icon">{a.icon}</span>
          <div className="quiz-activity-card__text">
            <span className="quiz-activity-card__label">{a.label}</span>
            <span className="quiz-activity-card__desc">{a.desc}</span>
          </div>
        </button>
      ))}
    </div>
  );

  const renderSummary = () => {
    const goalLabel = GOALS.find((g) => g.value === goal)?.label || goal;
    const actLabel = ACTIVITY_LEVELS.find((a) => a.value === activityLevel)?.label || activityLevel;
    const dietLabels = dietaryTypes.filter((d) => d !== 'none').map((d) => DIET_TYPES.find((dt) => dt.value === d)?.label || d);
    const allergyLabels = allergies.map((a) => ALLERGENS.find((al) => al.value === a)?.label || a);
    const cuisineLabels = cuisinePrefs.map((c) => CUISINES.find((cu) => cu.value === c)?.label || c);

    const proteinPct = goal === 'gain_muscle' ? 35 : goal === 'lose_weight' ? 30 : 25;
    const carbsPct = goal === 'lose_weight' ? 35 : 45;
    const fatPct = 100 - proteinPct - carbsPct;

    return (
      <div className="quiz-summary">
        <div className="quiz-summary__calorie-ring">
          <div className="quiz-summary__calorie-num">{calorieTarget}</div>
          <div className="quiz-summary__calorie-label">kcal / day</div>
        </div>

        <div className="quiz-summary__macros">
          <div className="quiz-summary__macro" style={{ '--macro-clr': '#3b82f6' } as React.CSSProperties}>
            <span className="quiz-summary__macro-label">Protein</span>
            <span className="quiz-summary__macro-val">{Math.round(calorieTarget * proteinPct / 400)}g</span>
            <span className="quiz-summary__macro-pct">{proteinPct}%</span>
          </div>
          <div className="quiz-summary__macro" style={{ '--macro-clr': '#f59e0b' } as React.CSSProperties}>
            <span className="quiz-summary__macro-label">Carbs</span>
            <span className="quiz-summary__macro-val">{Math.round(calorieTarget * carbsPct / 400)}g</span>
            <span className="quiz-summary__macro-pct">{carbsPct}%</span>
          </div>
          <div className="quiz-summary__macro" style={{ '--macro-clr': '#a855f7' } as React.CSSProperties}>
            <span className="quiz-summary__macro-label">Fat</span>
            <span className="quiz-summary__macro-val">{Math.round(calorieTarget * fatPct / 900)}g</span>
            <span className="quiz-summary__macro-pct">{fatPct}%</span>
          </div>
        </div>

        <div className="quiz-summary__details">
          <div className="quiz-summary__row"><span>🎯 Goal</span><span>{goalLabel}</span></div>
          <div className="quiz-summary__row"><span>🏃 Activity</span><span>{actLabel}</span></div>
          <div className="quiz-summary__row"><span>📏 Body</span><span>{age}y, {heightCm}cm, {weightKg}kg</span></div>
          {dietLabels.length > 0 && (
            <div className="quiz-summary__row"><span>🥗 Diet</span><span>{dietLabels.join(', ')}</span></div>
          )}
          {allergyLabels.length > 0 && (
            <div className="quiz-summary__row"><span>⚠️ Allergies</span><span>{allergyLabels.join(', ')}</span></div>
          )}
          {cuisineLabels.length > 0 && (
            <div className="quiz-summary__row"><span>🍜 Cuisines</span><span>{cuisineLabels.join(', ')}</span></div>
          )}
        </div>
      </div>
    );
  };

  const stepRenderers = [
    renderGoalStep,
    renderMetricsStep,
    renderDietStep,
    renderAllergyStep,
    renderActivityStep,
    renderSummary,
  ];

  const stepTitles = [
    "What's your primary goal?",
    'Tell us about yourself',
    'What do you eat?',
    'Any food allergies?',
    'How active are you?',
    'Your personalized plan',
  ];

  const stepSubtitles = [
    "We\u2019ll tailor your entire nutrition experience around this.",
    "This helps us calculate your ideal calorie & macro targets.",
    "Select your diet type and favorite cuisines.",
    "We\u2019ll make sure these never appear in your meal plans.",
    "Your daily calorie target depends on how much you move.",
    "Everything looks great! Let\u2019s start your journey.",
  ];

  const StepIcon = STEPS[step].icon;

  return (
    <div className="quiz-root">
      {/* Ambient orbs */}
      <div className="quiz-ambient">
        <div className="quiz-orb quiz-orb--1" />
        <div className="quiz-orb quiz-orb--2" />
      </div>

      <div className="quiz-container">
        {/* Logo */}
        <div className="quiz-logo">
          <div className="quiz-logo__icon">
            <ChefHat size={24} />
          </div>
          <span className="quiz-logo__text">NutriPro</span>
        </div>

        {/* Progress bar */}
        <div className="quiz-progress">
          {STEPS.map((s, i) => {
            const Icon = s.icon;
            return (
              <div key={i} className={`quiz-progress__step ${i <= step ? 'quiz-progress__step--done' : ''} ${i === step ? 'quiz-progress__step--current' : ''}`}>
                <div className="quiz-progress__dot">
                  <Icon size={14} />
                </div>
                <span className="quiz-progress__label">{s.label}</span>
              </div>
            );
          })}
          <div className="quiz-progress__bar">
            <div className="quiz-progress__fill" style={{ width: `${(step / (totalSteps - 1)) * 100}%` }} />
          </div>
        </div>

        {/* Step content */}
        <div className="quiz-card">
          <div className="quiz-card__header">
            <div className="quiz-card__icon-wrap">
              <StepIcon size={20} />
            </div>
            <div>
              <h2 className="quiz-card__title">{stepTitles[step]}</h2>
              <p className="quiz-card__subtitle">{stepSubtitles[step]}</p>
            </div>
          </div>

          <div key={step} className={`quiz-card__body quiz-anim--${animDir}`}>
            {stepRenderers[step]()}
          </div>

          {/* Navigation */}
          <div className="quiz-card__footer">
            {step > 0 && (
              <button className="quiz-nav-btn quiz-nav-btn--back" onClick={goBack}>
                <ChevronLeft size={16} /> Back
              </button>
            )}
            <div className="quiz-card__step-count">
              {step + 1} of {totalSteps}
            </div>
            {step < totalSteps - 1 ? (
              <button
                className="quiz-nav-btn quiz-nav-btn--next"
                onClick={goNext}
                disabled={!canAdvance()}
              >
                Continue <ChevronRight size={16} />
              </button>
            ) : (
              <button
                className="quiz-nav-btn quiz-nav-btn--complete"
                onClick={handleComplete}
                disabled={saving}
              >
                {saving ? (
                  <>Saving...</>
                ) : (
                  <><Sparkles size={16} /> Start My Journey</>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
