import { useEffect, useRef, useState, useCallback } from 'react';
import {
  ChefHat,
  Calendar,
  ShoppingCart,
  Camera,
  BarChart3,
  Flame,
  Apple,
  Salad,
  Utensils,
  TrendingUp,
} from 'lucide-react';
import gsap from 'gsap';

/* ─── Slide Data ─── */
const slides = [
  {
    id: 'meal-plan',
    label: 'Meal Plans',
    icon: Calendar,
    gradient: 'from-emerald-500 to-teal-600',
    content: (
      <div className="space-y-3">
        <div className="flex items-center gap-2 mb-4">
          <Calendar className="w-5 h-5 text-emerald-400" />
          <span className="text-sm font-semibold text-white/90">Weekly Plan — Jan 20</span>
        </div>
        {[
          { meal: 'Breakfast', name: 'Avocado Toast & Eggs', cal: 420, time: '15 min' },
          { meal: 'Lunch', name: 'Grilled Chicken Bowl', cal: 580, time: '25 min' },
          { meal: 'Dinner', name: 'Salmon & Quinoa', cal: 640, time: '35 min' },
          { meal: 'Snack', name: 'Greek Yogurt Parfait', cal: 180, time: '5 min' },
        ].map((item, i) => (
          <div key={i} className="flex items-center gap-3 p-2.5 rounded-lg bg-white/10 backdrop-blur-sm">
            <div className="w-8 h-8 rounded-md bg-white/15 flex items-center justify-center shrink-0">
              <Utensils className="w-4 h-4 text-emerald-300" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs text-emerald-300/80 font-medium">{item.meal}</div>
              <div className="text-sm font-medium text-white truncate">{item.name}</div>
            </div>
            <div className="text-right shrink-0">
              <div className="text-xs font-bold text-white/90">{item.cal} cal</div>
              <div className="text-[10px] text-white/50">{item.time}</div>
            </div>
          </div>
        ))}
        <div className="mt-2 pt-3 border-t border-white/10 flex justify-between text-xs">
          <span className="text-white/50">Daily Total</span>
          <span className="font-bold text-emerald-300">1,820 / 2,000 kcal</span>
        </div>
      </div>
    ),
  },
  {
    id: 'nutrition',
    label: 'Nutrition',
    icon: BarChart3,
    gradient: 'from-blue-500 to-indigo-600',
    content: (
      <div className="space-y-4">
        <div className="flex items-center gap-2 mb-2">
          <BarChart3 className="w-5 h-5 text-blue-300" />
          <span className="text-sm font-semibold text-white/90">Daily Nutrition</span>
        </div>
        {[
          { label: 'Protein', value: 142, max: 180, color: 'bg-blue-400', pct: 79 },
          { label: 'Carbs', value: 198, max: 250, color: 'bg-emerald-400', pct: 79 },
          { label: 'Fat', value: 67, max: 85, color: 'bg-amber-400', pct: 79 },
          { label: 'Fiber', value: 28, max: 35, color: 'bg-purple-400', pct: 80 },
        ].map((macro, i) => (
          <div key={i}>
            <div className="flex justify-between text-xs mb-1.5">
              <span className="text-white/70 font-medium">{macro.label}</span>
              <span className="text-white font-bold tabular-nums">{macro.value}g <span className="text-white/40 font-normal">/ {macro.max}g</span></span>
            </div>
            <div className="h-2 rounded-full bg-white/10 overflow-hidden">
              <div
                className={`h-full rounded-full ${macro.color} transition-all duration-1000`}
                style={{ width: `${macro.pct}%` }}
              />
            </div>
          </div>
        ))}
        <div className="grid grid-cols-3 gap-2 mt-3">
          {[
            { label: 'Calories', value: '1,820', icon: Flame },
            { label: 'Water', value: '2.4L', icon: Apple },
            { label: 'Score', value: 'A+', icon: TrendingUp },
          ].map((stat, i) => {
            const Icon = stat.icon;
            return (
              <div key={i} className="text-center p-2.5 rounded-lg bg-white/8">
                <Icon className="w-4 h-4 mx-auto mb-1 text-blue-300/80" />
                <div className="text-sm font-bold text-white">{stat.value}</div>
                <div className="text-[10px] text-white/40">{stat.label}</div>
              </div>
            );
          })}
        </div>
      </div>
    ),
  },
  {
    id: 'recipes',
    label: 'Recipes',
    icon: ChefHat,
    gradient: 'from-amber-500 to-orange-600',
    content: (
      <div className="space-y-3">
        <div className="flex items-center gap-2 mb-2">
          <ChefHat className="w-5 h-5 text-amber-300" />
          <span className="text-sm font-semibold text-white/90">Recipe Suggestions</span>
        </div>
        {[
          { name: 'Garlic Chicken Stir-Fry', match: 95, time: '25 min', difficulty: 'Easy' },
          { name: 'Mediterranean Bowl', match: 88, time: '30 min', difficulty: 'Easy' },
          { name: 'Thai Basil Salmon', match: 82, time: '35 min', difficulty: 'Medium' },
        ].map((recipe, i) => (
          <div key={i} className="p-3 rounded-lg bg-white/10 backdrop-blur-sm">
            <div className="flex justify-between items-start mb-2">
              <span className="text-sm font-medium text-white">{recipe.name}</span>
              <span className="text-xs font-bold text-amber-300 bg-amber-400/15 px-2 py-0.5 rounded-full">
                {recipe.match}%
              </span>
            </div>
            <div className="flex gap-3 text-[10px] text-white/50">
              <span>{recipe.time}</span>
              <span>·</span>
              <span>{recipe.difficulty}</span>
              <span>·</span>
              <span>4 ingredients match</span>
            </div>
          </div>
        ))}
        <div className="p-2.5 rounded-lg border border-dashed border-white/20 text-center">
          <Salad className="w-5 h-5 mx-auto mb-1 text-amber-300/60" />
          <span className="text-xs text-white/40">Based on your fridge contents</span>
        </div>
      </div>
    ),
  },
  {
    id: 'scanner',
    label: 'Scanner',
    icon: Camera,
    gradient: 'from-violet-500 to-purple-600',
    content: (
      <div className="space-y-3">
        <div className="flex items-center gap-2 mb-2">
          <Camera className="w-5 h-5 text-violet-300" />
          <span className="text-sm font-semibold text-white/90">Fridge Scanner</span>
        </div>
        {/* Simulated scan result */}
        <div className="relative rounded-lg bg-white/5 p-3 border border-white/10">
          <div className="grid grid-cols-4 gap-2 mb-3">
            {['Tomato', 'Eggs', 'Spinach', 'Chicken', 'Milk', 'Garlic', 'Rice', 'Onion'].map((item, i) => (
              <div key={i} className="text-center">
                <div className="w-10 h-10 mx-auto rounded-lg bg-white/10 flex items-center justify-center mb-1">
                  <span className="text-lg">{['🍅', '🥚', '🥬', '🍗', '🥛', '🧄', '🍚', '🧅'][i]}</span>
                </div>
                <span className="text-[9px] text-white/60 leading-none">{item}</span>
              </div>
            ))}
          </div>
          <div className="flex items-center gap-2 p-2 rounded-md bg-violet-400/15">
            <div className="w-2 h-2 rounded-full bg-violet-400 animate-pulse" />
            <span className="text-xs text-violet-200 font-medium">8 ingredients detected</span>
            <span className="text-[10px] text-white/40 ml-auto">98% confidence</span>
          </div>
        </div>
        <div className="text-center pt-1">
          <span className="text-xs text-white/50">12 recipes possible with these ingredients</span>
        </div>
      </div>
    ),
  },
  {
    id: 'grocery',
    label: 'Grocery',
    icon: ShoppingCart,
    gradient: 'from-rose-500 to-pink-600',
    content: (
      <div className="space-y-3">
        <div className="flex items-center gap-2 mb-2">
          <ShoppingCart className="w-5 h-5 text-rose-300" />
          <span className="text-sm font-semibold text-white/90">Smart Grocery List</span>
        </div>
        {[
          { category: 'Produce', items: ['Broccoli 400g', 'Mixed Berries 700g', 'Avocados x3'] },
          { category: 'Proteins', items: ['Chicken Breast 900g', 'Salmon Fillet 500g'] },
          { category: 'Dairy', items: ['Greek Yogurt 1.4kg', 'Feta Cheese 200g'] },
        ].map((group, i) => (
          <div key={i}>
            <div className="text-[10px] font-bold uppercase tracking-wider text-white/40 mb-1.5">{group.category}</div>
            {group.items.map((item, j) => (
              <div key={j} className="flex items-center gap-2 py-1.5 px-2 rounded-md hover:bg-white/5 transition-colors">
                <div className="w-4 h-4 rounded border border-white/30 shrink-0" />
                <span className="text-sm text-white/80">{item}</span>
              </div>
            ))}
          </div>
        ))}
        <div className="flex justify-between items-center pt-2 border-t border-white/10 text-xs">
          <span className="text-white/40">Estimated cost</span>
          <span className="font-bold text-rose-300">$45 — $65</span>
        </div>
      </div>
    ),
  },
];

/* ─── 3D Carousel Component ─── */
export function Hero3DCarousel() {
  const carouselRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const dragStartX = useRef(0);
  const dragStartRotation = useRef(0);
  const currentRotation = useRef(0);
  const autoplayRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const totalSlides = slides.length;
  const anglePerSlide = 360 / totalSlides;

  const goToSlide = useCallback(
    (index: number, instant = false) => {
      const targetRotation = -index * anglePerSlide;
      currentRotation.current = targetRotation;
      setActiveIndex(((index % totalSlides) + totalSlides) % totalSlides);

      if (trackRef.current) {
        gsap.to(trackRef.current, {
          rotateY: targetRotation,
          duration: instant ? 0 : 0.8,
          ease: 'power3.out',
        });
      }
    },
    [anglePerSlide, totalSlides]
  );

  const nextSlide = useCallback(() => {
    goToSlide(activeIndex + 1);
  }, [activeIndex, goToSlide]);

  const prevSlide = useCallback(() => {
    goToSlide(activeIndex - 1);
  }, [activeIndex, goToSlide]);

  /* Autoplay */
  useEffect(() => {
    autoplayRef.current = setInterval(nextSlide, 4000);
    return () => {
      if (autoplayRef.current) clearInterval(autoplayRef.current);
    };
  }, [nextSlide]);

  const pauseAutoplay = () => {
    if (autoplayRef.current) clearInterval(autoplayRef.current);
  };
  const resumeAutoplay = () => {
    if (autoplayRef.current) clearInterval(autoplayRef.current);
    autoplayRef.current = setInterval(nextSlide, 4000);
  };

  /* Mouse/Touch drag */
  const handlePointerDown = (e: React.PointerEvent) => {
    setIsDragging(true);
    dragStartX.current = e.clientX;
    dragStartRotation.current = currentRotation.current;
    pauseAutoplay();
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging || !trackRef.current) return;
    const deltaX = e.clientX - dragStartX.current;
    const sensitivity = 0.3;
    const newRotation = dragStartRotation.current + deltaX * sensitivity;
    currentRotation.current = newRotation;
    gsap.set(trackRef.current, { rotateY: newRotation });
  };

  const handlePointerUp = () => {
    if (!isDragging) return;
    setIsDragging(false);

    // Snap to nearest slide
    const rawIndex = Math.round(-currentRotation.current / anglePerSlide);
    const snappedIndex = ((rawIndex % totalSlides) + totalSlides) % totalSlides;
    goToSlide(snappedIndex);
    resumeAutoplay();
  };

  /* Keyboard */
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') nextSlide();
      if (e.key === 'ArrowLeft') prevSlide();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [nextSlide, prevSlide]);

  /* Entrance animation */
  useEffect(() => {
    if (!carouselRef.current) return;
    gsap.from(carouselRef.current, {
      opacity: 0,
      scale: 0.85,
      rotateY: 25,
      duration: 1.4,
      ease: 'power3.out',
      delay: 0.6,
    });
  }, []);

  return (
    <div className="hero-visual relative w-full z-10" ref={carouselRef}>
      {/* 3D Scene */}
      <div
        className="relative mx-auto select-none"
        style={{
          perspective: '1200px',
          perspectiveOrigin: '50% 40%',
          height: '480px',
          width: '100%',
          maxWidth: '520px',
        }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
      >
        {/* Rotating track */}
        <div
          ref={trackRef}
          className="absolute inset-0"
          style={{
            transformStyle: 'preserve-3d',
            transform: `rotateY(0deg)`,
            transition: isDragging ? 'none' : undefined,
          }}
        >
          {slides.map((slide, i) => {
            const angle = i * anglePerSlide;
            const radius = 300;
            // Explicit opaque background colors per slide
            const bgColors: Record<string, string> = {
              'meal-plan': 'linear-gradient(135deg, #059669, #0d9488)',
              'nutrition': 'linear-gradient(135deg, #3b82f6, #4f46e5)',
              'recipes': 'linear-gradient(135deg, #f59e0b, #ea580c)',
              'scanner': 'linear-gradient(135deg, #8b5cf6, #9333ea)',
              'grocery': 'linear-gradient(135deg, #f43f5e, #ec4899)',
            };
            return (
              <div
                key={slide.id}
                className="absolute inset-0 flex items-center justify-center"
                style={{
                  transformStyle: 'preserve-3d',
                  transform: `rotateY(${angle}deg) translateZ(${radius}px)`,
                }}
              >
                <div
                  className="w-[320px] rounded-2xl p-6 cursor-grab active:cursor-grabbing"
                  style={{
                    backfaceVisibility: 'hidden',
                    background: bgColors[slide.id],
                    boxShadow: '0 10px 50px -5px rgba(0,0,0,0.6), 0 0 25px 0px rgba(16,185,129,0.2)',
                    border: '1px solid rgba(255,255,255,0.25)',
                    opacity: 1,
                  }}
                >
                  {slide.content}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Navigation dots */}
      <div className="flex items-center justify-center gap-2 mt-6">
        {slides.map((slide, i) => {
          const Icon = slide.icon;
          const isActive = i === activeIndex;
          return (
            <button
              key={slide.id}
              onClick={() => {
                goToSlide(i);
                pauseAutoplay();
                resumeAutoplay();
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-300 ${
                isActive
                  ? 'bg-foreground/10 text-foreground scale-105'
                  : 'text-muted-foreground hover:text-foreground/70 hover:bg-foreground/5'
              }`}
              aria-label={`Go to ${slide.label}`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span className={`transition-all duration-300 ${isActive ? 'max-w-[60px] opacity-100' : 'max-w-0 opacity-0 overflow-hidden'}`}>
                {slide.label}
              </span>
            </button>
          );
        })}
      </div>

      {/* Drag hint */}
      <p className="text-center text-[11px] text-muted-foreground/50 mt-3 select-none">
        Drag to explore · Auto-rotates
      </p>
    </div>
  );
}
