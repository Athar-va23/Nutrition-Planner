import { useState } from 'react';
import {
  Calendar, Plus, Loader2, Trash2, ChevronDown, ChevronUp, Sparkles,
  Utensils, Edit3, Save, X, PlusCircle, ChefHat, Zap, Apple, Droplets, ShoppingCart, Check,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/components/ui/use-toast';
import { generateMealPlan, hasGroqKey } from '@/lib/groqClient';
import { localStore, type MealPlanLocal, type MealLocal, type ShoppingCartItem } from '@/lib/localStore';

export function MealPlan() {
  const { toast } = useToast();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [duration, setDuration] = useState<'daily' | 'weekly'>('weekly');
  const [isGenerating, setIsGenerating] = useState(false);
  const [mealPlans, setMealPlans] = useState<MealPlanLocal[]>(localStore.getMealPlans());
  const [expandedPlan, setExpandedPlan] = useState<string | null>(null);
  const [expandedMeals, setExpandedMeals] = useState<Set<string>>(new Set());
  const [editingPlan, setEditingPlan] = useState<string | null>(null);

  const [groceryAdded, setGroceryAdded] = useState<Set<string>>(new Set());

  // Custom meal dialog state
  const [addMealDialog, setAddMealDialog] = useState<{ planId: string; dayNumber: number } | null>(null);
  const [customMeal, setCustomMeal] = useState({
    name: '', description: '', calories: 400, type: 'lunch',
    prepTime: 15, cookTime: 20, servings: 2,
  });

  const refreshPlans = () => setMealPlans(localStore.getMealPlans());

  const handleCreate = async () => {
    if (!hasGroqKey()) {
      toast({ variant: 'destructive', title: 'API Key Required', description: 'Set up your Groq API key in the Dashboard first.' });
      return;
    }

    setIsGenerating(true);
    try {
      await generateMealPlan(duration);
      refreshPlans();
      setIsCreateDialogOpen(false);
      toast({ title: '✓ Meal plan created!', description: 'Your AI-generated plan is ready.' });
    } catch (error: any) {
      const msg = error.message === 'RATE_LIMITED'
        ? 'Rate limited — wait a moment and try again.'
        : 'Failed to generate meal plan. Please try again.';
      toast({ variant: 'destructive', title: 'Error', description: msg });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDelete = (id: string) => {
    localStore.deleteMealPlan(id);
    refreshPlans();
    toast({ title: 'Meal plan deleted' });
  };

  const toggleMealExpand = (key: string) => {
    setExpandedMeals(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const handleRemoveMeal = (planId: string, dayNumber: number, mealIndex: number) => {
    localStore.removeMealFromPlan(planId, dayNumber, mealIndex);
    refreshPlans();
    toast({ title: 'Meal removed' });
  };

  const handleAddDay = (planId: string) => {
    const newDay = localStore.addDayToPlan(planId);
    refreshPlans();
    toast({ title: `Day ${newDay} added` });
  };

  const handleAddMealToGrocery = (meal: MealLocal, mealKey: string) => {
    if (!meal.ingredients || meal.ingredients.length === 0) {
      toast({ variant: 'destructive', title: 'No ingredients', description: 'This meal has no ingredient data.' });
      return;
    }

    const items: ShoppingCartItem[] = meal.ingredients.map((ing) => ({
      name: ing.name,
      amount: ing.amount,
      unit: ing.unit,
      fromRecipes: [meal.name],
    }));

    localStore.addToShoppingCart(items);
    setGroceryAdded((prev) => new Set(prev).add(mealKey));
    toast({ title: `${items.length} ingredients added to grocery list`, description: `From: ${meal.name}` });
  };

  const handleAddCustomMeal = () => {
    if (!addMealDialog || !customMeal.name.trim()) {
      toast({ variant: 'destructive', title: 'Enter a meal name' });
      return;
    }

    const meal: MealLocal = {
      type: customMeal.type,
      name: customMeal.name,
      description: customMeal.description,
      calories: customMeal.calories,
      prepTime: customMeal.prepTime,
      cookTime: customMeal.cookTime,
      servings: customMeal.servings,
      nutrition: {
        protein: Math.round(customMeal.calories * 0.25 / 4),
        carbs: Math.round(customMeal.calories * 0.45 / 4),
        fat: Math.round(customMeal.calories * 0.30 / 9),
        fiber: 5,
      },
      ingredients: [],
      instructions: [],
    };

    localStore.addMealToPlan(addMealDialog.planId, addMealDialog.dayNumber, meal);
    setAddMealDialog(null);
    setCustomMeal({ name: '', description: '', calories: 400, type: 'lunch', prepTime: 15, cookTime: 20, servings: 2 });
    refreshPlans();
    toast({ title: '✓ Custom meal added!' });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Sparkles className="w-7 h-7 text-primary dash-sparkle" />
            Meal Plans
          </h1>
          <p className="text-muted-foreground">Generate, customize, and manage your AI-powered meal plans</p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="w-4 h-4" />
              New Plan
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Generate New Meal Plan</DialogTitle>
              <DialogDescription>
                AI will create a personalized plan using your profile data below.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              {/* Profile summary */}
              {(() => {
                const p = localStore.getUserProfile();
                const hasDiet = p.dietaryTypes?.length > 0;
                const hasAllergy = p.allergies?.length > 0;
                const hasCuisine = p.cuisinePreferences?.length > 0;

                return (
                  <div className="rounded-xl border border-primary/10 bg-muted/30 p-3 space-y-2 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground text-xs font-bold uppercase tracking-widest">Your Profile</span>
                      <a href="/profile" className="text-xs text-primary font-semibold hover:underline">Edit</a>
                    </div>
                    <div className="grid grid-cols-2 gap-1 text-xs">
                      <span className="text-muted-foreground">🎯 Goal</span>
                      <span className="font-semibold capitalize">{(p.healthGoal || 'maintain').replace('_', ' ')}</span>
                      <span className="text-muted-foreground">🔥 Calories</span>
                      <span className="font-semibold">{p.calorieTarget} kcal/day</span>
                      {hasDiet && <>
                        <span className="text-muted-foreground">🥗 Diet</span>
                        <span className="font-semibold capitalize">{p.dietaryTypes.join(', ')}</span>
                      </>}
                      {hasAllergy && <>
                        <span className="text-muted-foreground">⚠️ Allergies</span>
                        <span className="font-semibold capitalize">{p.allergies.join(', ')}</span>
                      </>}
                      {hasCuisine && <>
                        <span className="text-muted-foreground">🍜 Cuisines</span>
                        <span className="font-semibold capitalize">{p.cuisinePreferences.join(', ')}</span>
                      </>}
                    </div>
                  </div>
                );
              })()}
              <div className="space-y-2">
                <label className="text-sm font-medium">Duration</label>
                <Select value={duration} onValueChange={(v) => setDuration(v as 'daily' | 'weekly')}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="daily">Daily (1 day)</SelectItem>
                    <SelectItem value="weekly">Weekly (7 days)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={handleCreate} className="w-full" disabled={isGenerating || !hasGroqKey()}>
                {isGenerating ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Generating (may take ~15s)...
                  </>
                ) : (
                  'Generate Meal Plan'
                )}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {mealPlans.length === 0 ? (
        <Card className="text-center py-12 glass-card border-primary/10">
          <CardContent>
            <Calendar className="w-12 h-12 mx-auto mb-4 text-muted-foreground/30" />
            <h3 className="text-lg font-medium mb-2">No meal plans yet</h3>
            <p className="text-muted-foreground mb-4">
              Create your first AI-powered meal plan
            </p>
            <Button onClick={() => setIsCreateDialogOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Create Meal Plan
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {mealPlans.map((plan) => {
            const isExpanded = expandedPlan === plan.id;
            const isEditing = editingPlan === plan.id;
            return (
              <Card key={plan.id} className="glass-card border-primary/10 hover:border-primary/20 transition-colors">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">{plan.name}</CardTitle>
                      <CardDescription>
                        {new Date(plan.createdAt).toLocaleDateString()} · {plan.duration} · {plan.totalCalories.toLocaleString()} kcal total
                      </CardDescription>
                    </div>
                    <div className="flex items-center gap-1">
                      {isExpanded && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className={`h-8 w-8 ${isEditing ? 'text-primary' : ''}`}
                          onClick={() => setEditingPlan(isEditing ? null : plan.id)}
                          title={isEditing ? 'Done editing' : 'Edit plan'}
                        >
                          {isEditing ? <Save className="w-4 h-4" /> : <Edit3 className="w-4 h-4" />}
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => {
                          setExpandedPlan(isExpanded ? null : plan.id);
                          if (isExpanded) setEditingPlan(null);
                        }}
                      >
                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive/60 hover:text-destructive"
                        onClick={() => handleDelete(plan.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>

                {isExpanded && plan.days && plan.days.length > 0 && (
                  <CardContent className="pt-0">
                    <div className="space-y-4">
                      {plan.days.map((day, di) => (
                        <div key={di} className="border border-primary/10 rounded-xl p-4">
                          <div className="flex items-center justify-between mb-3">
                            <h4 className="font-bold text-sm flex items-center gap-2">
                              <Calendar className="w-4 h-4 text-primary" />
                              Day {day.dayNumber}
                              <span className="text-muted-foreground font-normal text-xs ml-2">
                                {day.totalCalories?.toLocaleString()} kcal
                              </span>
                            </h4>
                            {isEditing && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 text-xs text-primary"
                                onClick={() => setAddMealDialog({ planId: plan.id, dayNumber: day.dayNumber })}
                              >
                                <PlusCircle className="w-3 h-3 mr-1" /> Add Meal
                              </Button>
                            )}
                          </div>
                          <div className="grid sm:grid-cols-2 gap-3">
                            {day.meals?.map((meal, mi) => {
                              const mealKey = `${plan.id}-${day.dayNumber}-${mi}`;
                              const isMealExpanded = expandedMeals.has(mealKey);
                              return (
                                <div key={mi} className="bg-muted/30 rounded-lg p-3 space-y-2">
                                  {/* Meal Header */}
                                  <div className="flex items-center gap-2">
                                    <Utensils className="w-3 h-3 text-primary flex-shrink-0" />
                                    <span className="text-[10px] uppercase tracking-widest text-primary font-bold">{meal.type}</span>
                                    <span className="text-xs text-muted-foreground ml-auto">{meal.calories} kcal</span>
                                    {isEditing && (
                                      <button
                                        onClick={() => handleRemoveMeal(plan.id, day.dayNumber, mi)}
                                        className="p-0.5 rounded text-destructive/50 hover:text-destructive transition-colors"
                                        title="Remove meal"
                                      >
                                        <X className="w-3 h-3" />
                                      </button>
                                    )}
                                  </div>
                                  <p className="font-medium text-sm">{meal.name}</p>
                                  {meal.description && (
                                    <p className="text-xs text-muted-foreground">{meal.description}</p>
                                  )}

                                  {/* Macro badges */}
                                  {meal.nutrition && (
                                    <div className="flex gap-2 flex-wrap">
                                      <Badge variant="outline" className="text-[9px] py-0 px-1.5 gap-1 border-blue-500/20 text-blue-400">
                                        <Zap className="w-2.5 h-2.5" /> {meal.nutrition.protein}g P
                                      </Badge>
                                      <Badge variant="outline" className="text-[9px] py-0 px-1.5 gap-1 border-green-500/20 text-green-400">
                                        <Apple className="w-2.5 h-2.5" /> {meal.nutrition.carbs}g C
                                      </Badge>
                                      <Badge variant="outline" className="text-[9px] py-0 px-1.5 gap-1 border-yellow-500/20 text-yellow-400">
                                        <Droplets className="w-2.5 h-2.5" /> {meal.nutrition.fat}g F
                                      </Badge>
                                    </div>
                                  )}

                                  {/* Expand/collapse for full recipe */}
                                  {(meal.ingredients?.length > 0 || meal.instructions?.length > 0) && (
                                    <button
                                      onClick={() => toggleMealExpand(mealKey)}
                                      className="text-xs text-primary hover:underline flex items-center gap-1 mt-1"
                                    >
                                      <ChefHat className="w-3 h-3" />
                                      {isMealExpanded ? 'Hide Recipe' : 'View Full Recipe'}
                                    </button>
                                  )}

                                  {/* Full recipe (expanded) */}
                                  {isMealExpanded && (
                                    <div className="space-y-3 pt-2 border-t border-primary/10">
                                      {/* Ingredients */}
                                      {meal.ingredients && meal.ingredients.length > 0 && (
                                        <div>
                                          <h5 className="text-xs font-semibold mb-1.5 text-primary/80">Ingredients</h5>
                                          <ul className="text-xs space-y-1 text-muted-foreground">
                                            {meal.ingredients.map((ing, ii) => (
                                              <li key={ii} className="flex items-center gap-1.5">
                                                <span className="w-1 h-1 rounded-full bg-primary/50 flex-shrink-0" />
                                                {ing.amount} {ing.unit} {ing.name}
                                              </li>
                                            ))}
                                          </ul>
                                        </div>
                                      )}

                                      {/* Instructions */}
                                      {meal.instructions && meal.instructions.length > 0 && (
                                        <div>
                                          <h5 className="text-xs font-semibold mb-1.5 text-primary/80">Instructions</h5>
                                          <ol className="text-xs space-y-2">
                                            {meal.instructions.map((step, si) => (
                                              <li key={si} className="flex gap-2">
                                                <span className="flex-shrink-0 w-4 h-4 rounded-full bg-primary/10 text-primary text-[10px] font-bold flex items-center justify-center mt-0.5">
                                                  {si + 1}
                                                </span>
                                                <span className="text-muted-foreground leading-relaxed">{step}</span>
                                              </li>
                                            ))}
                                          </ol>
                                        </div>
                                      )}
                                      {/* Add to Grocery button */}
                                      {meal.ingredients && meal.ingredients.length > 0 && (
                                        <Button
                                          variant="outline"
                                          size="sm"
                                          className={`w-full mt-1 text-xs gap-1.5 ${
                                            groceryAdded.has(mealKey)
                                              ? 'border-green-500/20 text-green-400'
                                              : 'border-orange-500/20 text-orange-400 hover:bg-orange-500/10'
                                          }`}
                                          onClick={() => handleAddMealToGrocery(meal, mealKey)}
                                          disabled={groceryAdded.has(mealKey)}
                                        >
                                          {groceryAdded.has(mealKey) ? (
                                            <><Check className="w-3 h-3" /> Added to Grocery List</>
                                          ) : (
                                            <><ShoppingCart className="w-3 h-3" /> Add Ingredients to Grocery List</>
                                          )}
                                        </Button>
                                      )}
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      ))}

                      {/* Add Day button (edit mode) */}
                      {isEditing && (
                        <Button
                          variant="outline"
                          className="w-full border-dashed border-primary/20 text-primary hover:bg-primary/5"
                          onClick={() => handleAddDay(plan.id)}
                        >
                          <PlusCircle className="w-4 h-4 mr-2" />
                          Add New Day
                        </Button>
                      )}
                    </div>
                  </CardContent>
                )}
              </Card>
            );
          })}
        </div>
      )}

      {/* Add Custom Meal Dialog */}
      <Dialog open={!!addMealDialog} onOpenChange={(open) => !open && setAddMealDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Custom Meal</DialogTitle>
            <DialogDescription>
              Add a meal to Day {addMealDialog?.dayNumber}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">Meal Type</label>
              <Select value={customMeal.type} onValueChange={(v) => setCustomMeal({ ...customMeal, type: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="breakfast">Breakfast</SelectItem>
                  <SelectItem value="lunch">Lunch</SelectItem>
                  <SelectItem value="dinner">Dinner</SelectItem>
                  <SelectItem value="snack">Snack</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Meal Name *</label>
              <Input
                placeholder="e.g., Grilled Chicken Salad"
                value={customMeal.name}
                onChange={(e) => setCustomMeal({ ...customMeal, name: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Description</label>
              <Input
                placeholder="Short description..."
                value={customMeal.description}
                onChange={(e) => setCustomMeal({ ...customMeal, description: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">Calories</label>
                <Input
                  type="number"
                  value={customMeal.calories}
                  onChange={(e) => setCustomMeal({ ...customMeal, calories: parseInt(e.target.value) || 0 })}
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">Prep (min)</label>
                <Input
                  type="number"
                  value={customMeal.prepTime}
                  onChange={(e) => setCustomMeal({ ...customMeal, prepTime: parseInt(e.target.value) || 0 })}
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">Cook (min)</label>
                <Input
                  type="number"
                  value={customMeal.cookTime}
                  onChange={(e) => setCustomMeal({ ...customMeal, cookTime: parseInt(e.target.value) || 0 })}
                />
              </div>
            </div>

            <Button onClick={handleAddCustomMeal} className="w-full" disabled={!customMeal.name.trim()}>
              <Plus className="w-4 h-4 mr-2" />
              Add Meal
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
