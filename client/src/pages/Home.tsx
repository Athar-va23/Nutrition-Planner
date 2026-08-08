import { useEffect, useRef, lazy, Suspense } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, ChefHat, Calendar, ShoppingCart, Bot, BarChart3, Star, Check, Zap, Shield, Sparkles } from 'lucide-react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const HeroCanvas = lazy(() => import('@/components/HeroCanvas').then(m => ({ default: m.HeroCanvas })));

const features = [
  { icon: Calendar, title: 'AI Meal Plans', desc: 'Personalized weekly plans adapting to your goals, macros, and food preferences.', color: '#4ade80' },
  { icon: ChefHat, title: 'Smart Recipes', desc: 'Get chef-grade recipes in seconds based on your goals and preferences.', color: '#a3e635' },
  { icon: ShoppingCart, title: 'Grocery Lists', desc: 'Auto-generated, aisle-sorted shopping lists synced to your meal plan.', color: '#2dd4bf' },
  { icon: Bot, title: 'NutriAI Coach', desc: '24/7 science-backed nutrition guidance from your personal AI concierge.', color: '#a3e635' },
  { icon: BarChart3, title: 'Macro Tracking', desc: 'Beautiful real-time dashboards showing daily nutrition and progress toward goals.', color: '#2dd4bf' },
];

const steps = [
  { num: '01', icon: Shield, title: 'Build Your Profile', desc: 'Set goals, dietary preferences, and restrictions. The AI learns your biology.', img: 'https://images.unsplash.com/photo-1505576399279-565b52d4ac71?w=600&q=80' },
  { num: '02', icon: Sparkles, title: 'Generate Your Plan', desc: 'Receive a complete, balanced weekly plan with macros calculated to the gram.', img: 'https://images.unsplash.com/photo-1543339308-43e59d6b73a6?w=600&q=80' },
  { num: '03', icon: Zap, title: 'Cook & Dominate', desc: 'Follow step-by-step recipes, auto-shop, and track results in real time.', img: 'https://images.unsplash.com/photo-1466637574441-749b8f19452f?w=600&q=80' },
];

const testimonials = [
  { name: 'Sarah Chen', role: 'Fitness Coach', text: 'The first AI planner that actually understands macro cycling. My clients are obsessed.', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&q=80' },
  { name: 'Marcus Williams', role: 'Home Cook', text: 'Zero food waste. Better meals than I ever made. This app transformed my kitchen.', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&q=80' },
  { name: 'Dr. Priya Sharma', role: 'Nutritionist', text: 'I recommend this to every client. AI-generated plans aligned with clinical guidelines.', avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=100&q=80' },
];

const plans = [
  { name: 'Free', price: '$0', period: '/forever', desc: 'Start your journey, zero cost.', features: ['3 meal plans/month', 'Basic macro tracking', 'NutriAI chat (50/day)', '10 recipe generations'], cta: 'Get Started', featured: false },
  { name: 'Pro', price: '$9', period: '/month', desc: 'Unlock unlimited intelligence.', features: ['Unlimited meal plans', 'Advanced analytics', 'Unlimited AI chat', 'PDF export'], cta: 'Start Free Trial', featured: true },
  { name: 'Team', price: '$24', period: '/month', desc: 'For families and coaches.', features: ['Everything in Pro', 'Up to 6 profiles', 'Shared grocery lists', 'Coach dashboard', 'API access'], cta: 'Contact Sales', featured: false },
];

const stats = [
  { value: '50K+', label: 'Active Users' },
  { value: '2M+', label: 'Meals Generated' },
  { value: '98%', label: 'Satisfaction Rate' },
  { value: '$0', label: 'AI Cost / Month' },
];

export function Home() {
  const navRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const nav = navRef.current;
    if (!nav) return;

    // Nav scroll effect
    const handleScroll = () => {
      if (window.scrollY > 50) nav.classList.add('scrolled');
      else nav.classList.remove('scrolled');
    };
    window.addEventListener('scroll', handleScroll, { passive: true });

    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced) return () => window.removeEventListener('scroll', handleScroll);

    const ctx = gsap.context(() => {
      // Hero text
      gsap.fromTo('.hero-line',
        { y: 80, opacity: 0 },
        { y: 0, opacity: 1, duration: 1.1, stagger: 0.12, ease: 'power4.out', delay: 0.3 }
      );
      gsap.fromTo('.hero-sub',
        { y: 30, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.9, ease: 'power3.out', delay: 0.7 }
      );
      gsap.fromTo('.hero-ctas',
        { y: 20, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.8, ease: 'power3.out', delay: 0.9 }
      );
      gsap.fromTo('.hero-stats',
        { y: 20, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.8, stagger: 0.08, ease: 'power3.out', delay: 1.1 }
      );

      // Reveals on scroll
      gsap.utils.toArray<HTMLElement>('.reveal').forEach(el => {
        gsap.fromTo(el, { y: 50, opacity: 0 }, {
          y: 0, opacity: 1, duration: 0.9, ease: 'power3.out',
          scrollTrigger: { trigger: el, start: 'top 85%', once: true }
        });
      });

      // Feature cards stagger
      gsap.fromTo('.feat-card',
        { y: 60, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.8, stagger: 0.08, ease: 'power3.out',
          scrollTrigger: { trigger: '#features', start: 'top 75%', once: true } }
      );

      // Stats counter feel
      gsap.fromTo('.hero-stats .stat-num',
        { scale: 0.7, opacity: 0 },
        { scale: 1, opacity: 1, duration: 0.6, stagger: 0.1, ease: 'back.out(1.5)',
          scrollTrigger: { trigger: '.stats-section', start: 'top 80%', once: true } }
      );

      // Step cards
      gsap.fromTo('.step-card',
        { x: -40, opacity: 0 },
        { x: 0, opacity: 1, duration: 0.8, stagger: 0.15, ease: 'power3.out',
          scrollTrigger: { trigger: '#how', start: 'top 75%', once: true } }
      );

      // Testimonials
      gsap.fromTo('.testi-card',
        { y: 40, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.8, stagger: 0.12, ease: 'power3.out',
          scrollTrigger: { trigger: '#testimonials', start: 'top 80%', once: true } }
      );

      // Pricing
      gsap.fromTo('.price-card',
        { y: 50, opacity: 0, scale: 0.97 },
        { y: 0, opacity: 1, scale: 1, duration: 0.8, stagger: 0.1, ease: 'power3.out',
          scrollTrigger: { trigger: '#pricing', start: 'top 80%', once: true } }
      );
    });

    return () => {
      ctx.revert();
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  return (
    <div className="noise relative min-h-screen bg-[rgb(10,10,14)] text-[rgb(248,250,252)] overflow-x-hidden">

      {/* ── Navbar ── */}
      <nav ref={navRef} className="landing-nav px-6 py-4 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#4ade80] to-[#a3e635] flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-[rgb(10,10,14)]" />
          </div>
          <span className="font-bold text-lg tracking-tight">NutriPro</span>
        </Link>
        <div className="hidden md:flex items-center gap-8 text-sm text-[rgb(148,163,184)]">
          <a href="#features" className="hover:text-white transition-colors">Features</a>
          <a href="#how" className="hover:text-white transition-colors">How it works</a>
          <a href="#pricing" className="hover:text-white transition-colors">Pricing</a>
        </div>
        <div className="flex items-center gap-3">
          <Link to="/login" className="hidden md:block text-sm text-[rgb(148,163,184)] hover:text-white transition-colors">Sign In</Link>
          <Link to="/login" className="btn-primary !py-2 !px-5 !text-xs">Get Started</Link>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="relative min-h-screen flex flex-col items-center justify-center px-6 pt-20 overflow-hidden">
        {/* 3D Canvas */}
        <div id="hero-canvas-wrap" className="absolute inset-0 pointer-events-none">
          <Suspense fallback={null}>
            <HeroCanvas />
          </Suspense>
        </div>

        {/* Background orbs */}
        <div className="orb orb-green w-[600px] h-[600px] -top-32 -left-32 opacity-40" />
        <div className="orb orb-teal w-[400px] h-[400px] top-1/2 -right-20 opacity-30" style={{ animationDelay: '4s' }} />

        {/* Hero content */}
        <div className="relative z-10 text-center max-w-5xl mx-auto">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass border border-[rgba(74,222,128,0.2)] text-xs font-semibold text-[#4ade80] uppercase tracking-widest mb-8 hero-line">
            <span className="w-2 h-2 rounded-full bg-[#4ade80] animate-pulse" />
            AI-Powered Nutrition · Free to Start
          </div>

          <h1 className="hero-line text-[clamp(3rem,9vw,8rem)] font-extrabold leading-[0.9] tracking-[-0.04em] mb-6">
            Eat Like a<br />
            <span className="text-gradient-green">Scientist.</span>
          </h1>

          <p className="hero-sub text-xl md:text-2xl text-[rgb(148,163,184)] max-w-2xl mx-auto leading-relaxed mb-10">
            NutriPro turns cutting-edge AI into your personal nutrition architect — building precision meal plans, generating chef-grade recipes, and optimizing your body from the inside out.
          </p>

          <div className="hero-ctas flex flex-col sm:flex-row items-center justify-center gap-4 mb-20">
            <Link to="/login" className="btn-primary text-sm magnetic-btn">
              Start Free — No Card Needed <ArrowRight className="w-4 h-4" />
            </Link>
            <a href="#features" className="btn-ghost text-sm">
              See How It Works
            </a>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl mx-auto">
            {stats.map((s) => (
              <div key={s.label} className="hero-stats glass rounded-2xl p-5 border border-[rgba(74,222,128,0.08)]">
                <div className="stat-num stat-number">{s.value}</div>
                <div className="text-xs text-[rgb(71,85,105)] uppercase tracking-widest mt-1">{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 opacity-50">
          <div className="w-[1px] h-12 bg-gradient-to-b from-transparent via-[#4ade80] to-transparent animate-pulse" />
        </div>
      </section>

      {/* ── Marquee ── */}
      <div className="py-5 border-y border-[rgba(74,222,128,0.06)] bg-[rgba(20,23,32,0.5)] overflow-hidden">
        <div className="animate-marquee marquee-track">
          {['AI Meal Planning', '·', 'Smart Recipes', '·', 'Macro Tracking', '·', 'Grocery Lists', '·', 'NutriAI Coach', '·', 'AI Meal Planning', '·', 'Smart Recipes', '·', 'Macro Tracking', '·', 'Grocery Lists', '·', 'NutriAI Coach'].map((t, i) => (
            <span key={i} className={`text-sm font-semibold tracking-widest uppercase ${t === '·' ? 'text-[#4ade80]' : 'text-[rgb(71,85,105)]'}`}>{t}</span>
          ))}
        </div>
      </div>

      {/* ── Features ── */}
      <section id="features" className="py-36 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="max-w-2xl mb-20 reveal">
            <span className="section-label inline-flex items-center gap-2 mb-6">
              <Sparkles className="w-3 h-3" /> Core Intelligence
            </span>
            <h2 className="text-4xl md:text-6xl font-bold tracking-tight leading-[1.05]">
              Built for <span className="heading-serif text-gradient-green">peak performance.</span>
            </h2>
            <p className="text-[rgb(148,163,184)] text-sm mt-5 leading-relaxed max-w-lg">Five pillars of AI-driven nutrition intelligence — each engineered to optimize a different part of how you eat.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map((f, i) => (
              <div key={f.title} className="feat-card !p-7" style={{ animationDelay: `${i * 0.1}s` }}>
                <div className="icon-wrap w-11 h-11 rounded-xl flex items-center justify-center mb-5" style={{ background: `${f.color}15`, border: `1px solid ${f.color}25` }}>
                  <f.icon className="w-[18px] h-[18px]" style={{ color: f.color }} />
                </div>
                <h3 className="text-[15px] font-semibold mb-2 tracking-tight">{f.title}</h3>
                <p className="text-[13px] text-[rgb(120,137,160)] leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Stats Section ── */}
      <section className="stats-section py-24 px-6 border-y border-[rgba(74,222,128,0.06)]">
        <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-10 text-center">
          {stats.map((s) => (
            <div key={s.label} className="reveal">
              <div className="stat-num stat-number mb-3">{s.value}</div>
              <p className="section-label text-[rgb(71,85,105)]">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── How It Works ── */}
      <section id="how" className="py-36 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-20 reveal">
            <div className="max-w-xl">
              <span className="section-label inline-flex items-center gap-2 mb-6">
                <Zap className="w-3 h-3" /> The Protocol
              </span>
              <h2 className="text-4xl md:text-6xl font-bold tracking-tight leading-[1.05]">
                Three steps to <span className="heading-serif text-gradient-green">total control.</span>
              </h2>
            </div>
            <p className="text-[rgb(120,137,160)] text-sm leading-relaxed max-w-xs">From profile to plate in under five minutes. No guesswork, no spreadsheets.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {steps.map((s) => (
              <div key={s.num} className="step-card glass rounded-2xl overflow-hidden border border-[rgba(74,222,128,0.08)]">
                <div className="relative h-48 overflow-hidden">
                  <img src={s.img} alt={s.title} className="w-full h-full object-cover" style={{ filter: 'saturate(0.6) brightness(0.65)' }} loading="lazy" />
                  <div className="absolute inset-0 bg-gradient-to-t from-[rgba(10,10,14,0.95)] via-[rgba(10,10,14,0.4)] to-transparent" />
                  <span className="absolute bottom-4 left-6 heading-serif text-5xl text-[rgba(74,222,128,0.2)]">{s.num}</span>
                </div>
                <div className="p-6">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="icon-wrap w-8 h-8 rounded-lg bg-[rgba(74,222,128,0.08)] flex items-center justify-center">
                      <s.icon className="w-3.5 h-3.5 text-[#4ade80]" />
                    </div>
                    <h3 className="font-semibold text-[15px] tracking-tight">{s.title}</h3>
                  </div>
                  <p className="text-[13px] text-[rgb(120,137,160)] leading-relaxed">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Testimonials ── */}
      <section id="testimonials" className="py-36 px-6 bg-[rgba(14,16,22,0.6)]">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-20 reveal">
            <span className="section-label inline-flex items-center gap-2 mb-6">
              <Star className="w-3 h-3" /> Voices
            </span>
            <h2 className="text-4xl md:text-6xl font-bold tracking-tight leading-[1.05]">
              Real people, <span className="heading-serif text-gradient-green">real results.</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {testimonials.map((t) => (
              <div key={t.name} className="testi-card glass-strong rounded-2xl p-7 border border-[rgba(74,222,128,0.06)] flex flex-col">
                <div className="flex gap-0.5 mb-5">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-3.5 h-3.5 fill-[#fbbf24] text-[#fbbf24]" />
                  ))}
                </div>
                <p className="heading-serif not-italic text-[15px] text-[rgb(168,183,204)] leading-relaxed mb-7 flex-1">“{t.text}”</p>
                <div className="pt-5 border-t border-[rgba(74,222,128,0.06)] flex items-center gap-3">
                  <img src={t.avatar} alt={t.name} className="w-10 h-10 rounded-full object-cover ring-1 ring-[rgba(74,222,128,0.15)]" />
                  <div>
                    <div className="text-[13px] font-semibold">{t.name}</div>
                    <div className="text-[11px] text-[rgb(71,85,105)]">{t.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Pricing ── */}
      <section id="pricing" className="py-36 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-20 reveal">
            <span className="section-label inline-flex items-center gap-2 mb-6">
              <Shield className="w-3 h-3" /> Pricing
            </span>
            <h2 className="text-4xl md:text-6xl font-bold tracking-tight leading-[1.05]">
              Start free. <span className="heading-serif text-gradient-green">Scale when ready.</span>
            </h2>
            <p className="text-[rgb(120,137,160)] text-sm mt-5">No credit card required. Cancel anytime.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
            {plans.map((p) => (
              <div key={p.name} className={`price-card !p-7 ${p.featured ? 'price-card--featured !pt-9' : ''}`}>
                {p.featured && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="px-4 py-1 rounded-full bg-gradient-to-r from-[#4ade80] to-[#a3e635] text-[rgb(10,10,14)] text-[10px] font-bold uppercase tracking-wider whitespace-nowrap">Most Popular</span>
                  </div>
                )}
                <h3 className="text-lg font-semibold mb-1">{p.name}</h3>
                <p className="text-[12px] text-[rgb(71,85,105)] mb-5">{p.desc}</p>
                <div className="mb-6 pb-5 border-b border-[rgba(74,222,128,0.08)]">
                  <span className="text-4xl font-bold tracking-tight">{p.price}</span>
                  <span className="text-[12px] text-[rgb(71,85,105)] ml-1">{p.period}</span>
                </div>
                <ul className="space-y-3 mb-8">
                  {p.features.map((f) => (
                    <li key={f} className="flex items-center gap-2.5 text-[13px] text-[rgb(148,163,184)]">
                      <Check className="w-3.5 h-3.5 text-[#4ade80] shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Link to="/login" className={p.featured ? 'btn-primary w-full justify-center !text-[13px]' : 'btn-ghost w-full justify-center !text-[13px]'}>
                  {p.cta}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA Banner ── */}
      <section className="py-36 px-6 relative overflow-hidden">
        <div className="orb orb-green w-96 h-96 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-15" />
        <div className="relative z-10 max-w-2xl mx-auto text-center reveal">
          <h2 className="text-4xl md:text-6xl font-bold tracking-tight mb-5 leading-[1.05]">
            Your body deserves <span className="heading-serif text-gradient-green">better data.</span>
          </h2>
          <p className="text-[rgb(120,137,160)] text-sm mb-10 max-w-md mx-auto leading-relaxed">
            Join 50,000+ users eating smarter with NutriPro. Start free, upgrade when you're ready.
          </p>
          <Link to="/login" className="btn-primary text-sm magnetic-btn">
            Start Optimizing Free <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-[rgba(74,222,128,0.06)] py-16 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between gap-12 mb-12">
            <div className="max-w-xs">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#4ade80] to-[#a3e635] flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-[rgb(10,10,14)]" />
                </div>
                <span className="font-bold text-lg">NutriPro</span>
              </div>
              <p className="text-sm text-[rgb(71,85,105)] leading-relaxed">
                AI-powered nutrition intelligence for peak human performance. Eat smarter. Live better.
              </p>
            </div>
            <div className="flex gap-12 text-sm">
              <div className="flex flex-col gap-3">
                <span className="text-xs uppercase tracking-widest text-[rgb(71,85,105)] font-semibold">Product</span>
                <a href="#features" className="text-[rgb(148,163,184)] hover:text-white transition-colors">Features</a>
                <a href="#pricing" className="text-[rgb(148,163,184)] hover:text-white transition-colors">Pricing</a>
                <a href="#how" className="text-[rgb(148,163,184)] hover:text-white transition-colors">How it Works</a>
              </div>
              <div className="flex flex-col gap-3">
                <span className="text-xs uppercase tracking-widest text-[rgb(71,85,105)] font-semibold">Legal</span>
                <a href="#" className="text-[rgb(148,163,184)] hover:text-white transition-colors">Privacy</a>
                <a href="#" className="text-[rgb(148,163,184)] hover:text-white transition-colors">Terms</a>
                <a href="#" className="text-[rgb(148,163,184)] hover:text-white transition-colors">GDPR</a>
              </div>
            </div>
          </div>
          <div className="border-t border-[rgba(74,222,128,0.06)] pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-xs text-[rgb(71,85,105)]">© {new Date().getFullYear()} NutriPro. All rights reserved.</p>
            <p className="text-xs text-[rgb(71,85,105)]">Built with AI · Zero Cost · Maximum Performance</p>
          </div>
        </div>
      </footer>
    </div>
  );
}