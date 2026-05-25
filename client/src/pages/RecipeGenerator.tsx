import { useState } from 'react';
import {
  ChefHat, Plus, X, Loader2, Clock, Users, Sparkles, BookOpen,
  AlertCircle, ShoppingCart, CalendarPlus, Check,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { generateRecipes, hasGroqKey } from '@/lib/groqClient';
import { localStore, type RecipeLocal, type MealLocal, type MealPlanLocal } from '@/lib/localStore';

export function RecipeGenerator() {
  const { toast } = useToast();
  const [ingredients, setIngredients] = useState<string[]>([]);
  const [newIngredient, setNewIngredient] = useState('');
  const [recipes, setRecipes] = useState<RecipeLocal[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [expandedRecipe, setExpandedRecipe] = useState<string | null>(null);
  const [cartAdded, setCartAdded] = useState<Set<string>>(new Set());

  // Add-to-plan dialog state
  const [planDialogOpen, setPlanDialogOpen] = useState(false);
  const [planDialogRecipe, setPlanDialogRecipe] = useState<RecipeLocal | null>(null);
  const [selectedPlanId, setSelectedPlanId] = useState('');
  const [selectedDay, setSelectedDay] = useState('1');
  const [selectedMealType, setSelectedMealType] = useState('lunch');

  const addIngredient = () => {
    const val = newIngredient.trim().toLowerCase();
    if (val && !ingredients.includes(val)) {
      setIngredients([...ingredients, val]);
      setNewIngredient('');
    }
  };

  const removeIngredient = (ing: string) => {
    setIngredients(ingredients.filter((i) => i !== ing));
  };

  const handleGenerate = async () => {
    if (ingredients.length === 0) {
      toast({ variant: 'destructive', title: 'No ingredients', description: 'Add at least one ingredient' });
      return;
    }
    if (!hasGroqKey()) {
      toast({ variant: 'destructive', title: 'API Key Required', description: 'Set up your Groq API key in the Dashboard first.' });
      return;
    }

    setIsGenerating(true);
    setCartAdded(new Set());
    try {
      const result = await generateRecipes(ingredients);
      setRecipes(result);
      if (result.length === 0) {
        toast({ title: 'No recipes found', description: 'Try different ingredients.' });
      }
    } catch (error: any) {
      const msg = error.message === 'RATE_LIMITED'
        ? 'Rate limited — wait a moment and try again.'
        : error.message === 'GROQ_KEY_MISSING'
        ? 'Set up your Groq API key in the Dashboard first.'
        : 'Failed to generate recipes. Please try again.';
      toast({ variant: 'destructive', title: 'Error', description: msg });
    } finally {
      setIsGenerating(false);
    }
  };

  // ── Cart Actions ──
  const handleAddToCart = (recipe: RecipeLocal, ingredient: RecipeLocal['ingredients'][0]) => {
    localStore.addToShoppingCart([{
      name: ingredient.name,
      amount: ingredient.amount,
      unit: ingredient.unit,
      fromRecipes: [recipe.name],
    }]);
    setCartAdded(prev => new Set(prev).add(`${recipe.id}-${ingredient.name}`));
    toast({ title: `Added ${ingredient.name} to cart`, description: `From: ${recipe.name}` });
  };

  const handleAddAllMissing = (recipe: RecipeLocal) => {
    const missing = recipe.ingredients.filter(i => !i.original);
    if (missing.length === 0) return;

    localStore.addToShoppingCart(
      missing.map(i => ({
        name: i.name,
        amount: i.amount,
        unit: i.unit,
        fromRecipes: [recipe.name],
      }))
    );

    const newAdded = new Set(cartAdded);
    missing.forEach(i => newAdded.add(`${recipe.id}-${i.name}`));
    setCartAdded(newAdded);
    toast({ title: `${missing.length} items added to cart`, description: `Missing ingredients from ${recipe.name}` });
  };

  // ── Add to Meal Plan ──
  const openPlanDialog = (recipe: RecipeLocal) => {
    setPlanDialogRecipe(recipe);
    const plans = localStore.getMealPlans();
    setSelectedPlanId(plans[0]?.id || '');
    setSelectedDay('1');
    setSelectedMealType('lunch');
    setPlanDialogOpen(true);
  };

  const handleAddToPlan = () => {
    if (!planDialogRecipe || !selectedPlanId) {
      toast({ variant: 'destructive', title: 'Select a meal plan' });
      return;
    }

    const meal: MealLocal = {
      type: selectedMealType,
      name: planDialogRecipe.name,
      description: planDialogRecipe.description,
      calories: planDialogRecipe.calories,
      prepTime: planDialogRecipe.prepTime,
      cookTime: planDialogRecipe.cookTime,
      servings: planDialogRecipe.servings,
      nutrition: planDialogRecipe.nutrition,
      ingredients: planDialogRecipe.ingredients.map(i => ({ name: i.name, amount: i.amount, unit: i.unit })),
      instructions: planDialogRecipe.instructions,
    };

    localStore.addMealToPlan(selectedPlanId, parseInt(selectedDay), meal);
    setPlanDialogOpen(false);
    toast({ title: '✓ Recipe added to meal plan!', description: `${planDialogRecipe.name} → Day ${selectedDay} (${selectedMealType})` });
  };

  const handleCreateNewPlanAndAdd = () => {
    if (!planDialogRecipe) return;

    const newPlan: MealPlanLocal = {
      id: crypto.randomUUID(),
      name: `Custom Plan – ${new Date().toLocaleDateString()}`,
      duration: 'daily',
      createdAt: new Date().toISOString(),
      totalCalories: 0,
      days: [],
    };
    localStore.saveMealPlan(newPlan);
    setSelectedPlanId(newPlan.id);
    toast({ title: 'New plan created!', description: 'Now select the day and meal type, then click Add.' });
  };

  const mealPlans = localStore.getMealPlans();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <Sparkles className="w-7 h-7 text-primary dash-sparkle" />
          Recipe Lab
        </h1>
        <p className="text-muted-foreground">
          Enter ingredients you have and get AI-crafted recipe suggestions
        </p>
      </div>

      {/* Ingredient Input */}
      <Card className="glass-card border-primary/10">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <ChefHat className="w-5 h-5 text-primary" />
            Your Ingredients
          </CardTitle>
          <CardDescription>Add what you have — AI will create recipes from them</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder="e.g., chicken breast, tomatoes, rice..."
              value={newIngredient}
              onChange={(e) => setNewIngredient(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addIngredient()}
              className="bg-background/50 border-primary/20"
            />
            <Button onClick={addIngredient} variant="outline" className="border-primary/20">
              <Plus className="w-4 h-4" />
            </Button>
          </div>

          {ingredients.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {ingredients.map((ing) => (
                <Badge key={ing} variant="secondary" className="gap-1 pr-1 bg-primary/10 border-primary/20 text-primary">
                  {ing}
                  <button
                    onClick={() => removeIngredient(ing)}
                    className="ml-1 hover:bg-primary/20 rounded-full p-0.5 transition-colors"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </Badge>
              ))}
            </div>
          )}

          {!hasGroqKey() && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-sm">
              <AlertCircle className="w-4 h-4 text-destructive flex-shrink-0" />
              <span>Set up your Groq API key in the Dashboard to enable recipe generation.</span>
            </div>
          )}

          <Button
            onClick={handleGenerate}
            className="w-full"
            disabled={isGenerating || ingredients.length === 0 || !hasGroqKey()}
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Crafting Recipes...
              </>
            ) : (
              <>
                <ChefHat className="w-4 h-4 mr-2" />
                Generate Recipes
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Recipe Results */}
      {recipes.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-primary" />
            AI-Crafted Recipes
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {recipes.map((recipe) => {
              const isExpanded = expandedRecipe === recipe.id;
              const missingCount = recipe.ingredients.filter(i => !i.original).length;
              const allMissingAdded = recipe.ingredients
                .filter(i => !i.original)
                .every(i => cartAdded.has(`${recipe.id}-${i.name}`));

              return (
                <Card key={recipe.id} className="flex flex-col glass-card border-primary/10 hover:border-primary/25 transition-colors">
                  <CardHeader>
                    <CardTitle className="text-lg">{recipe.name}</CardTitle>
                    <CardDescription className="line-clamp-3">{recipe.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="flex-1 space-y-4">
                    {/* Stats */}
                    <div className="flex flex-wrap gap-3 text-sm">
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <Clock className="w-4 h-4" />
                        {recipe.prepTime + recipe.cookTime} min
                      </div>
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <Users className="w-4 h-4" />
                        {recipe.servings} servings
                      </div>
                      <Badge variant="outline" className="border-primary/20">{recipe.difficulty}</Badge>
                    </div>

                    {/* Nutrition */}
                    <div className="grid grid-cols-4 gap-2 text-center text-sm">
                      <div className="bg-muted/50 rounded-lg p-2">
                        <div className="font-bold">{recipe.calories}</div>
                        <div className="text-[10px] text-muted-foreground uppercase tracking-wider">cal</div>
                      </div>
                      <div className="bg-muted/50 rounded-lg p-2">
                        <div className="font-bold">{recipe.nutrition.protein}g</div>
                        <div className="text-[10px] text-muted-foreground uppercase tracking-wider">protein</div>
                      </div>
                      <div className="bg-muted/50 rounded-lg p-2">
                        <div className="font-bold">{recipe.nutrition.carbs}g</div>
                        <div className="text-[10px] text-muted-foreground uppercase tracking-wider">carbs</div>
                      </div>
                      <div className="bg-muted/50 rounded-lg p-2">
                        <div className="font-bold">{recipe.nutrition.fat}g</div>
                        <div className="text-[10px] text-muted-foreground uppercase tracking-wider">fat</div>
                      </div>
                    </div>

                    {/* Ingredients */}
                    <div>
                      <h4 className="font-medium text-sm mb-2">Ingredients</h4>
                      <ul className="text-sm space-y-1.5">
                        {recipe.ingredients.slice(0, isExpanded ? undefined : 5).map((ing, i) => {
                          const isAdded = cartAdded.has(`${recipe.id}-${ing.name}`);
                          return (
                            <li
                              key={i}
                              className={`flex items-center gap-2 ${
                                ing.original ? 'text-foreground' : 'text-muted-foreground'
                              }`}
                            >
                              <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${ing.original ? 'bg-primary' : 'bg-orange-400/60'}`} />
                              <span className="flex-1">
                                {ing.amount} {ing.unit} {ing.name}
                              </span>
                              {!ing.original && (
                                <>
                                  <Badge variant="outline" className="text-[10px] py-0 px-1 border-orange-500/30 text-orange-400 flex-shrink-0">
                                    needed
                                  </Badge>
                                  <button
                                    onClick={() => handleAddToCart(recipe, ing)}
                                    disabled={isAdded}
                                    className={`p-1 rounded transition-colors flex-shrink-0 ${
                                      isAdded
                                        ? 'text-green-400 cursor-default'
                                        : 'text-muted-foreground hover:text-primary hover:bg-primary/10'
                                    }`}
                                    title={isAdded ? 'Added to cart' : 'Add to shopping cart'}
                                  >
                                    {isAdded ? <Check className="w-3.5 h-3.5" /> : <ShoppingCart className="w-3.5 h-3.5" />}
                                  </button>
                                </>
                              )}
                            </li>
                          );
                        })}
                        {!isExpanded && recipe.ingredients.length > 5 && (
                          <li className="text-muted-foreground text-xs">
                            +{recipe.ingredients.length - 5} more
                          </li>
                        )}
                      </ul>

                      {/* Add All Missing to Cart */}
                      {isExpanded && missingCount > 0 && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="mt-3 w-full border-orange-500/20 text-orange-400 hover:bg-orange-500/10 text-xs"
                          onClick={() => handleAddAllMissing(recipe)}
                          disabled={allMissingAdded}
                        >
                          {allMissingAdded ? (
                            <><Check className="w-3 h-3 mr-1" /> All Missing Added</>
                          ) : (
                            <><ShoppingCart className="w-3 h-3 mr-1" /> Add All {missingCount} Missing to Cart</>
                          )}
                        </Button>
                      )}
                    </div>

                    {/* Instructions (expanded) */}
                    {isExpanded && recipe.instructions.length > 0 && (
                      <div>
                        <h4 className="font-medium text-sm mb-2">Instructions</h4>
                        <ol className="text-sm space-y-3 list-none">
                          {recipe.instructions.map((step, i) => (
                            <li key={i} className="flex gap-3">
                              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center">
                                {i + 1}
                              </span>
                              <span className="text-muted-foreground leading-relaxed">{step}</span>
                            </li>
                          ))}
                        </ol>
                      </div>
                    )}

                    {/* Tips (expanded) */}
                    {isExpanded && recipe.tips && recipe.tips.length > 0 && (
                      <div className="bg-primary/5 rounded-lg p-3 border border-primary/10">
                        <h4 className="font-medium text-sm mb-1 text-primary">💡 Pro Tips</h4>
                        <ul className="text-xs text-muted-foreground space-y-1">
                          {recipe.tips.map((tip, i) => <li key={i}>• {tip}</li>)}
                        </ul>
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div className="space-y-2 pt-1">
                      <Button
                        variant="outline"
                        className="w-full border-primary/20"
                        onClick={() => setExpandedRecipe(isExpanded ? null : recipe.id)}
                      >
                        {isExpanded ? 'Collapse' : 'View Full Recipe'}
                      </Button>

                      <Button
                        variant="outline"
                        className="w-full border-green-500/20 text-green-400 hover:bg-green-500/10"
                        onClick={() => openPlanDialog(recipe)}
                      >
                        <CalendarPlus className="w-4 h-4 mr-2" />
                        Add to Meal Plan
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* Add to Meal Plan Dialog */}
      <Dialog open={planDialogOpen} onOpenChange={setPlanDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Recipe to Meal Plan</DialogTitle>
          </DialogHeader>
          {planDialogRecipe && (
            <div className="space-y-4 py-2">
              <div className="bg-muted/30 rounded-lg p-3 border border-primary/10">
                <p className="font-medium text-sm">{planDialogRecipe.name}</p>
                <p className="text-xs text-muted-foreground">{planDialogRecipe.calories} kcal · {planDialogRecipe.prepTime + planDialogRecipe.cookTime} min</p>
              </div>

              {mealPlans.length === 0 ? (
                <div className="text-center py-4 space-y-3">
                  <p className="text-sm text-muted-foreground">No meal plans yet.</p>
                  <Button onClick={handleCreateNewPlanAndAdd} className="gap-2">
                    <Plus className="w-4 h-4" /> Create New Plan
                  </Button>
                </div>
              ) : (
                <>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Meal Plan</label>
                    <Select value={selectedPlanId} onValueChange={setSelectedPlanId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a plan" />
                      </SelectTrigger>
                      <SelectContent>
                        {mealPlans.map(p => (
                          <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Day</label>
                      <Select value={selectedDay} onValueChange={setSelectedDay}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {Array.from({ length: 14 }, (_, i) => (
                            <SelectItem key={i + 1} value={String(i + 1)}>Day {i + 1}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium">Meal Type</label>
                      <Select value={selectedMealType} onValueChange={setSelectedMealType}>
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
                  </div>

                  <div className="flex gap-2">
                    <Button onClick={handleAddToPlan} className="flex-1">
                      <CalendarPlus className="w-4 h-4 mr-2" /> Add to Plan
                    </Button>
                    <Button variant="outline" onClick={handleCreateNewPlanAndAdd} className="border-primary/20">
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                </>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
