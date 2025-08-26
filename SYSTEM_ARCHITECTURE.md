# Prompt Battle Arena: Complete System Architecture
## Generated: 2025-01-26 18:20:00 IST

This document serves as the definitive architecture reference for the Prompt Battle Arena system.

***

# **Prompt Battle Arena: Complete System & UX Flow**

***

## **1. User Journey: Entry to Battle**

### a. **User Entry & Authentication**
- **Frontend (React/Typescript/Vite):**
  - User lands on landing page; can explore features, battle history, etc.
  - User can register/login (email/password, OAuth via Supabase Auth).
  - **Demo users** detected by specific credentials (e.g., demo@example.com).

- **Backend (Supabase):**
  - Handles user authentication and session via secure cookies/JWT.
  - User meta data stored in Supabase Postgres (RLS-protected).

***

## **2. Battle Creation**

### a. **Battle Type Selection**
- User chooses **Prompt Battle (prompt refinement)** or **Response Battle (completion comparison)**

### b. **Mode & Model Selection**
- User chooses:
  - **Auto Mode**: App auto-selects optimal LLMs based on prompt analysis (category, length, domain).
  - **Manual Mode**: User picks any N models from available Groq API pool (detailed cards shown).
- Frontend displays model info cards (context, strengths, rate limits) for informed selection.

### c. **Prompt Entry**
- User enters a prompt/challenge/question.
- App may offer category suggestions, prompt templates, or examples for new users.

### d. **Config Summary & Launch**
- Frontend validates input, shows config summary, and confirms model selection.
- User clicks "Start Battle".

***

## **3. Battle Pipeline—Step-by-Step Execution**

### **A. Frontend → Backend Handoff**
- Frontend POSTs battle config (prompt, selected models, userID, mode) via AJAX to a battle creation API (often a Supabase Edge Function endpoint).

***

### **B. Backend: Orchestration & AI API Pipeline**

- **Orchestration Function (Supabase Edge Function / Node or Deno Function):**
  1. **Sanity Check:** Validate inputs, selected models, prompt quality.
  2. **Battle Metadata Creation:** Make a record in the `battles` table (prompt, user, config, created_at).
  3. **Iterative Battle Loop:**  
     - **Prompt Battle**:
       - For each round:
         1. All N models receive (prior refined prompt or original prompt).
         2. Each model returns:  
             - `THINKING:` — their analysis/rationale/ideas  
             - `IMPROVED_PROMPT:` — their improved version
         3. **Each model cross-critiques all other outputs** (N×N matrix), providing scores by rubric (clarity, completeness, creativity, etc.).
         4. **Backend calculates round winner:** Highest average/peer-reviewed score.
         5. If plateau/convergence or "perfection" is detected (e.g., all scores ≥9.5/10, or N rounds stably unchanged), battle halts.
         6. All rounds (prompts, scores, thinkings) written to `prompt_evolution`/history tables in Supabase.
         7. Failure handling:
             - If a model/API fails → fallback to backup (retry, or try another model).
             - If all models down → log and trigger user-facing error/report.

     - **Response Battle:**  
       - All models generate a response to the original prompt in one round.
       - Judging done by "panel" of specialized LLMs; scores on multiple axes.
       - Same DB writes as above.

  4. **Result Processing:** Prepare battle outcome, final winner, full prompt/reasoning chains for return to frontend.
  5. **History Write:** Final result/status written to DB.

***

### **C. LLM API Integration**
- Calls to Groq API (or OpenRouter, Anthropic, as per selection) are made from the Edge Function.
- All retries, error handling, fallbacks, token/timeout management handled here.
- Model-scoped circuit breakers prevent thrashing on upstream model/APIs.

***

## **4. Frontend: Real-Time UI**

### a. **Progress Tracking**
- UI pulls progress updates via polling or server-push/WebSocket.
- Users see round-by-round status, "thinking", who's winning, score evolution, errors (if any).

### b. **Battle Results Display**
- On completion, frontend renders:
  - **Prompt Battles:**  
    - Round-by-round prompt evolution, each prompt's AI "thinking", peer scores, clear "winner" callout.
    - Final prompt (no reasoning), ready to copy/share.
  - **Response Battles:**  
    - Model outputs side-by-side, judged scores, strengths/weaknesses, winner badge.
  - Peer model critique/reasoning and scoring displayed or collapsible.

### c. **History and Analytics**
- Users access history page: all battles, scores, advanced analytics (avg. score, personal leaderboard).
- Shareable recap cards (including only the final prompt), with direct copy/share to social allowed.

### d. **Error/Edge Experience**
- All failures, stalls, or API issues surfaced to user cleanly ("Model X unavailable—fallback used", "Could not get a meaningful improvement, here are best results so far").
- No broken or blank screens—always a clear next step for user.

***

## **5. Persistence & Admin**

- **Supabase Storage:**  
  - All critical battle data, user records, prompt evolution rounds, and scores stored in RLS-secured Postgres.
  - History available for users, with pruning and privacy controls.
- **Admin/Analytics:**  
  - Admins have dashboards (or Supabase studio) for auditing failures, tracking model/API stats, cost, errors, and user traffic.

***

## **6. Monetization & Expansion (Roadmap/Planned)**

- **Freemium Tiers:**  
  - Token/model/call quotas, alerting for overages/free up-sell.
  - Pro users: premium models, more rounds, analytics.
  - BYO API Key option: cost externalization for power users.
- **Moat Features:**  
  - Live leaderboards, AI commentary, tournaments, embeddable battles, advanced model coaching, and social sharing.

***

# **Summary: How the User Experience & Technical Pipeline Align**

| Stage            | Frontend Role                                      | Backend/API Role                                           |
|------------------|----------------------------------------------------|------------------------------------------------------------|
| Entry/Auth       | UI, login/register, demo/account switch            | User verification, session mgmt (Supabase)                 |
| Create Battle    | Input prompt, model selection, config summary      | Validate config, create battle record, launch pipeline     |
| Battle Pipeline  | Show rounds, progress, thinking, UX feedback       | Orchestrate rounds, LLM calls, judging, persist results    |
| Results/Sharing  | Show final results, allow copy/share/history       | Return full history/data, store analytics, surface errors  |
| Admin/Analytics  | NA (unless admin account)                          | Operations dashboard, logs, error/usage reporting          |

***

## **Technical Implementation Details**

### **A. System Components:**

- **Frontend:** React (TypeScript, Vite, TailwindCSS)
- **Backend/Orchestration:** Supabase Edge Functions, TypeScript (Node/Deno)
- **DB:** Supabase Postgres (with Row-Level Security, strict types)
- **AI API:** Groq Cloud (could extend to others)
- **Testing:** Playwright (e2e), Vitest/unit (optional)
- **DevOps:** Supabase deploy, CI/CD (Vercel/Netlify/Cloudflare), .env/billing/config control

### **B. Database Schema**

#### **Core Tables:**
- `profiles` - User data with RLS policies
- `battles` - Battle configurations and results
- `battle_responses` - Individual model responses
- `battle_scores` - Detailed scoring breakdown
- `prompt_evolution` - Round-by-round prompt improvements

#### **Security:**
- Row Level Security (RLS) enabled on all tables
- User-specific access policies
- Admin role separation
- API keys secured server-side only

### **C. API Integration Architecture**

#### **Groq API Integration:**
- Secure server-side API calls via Supabase Edge Functions
- Rate limiting and circuit breaker patterns
- Multiple fallback strategies
- Cost calculation and usage tracking

#### **Error Handling:**
- Comprehensive error boundaries
- Graceful degradation
- User-friendly error messages
- Automatic retry mechanisms

### **D. Battle Engine Architecture**

#### **Prompt Battle Flow:**
1. Initial prompt analysis
2. Multi-round iterative improvement
3. Peer review and scoring
4. Convergence detection
5. Final prompt selection

#### **Response Battle Flow:**
1. Parallel response generation
2. Expert panel AI judging
3. Multi-dimensional scoring
4. Winner determination

### **E. Frontend Architecture**

#### **Component Structure:**
- Page components for each route
- Reusable UI components
- Context providers for state management
- Error boundaries for fault tolerance

#### **State Management:**
- AuthContext for user authentication
- BattleContext for battle state
- ThemeContext for UI preferences
- Local storage fallbacks

### **F. Deployment Architecture**

#### **Production Setup:**
- Frontend: Static site deployment (Vercel/Netlify/Cloudflare)
- Backend: Supabase Edge Functions
- Database: Supabase PostgreSQL
- CDN: Automatic via deployment platform

#### **Environment Configuration:**
- Supabase URL and keys
- Groq API key (server-side only)
- App URL for redirects

***

**In summary,** your app's flow is a textbook example of a resilient, multi-round AI orchestration product where the frontend maximizes user clarity/control and the backend robustly orchestrates pivotal, error-prone LLM operations—persisting, judging, and recovering at every step to guarantee usable output and future extensibility. This pipeline is modern, scalable, and ready for production and the next generation of moat features.