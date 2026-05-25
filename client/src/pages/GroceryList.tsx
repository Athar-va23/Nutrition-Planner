import { useState } from 'react';
import {
  ShoppingCart, Trash2, Plus, Sparkles, Check, ChefHat,
  Package, X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { localStore, type ShoppingCartItem, type MealPlanLocal } from '@/lib/localStore';

export function GroceryList() {
  const { toast } = useToast();
  const [cartItems, setCartItems] = useState<ShoppingCartItem[]>(localStore.getShoppingCart());
  const [checkedItems, setCheckedItems] = useState<Set<string>>(new Set());
  const [mealPlans] = useState<MealPlanLocal[]>(localStore.getMealPlans());
  const [selectedPlan, setSelectedPlan] = useState('');

  // Manual add
  const [newItemName, setNewItemName] = useState('');
  const [newItemAmount, setNewItemAmount] = useState('1');
  const [newItemUnit, setNewItemUnit] = useState('piece');

  const refreshCart = () => setCartItems(localStore.getShoppingCart());

  const handleToggleCheck = (name: string) => {
    setCheckedItems((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  };

  const handleRemoveItem = (name: string) => {
    localStore.removeFromShoppingCart(name);
    refreshCart();
    toast({ title: `Removed ${name}` });
  };

  const handleClearCart = () => {
    localStore.clearShoppingCart();
    setCheckedItems(new Set());
    refreshCart();
    toast({ title: 'Cart cleared' });
  };

  const handleClearChecked = () => {
    checkedItems.forEach((name) => localStore.removeFromShoppingCart(name));
    setCheckedItems(new Set());
    refreshCart();
    toast({ title: `${checkedItems.size} items cleared` });
  };

  const handleAddManual = () => {
    const name = newItemName.trim();
    if (!name) return;

    localStore.addToShoppingCart([{
      name,
      amount: parseFloat(newItemAmount) || 1,
      unit: newItemUnit,
      fromRecipes: ['Manual'],
    }]);
    setNewItemName('');
    setNewItemAmount('1');
    refreshCart();
    toast({ title: `Added ${name}` });
  };

  // Generate grocery list from a meal plan
  const handleGenerateFromPlan = () => {
    const plan = mealPlans.find((p) => p.id === selectedPlan);
    if (!plan) {
      toast({ variant: 'destructive', title: 'Select a meal plan' });
      return;
    }

    // Collect all ingredients from all meals across all days
    const ingredientMap = new Map<string, ShoppingCartItem>();

    for (const day of plan.days) {
      for (const meal of day.meals) {
        if (!meal.ingredients) continue;
        for (const ing of meal.ingredients) {
          const key = ing.name.toLowerCase();
          const existing = ingredientMap.get(key);
          if (existing && existing.unit === ing.unit) {
            existing.amount += ing.amount;
            if (!existing.fromRecipes.includes(meal.name)) {
              existing.fromRecipes.push(meal.name);
            }
          } else if (!existing) {
            ingredientMap.set(key, {
              name: ing.name,
              amount: ing.amount,
              unit: ing.unit,
              fromRecipes: [meal.name],
            });
          }
        }
      }
    }

    const items = Array.from(ingredientMap.values());
    if (items.length === 0) {
      toast({ variant: 'destructive', title: 'No ingredients found', description: 'This plan has no ingredient data. Try generating a new plan.' });
      return;
    }

    localStore.addToShoppingCart(items);
    refreshCart();
    setSelectedPlan('');
    toast({ title: `${items.length} ingredients added from "${plan.name}"` });
  };

  const checkedCount = checkedItems.size;
  const totalCount = cartItems.length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <Sparkles className="w-7 h-7 text-primary dash-sparkle" />
          Grocery List
        </h1>
        <p className="text-muted-foreground">Your shopping cart from recipes and meal plans</p>
      </div>

      {/* Generate from Meal Plan */}
      <Card className="glass-card border-primary/10">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <ChefHat className="w-5 h-5 text-primary" />
            Import from Meal Plan
          </CardTitle>
          <CardDescription>Pull all ingredients from a meal plan into your grocery list</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-3">
            <Select value={selectedPlan} onValueChange={setSelectedPlan}>
              <SelectTrigger className="flex-1 bg-background/50 border-primary/20">
                <SelectValue placeholder="Select a meal plan..." />
              </SelectTrigger>
              <SelectContent>
                {mealPlans.length === 0 ? (
                  <SelectItem value="_none" disabled>No meal plans yet</SelectItem>
                ) : (
                  mealPlans.map((plan) => (
                    <SelectItem key={plan.id} value={plan.id}>
                      {plan.name} ({plan.days.length} days · {plan.totalCalories.toLocaleString()} kcal)
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
            <Button
              onClick={handleGenerateFromPlan}
              disabled={!selectedPlan}
              className="gap-2"
            >
              <Plus className="w-4 h-4" />
              Import
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Add Manual Item */}
      <Card className="glass-card border-primary/10">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Plus className="w-5 h-5 text-primary" />
            Add Item
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Input
              placeholder="Item name..."
              value={newItemName}
              onChange={(e) => setNewItemName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAddManual()}
              className="flex-1 bg-background/50 border-primary/20"
            />
            <Input
              type="number"
              placeholder="Qty"
              value={newItemAmount}
              onChange={(e) => setNewItemAmount(e.target.value)}
              className="w-20 bg-background/50 border-primary/20"
            />
            <Select value={newItemUnit} onValueChange={setNewItemUnit}>
              <SelectTrigger className="w-24 bg-background/50 border-primary/20">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="piece">piece</SelectItem>
                <SelectItem value="g">g</SelectItem>
                <SelectItem value="kg">kg</SelectItem>
                <SelectItem value="ml">ml</SelectItem>
                <SelectItem value="cup">cup</SelectItem>
                <SelectItem value="tbsp">tbsp</SelectItem>
                <SelectItem value="tsp">tsp</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={handleAddManual} disabled={!newItemName.trim()}>
              Add
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Cart Items */}
      {totalCount === 0 ? (
        <Card className="text-center py-12 glass-card border-primary/10">
          <CardContent>
            <ShoppingCart className="w-12 h-12 mx-auto mb-4 text-muted-foreground/30" />
            <h3 className="text-lg font-medium mb-2">Your grocery list is empty</h3>
            <p className="text-muted-foreground text-sm mb-1">
              Add items from recipe missing ingredients or import from a meal plan above.
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card className="glass-card border-primary/10">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Package className="w-5 h-5 text-primary" />
                  Shopping List
                  <Badge variant="secondary" className="ml-2">{totalCount} items</Badge>
                </CardTitle>
                <CardDescription>
                  {checkedCount > 0
                    ? `${checkedCount} of ${totalCount} checked off`
                    : 'Check items as you shop'}
                </CardDescription>
              </div>
              <div className="flex gap-2">
                {checkedCount > 0 && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-1 text-xs border-green-500/20 text-green-400 hover:bg-green-500/10"
                    onClick={handleClearChecked}
                  >
                    <Check className="w-3 h-3" />
                    Clear {checkedCount} Checked
                  </Button>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1 text-xs border-destructive/20 text-destructive hover:bg-destructive/10"
                  onClick={handleClearCart}
                >
                  <Trash2 className="w-3 h-3" />
                  Clear All
                </Button>
              </div>
            </div>

            {/* Progress bar */}
            {totalCount > 0 && (
              <div className="flex items-center gap-2 text-sm mt-2">
                <div className="flex-1 bg-muted rounded-full h-2">
                  <div
                    className="bg-primary rounded-full h-2 transition-all duration-300"
                    style={{ width: `${(checkedCount / totalCount) * 100}%` }}
                  />
                </div>
                <span className="text-xs text-muted-foreground">
                  {checkedCount}/{totalCount}
                </span>
              </div>
            )}
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              {cartItems.map((item) => {
                const isChecked = checkedItems.has(item.name);
                return (
                  <div
                    key={item.name}
                    className={`flex items-center gap-3 p-2.5 rounded-lg transition-colors ${
                      isChecked ? 'bg-muted/20' : 'hover:bg-muted/40'
                    }`}
                  >
                    <Checkbox
                      checked={isChecked}
                      onCheckedChange={() => handleToggleCheck(item.name)}
                    />
                    <div className="flex-1 min-w-0">
                      <span className={`text-sm ${isChecked ? 'line-through text-muted-foreground' : 'font-medium'}`}>
                        {item.name}
                      </span>
                      <span className="text-xs text-muted-foreground ml-2">
                        {item.amount} {item.unit}
                      </span>
                      {item.fromRecipes.length > 0 && item.fromRecipes[0] !== 'Manual' && (
                        <div className="flex flex-wrap gap-1 mt-0.5">
                          {item.fromRecipes.map((r, i) => (
                            <Badge key={i} variant="outline" className="text-[9px] py-0 px-1 border-primary/15 text-muted-foreground">
                              {r}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                    <button
                      onClick={() => handleRemoveItem(item.name)}
                      className="p-1 rounded text-muted-foreground/40 hover:text-destructive transition-colors flex-shrink-0"
                      title="Remove"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
