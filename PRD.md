# NutriPro — Product Requirements Document (PRD)

> **Version:** 2.0  
> **Last Updated:** May 2026  
> **Status:** Active Development  

---

## 1. Executive Summary

NutriPro is an AI-powered nutrition planning platform that combines cutting-edge large language models, computer vision, and personalized health profiling to deliver precision meal plans, smart recipes, and real-time macro tracking. The product is designed for individuals who want science-backed, effortless nutrition management — from casual home cooks to competitive athletes and professional nutritionists.

The platform consists of:
- A **React + TypeScript** single-page application (SPA) with immersive 3D animations and dark-cosmos design language.
- An **Express + TypeScript** REST API backend with Prisma ORM, JWT authentication, Redis caching, and Groq/OpenAI LLM integration.
- A **SQLite** database for development (PostgreSQL-ready for production via Docker Compose).

---

## 2. Problem Statement

Nutrition planning is broken for most people:

| Problem | Impact |
|---|---|
| Generic meal plans don't account for individual biology | Low adherence, poor results |
| Manual macro tracking is tedious and error-prone | Users abandon tracking within weeks |
| Recipe discovery is disconnected from pantry inventory | Food waste, extra grocery trips |
| No smart shopping integration | Planning and purchasing are siloed |
| Professional nutritionists are expensive & inaccessible | Only high-income users get quality guidance |

NutriPro solves all of the above with AI.

---

## 3. Target Users

### Primary
- **Health-conscious individuals (25–45)** who want to eat better without a nutrition degree
- **Fitness enthusiasts** tracking macros for muscle gain or fat loss
- **Busy professionals** who need fast, healthy meal solutions

### Secondary
- **Fitness coaches** managing multiple client meal plans
- **Families** coordinating meals across different dietary needs
- **Home cooks** looking for AI recipe inspiration from available ingredients

---

## 4. Core Features

### 4.1 AI Meal Plan Generation
- Generate personalized 7-day meal plans based on user profile (age, weight, height, activity level, health goal)
- AI accounts for dietary restrictions, allergies, cuisine preferences, meals-per-day, and max prep time
- Plans are stored in the database and can be regenerated or customized
- Each plan includes full macro breakdowns (calories, protein, carbs, fat, fiber, sugar, sodium)
- Powered by Groq LLaMA 3 / OpenAI GPT with structured prompt engineering

### 4.2 Smart Recipe Generator
- Generate AI recipes from any text prompt (e.g. "high-protein dinner under 30 min")
- Supports fridge-first generation: input ingredients you have, get optimal recipes
- Each recipe includes: ingredients list, step-by-step instructions, prep/cook time, servings, difficulty, cuisine type, full nutritional data
- Recipes are saved and can be added directly to meal plans

### 4.3 Fridge Scanner (Computer Vision)
- Upload a photo of your fridge or pantry
- Vision AI (Google Cloud Vision + LLM processing) identifies ingredients
- Instantly suggests recipes using detected ingredients
- Supports JPEG/PNG uploads via Cloudinary CDN

### 4.4 Grocery List Manager
- Auto-generate aisle-sorted shopping lists from any meal plan
- Lists are grouped by category (Proteins, Vegetables, Dairy, Pantry Staples, etc.)
- Check off items as you shop; state persists across sessions
- Lists are linked to meal plans in the database

### 4.5 Macro Tracker & Dashboard
- Real-time daily nutrition dashboard with ring charts and weekly bar charts
- Quick-log individual meals with instant macro calculation
- Calorie burn estimation based on activity level (BMR × activity multiplier)
- Weekly insights powered by AI (trends, recommendations, patterns)
- Recharts-based visualizations (MacroRing, WeekChart)

### 4.6 NutriAI Coach
- 24/7 conversational AI nutrition coach (Groq Llama 3 / OpenAI)
- Context-aware: knows your profile, goals, and recent meal data
- Client-side Groq SDK integration for low-latency responses
- Answers questions about macros, meal timing, substitutions, supplements
- Embedded in the dashboard for instant access

### 4.7 Onboarding Quiz
- Multi-step onboarding to capture: personal data, health goals, dietary types, allergies, cuisine preferences, activity level
- Profile stored in `UserProfile` and `UserPreference` tables
- Used as context for all AI generation across the platform

### 4.8 User Authentication
- JWT access tokens (15-min expiry) + refresh token rotation (7-day)
- bcrypt password hashing
- Protected routes on both client and server
- Zustand-based auth store with persistent session

---

## 5. Technical Architecture

### 5.1 Frontend (Client)

| Technology | Purpose |
|---|---|
| React 18 + TypeScript | UI framework |
| Vite 5 | Build tool & dev server |
| React Router v6 | Client-side routing |
| Zustand | Global auth state management |
| TanStack Query v5 | Server state & data fetching |
| Axios | HTTP client with interceptors |
| GSAP 3 + ScrollTrigger | Landing page animations |
| React Three Fiber + Three.js | 3D hero canvas animation |
| Radix UI | Accessible headless UI primitives |
| Recharts | Data visualization |
| React Hook Form + Zod | Form handling & validation |
| Tailwind CSS v3 | Utility-first styling |
| Groq SDK (client-side) | NutriAI chat (direct LLM calls) |

### 5.2 Backend (Server)

| Technology | Purpose |
|---|---|
| Node.js 18+ | Runtime |
| Express 4 + TypeScript | REST API framework |
| Prisma ORM | Database access layer |
| SQLite (dev) / PostgreSQL (prod) | Database |
| Redis + ioredis | Response caching (AI calls) |
| Groq SDK + OpenAI SDK | LLM inference |
| Google Cloud Vision API | Image ingredient recognition |
| Cloudinary | Image storage & CDN |
| JSON Web Tokens (JWT) | Authentication |
| bcrypt | Password hashing |
| Helmet | HTTP security headers |
| express-rate-limit | API rate limiting |
| Winston | Structured logging |
| Zod | Request validation |
| Multer | File upload handling |

### 5.3 Database Schema (Prisma)

```
User
├── UserProfile       (age, height, weight, activity level, calorie target)
├── UserPreference    (dietary types, allergies, restrictions, cuisine prefs)
├── RefreshToken[]    (JWT refresh token rotation)
├── MealPlan[]
│   └── PlanMeal[]
│       └── Meal
│           ├── Ingredient[]
│           └── NutritionInfo
│   └── GroceryList?
│       └── GroceryCategory[]
│           └── GroceryItem[]
└── GroceryList[]
```

### 5.4 API Routes

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/v1/auth/register` | User registration |
| POST | `/api/v1/auth/login` | Login + token issuance |
| POST | `/api/v1/auth/refresh` | Refresh access token |
| POST | `/api/v1/auth/logout` | Invalidate refresh token |
| GET | `/api/v1/users/profile` | Get user + profile |
| PUT | `/api/v1/users/profile` | Update profile/preferences |
| POST | `/api/v1/meal-plans/generate` | AI meal plan generation |
| GET | `/api/v1/meal-plans` | List user's meal plans |
| GET | `/api/v1/meal-plans/:id` | Get specific plan |
| DELETE | `/api/v1/meal-plans/:id` | Delete plan |
| POST | `/api/v1/recipes/generate` | AI recipe generation |
| GET | `/api/v1/recipes` | List saved recipes |
| POST | `/api/v1/grocery/generate` | Generate grocery list from plan |
| GET | `/api/v1/grocery` | List grocery lists |
| PUT | `/api/v1/grocery/:id/items/:itemId` | Toggle item checked state |
| POST | `/api/v1/image/analyze` | Fridge scanner (vision AI) |
| POST | `/api/v1/ai/chat` | NutriAI coach message |

---

## 6. Design System

- **Color Palette:** Dark cosmos — `rgb(10,10,14)` void, `#4ade80` emerald accent, `#a3e635` lime, `#2dd4bf` teal
- **Typography:** Bricolage Grotesque (sans-serif body/headings) + Instrument Serif (italic editorial accents)
- **Glassmorphism:** Backdrop-filter blur cards with subtle green-tinted borders
- **Animations:** GSAP ScrollTrigger reveals, React Three Fiber 3D particle canvas, CSS micro-animations
- **Design Principles:** Dark mode first, vibrant but controlled accents, editorial feel, premium micro-interactions

---

## 7. Pages & User Flows

```
/ (Home)
  → Landing page with hero, features, how-it-works, testimonials, pricing

/login
  → Email + password authentication
  → On success → /onboarding (new user) or /dashboard (existing)

/onboarding
  → Multi-step quiz: goals, body metrics, dietary prefs, allergies, cuisines
  → Saves to UserProfile + UserPreference
  → Redirects to /dashboard

/dashboard
  → Daily macro ring + weekly bar chart
  → Quick log meals
  → NutriAI chat widget
  → AI insights panel
  → API key setup for client-side Groq

/meal-plan
  → View current AI-generated meal plan
  → Day-by-day meal breakdown with macros
  → Generate new plan button

/recipe-generator
  → Freeform AI recipe generation
  → Saved recipes library

/grocery
  → Category-sorted shopping list
  → Checkable items

/image-upload
  → Fridge scanner: upload photo → AI ingredient detection → recipe suggestions

/profile
  → Edit personal data, goals, dietary preferences
```

---

## 8. Infrastructure & Deployment

### Development
- **Client:** `npm run dev` → Vite dev server at `http://localhost:5173`
- **Server:** `npm run dev` → tsx watch at `http://localhost:3000`
- **Database:** SQLite local file (`prisma/dev.db`)

### Production (Docker Compose)
- PostgreSQL 15 (health-checked)
- Redis 7 (health-checked)
- Express API container
- React client container (Vite build)
- All environment variables injected via Docker environment config

---

## 9. Environment Variables

### Server (`.env`)
```env
DATABASE_URL=file:./prisma/dev.db
JWT_SECRET=<secret>
JWT_REFRESH_SECRET=<secret>
GROQ_API_KEY=<groq-api-key>
OPENAI_API_KEY=<openai-api-key>
USDA_API_KEY=<usda-api-key>
CLOUDINARY_CLOUD_NAME=<name>
CLOUDINARY_API_KEY=<key>
CLOUDINARY_API_SECRET=<secret>
REDIS_URL=redis://localhost:6379
PORT=3000
NODE_ENV=development
```

### Client (`.env`)
```env
VITE_API_URL=http://localhost:3000/api/v1
VITE_GROQ_API_KEY=<groq-api-key>
```

---

## 10. AI Integration Details

### LLM Stack
- **Primary:** Groq (llama3-70b-8192) — ultra-low latency for recipe + meal plan generation
- **Fallback:** OpenAI GPT-4o — higher quality for complex reasoning
- **Client-side:** Groq SDK used directly in browser for NutriAI chat (no server round-trip)

### Prompt Engineering
- Structured prompts in `server/src/services/ai/prompts.ts`
- Prompts include user profile context (age, weight, goals, restrictions)
- JSON-mode outputs enforced for structured meal plan / recipe objects

### Caching
- Redis cache with TTL for AI responses (prevents redundant LLM calls for identical requests)
- Cache service in `server/src/services/ai/cacheService.ts`

### Vision AI
- Google Cloud Vision API detects food labels from uploaded fridge photos
- Detected labels piped into LLM for recipe suggestion generation
- Image stored via Cloudinary before analysis

---

## 11. Security

- JWT token rotation (short-lived access + long-lived refresh)
- bcrypt password hashing (10 salt rounds)
- Helmet.js HTTP security headers
- Rate limiting on all API routes (express-rate-limit + Redis)
- Request validation via Zod schemas on all endpoints
- CORS configured for trusted origins only
- No sensitive credentials stored client-side (Groq key optional, user-supplied)

---

## 12. Upcoming Features (Roadmap)

- [ ] **PDF Export** — Download meal plans and grocery lists as styled PDFs
- [ ] **Team/Coach Tier** — Manage up to 6 user profiles from one coach dashboard
- [ ] **Push Notifications** — Meal reminders and daily macro check-ins
- [ ] **Apple Health / Google Fit sync** — Import activity data for calorie adjustments
- [ ] **Barcode Scanner** — Scan packaged food barcodes for instant macro logging
- [ ] **Meal Plan Templates** — Pre-built plans for common goals (cutting, bulking, keto)
- [ ] **Social Sharing** — Share recipes and meal plans with the NutriPro community
- [ ] **PostgreSQL Migration** — Full production DB migration from SQLite
- [ ] **Stripe Integration** — Billing for Pro and Team subscription tiers

---

## 13. Non-Functional Requirements

| Requirement | Target |
|---|---|
| AI response time (meal plan) | < 5 seconds |
| AI response time (recipe) | < 3 seconds |
| API response time (cached) | < 50ms |
| Authentication token refresh | Silent, no user action |
| Mobile responsiveness | Full support (mobile-first CSS) |
| Accessibility | Radix UI primitives (ARIA-compliant) |
| Browser support | Chromium 90+, Firefox 88+, Safari 14+ |
| Node.js requirement | ≥ 18.0.0 |
