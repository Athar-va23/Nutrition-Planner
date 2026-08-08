import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  Flame, Zap, Droplets, Activity, TrendingUp, Plus,
  ChefHat, ShoppingCart, Sparkles, ArrowRight,
  Clock, Target, BarChart3, Utensils, Apple, Moon,
  Sun, Settings,
} from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import { localStore, type DailyLogEntry, type MealPlanLocal } from '@/lib/localStore';
import { generateInsights, hasGroqKey } from '@/lib/groqClient';
import { cn } from '@/lib/utils';
import { NutriAI } from '@/components/dashboard/NutriAI';
import { ApiKeySetup } from '@/components/dashboard/ApiKeySetup';
import { QuickLog } from '@/components/dashboard/QuickLog';
import { MacroRing } from '@/components/dashboard/MacroRing';
import { WeekChart } from '@/components/dashboard/WeekChart';

// ── Time-aware greeting ──
function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 6) return 'Rest well';
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  if (h < 21) return 'Good evening';
  return 'Good night';
}

function getGreetingIcon() {
  const h = new Date().getHours();
  if (h >= 6 && h < 18) return <Sun className="w-5 h-5" />;
  return <Moon className="w-5 h-5" />;
}

export function Dashboard() {
  const user = useAuthStore((s) => s.user);
  const profile = localStore.getUserProfile();
  const [todayLog, setTodayLog] = useState<DailyLogEntry | null>(localStore.getTodayLog());
  const [recentPlans, setRecentPlans] = useState<MealPlanLocal[]>(localStore.getMealPlans().slice(0, 3));
  const [insights, setInsights] = useState<{ title: string; description: string; type: string }[]>([]);
  const [insightsLoading, setInsightsLoading] = useState(false);
  const [showApiSetup, setShowApiSetup] = useState(!hasGroqKey());
  const [currentTime, setCurrentTime] = useState(new Date());
  const containerRef = useRef<HTMLDivElement>(null);

  // Live clock
  useEffect(() => {
    const t = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(t);
  }, []);

  // Fetch AI insights
  useEffect(() => {
    if (!hasGroqKey()) return;
    setInsightsLoading(true);
    generateInsights()
      .then((r) => setInsights(r.insights || []))
      .catch(() => setInsights([
        { title: 'Track Your Meals', description: 'Log your meals to unlock personalized insights powered by AI.', type: 'info' },
        { title: 'Set Your Goals', description: 'Configure your profile to get calorie targets and macro splits.', type: 'info' },
        { title: 'Stay Hydrated', description: 'Aim for 2-3 liters of water daily for optimal metabolism.', type: 'success' },
      ]))
      .finally(() => setInsightsLoading(false));
  }, []);

  // Refresh local data
  const refreshData = () => {
    setTodayLog(localStore.getTodayLog());
    setRecentPlans(localStore.getMealPlans().slice(0, 3));
  };

  // Derived values
  const calorieTarget = profile.calorieTarget || 2200;
  const caloriesConsumed = todayLog?.calories || 0;
  const caloriePercent = Math.min(100, Math.round((caloriesConsumed / calorieTarget) * 100));
  const proteinTarget = Math.round(calorieTarget * 0.3 / 4);
  const carbsTarget = Math.round(calorieTarget * 0.4 / 4);
  const fatTarget = Math.round(calorieTarget * 0.3 / 9);

  const firstName = user?.firstName || profile.firstName || 'there';

  if (showApiSetup) {
    return <ApiKeySetup onComplete={() => setShowApiSetup(false)} />;
  }

  return (
    <div ref={containerRef} className="dash-root">
      {/* ── Ambient background ── */}
      <div className="dash-ambient" aria-hidden="true">
        <div className="dash-orb dash-orb--1" />
        <div className="dash-orb dash-orb--2" />
        <div className="dash-orb dash-orb--3" />
      </div>

      {/* ── Header ── */}
      <header className="dash-header">
        <div className="dash-header__left">
          <div className="dash-header__greeting">
            {getGreetingIcon()}
            <span className="dash-header__time">
              {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
          <h1 className="dash-header__title">
            {getGreeting()}, <span className="text-gradient">{firstName}</span>
          </h1>
          <p className="dash-header__subtitle">
            {caloriesConsumed > 0
              ? `${caloriesConsumed.toLocaleString()} of ${calorieTarget.toLocaleString()} kcal tracked today`
              : 'Start tracking your nutrition to see live analytics'
            }
          </p>
        </div>
        <div className="dash-header__actions">
          <Link to="/meal-plans">
            <button className="dash-btn dash-btn--primary">
              <Plus className="w-4 h-4" />
              <span>New Plan</span>
            </button>
          </Link>
        </div>
      </header>

      {/* ── Vitals Strip ── */}
      <section className="dash-vitals" aria-label="Today's vitals">
        <VitalCard
          label="Calories"
          value={caloriesConsumed}
          target={calorieTarget}
          unit="kcal"
          icon={<Flame />}
          color="var(--clr-calorie)"
          percent={caloriePercent}
        />
        <VitalCard
          label="Protein"
          value={todayLog?.protein || 0}
          target={proteinTarget}
          unit="g"
          icon={<Zap />}
          color="var(--clr-protein)"
          percent={Math.min(100, Math.round(((todayLog?.protein || 0) / proteinTarget) * 100))}
        />
        <VitalCard
          label="Carbs"
          value={todayLog?.carbs || 0}
          target={carbsTarget}
          unit="g"
          icon={<Apple />}
          color="var(--clr-carbs)"
          percent={Math.min(100, Math.round(((todayLog?.carbs || 0) / carbsTarget) * 100))}
        />
        <VitalCard
          label="Fat"
          value={todayLog?.fat || 0}
          target={fatTarget}
          unit="g"
          icon={<Droplets />}
          color="var(--clr-fat)"
          percent={Math.min(100, Math.round(((todayLog?.fat || 0) / fatTarget) * 100))}
        />
      </section>

      {/* ── Main Grid ── */}
      <div className="dash-grid">
        {/* Left Column */}
        <div className="dash-grid__main">
          {/* Macro Ring + Quick Log */}
          <div className="dash-split">
            <div className="dash-card dash-card--ring">
              <div className="dash-card__label">
                <BarChart3 className="w-4 h-4" />
                <span>Today's Macros</span>
              </div>
              <MacroRing
                calories={caloriesConsumed}
                target={calorieTarget}
                protein={todayLog?.protein || 0}
                carbs={todayLog?.carbs || 0}
                fat={todayLog?.fat || 0}
              />
            </div>
            <div className="dash-card dash-card--log">
              <div className="dash-card__label">
                <Utensils className="w-4 h-4" />
                <span>Quick Log</span>
              </div>
              <QuickLog onLog={refreshData} />
            </div>
          </div>

          {/* Weekly Trend */}
          <div className="dash-card dash-card--chart">
            <div className="dash-card__header">
              <div className="dash-card__label">
                <TrendingUp className="w-4 h-4" />
                <span>7-Day Trend</span>
              </div>
              <span className="dash-pill">This Week</span>
            </div>
            <WeekChart target={calorieTarget} />
          </div>

          {/* Recent Plans */}
          <div className="dash-card">
            <div className="dash-card__header">
              <div className="dash-card__label">
                <Clock className="w-4 h-4" />
                <span>Recent Plans</span>
              </div>
              <Link to="/meal-plans" className="dash-link">
                View all <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
            {recentPlans.length === 0 ? (
              <div className="dash-empty">
                <div className="dash-empty__icon">
                  <Target className="w-8 h-8" />
                </div>
                <p>No meal plans yet</p>
                <Link to="/meal-plans">
                  <button className="dash-btn dash-btn--sm dash-btn--primary">
                    <Plus className="w-3 h-3" /> Create First Plan
                  </button>
                </Link>
              </div>
            ) : (
              <div className="dash-plan-list">
                {recentPlans.map((plan) => (
                  <div key={plan.id} className="dash-plan-row">
                    <div className="dash-plan-row__icon">
                      <Activity className="w-4 h-4" />
                    </div>
                    <div className="dash-plan-row__info">
                      <span className="dash-plan-row__name">{plan.name}</span>
                      <span className="dash-plan-row__meta">
                        {new Date(plan.createdAt).toLocaleDateString()} · {plan.duration} · {plan.totalCalories.toLocaleString()} kcal
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column */}
        <div className="dash-grid__side">
          {/* AI Insights */}
          <div className="dash-card dash-card--insights">
            <div className="dash-card__header">
              <div className="dash-card__label">
                <Sparkles className="w-4 h-4 dash-sparkle" />
                <span>AI Insights</span>
              </div>
              <span className="dash-pill dash-pill--glow">Live</span>
            </div>
            {insightsLoading ? (
              <div className="dash-insights-skeleton">
                {[1, 2, 3].map(i => <div key={i} className="dash-skeleton-bar" />)}
              </div>
            ) : insights.length > 0 ? (
              <div className="dash-insights-list">
                {insights.map((insight, i) => (
                  <div key={i} className={cn('dash-insight', `dash-insight--${insight.type}`)}>
                    <div className="dash-insight__dot" />
                    <div>
                      <h4 className="dash-insight__title">{insight.title}</h4>
                      <p className="dash-insight__desc">{insight.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="dash-insights-empty">Generate a meal plan to unlock AI insights.</p>
            )}
          </div>

          {/* Quick Actions */}
          <div className="dash-actions">
            <Link to="/recipes" className="dash-action-card">
              <div className="dash-action-card__icon dash-action-card__icon--orange">
                <ChefHat className="w-5 h-5" />
              </div>
              <div>
                <h4>Recipe Lab</h4>
                <p>AI-crafted recipes</p>
              </div>
              <ArrowRight className="w-4 h-4 dash-action-card__arrow" />
            </Link>
            <Link to="/grocery-list" className="dash-action-card">
              <div className="dash-action-card__icon dash-action-card__icon--blue">
                <ShoppingCart className="w-5 h-5" />
              </div>
              <div>
                <h4>Supply Sync</h4>
                <p>Smart grocery lists</p>
              </div>
              <ArrowRight className="w-4 h-4 dash-action-card__arrow" />
            </Link>
            <Link to="/profile" className="dash-action-card">
              <div className="dash-action-card__icon dash-action-card__icon--purple">
                <Settings className="w-5 h-5" />
              </div>
              <div>
                <h4>Profile</h4>
                <p>Goals & preferences</p>
              </div>
              <ArrowRight className="w-4 h-4 dash-action-card__arrow" />
            </Link>
          </div>
        </div>
      </div>

      {/* ── Floating AI Chat ── */}
      <NutriAI />
    </div>
  );
}

// ── Sub-component: Vital Card ──
function VitalCard({
  label, value, target, unit, icon, color, percent,
}: {
  label: string; value: number; target: number; unit: string;
  icon: React.ReactNode; color: string; percent: number;
}) {
  return (
    <div className="dash-vital" style={{ '--vital-clr': color } as React.CSSProperties}>
      <div className="dash-vital__top">
        <span className="dash-vital__icon">{icon}</span>
        <span className="dash-vital__label">{label}</span>
      </div>
      <div className="dash-vital__value">
        <span className="dash-vital__num">{value.toLocaleString()}</span>
        <span className="dash-vital__unit">/ {target} {unit}</span>
      </div>
      <div className="dash-vital__bar">
        <div
          className="dash-vital__fill"
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}
