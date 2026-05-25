/**
 * HeroIntro — Cinematic food-focused hero with parallax & reveal animations
 * 
 * Design: Vibrant, appetizing, high-impact visual experience
 * - Full-width hero image with parallax depth
 * - Smooth scroll-driven reveal animations
 * - Modern warm color palette
 * - Stock photography focused on fresh food/nutrition
 */

import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Sparkles, ChevronDown, ArrowRight, Play } from 'lucide-react';
import { Link } from 'react-router-dom';

gsap.registerPlugin(ScrollTrigger);

/* ── Stock photos for hero (high-quality free images) ── */
const HERO_IMAGES = [
  'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=1920&q=80', // Fresh salad bowl
  'https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=1920&q=80', // Healthy meal prep
  'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=1920&q=80', // Colorful healthy food
];

export function HeroIntro() {
  const containerRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced) return;

    const ctx = gsap.context(() => {
      const container = containerRef.current!;

      /* ── Horizontal image scroll effect ── */
      const images = gsap.utils.toArray('.hero-img-panel') as HTMLElement[];
      gsap.to(images, {
        xPercent: -100 * (images.length - 1),
        ease: 'none',
        scrollTrigger: {
          trigger: '.hero-showcase',
          start: 'top top',
          end: '+=300%',
          pin: true,
          scrub: 1,
        },
      });

      /* ── Text fade and scale on scroll ── */
      gsap.fromTo(
        textRef.current,
        { opacity: 1, scale: 1 },
        {
          opacity: 0,
          scale: 0.8,
          scrollTrigger: {
            trigger: container,
            start: 'top top',
            end: '30% top',
            scrub: true,
          },
        }
      );

      /* ── Floating food elements parallax ── */
      gsap.to('.hero-floating--1', {
        y: -150,
        rotation: 15,
        scrollTrigger: {
          trigger: container,
          start: 'top top',
          end: 'bottom top',
          scrub: 1,
        },
      });

      gsap.to('.hero-floating--2', {
        y: -80,
        rotation: -10,
        x: 50,
        scrollTrigger: {
          trigger: container,
          start: 'top top',
          end: 'bottom top',
          scrub: 1,
        },
      });

      gsap.to('.hero-floating--3', {
        y: -200,
        x: -30,
        scrollTrigger: {
          trigger: container,
          start: 'top top',
          end: 'bottom top',
          scrub: 1,
        },
      });

      /* ── Initial entrance animations ── */
      const intro = gsap.timeline({ defaults: { ease: 'power3.out' } });
      intro
        .from('.hero-badge-new', { y: 40, opacity: 0, duration: 0.8 })
        .from('.hero-title-new', { y: 60, opacity: 0, duration: 1, stagger: 0.1 }, '-=0.5')
        .from('.hero-desc-new', { y: 30, opacity: 0, duration: 0.8 }, '-=0.6')
        .from('.hero-cta-new', { y: 20, opacity: 0, duration: 0.6 }, '-=0.4')
        .from('.hero-floating', { scale: 0, rotation: 180, duration: 1, stagger: 0.15 }, '-=0.8')
        .from('.hero-scroll-indicator', { y: 20, opacity: 0, duration: 0.5 }, '-=0.2');
    }, containerRef);

    return () => ctx.revert();
  }, []);

  return (
    <div ref={containerRef} className="hero-intro-new">
      {/* ── Main Hero Section with Parallax Background ── */}
      <div className="hero-main">
        {/* Background Image with Overlay */}
        <div className="hero-bg-image">
          <img 
            src="https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=1920&q=80" 
            alt="Healthy meal prep"
          />
          <div className="hero-bg-overlay" />
        </div>

        {/* Floating Food Elements */}
        <div className="hero-floating hero-floating--1">
          <img src="https://images.unsplash.com/photo-1610832958506-aa56368176cf?w=200&q=80" alt="Avocado" />
        </div>
        <div className="hero-floating hero-floating--2">
          <img src="https://images.unsplash.com/photo-1550258987-190a2d41a8ba?w=200&q=80" alt="Strawberry" />
        </div>
        <div className="hero-floating hero-floating--3">
          <img src="https://images.unsplash.com/photo-1587049352846-4a222e784d38?w=200&q=80" alt="Orange" />
        </div>

        {/* Hero Content */}
        <div ref={textRef} className="hero-content-new">
          <div className="hero-badge-new">
            <Sparkles className="w-4 h-4" />
            <span>AI-Powered Nutrition</span>
          </div>

          <h1 className="hero-title-new">
            Eat Smarter.<br />
            <span className="hero-title-accent">Live Better.</span>
          </h1>

          <p className="hero-desc-new">
            Personalized meal plans crafted by AI just for you. 
            Track macros, generate recipes, and achieve your health goals — all in one beautiful app.
          </p>

          <div className="hero-cta-new">
            <Link to="/login" className="hero-btn-new hero-btn-new--primary">
              Start Free <ArrowRight className="w-4 h-4" />
            </Link>
            <a href="#showcase" className="hero-btn-new hero-btn-new--ghost">
              <Play className="w-4 h-4" /> See How It Works
            </a>
          </div>
        </div>

        {/* Scroll Indicator */}
        <div className="hero-scroll-indicator">
          <span>Scroll to explore</span>
          <ChevronDown className="w-5 h-5 animate-bounce" />
        </div>
      </div>

      {/* ── Horizontal Image Showcase (scrolls horizontally) ── */}
      <div id="showcase" className="hero-showcase">
        <div className="hero-showcase-wrapper">
          {HERO_IMAGES.map((src, i) => (
            <div key={i} className="hero-img-panel">
              <img src={src} alt={`Showcase ${i + 1}`} />
              <div className="hero-img-caption">
                <span className="hero-img-number">0{i + 1}</span>
                <span className="hero-img-text">
                  {i === 0 ? 'Balanced Nutrition' : i === 1 ? 'Smart Meal Prep' : 'Fresh Ingredients'}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Stats Bar ── */}
      <div className="hero-stats">
        <div className="hero-stats-inner">
          {[
            { num: '2.4M+', label: 'Recipes Generated', icon: '🍳' },
            { num: '<3s', label: 'AI Response Time', icon: '⚡' },
            { num: '98%', label: 'User Satisfaction', icon: '⭐' },
            { num: '$0', label: 'Free Forever', icon: '🎉' },
          ].map((stat, i) => (
            <div key={i} className="hero-stat-item">
              <span className="hero-stat-icon">{stat.icon}</span>
              <span className="hero-stat-num">{stat.num}</span>
              <span className="hero-stat-label">{stat.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}