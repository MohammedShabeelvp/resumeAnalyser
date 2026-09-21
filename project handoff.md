# AI Resume Analyzer — Complete Project Handoff Document

**Version:** 1.0  
**Author:** Mohammed  
**Date:** July 2026  
**Status:** Pre-deployment — email verification complete, deployment pending

---

## 1. Executive Summary

### Project Name
AI Resume Analyzer & Job Recommendation System

### Project Purpose
A full-stack AI-powered web application that analyses PDF resumes against job descriptions and provides ATS (Applicant Tracking System) scoring, skill gap analysis, job recommendations, and personalised improvement suggestions.

### Problem Being Solved
Over 75% of resumes are rejected by ATS software before a human ever sees them. Most free ATS checkers inflate scores using naive keyword counting and give vague advice. This project implements a multi-factor, semantically-aware ATS scoring engine that mirrors real enterprise ATS logic — combining TF-IDF keyword matching with BERT semantic similarity, weighted across seven factors, with full gap analysis and AI-generated suggestions.

### Target Users
- Job seekers who want to understand why their resume isn't getting through
- Developers wanting to see NLP and deep learning applied to a real-world problem
- Students building a portfolio-grade AI project

### Key Features
- PDF resume upload with text extraction
- NLP text cleaning pipeline (spaCy + NLTK)
- Skill extraction across 7 categories
- Dual match scoring: TF-IDF (35%) + BERT semantic (65%)
- 7-factor weighted ATS scoring engine
- Gap analysis across 4 categories (skills, action verbs, soft skills, domain terms)
- AI resume suggestions prioritised by impact
- BERT-powered job recommendation engine (12 roles)
- JWT authentication with bcrypt password hashing
- Email verification (Gmail SMTP) — hard block on unverified users
- Password reset via email token
- Guest-to-user pending analysis flow
- Per-user persistent history with rename, rematch, delete
- React frontend with warm neutral design system, Fraunces/Instrument Sans typography, CSS-only animations

### Current Development Stage
Feature-complete. Email verification and password reset implemented. Deployment to Vercel (frontend) and Render (backend) is the final remaining step.

### Estimated Completion
95% — all features built and debugged. Deployment + final documentation = 5% remaining.

---

## 2. Development Timeline

### Phase 1 — Project Setup (Day 1)
**What happened:** Established project structure, Flask backend, React/Vite frontend, confirmed frontend-backend communication.

**Files created:**
- `backend/app.py` — Flask entry point with CORS
- `frontend/src/App.jsx` — React root with connectivity test
- `frontend/src/index.css` — Tailwind base
- `frontend/vite.config.js` — Vite + React plugin
- `frontend/tailwind.config.js` — Tailwind content paths

**Dependencies introduced:**
- flask, flask-cors, pdfplumber, spacy, scikit-learn, sentence-transformers, nltk
- react, react-dom, react-router-dom, axios, tailwindcss

**Challenge:** Frontend showed "backend not reachable" — resolved by confirming Flask was running and CORS was correctly applied after `Flask(__name__)`.

**Outcome:** Both servers running; frontend confirmed backend response in browser.

---

### Phase 2 — PDF Upload Pipeline (Days 2–4)
**What happened:** Built the full PDF upload, save, and text extraction pipeline.

**Files created/modified:**
- `backend/app.py` — `/upload` POST route, `allowed_file()`, `secure_filename`, `MAX_CONTENT_LENGTH`
- `frontend/src/App.jsx` — file picker, FormData, axios POST, success/error states

**Key decisions:**
- Used `werkzeug.utils.secure_filename` to prevent path traversal attacks
- Used `pdfplumber` over PyPDF2 — better text layer extraction, handles multi-page
- 5MB file size limit set via `MAX_CONTENT_LENGTH`
- `uploads/` folder created with `.gitkeep` to preserve in git

**Challenge:** Windows PowerShell does not have `curl` — all curl commands replaced with PowerShell `Invoke-WebRequest (iwr)` equivalents for the remainder of the project.

**Outcome:** User can upload PDF; file saved to `backend/uploads/`; extracted text returned in response.

---

### Phase 3 — NLP Pipeline (Day 5)
**What happened:** Built the text cleaning and tokenisation pipeline.

**Files created:**
- `backend/nlp_utils.py` — `clean_text()`, `tokenise()`, `clean_and_tokenise()`

**Key decisions:**
- spaCy for tokenisation and lemmatisation (preferred over NLTK stemming — produces real words)
- NLTK for stopword corpus
- Regex for removing emails, URLs, special characters before NLP processing
- Minimum token length of 3 characters to filter noise
- `/clean` endpoint added for isolated testing

**Outcome:** Raw PDF text → cleaned lowercase text → lemmatised tokens.

---

### Phase 4 — Skill Extraction (Day 6)
**What happened:** Built the skill detection system with category grouping and whole-word matching.

**Files created:**
- `backend/skills_db.py` — `SKILLS` dict (7 categories, ~100 skills), `ALL_SKILLS` flat list
- `backend/skill_extractor.py` — `extract_skills()`, `extract_skills_by_category()`, `find_missing_skills()`

**Key decisions:**
- Whole-word boundary matching to prevent "C" matching inside "CI/CD"
- Before/after character check instead of regex word boundaries (more reliable across special chars)
- Skills database is intentionally editable — users encouraged to add their own skills
- Category structure: programming_languages, frontend, backend, databases, ai_ml, devops_cloud, tools

**Outcome:** Resume text → list of detected skills with category breakdown.

---

### Phase 5 — Frontend Dashboard UI (Day 7)
**What happened:** Refactored from single-page to multi-page React app with routing.

**Files created:**
- `frontend/src/pages/UploadPage.jsx`
- `frontend/src/pages/ResultsPage.jsx` (later renamed AnalysisPage)
- `frontend/src/components/SkillBadge.jsx`
- `frontend/src/components/CategoryCard.jsx`
- `frontend/src/App.jsx` — BrowserRouter, Routes, FadeWrapper

**Key decisions:**
- `sessionStorage` for passing data between pages (resumeData, matchData, lastJobDescription)
- `useNavigate` for programmatic navigation after upload
- Skills displayed as coloured badges grouped by category
- `<details><summary>` native HTML collapsible for raw text — no library needed

**Challenge:** `JSON.parse(stored)` showed TypeScript red underline — project uses `.jsx` not `.tsx` but VS Code was treating files as TypeScript. Fixed with `as string` cast, later resolved by adding `"checkJs": false` to ESLint config.

**Outcome:** Upload → `/results` showing skills, category cards, raw text collapsible.

---

### Phase 6 — ATS Scoring Engine (Days 8–11)
**What happened:** Built the full ATS analysis pipeline: JD input, TF-IDF matching, ATS scoring, gap analysis.

**Files created:**
- `backend/matcher.py` — `compute_tfidf_similarity()`, `get_common_keywords()`
- `backend/ats_scorer.py` — `score_skills()`, `score_experience()`, `score_education()`, `score_keywords()`, `score_structure()`, `score_action_verbs()`, `score_contact_info()`, `compute_ats_score()`
- `backend/keyword_analyzer.py` — `analyze_gaps()`, `find_keywords_in_text()`
- `backend/keywords_db.py` — `ACTION_VERBS`, `SOFT_SKILLS`, `DOMAIN_TERMS`

**ATS scoring weights (final after review):**
- BERT Keywords: 40%
- Skills Match: 30%
- Experience: 15%
- Education: 10%
- Structure: 3%
- Action Verbs: 1%
- Contact Info: 1%

**Key decisions:**
- Experience parser uses regex for explicit year mentions AND date range math using `datetime.now().year` (not hardcoded 2024 — identified as a weakness and fixed)
- Education scoring compares resume level vs JD requirement, not just detects degree
- Structure detection uses multi-alias groups (e.g. "experience", "work history", "employment" all map to the experience section)
- Gap analysis returns 4 categories: skills, action_verbs, soft_skills, domain_terms
- Priority list surfaces the 5 highest-impact gaps

**External ATS comparison:** Our scores (~70%) are lower than inflated free tools (80-90%) intentionally — we're stricter and more honest. Score improvements made: skills partial credit bonus, smoother experience curve, BERT sentence-chunking for fairer comparison.

**Outcome:** Full ATS breakdown, gap analysis, priority suggestions returned from `/match`.

---

### Phase 7 — SQLite Database (Day 13)
**What happened:** Added persistence layer so analyses are saved and retrievable.

**Files created:**
- `backend/database.py` — `init_db()`, `save_upload()`, `save_analysis()`, `get_history()`, `delete_analysis()`, `delete_all_history()`

**Schema (initial):**
```sql
uploads(id, filename, upload_time, skill_count, skills)
analyses(id, upload_id, job_description, similarity_score, ats_score, ats_label, missing_count, common_keywords, analysis_time)
```

**Key decisions:**
- `sqlite3.Row` factory for dict-like row access
- `init_db()` called at Flask startup — safe to call every time, uses `IF NOT EXISTS`
- Foreign key: `analyses.upload_id → uploads.id`
- Job description truncated to 500 chars in DB — full JD not needed for history display

**Challenge:** NULL upload_id rows appearing — guests using app without login caused uploads saved with `user_id=NULL`. Fixed by only saving to DB when user is logged in.

**Outcome:** Every logged-in user analysis persisted; history API returning past analyses.

---

### Phase 8 — BERT Integration (Days 15–16)
**What happened:** Added semantic similarity using Sentence Transformers.

**Files created:**
- `backend/bert_matcher.py` — `compute_bert_similarity()`, `get_combined_score()`, `model` (shared instance)

**Key decisions:**
- Model loaded at module import time (`model = SentenceTransformer('all-MiniLM-L6-v2')`) — not per request
- Single shared model instance imported by `recommender.py` to avoid loading 80MB twice
- Combined score: TF-IDF × 0.35 + BERT × 0.65
- Sentence-level chunking for fairer document comparison (full-doc BERT similarity caps at ~60-70%)
- `similarity_score` alias kept in response for frontend backward compatibility

**Model choice rationale:**
- `all-MiniLM-L6-v2` — 22M params, 384 dimensions, ~80MB, ~14,000 sentences/sec
- Chosen over `all-mpnet-base-v2` (more accurate but 5x slower — not worth it for resume tool)
- First request after Flask start takes 3-5 seconds (model loading) — every subsequent request is fast

**Outcome:** Semantic match score added alongside TF-IDF score; combined score becomes primary display value.

---

### Phase 9 — Job Recommendation Engine (Day 17)
**What happened:** Built content-based job role recommendation using BERT embeddings.

**Files created:**
- `backend/job_roles.py` — 12 role descriptions
- `backend/recommender.py` — `get_job_recommendations()`, `generate_reason()`, pre-computed `role_embeddings`

**Key decisions:**
- Role embeddings pre-computed at module import time — `model.encode(role_descriptions)` runs once at startup
- 12 roles: Backend Developer, Frontend Developer, Full Stack, Data Analyst, Data Engineer, ML Engineer, DevOps, Data Scientist, Cloud Engineer, Mobile Developer, Cybersecurity Analyst, Database Administrator
- `generate_reason()` cross-references resume skills against role description for human-readable explanation
- Frontend shows all 12 roles in scrollable list (not capped at 3)
- `/recommend` endpoint returns `top_n=12` by default

**Outcome:** Resume → ranked list of 12 job roles with scores and reasons.

---

### Phase 10 — AI Suggestions Engine (Day 18)
**What happened:** Built rule-based suggestion generator using ATS and gap data.

**Files created:**
- `backend/suggestion_engine.py` — `generate_suggestions()`

**Suggestion categories:** missing_skill, experience, education, keywords, general

**Priority levels:** high, medium, low

**Key decisions:**
- Suggestions generated from already-computed ATS and gap data — no recomputation
- Capped at 6 suggestions to avoid overwhelming the user
- Sorted by priority (high → medium → low)
- Specific and actionable — references actual missing skills by name
- Resume length check: < 200 words = too short warning, > 1000 words = too long warning

**Outcome:** 3–6 prioritised, specific improvement suggestions returned with match results.

---

### Phase 11 — UI Polish (Day 19)
**What happened:** Final visual polish — drag-and-drop upload, score rings, history page, page transitions.

**Key changes:**
- Drag-and-drop in `UploadPage.jsx` using `onDrop`, `onDragOver`, `onDragLeave`
- `ScoreRing` SVG component with `strokeDashoffset` animation
- `ScoreBar` with `barGrow` CSS animation
- `FadeWrapper` in `App.jsx` keyed to `location.pathname` for page transitions
- `Navbar.jsx` with active link highlighting
- History page with score bars per card
- `Spinner.jsx` component

**Tailwind v4 breaking changes encountered:**
- `@tailwind components` removed → use `@utility` blocks
- `@layer components` not supported for custom utilities
- Hover pseudo-class in `@utility` not supported → inline `hover:` classes in JSX
- `text-(--color-muted)` syntax invalid → use `text-[var(--color-muted)]`

---

### Phase 12 — Authentication (Added after Day 19)
**What happened:** Full JWT auth system added — register, login, protected routes.

**Files modified:**
- `backend/app.py` — `/register`, `/login`, `/me` routes, `flask-jwt-extended` setup
- `backend/database.py` — `users` table, `create_user()`, `get_user_by_email()`, `get_user_by_id()`
- `frontend/src/context/AuthContext.js` — `createContext`, `useAuth` hook
- `frontend/src/context/AuthProvider.jsx` — provider with localStorage token restore
- `frontend/src/components/ProtectedRoute.jsx`
- `frontend/src/lib/api.js` — axios instance with JWT interceptor + 401 auto-logout
- `frontend/src/pages/LoginPage.jsx`
- `frontend/src/pages/SignupPage.jsx`

**Key decisions:**
- JWT stored in `localStorage` (not httpOnly cookie) — tradeoff for SPA simplicity
- Token expiry: 7 days
- Axios instance with request interceptor attaches token per-request (not `axios.defaults`)
- 401 interceptor auto-logs out and redirects to `/login`
- `AuthContext.js` and `AuthProvider.jsx` split into two files (ESLint fast-refresh requirement)
- Only `/history` is protected — all core features (upload, match, results) are public

**Guest flow:**
- Guests can use all features without signing up
- Guest's last analysis stored in `localStorage` with 24-hour expiry
- On login or signup, pending analysis auto-saved to their history via `/save-pending`

---

### Phase 13 — History Features (Added after auth)
**What happened:** Enhanced history with rename, rematch, delete, auto-naming, job role badge.

**Database schema changes:**
- `analyses` table: added `name`, `job_role`, `resume_text` columns
- `uploads` table: added `user_id` column (FK to users)
- `get_history()` updated to filter by `user_id`
- `delete_all_history()` updated to filter by `user_id`

**Files modified:**
- `backend/database.py` — `rename_analysis()`, `get_analysis_by_id()`, `update_user_password()`, `set_user_verified()`
- `backend/app.py` — `/history/:id/rename`, `/history/:id/rematch`, `/save-pending`
- `frontend/src/pages/HistoryPage.jsx` — complete rewrite with inline rename, rematch textarea, job role badge

**Auto-naming logic:** `"Analysis " + str(count + 1).zfill(2)` — produces "Analysis 01", "Analysis 02" etc.

**Rematch:** Stores `resume_text` in DB at analysis time; rematch endpoint re-runs full pipeline using stored text against new JD.

**Challenge:** Rematch returning 400 — `resume_text` was not being passed to `save_analysis()`. Fixed by confirming `resume_text=resume_text` argument in the `/match` save block.

---

### Phase 14 — Email Verification + Password Reset (Final feature)
**What happened:** Gmail-based email verification and password reset added.

**Dependencies added:** `flask-mail`, `itsdangerous`, `python-dotenv`

**Files created:**
- `backend/email_utils.py` — `init_mail()`, `generate_verification_token()`, `verify_email_token()`, `generate_reset_token()`, `verify_reset_token()`, `send_verification_email()`, `send_reset_email()`
- `backend/.env` — `MAIL_USERNAME`, `MAIL_PASSWORD`, `SECRET_KEY`, `JWT_SECRET_KEY`, `FRONTEND_URL`
- `frontend/src/pages/VerifyEmailPage.jsx`
- `frontend/src/pages/ForgotPasswordPage.jsx`
- `frontend/src/pages/ResetPasswordPage.jsx`

**Key decisions:**
- Hard verification — unverified users cannot log in (403 returned)
- `itsdangerous.URLSafeTimedSerializer` for signed tokens (verification: 1 hour, reset: 30 minutes)
- Separate salts for verification and reset tokens prevent token reuse across flows
- Email enumeration prevention — `/forgot-password` always returns 200 regardless of whether email exists
- Gmail App Password used (not regular password) — requires 2-Step Verification enabled
- `FRONTEND_URL` in `.env` constructs correct links for both local and production

**Database changes:**
- `users` table: added `is_verified INTEGER DEFAULT 0`
- `set_user_verified()` function added
- `update_user_password()` function added
- Database deleted and recreated after schema change

**Frontend changes:**
- `LoginPage.jsx` — 403 handling shows unverified banner with resend option, `useAsync` removed (stale closure bug), replaced with direct `api.post` + manual state
- `SignupPage.jsx` — post-register shows "Check your inbox" screen instead of auto-login

**Bug fixed:** Login page was "refreshing" on wrong password — caused by stale closure in `useAsync` sending empty email/password. Fixed by removing `useAsync` and using direct `api.post` with manual `isLoading` and `error` state.

---

### Phase 15 — New Frontend (Complete Rebuild)
**What happened:** Frontend completely rebuilt with production-quality design system.

**New frontend stack:**
- Vite 6, React 18.3, react-router-dom 7, axios 1.7, Tailwind CSS v4
- Google Fonts: Fraunces (display), Instrument Sans (UI), JetBrains Mono (scores)
- CSS-only animations: slideUp, fadeIn, shimmerPulse, ringDraw, barGrow, spin
- Inline SVGs — no icon library
- SVG noise texture via `body::before` with multiply blend mode

**Key architectural changes:**
- `src/lib/api.js` — axios instance with interceptors
- `src/lib/storage.js` — `session.get/set/remove`, `savePendingAnalysis()`, `getPendingAnalysis()`, `clearPendingAnalysis()`
- `src/hooks/useAsync.js` — consistent loading/error/retry pattern
- `SessionExpired` component replaces silent redirect
- `ScoreRing`, `ScoreBar`, `SectionCard` extracted as separate components
- `AnalysisLoader` with step-by-step progress messages

**Design system:**
- `--color-bg: #F7F6F3` (warm off-white)
- `--color-ink: #1C1C1A` (charcoal)
- `--color-teal: #1A6B52` (single accent)
- `--color-card: #FEFEFE`
- `--color-border: #E8E6E0`
- Score gauges: single teal accent at varying opacity — NOT traffic-light colours

**Bugs found and fixed in new frontend:**
1. `HistoryPage` field mismatches: `combined_score` → `similarity_score`, `skills_count` → `skill_count`, `gaps_count` → `missing_count`, `created_at` → `analysis_time`
2. Rematch reads `data` not `res.data` (useAsync unwraps response)
3. `gaps.priority` rendered as string — is actually an array, fixed to map as badges
4. `AnalysisPage` useAsync stale closure for match function — fixed to pass resume data explicitly
5. `ScoreRing` initial `strokeDashoffset` was `undefined` — fixed to `circumference` to prevent flash

---

### Phase 16 — Navbar Redesign
**What happened:** Navbar refactored for cleaner guest/user states.

**Final navbar behaviour:**
- Guest: Upload link + single "Sign in" button
- Logged in: Upload link + avatar circle with initials + dropdown (History, Logout)
- History hidden from guests entirely
- Dropdown closes via `navigateTo()` helper (not `useEffect` setState — avoids React setState-in-effect warning)
- Outside click handler via `useRef` + `document.addEventListener`

---

### Phase 17 — Presentation
**What happened:** 12-slide PowerPoint generated using pptxgenjs covering the DL perspective of the project.

**Slides:**
1. Title (dark navy)
2. Agenda (8 topics)
3. Problem Space (stats + challenges)
4. NLP Pipeline (5-step flow)
5. TF-IDF vs BERT comparison
6. BERT Architecture (dark theme)
7. Sentence Transformers in Production
8. 7-Factor ATS Scoring (bar chart)
9. Job Recommendation Engine
10. System Architecture (3-layer)
11. Results & Evaluation (comparison table)
12. Key Takeaways (dark theme)

---

## 3. Complete Technology Stack

### Frontend

| Technology | Version | Purpose | Why chosen |
|---|---|---|---|
| React | 18.3.1 | UI framework | Component model, hooks, ecosystem |
| Vite | 6.0.7 | Build tool | Fast HMR, ES modules, replaces CRA |
| react-router-dom | 7.1.1 | Client routing | SPA navigation, URL-based routing |
| axios | 1.7.7 | HTTP client | Interceptors, instance config, cleaner than fetch |
| Tailwind CSS | 4.0 | Utility CSS | Zero CSS files, design constraints |
| @tailwindcss/vite | 4.0 | Vite plugin | Tailwind v4 integration, no PostCSS needed |
| Google Fonts | — | Typography | Fraunces, Instrument Sans, JetBrains Mono |

**Not used:** CRA (unmaintained), PostCSS, tailwind.config.js (v4 auto-detects), icon libraries, motion libraries (framer-motion), UI kits (shadcn, MUI), Redux/Zustand

### Backend

| Technology | Version | Purpose |
|---|---|---|
| Python | 3.x | Backend language |
| Flask | latest | Web framework |
| flask-cors | latest | CORS headers |
| flask-jwt-extended | latest | JWT auth |
| flask-mail | latest | Email sending |
| bcrypt | latest | Password hashing |
| Werkzeug | latest | Secure filename, WSGI utilities |
| itsdangerous | latest | Signed token generation |
| python-dotenv | latest | .env loading |

### AI / NLP

| Technology | Purpose |
|---|---|
| spaCy (en_core_web_sm) | Tokenisation, lemmatisation, POS tagging |
| NLTK | Stopword corpus |
| scikit-learn TfidfVectorizer | TF-IDF vectorisation |
| scikit-learn cosine_similarity | Similarity computation |
| Sentence Transformers | BERT semantic embeddings |
| all-MiniLM-L6-v2 | 384-dim embedding model |
| pdfplumber | PDF text extraction |

### Database

| Technology | Purpose |
|---|---|
| SQLite | Embedded relational database |
| sqlite3 (stdlib) | Direct SQL — no ORM |

**Why SQLite:** Embedded, zero-config, sufficient for single-server MVP. PostgreSQL recommended for production scaling.

### Deployment

| Service | Purpose |
|---|---|
| Vercel | Frontend hosting (React/Vite static build) |
| Render | Backend hosting (Flask/Python) |

---

## 4. Complete Folder Structure

```
resume-analyzer/
│
├── backend/
│   ├── app.py                   # Flask entry point, all routes
│   ├── database.py              # SQLite schema + all DB functions
│   ├── nlp_utils.py             # Text cleaning and tokenisation
│   ├── skill_extractor.py       # Skill detection from text
│   ├── skills_db.py             # Skills database (7 categories)
│   ├── matcher.py               # TF-IDF similarity computation
│   ├── bert_matcher.py          # BERT semantic similarity
│   ├── ats_scorer.py            # 7-factor ATS scoring engine
│   ├── keyword_analyzer.py      # Gap analysis across 4 categories
│   ├── keywords_db.py           # Action verbs, soft skills, domain terms
│   ├── recommender.py           # Job role recommendation engine
│   ├── job_roles.py             # 12 job role descriptions
│   ├── suggestion_engine.py     # AI resume suggestions
│   ├── email_utils.py           # Gmail SMTP + token generation
│   ├── requirements.txt         # Python dependencies
│   ├── .env                     # Secrets (gitignored)
│   ├── .gitignore
│   ├── resume_analyzer.db       # SQLite database (gitignored)
│   └── uploads/                 # Uploaded PDFs (gitignored)
│       └── .gitkeep
│
└── frontend/
    ├── index.html               # Entry HTML with Google Fonts
    ├── vite.config.js           # Vite + React + Tailwind config
    ├── package.json
    ├── .env.local               # VITE_API_URL (gitignored)
    ├── .gitignore
    └── src/
        ├── main.jsx             # ReactDOM entry
        ├── App.jsx              # Routes + FadeWrapper + AuthProvider
        ├── index.css            # Design system + @utility blocks + keyframes
        │
        ├── context/
        │   ├── AuthContext.js   # createContext + useAuth hook
        │   └── AuthProvider.jsx # Auth state + token restore
        │
        ├── hooks/
        │   └── useAsync.js      # Consistent loading/error/retry
        │
        ├── lib/
        │   ├── api.js           # Axios instance + JWT interceptor
        │   └── storage.js       # sessionStorage helpers + pending analysis
        │
        ├── components/
        │   ├── Navbar.jsx       # Navigation + avatar dropdown
        │   ├── ProtectedRoute.jsx # Auth guard (history only)
        │   ├── ScoreRing.jsx    # SVG animated score ring
        │   ├── ScoreBar.jsx     # Animated factor bar
        │   ├── SectionCard.jsx  # Card wrapper with title/subtitle
        │   ├── SkillBadge.jsx   # Skill chip (default/success/missing)
        │   ├── CategoryCard.jsx # Skill group by category
        │   ├── AnalysisLoader.jsx # Step-by-step progress loader
        │   ├── SessionExpired.jsx # Friendly session timeout screen
        │   └── Spinner.jsx      # Simple loading spinner
        │
        └── pages/
            ├── UploadPage.jsx        # PDF upload with drag-and-drop
            ├── AnalysisPage.jsx      # Skills, recommendations, JD input
            ├── MatchPage.jsx         # Match scores, ATS breakdown, gaps
            ├── HistoryPage.jsx       # Past analyses with rename/rematch
            ├── LoginPage.jsx         # Sign in form
            ├── SignupPage.jsx        # Register form
            ├── VerifyEmailPage.jsx   # Email verification handler
            ├── ForgotPasswordPage.jsx # Request password reset
            └── ResetPasswordPage.jsx # Set new password
```

---

## 5. File-by-File Documentation

### `backend/app.py`

**Purpose:** Flask application entry point. Contains all route definitions, Flask config, JWT setup, mail init, and startup initialisation.

**Key responsibilities:**
- Flask app creation and CORS configuration
- JWT and mail initialisation
- All HTTP route handlers
- PDF text extraction helper (`extract_text_from_pdf`)
- File upload validation (`allowed_file`)
- Optional JWT extraction for guest-compatible routes

**Routes:**
```
POST   /register
POST   /login
GET    /me
POST   /upload
POST   /match
POST   /recommend
POST   /suggest
POST   /save-pending
GET    /history
PATCH  /history/<id>/rename
POST   /history/<id>/rematch
DELETE /history/<id>
DELETE /history
POST   /verify-email/<token>
POST   /resend-verification
POST   /forgot-password
POST   /reset-password
```

**Startup sequence:**
1. `load_dotenv()` reads `.env`
2. `init_db()` creates tables if not exist
3. `init_mail(app)` configures Gmail SMTP
4. BERT model loads when `bert_matcher` and `recommender` modules import

---

### `backend/database.py`

**Purpose:** All database interactions. Single file, no ORM.

**Functions:**

| Function | Purpose |
|---|---|
| `get_connection()` | Returns SQLite connection with Row factory |
| `init_db()` | Creates all tables on startup |
| `create_user(name, email, hash)` | Inserts user, returns ID |
| `get_user_by_email(email)` | Fetch user dict by email |
| `get_user_by_id(id)` | Fetch user dict by ID |
| `set_user_verified(user_id)` | Sets is_verified=1 |
| `update_user_password(user_id, hash)` | Updates password hash |
| `save_upload(filename, skill_count, skills, user_id)` | Saves upload, returns ID |
| `save_analysis(...)` | Saves analysis with auto-name generation |
| `get_history(user_id, limit=20)` | Fetches user's analyses via JOIN |
| `delete_analysis(analysis_id)` | Deletes analysis + orphaned upload |
| `delete_all_history(user_id)` | Clears all user data |
| `rename_analysis(analysis_id, new_name)` | Updates name field |
| `get_analysis_by_id(analysis_id)` | Fetches single analysis for rematch |

**Auto-naming logic:**
```python
count = cursor.execute("SELECT COUNT(*) FROM analyses WHERE upload_id IN (SELECT id FROM uploads WHERE user_id = ?)", (upload_id,)).fetchone()[0]
name = f"Analysis {str(count + 1).zfill(2)}"
```

---

### `backend/nlp_utils.py`

**Purpose:** Text preprocessing pipeline.

**Functions:**

`clean_text(text)`:
1. Lowercase
2. Remove emails (`\S+@\S+`)
3. Remove URLs (`http\S+|www\S+`)
4. Remove special characters and digits (`[^a-z\s]`)
5. Collapse whitespace

`tokenise(text)`:
- Uses spaCy `en_core_web_sm`
- Filters: `not token.is_stop`, `not token.is_punct`, `not token.is_space`, `len > 2`
- Returns `token.lemma_` (lemmatised form)

`clean_and_tokenise(text)`:
- Returns dict: `{cleaned_text, tokens, token_count, unique_tokens}`

---

### `backend/skills_db.py`

**Purpose:** Skill knowledge base.

**Structure:**
```python
SKILLS = {
    "programming_languages": [...],
    "frontend": [...],
    "backend": [...],
    "databases": [...],
    "ai_ml": [...],
    "devops_cloud": [...],
    "tools": [...]
}
ALL_SKILLS = [skill for category in SKILLS.values() for skill in category]
```

Approximately 100 skills across 7 categories. Editable — users encouraged to add project-specific skills.

---

### `backend/skill_extractor.py`

**Purpose:** Extracts skills from text using whole-word matching.

**Matching logic:**
```python
idx = text_lower.find(skill_lower)
before = text_lower[idx - 1] if idx > 0 else " "
after = text_lower[idx + len(skill_lower)] if ... else " "
if not before.isalpha() and not after.isalpha():
    found.append(skill)
```

This prevents "C" matching inside "CI/CD" or "React" matching inside "Reactive".

**Functions:**
- `extract_skills(text)` → flat list
- `extract_skills_by_category(text)` → dict by category
- `find_missing_skills(resume_text, jd_text)` → skills in JD not in resume

---

### `backend/matcher.py`

**Purpose:** TF-IDF keyword similarity.

**Algorithm:**
1. Clean both texts
2. `TfidfVectorizer().fit_transform([resume, jd])` → sparse matrix
3. `cosine_similarity(matrix[0:1], matrix[1:2])` → score
4. Return as percentage (0-100)

`get_common_keywords(resume, jd, top_n=10)`:
- Finds words appearing in both texts
- Filters to length > 3
- Returns top_n

---

### `backend/bert_matcher.py`

**Purpose:** BERT semantic similarity using Sentence Transformers.

**Model:** `all-MiniLM-L6-v2` — loaded once at module import.

**`compute_bert_similarity(resume, jd)`:**
1. Clean both texts
2. Split into sentences (split on `.`)
3. Filter sentences > 20 chars
4. Encode all sentences (capped at 20 each for speed)
5. For each JD sentence, find best matching resume sentence
6. Average best matches
7. Scale × 1.30 (sentence similarity is naturally lower than full-doc)
8. Cap at 100

**`get_combined_score(tfidf, bert)`:**
```python
return round((tfidf * 0.35) + (bert * 0.65), 1)
```

---

### `backend/ats_scorer.py`

**Purpose:** 7-factor weighted ATS scoring engine.

**Factors and weights:**

| Factor | Weight | Algorithm |
|---|---|---|
| BERT keywords | 40% | Semantic similarity via `bert_matcher` |
| Skills match | 30% | `matched / jd_skills` + partial credit bonus |
| Experience | 15% | Date range math + explicit year patterns |
| Education | 10% | Resume level vs JD requirement |
| Structure | 3% | Section detection with multi-alias groups |
| Action verbs | 1% | 25-verb dictionary intersection |
| Contact info | 1% | Regex: email, phone, LinkedIn, GitHub |

**Experience scoring:**
- Explicit: `r"(\d+)\+?\s*years?\s*of\s*experience"`
- Date ranges: `r"(month)?\s*(20\d\d)\s*[-–—to]+\s*(20\d\d|present|current|now)"`
- Uses `CURRENT_YEAR = datetime.now().year` (not hardcoded)
- Smooth curve: 0.5yr=35%, 1yr=50%, 2yr=65%, 3yr=80%, 4yr=90%, 5yr+=100%

**Education levels:**
- 0=unknown, 1=diploma, 2=bachelor, 3=master, 4=PhD
- Compares resume level vs JD required level
- If resume ≥ required: 100%, one below: 60%, further below: 30%

**Output:**
```json
{
  "ats_score": 74.2,
  "label": "Good",
  "breakdown": {
    "skills": { "score": 80.0, "weight": 30, "matched_skills": [...], "missing_skills": [...] },
    "keywords": { "score": 68.4, "weight": 40 },
    ...
  },
  "insights": {
    "matched_skills": [...],
    "missing_skills": [...],
    "found_verbs": [...],
    "contact_present": { "email": true, "phone": true, "linkedin": false, "github": false }
  }
}
```

---

### `backend/keyword_analyzer.py`

**Purpose:** Gap analysis across 4 categories.

**`analyze_gaps(resume_text, job_description)`:**
1. Skill gap: `jd_skills - resume_skills` using `extract_skills()`
2. Action verb gap: `find_keywords_in_text()` on `ACTION_VERBS`
3. Soft skill gap: `find_keywords_in_text()` on `SOFT_SKILLS`
4. Domain term gap: `find_keywords_in_text()` on `DOMAIN_TERMS`
5. Priority: `(missing_skills + missing_domain)[:5]`

**Output:**
```json
{
  "missing": {
    "skills": [...],
    "action_verbs": [...],
    "soft_skills": [...],
    "domain_terms": [...]
  },
  "total_missing": 8,
  "priority": ["AWS", "Docker", "agile", "microservices"]
}
```

---

### `backend/keywords_db.py`

**Purpose:** Curated keyword lists for gap analysis.

| List | Contents |
|---|---|
| `ACTION_VERBS` | 26 professional verbs: led, built, designed, deployed... |
| `SOFT_SKILLS` | 16 soft skills: communication, leadership, teamwork... |
| `DOMAIN_TERMS` | 24 industry terms: agile, scrum, microservices, CI/CD... |

---

### `backend/recommender.py`

**Purpose:** BERT-powered job role recommendation.

**Startup:** `role_embeddings = model.encode(role_descriptions)` — computed once.

**`get_job_recommendations(resume_text, top_n=12)`:**
1. Encode cleaned resume text
2. `cosine_similarity([resume_emb], role_embeddings)` → 12 scores
3. `sorted(zip(roles, scores), key=lambda x: x[1], reverse=True)`
4. For each top role: call `generate_reason(resume_skills, role)`
5. Returns list of `{role, score, reason}`

**`generate_reason(resume_skills, role)`:**
- Finds resume skills mentioned in role description
- Returns `"Strong match due to {skill1}, {skill2}, {skill3} experience"`

---

### `backend/suggestion_engine.py`

**Purpose:** Rule-based AI suggestions from ATS + gap data.

**Suggestion triggers:**

| Condition | Message type | Priority |
|---|---|---|
| Missing skills > 3 | missing_skill | high |
| Resume skills < 5 | missing_skill | high |
| Experience score < 50 | experience | high |
| Experience score < 75 | experience | medium |
| Missing action verbs | experience | medium |
| Education not detected | education | medium |
| Education < bachelor | education | low |
| Missing domain terms | keywords | high |
| Missing soft skills | keywords | low |
| Keywords score < 30 | keywords | high |
| Resume < 200 words | general | high |
| Resume > 1000 words | general | low |

Sorted high → medium → low, capped at 6.

---

### `backend/email_utils.py`

**Purpose:** Gmail SMTP integration and signed token generation.

**Token generation:**
```python
s = URLSafeTimedSerializer(SECRET_KEY)
token = s.dumps(email, salt="email-verify")  # or "password-reset"
email = s.loads(token, salt="email-verify", max_age=3600)
```

**Email templates:** HTML emails with inline styles matching app colour palette. Links constructed as `{FRONTEND_URL}/verify-email/{token}`.

---

### `frontend/src/lib/api.js`

**Purpose:** Single axios instance for all API calls.

```javascript
const BASE_URL = import.meta.env.VITE_API_URL ||
                 import.meta.env.REACT_APP_BACKEND_URL ||
                 "http://localhost:5000"

const api = axios.create({ baseURL: BASE_URL })

// Attach JWT per-request
api.interceptors.request.use(config => {
  const token = localStorage.getItem("token")
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// Auto-logout on 401
api.interceptors.response.use(res => res, err => {
  if (err.response?.status === 401) {
    localStorage.removeItem("token")
    window.location.href = "/login"
  }
  return Promise.reject(err)
})
```

---

### `frontend/src/lib/storage.js`

**Purpose:** All storage operations in one place.

```javascript
// sessionStorage helpers
export const session = {
  set: (key, value) => sessionStorage.setItem(key, JSON.stringify(value)),
  get: (key) => { try { const v = sessionStorage.getItem(key); return v ? JSON.parse(v) : null } catch { return null } },
  remove: (key) => sessionStorage.removeItem(key),
}

// localStorage with 24-hour TTL for guest pending analysis
export function savePendingAnalysis(data) { ... }
export function getPendingAnalysis() { ... }  // returns null if expired
export function clearPendingAnalysis() { ... }
```

---

### `frontend/src/hooks/useAsync.js`

**Purpose:** Consistent async state management.

```javascript
export default function useAsync(asyncFn) {
  const [status, setStatus] = useState("idle")  // idle | loading | success | error
  const [data, setData] = useState(null)
  const [error, setError] = useState(null)

  const execute = useCallback(async (...args) => {
    setStatus("loading")
    setError(null)
    try {
      const result = await asyncFn(...args)
      setData(result); setStatus("success")
      return result
    } catch (err) {
      const message = err.response?.data?.error || err.message || "Something went wrong"
      setError(message); setStatus("error")
      throw err
    }
  }, [asyncFn])

  return { execute, data, error, reset, isIdle, isLoading, isSuccess, isError }
}
```

**Important limitation:** `useAsync` memoizes `asyncFn` with `useCallback`. Functions that close over state variables (like email/password in login) will capture stale values. For forms, use direct `api.post` with manual state instead.

---

### `frontend/src/context/AuthContext.js`

```javascript
export const AuthContext = createContext(null)
export const useAuth = () => useContext(AuthContext)
```

Split from `AuthProvider.jsx` to satisfy ESLint `react-refresh/only-export-components` rule.

---

### `frontend/src/context/AuthProvider.jsx`

**Responsibilities:**
- On mount: reads token from localStorage, calls `/me` to restore user
- `login(token, userData)`: saves token to localStorage, sets user state
- `logout()`: removes token from localStorage, clears user state
- Provides `{ user, loading, login, logout }` to all children

---

### `frontend/src/App.jsx`

**Responsibilities:**
- Wraps app in `AuthProvider` and `BrowserRouter`
- `FadeWrapper` component: fades on `location.pathname` change (50ms delay + opacity transition)
- Route definitions

**Route protection:**
- `/` `/analysis` `/match` `/login` `/signup` `/verify-email/:token` `/forgot-password` `/reset-password/:token` → public
- `/history` → `<ProtectedRoute>` → redirects to `/login` if unauthenticated

---

### `frontend/src/index.css`

**Full design system:**
```css
@import "tailwindcss";
@reference "tailwindcss";

:root {
  --font-display: "Fraunces", serif;
  --font-sans:    "Instrument Sans", sans-serif;
  --font-mono:    "JetBrains Mono", monospace;
  --color-bg:     #F7F6F3;
  --color-ink:    #1C1C1A;
  --color-teal:   #1A6B52;
  --color-teal-dim: #155940;
  --color-card:   #FEFEFE;
  --color-border: #E8E6E0;
  --color-muted:  #9B9790;
  --color-paper:  #F4F2ED;
}

/* SVG noise texture via body::before — opacity 0.035, mix-blend-mode multiply */
/* Keyframes: slideUp, fadeIn, shimmerPulse, ringDraw, barGrow, spin */

@utility card { ... }
@utility btn-primary { ... }
@utility btn-secondary { ... }
@utility section-label { ... }
@utility page-container { ... }
```

---

## 6. System Architecture

```
User (Browser)
     │
     ▼
React SPA (Vite)
  - FadeWrapper (page transitions)
  - AuthProvider (JWT state)
  - ProtectedRoute (history guard)
     │
     ▼
Axios Instance (api.js)
  - JWT header injected per-request
  - 401 → auto-logout
     │
     ▼
Flask REST API (app.py)
  - CORS middleware
  - JWT verification (@jwt_required)
  - Optional JWT (guest routes)
  - Request validation
     │
     ├──────────────────────────────────┐
     ▼                                  ▼
NLP Pipeline                    SQLite Database
  - pdfplumber (extract)          - users
  - nlp_utils (clean)             - uploads
  - skill_extractor               - analyses
     │
     ▼
Scoring Engine
  - matcher.py (TF-IDF)
  - bert_matcher.py (BERT)
  - ats_scorer.py (7-factor)
  - keyword_analyzer.py (gaps)
  - suggestion_engine.py
  - recommender.py
     │
     ▼
JSON Response → React → sessionStorage → Results Pages
```

---

## 7. Database Documentation

### Schema

```sql
CREATE TABLE users (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  name          TEXT NOT NULL,
  email         TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  is_verified   INTEGER DEFAULT 0,
  created_at    TEXT NOT NULL
);

CREATE TABLE uploads (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id     INTEGER,                          -- NULL for pre-auth uploads (not used post-fix)
  filename    TEXT NOT NULL,
  upload_time TEXT NOT NULL,
  skill_count INTEGER DEFAULT 0,
  skills      TEXT DEFAULT '',                  -- comma-separated skill list
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE analyses (
  id               INTEGER PRIMARY KEY AUTOINCREMENT,
  upload_id        INTEGER,
  name             TEXT DEFAULT '',             -- "Analysis 01", user-renameable
  job_role         TEXT DEFAULT '',             -- BERT-detected role from JD
  job_description  TEXT,                        -- truncated to 500 chars
  similarity_score REAL,                        -- combined TF-IDF + BERT score
  ats_score        REAL,
  ats_label        TEXT,                        -- "Excellent" | "Good" | "Fair" | "Needs work"
  missing_count    INTEGER DEFAULT 0,
  common_keywords  TEXT DEFAULT '',
  resume_text      TEXT DEFAULT '',             -- stored for rematch (truncated to 3000 chars)
  analysis_time    TEXT NOT NULL,
  FOREIGN KEY (upload_id) REFERENCES uploads(id)
);
```

### Relationships
- `uploads.user_id → users.id` (nullable — though post-fix never NULL for logged-in users)
- `analyses.upload_id → uploads.id`
- History query uses `JOIN uploads u ON a.upload_id = u.id WHERE u.user_id = ?`

---

## 8. API Documentation

### Auth Routes

#### `POST /register`
```json
Request: { "name": "string", "email": "string", "password": "string (min 6)" }
Success 201: { "message": "...", "requires_verification": true }
Error 400: { "error": "Name, email and password are required" }
Error 409: { "error": "An account with this email already exists" }
```

#### `POST /login`
```json
Request: { "email": "string", "password": "string" }
Success 200: { "message": "Login successful", "token": "JWT", "user": { "id", "name", "email" } }
Error 401: { "error": "Invalid email or password" }
Error 403: { "error": "Please verify your email...", "requires_verification": true, "email": "..." }
```

#### `GET /me` *(JWT required)*
```json
Success 200: { "id": 1, "name": "...", "email": "..." }
```

#### `POST /verify-email/<token>`
```json
Success 200: { "message": "Email verified successfully. You can now log in." }
Error 400: { "error": "Verification link is invalid or has expired." }
```

#### `POST /resend-verification`
```json
Request: { "email": "string" }
Success 200: { "message": "If that email exists, a verification link has been sent." }
```

#### `POST /forgot-password`
```json
Request: { "email": "string" }
Success 200: { "message": "If that email exists, a reset link has been sent." }
```

#### `POST /reset-password`
```json
Request: { "token": "string", "password": "string (min 6)" }
Success 200: { "message": "Password reset successfully. You can now log in." }
Error 400: { "error": "Reset link is invalid or has expired." }
```

### Core Routes

#### `POST /upload` *(JWT optional)*
```
Content-Type: multipart/form-data
Body: file (PDF, max 5MB)
```
```json
Success 200: {
  "message": "File uploaded successfully",
  "filename": "resume.pdf",
  "upload_id": 4,           // null for guests
  "text": "raw extracted text...",
  "cleaned": { "cleaned_text", "tokens", "token_count", "unique_tokens" },
  "skills": {
    "detected": ["Python", "React", ...],
    "count": 17,
    "by_category": { "programming_languages": [...], ... }
  }
}
Error 400: { "error": "Only PDF files are allowed" }
Error 422: { "error": "Could not extract text — PDF may be scanned or image-based" }
```

#### `POST /match` *(JWT optional)*
```json
Request: {
  "resume_text": "string",
  "job_description": "string",
  "upload_id": 4           // optional, null for guests
}
Success 200: {
  "tfidf_score": 42.3,
  "bert_score": 71.8,
  "combined_score": 61.9,
  "similarity_score": 61.9,  // alias for frontend compatibility
  "label": "Good match",
  "common_keywords": [...],
  "ats": {
    "ats_score": 74.2,
    "label": "Good",
    "breakdown": {
      "skills": { "score": 80.0, "weight": 30, "matched_skills": [...], "missing_skills": [...] },
      "keywords": { "score": 68.4, "weight": 40 },
      "experience": { "score": 50.0, "weight": 15 },
      "education": { "score": 75.0, "weight": 10 },
      "structure": { "score": 60.0, "weight": 3 },
      "action_verbs": { "score": 80.0, "weight": 1 },
      "contact_info": { "score": 75.0, "weight": 1 }
    },
    "insights": { "matched_skills": [...], "missing_skills": [...], "found_verbs": [...], "contact_present": {...} }
  },
  "gaps": {
    "missing": { "skills": [...], "action_verbs": [...], "soft_skills": [...], "domain_terms": [...] },
    "total_missing": 8,
    "priority": [...]
  },
  "suggestions": [{ "type": "missing_skill", "priority": "high", "message": "..." }],
  "job_role": "ML Engineer",
  "saved_to_history": true
}
```

#### `POST /recommend` *(JWT optional)*
```json
Request: { "resume_text": "string" }
Success 200: {
  "recommendations": [
    { "role": "ML Engineer", "score": 84.2, "reason": "Strong match due to TensorFlow, PyTorch" },
    ...
  ],
  "total_roles_checked": 12
}
```

#### `GET /history` *(JWT required)*
```json
Success 200: {
  "history": [
    {
      "id": 1, "name": "Analysis 01", "job_role": "ML Engineer",
      "similarity_score": 61.9, "ats_score": 74.2, "ats_label": "Good",
      "missing_count": 8, "common_keywords": "python, flask, ...",
      "analysis_time": "2026-06-01T10:30:00", "filename": "resume.pdf",
      "skill_count": 17, "skills": "Python, React, ...", "job_description": "..."
    }
  ]
}
```

#### `PATCH /history/<id>/rename` *(JWT required)*
```json
Request: { "name": "string (max 50 chars)" }
Success 200: { "message": "Renamed successfully", "name": "My ML Application" }
```

#### `POST /history/<id>/rematch` *(JWT required)*
```json
Request: { "job_description": "string" }
Success 200: { ...same as /match response... }
```

#### `DELETE /history/<id>` *(JWT required)*
```json
Success 200: { "message": "Analysis deleted" }
```

#### `DELETE /history` *(JWT required)*
```json
Success 200: { "message": "All history cleared" }
```

---

## 9. AI/NLP Pipeline

### Full Pipeline Flow

```
PDF File
  ↓ pdfplumber.open() → page.extract_text()
Raw Text
  ↓ clean_text(): lowercase, remove emails/URLs/special chars, collapse whitespace
Cleaned Text
  ↓ tokenise(): spaCy → filter stop/punct/space → lemma_
Token List
  ↓
  ├── skill_extractor → detected skills (flat + by category)
  ├── TfidfVectorizer.fit_transform([resume, jd]) → cosine_similarity → TF-IDF score
  ├── model.encode(sentences) → cosine_similarity → BERT score
  ├── get_combined_score(tfidf × 0.35 + bert × 0.65) → combined score
  ├── ats_scorer → 7-factor score
  ├── keyword_analyzer → gap analysis
  ├── suggestion_engine → suggestions
  └── recommender → job roles
  ↓
JSON Response
```

### Scoring Constants

| Constant | Value | Purpose |
|---|---|---|
| TF-IDF weight | 0.35 | Contribution to combined score |
| BERT weight | 0.65 | Contribution to combined score |
| Skills weight | 0.30 | ATS factor weight |
| Keywords weight | 0.40 | ATS factor weight |
| Experience weight | 0.15 | ATS factor weight |
| Education weight | 0.10 | ATS factor weight |
| Structure weight | 0.03 | ATS factor weight |
| Action verbs weight | 0.01 | ATS factor weight |
| Contact info weight | 0.01 | ATS factor weight |
| Sentence scale factor | 1.30 | BERT sentence similarity scaling |
| Max suggestion count | 6 | Cap per analysis |
| Max JD stored | 500 chars | DB truncation |
| Max resume stored | 3000 chars | DB truncation for rematch |
| Token min length | 3 chars | NLP filter |
| Max file size | 5MB | Upload limit |
| JWT expiry | 7 days | Token TTL |
| Verification expiry | 3600s (1hr) | Token TTL |
| Reset expiry | 1800s (30min) | Token TTL |

---

## 10. Configuration Files

### `backend/.env`
```
MAIL_USERNAME=your.gmail@gmail.com
MAIL_PASSWORD=xxxx xxxx xxxx xxxx    # Gmail App Password (16 chars)
SECRET_KEY=long-random-string        # For itsdangerous token signing
JWT_SECRET_KEY=another-random-string  # For flask-jwt-extended
FRONTEND_URL=http://localhost:3000   # For email link construction
```

### `frontend/.env.local`
```
VITE_API_URL=http://localhost:5000
```

### `frontend/vite.config.js`
```javascript
import { defineConfig } from "vite"
import react from "@vitejs/plugin-react"
import tailwindcss from "@tailwindcss/vite"

export default defineConfig({
  plugins: [react(), tailwindcss()]
})
```

### `backend/requirements.txt`
```
flask
flask-cors
flask-jwt-extended
flask-mail
pdfplumber
spacy
nltk
scikit-learn
sentence-transformers
bcrypt
werkzeug
itsdangerous
python-dotenv
```

---

## 11. Bug History

### Bug 1 — "Backend not reachable"
**Symptom:** Frontend showed backend not reachable on Day 1.
**Cause:** Flask wasn't running, or `CORS(app)` was missing/misplaced.
**Fix:** Confirmed Flask running; verified `CORS(app)` placed immediately after `app = Flask(__name__)`.

### Bug 2 — PowerShell curl not working
**Symptom:** `curl -X POST` failed with parameter binding error.
**Cause:** PowerShell's `curl` is an alias for `Invoke-WebRequest`, not Unix curl.
**Fix:** All curl commands replaced with `iwr -Uri ... -Method POST -ContentType ... -Body ...`. Alternative: install real curl via `winget install curl.curl`.

### Bug 3 — TypeScript red underline on `JSON.parse(stored)`
**Symptom:** VS Code showed red underline on sessionStorage parse.
**Cause:** VS Code treating `.jsx` file as TypeScript because of `tsconfig.json` presence, or ESLint rules.
**Fix:** Added `"no-unused-vars": "off"` and `"no-undef": "off"` to ESLint config. For setState-in-effect warnings: moved sessionStorage reads into `useState` initialisers.

### Bug 4 — `setMatchLoading` declared but never read
**Symptom:** ESLint warning on `setMatchLoading`.
**Cause:** Button still referenced old `matchStatus === "loading"` instead of `matchLoading`.
**Fix:** Updated button to use `disabled={matchLoading}` and `{matchLoading ? ... : "..."}`.

### Bug 5 — NULL user_id rows in uploads table
**Symptom:** History showed no data; DB had NULL user_id in uploads.
**Cause:** Upload endpoint saved to DB regardless of auth status; `upload_id` was being sent but `user_id` wasn't being linked.
**Fix:** Wrapped `save_upload()` call in `if user_id:` check. Only save to DB when JWT present.

### Bug 6 — Rematch returning 400
**Symptom:** History rematch endpoint returned 400 Bad Request.
**Cause:** `resume_text` column was empty in DB — `resume_text=resume_text` argument missing from `save_analysis()` call in `/match` route.
**Fix:** Added `resume_text=resume_text` to `save_analysis()` call. Cleared old rows and re-tested.

### Bug 7 — JD not persisting on "Back to results"
**Symptom:** Job description textarea empty when navigating back from `/match`.
**Cause:** `ResultsPage` re-mounts on navigation and initialises `jobDescription` state as `""`.
**Fix:** Save JD to `sessionStorage("lastJobDescription")` before navigating; restore in `useState` initialiser on mount.

### Bug 8 — Login page "refreshing" on wrong password
**Symptom:** Page appeared to refresh instead of showing error message.
**Cause:** `useAsync` memoizes the async function with `useCallback`. The function closed over `email` and `password` at render time — stale values (empty strings) sent to backend, getting 401, causing re-render loop appearance.
**Fix:** Removed `useAsync` from `LoginPage`. Used direct `api.post` with manual `isLoading`, `error` state. This gives the function access to current state values at execution time.

### Bug 9 — `@utility btn-primary:hover` invalid
**Symptom:** Tailwind v4 CSS build error: "defines an invalid utility name".
**Cause:** Tailwind v4 `@utility` does not support pseudo-class syntax.
**Fix:** Move hover styles into plain CSS within the utility, or add `hover:bg-[#155940]` directly in JSX className.

### Bug 10 — `@tailwind components` not available
**Symptom:** Vite build error about `@tailwind components`.
**Cause:** Tailwind v4 removed `@layer components` directive.
**Fix:** Replace with `@utility` blocks using plain CSS properties.

### Bug 11 — HistoryPage field mismatches
**Symptom:** History cards showed undefined values.
**Cause:** New frontend used `combined_score`, `skills_count`, `gaps_count`, `created_at` but backend returns `similarity_score`, `skill_count`, `missing_count`, `analysis_time`.
**Fix:** Updated HistoryPage to use correct field names.

### Bug 12 — `gaps.priority` rendered as string
**Symptom:** Priority section showed `[object Object]` or raw array string.
**Cause:** `gaps.priority` is an array of strings but was rendered as a single div child.
**Fix:** Changed to `.map()` over array and render as `SkillBadge` components.

### Bug 13 — `SignupPage` missing closing parenthesis
**Symptom:** Compile error in SignupPage.jsx.
**Cause:** `useState("")` for `registeredEmail` was missing closing `)`.
**Fix:** Added `)`. Also moved `if (registered) { return (...) }` block to before the main `return` statement — it was incorrectly placed inside the JSX.

---

## 12. Security Documentation

### Password Hashing
- `bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")`
- Salt is randomly generated per password
- Cost factor: bcrypt default (10 rounds)
- Never stored in plaintext; never logged

### JWT
- Library: `flask-jwt-extended`
- Algorithm: HS256 (HMAC-SHA256)
- Expiry: 7 days (`timedelta(days=7)`)
- Secret: `JWT_SECRET_KEY` from `.env`
- Frontend stores in `localStorage` (XSS risk — acceptable for SPA MVP)
- Per-request attachment via axios request interceptor

### Email Tokens
- Library: `itsdangerous.URLSafeTimedSerializer`
- Signed with `SECRET_KEY`
- Separate salts: `"email-verify"` and `"password-reset"` prevent cross-use
- Verification: 1 hour TTL
- Reset: 30 minute TTL

### Input Validation
- `secure_filename()` on all uploaded filenames
- File extension whitelist: `.pdf` only
- File size limit: 5MB via `MAX_CONTENT_LENGTH`
- Password minimum: 6 characters (client + server)
- Email uniqueness enforced at DB level (`UNIQUE` constraint)
- JD truncated to 500 chars before DB storage

### CORS
- `flask-cors` with `supports_credentials=True`
- Development: allows all origins
- Production: should restrict to Vercel domain

### SQL Injection Prevention
- All queries use parameterised placeholders (`?` in sqlite3)
- No string interpolation in SQL
- `sqlite3.Row` factory for safe row access

### Email Enumeration Prevention
- `/forgot-password` always returns 200 regardless of whether email exists
- `/resend-verification` same pattern

---

## 13. Current Project Status

### Completed ✓
- Full PDF upload + text extraction pipeline
- NLP cleaning (spaCy + NLTK)
- Skill extraction with 7 categories
- TF-IDF keyword matching
- BERT semantic matching (all-MiniLM-L6-v2)
- 7-factor ATS scoring engine
- Gap analysis (4 categories)
- AI resume suggestions
- Job recommendation engine (12 roles)
- SQLite persistence
- JWT authentication
- bcrypt password hashing
- Email verification (Gmail SMTP)
- Password reset via email
- Guest-to-user pending analysis flow
- History: rename, rematch, delete, clear all
- Auto-naming ("Analysis 01")
- Job role detection from JD
- Complete React frontend (new design system)
- Navbar with avatar dropdown
- Fraunces/Instrument Sans/JetBrains Mono typography
- CSS-only animations
- Warm neutral design palette
- 12-slide PowerPoint presentation

### Pending ⏳
- Deployment to Vercel (frontend)
- Deployment to Render (backend)
- README screenshots (after deployment)
- GitHub repository push

### Known Technical Debt
- JWT in localStorage (XSS risk — should be httpOnly cookie in production)
- SQLite (not production-grade for concurrent users — should migrate to PostgreSQL)
- No rate limiting on auth endpoints (brute force risk)
- No request logging or monitoring
- No automated tests
- CORS allows all origins in development
- `SECRET_KEY` and `JWT_SECRET_KEY` need proper random generation for production

### Missing Features (Future)
- Social OAuth (Google login)
- Resume version history
- Multiple resume support per user
- Admin dashboard
- Usage analytics
- API rate limiting
- Webhook notifications
- Export to PDF

---

## 14. Future Roadmap

### Short-term (Post-deployment)
1. Deploy to Vercel + Render
2. Set production environment variables
3. Restrict CORS to production domain
4. Add rate limiting to auth endpoints (`flask-limiter`)
5. Push to GitHub with README and screenshots
6. Add project to resume/portfolio

### Medium-term
1. Migrate SQLite → PostgreSQL (connection pooling, concurrency)
2. Add Redis caching for frequent BERT computations
3. Add pagination to history endpoint
4. Write unit tests for ATS scorer and skill extractor
5. Add request logging (structured JSON logs)
6. Add error monitoring (Sentry)

### Long-term AI Improvements
1. Fine-tune the MiniLM model on resume-JD pairs
2. Named entity recognition for experience extraction
3. Resume section parser (identify education, experience, skills sections)
4. Multi-language resume support
5. Reranking using cross-encoder models
6. Vector database (Pinecone/Weaviate) for semantic search across history

### Infrastructure
1. Docker containerisation for consistent deployment
2. CI/CD pipeline (GitHub Actions)
3. Environment staging (dev → staging → prod)
4. CDN for frontend static assets

---

## 15. Design Decisions

### Why Flask over FastAPI
Flask was chosen for its simplicity and the student's familiarity. FastAPI would be preferred for production (async, automatic OpenAPI docs, better type safety) — recommended for next project.

### Why SQLite over PostgreSQL
Zero-config, embedded, perfect for learning and MVP. PostgreSQL recommended when deploying to multiple workers or expecting concurrent users.

### Why all-MiniLM-L6-v2 over larger BERT models
Speed/accuracy tradeoff. 22M parameters, 384 dimensions, ~80MB. Larger models (all-mpnet-base-v2) are more accurate but 5x slower — not worth it for a resume tool where good-enough is sufficient.

### Why TF-IDF + BERT combined
Neither alone is sufficient. TF-IDF catches exact keyword matches (which real ATS systems still look for). BERT handles semantic equivalence. Combined at 35/65 gives best of both.

### Why weighted ATS over single score
Single keyword density is gameable (keyword stuffing). Seven independent factors produce a score that reflects actual resume quality, not just keyword frequency.

### Why sessionStorage over URL params or global state
Simple, no URL clutter, no library needed. Pages receive data on mount and redirect if missing. Tradeoff: data lost on tab close (mitigated for guests with localStorage TTL).

### Why direct SQL over ORM
Simpler to understand, no abstraction layer, closer to how databases actually work. SQLAlchemy recommended for production teams but adds complexity for a learning project.

### Why inline SVGs over icon library
No dependency, no bundle weight, fully customisable, consistent with design system. Lucide or Heroicons would be acceptable alternatives.

### Why `useAsync` removed from LoginPage
`useCallback` memoization captured stale `email`/`password` closure values. Direct `api.post` reads current state at execution time. Rule: never wrap form submission functions in `useAsync` when they close over form field state.

---

## 16. Data Flow

### Upload Flow
```
User selects PDF
  ↓ handleFileChange() → setFile(selectedFile)
  ↓ handleUpload() → FormData → api.post("/upload")
Flask /upload:
  ↓ verify JWT (optional) → extract user_id
  ↓ secure_filename() → save to uploads/
  ↓ extract_text_from_pdf() via pdfplumber
  ↓ clean_and_tokenise() → cleaned text + tokens
  ↓ extract_skills() + extract_skills_by_category()
  ↓ if user_id: save_upload() → upload_id
  ↓ return { filename, upload_id, text, cleaned, skills }
Frontend:
  ↓ session.set("resumeData", res.data)
  ↓ navigate("/analysis")
AnalysisPage:
  ↓ data = session.get("resumeData")
  ↓ api.post("/recommend") → setRecommendations()
  ↓ render skills, categories, recommendations
```

### Match Flow
```
User pastes JD → clicks "Analyse Match"
  ↓ api.post("/match", { resume_text, job_description, upload_id })
Flask /match:
  ↓ compute_tfidf_similarity() → tfidf_score
  ↓ get_common_keywords()
  ↓ compute_bert_similarity() → bert_score
  ↓ get_combined_score() → combined_score
  ↓ compute_ats_score() → ats (7 factors)
  ↓ analyze_gaps() → gaps (4 categories)
  ↓ generate_suggestions() → suggestions
  ↓ get_job_recommendations(jd, top_n=1) → job_role
  ↓ if user_id and upload_id: save_analysis()
  ↓ return full response
Frontend:
  ↓ session.set("matchData", { ...res.data, job_description, resume_text })
  ↓ if guest: savePendingAnalysis({ resume_text, job_description, ... })
  ↓ navigate("/match")
MatchPage:
  ↓ data = session.get("matchData")
  ↓ staggered card reveal (120ms delay each)
  ↓ ScoreRing rAF tween 0 → score over 1000ms
  ↓ render all sections
```

### Auth Flow
```
User submits signup form:
  ↓ api.post("/register") → 201 { requires_verification: true }
  ↓ setRegistered(true) → show "Check your inbox"
  ↓ Gmail sends verification email with /verify-email/{token} link

User clicks email link:
  ↓ Browser navigates to /verify-email/{token}
  ↓ VerifyEmailPage → api.get("/verify-email/{token}")
  ↓ Flask: verify_email_token(token) → email → set_user_verified()
  ↓ Show success → link to /login

User logs in:
  ↓ api.post("/login") → 200 { token, user }
  ↓ login(token, userData) → localStorage.setItem("token") → setUser()
  ↓ Check getPendingAnalysis() → if exists: api.post("/save-pending") → clear
  ↓ navigate("/")

Page refresh:
  ↓ AuthProvider useEffect → localStorage.getItem("token")
  ↓ api.get("/me") → setUser(res.data)
  ↓ Loading spinner shown until complete
```

---

## 17. Developer Quick Start

### Prerequisites
- Python 3.8+
- Node.js 18+
- Gmail account with 2-Step Verification enabled
- Gmail App Password

### Backend Setup
```bash
cd backend
pip install -r requirements.txt
python -m spacy download en_core_web_sm

# Create .env
echo "MAIL_USERNAME=your@gmail.com" > .env
echo "MAIL_PASSWORD=xxxx xxxx xxxx xxxx" >> .env
echo "SECRET_KEY=$(python -c 'import secrets; print(secrets.token_hex(32))')" >> .env
echo "JWT_SECRET_KEY=$(python -c 'import secrets; print(secrets.token_hex(32))')" >> .env
echo "FRONTEND_URL=http://localhost:3000" >> .env

python app.py
# Flask runs on http://localhost:5000
# BERT model downloads automatically on first /match request (~80MB, one-time)
```

### Frontend Setup
```bash
cd frontend
npm install   # or yarn install
echo "VITE_API_URL=http://localhost:5000" > .env.local
npm run dev   # or yarn start
# React runs on http://localhost:5173 (or port 3000 if yarn start)
```

### Test the Full Flow
1. Visit `http://localhost:5173`
2. Upload a PDF resume
3. View detected skills on `/analysis`
4. Paste a job description → click "Analyse Match"
5. View scores, ATS breakdown, gaps on `/match`
6. Click "Sign up" → verify email → log in
7. Run another match → check `/history`

---

## 18. Recommendations for Next Developer

### Immediate Priorities
1. **Deploy** — Render (backend) + Vercel (frontend) with proper environment variables
2. **CORS** — Restrict to production Vercel URL in production Flask config
3. **Rate limiting** — Add `flask-limiter` to `/login`, `/register`, `/forgot-password`
4. **GitHub** — Push with README, screenshots, and deployment badge

### Code Quality
- Add type hints to all Python functions
- Extract route handlers into separate Blueprint modules (`auth.py`, `analysis.py`)
- Add input validation decorator or use `marshmallow` / `pydantic`
- Add `pytest` test suite for `ats_scorer.py` and `skill_extractor.py`

### Performance
- Cache BERT embeddings for identical texts using MD5 hash key
- Add Redis for session/cache layer
- Lazy-load BERT model behind first-request check
- Paginate history endpoint (add `page` and `per_page` params)

### Security
- Move JWT to httpOnly cookie (prevents XSS token theft)
- Add CSRF protection for cookie-based auth
- Hash uploaded filenames to prevent enumeration
- Add `bleach` for HTML sanitisation on any user text rendered in HTML

### Database
- Migrate to PostgreSQL for production
- Add database indexes on `users.email` and `analyses.upload_id`
- Add migration system (`flask-migrate` or `alembic`)

---

*This document was generated from the complete development conversation and represents the full technical knowledge of the AI Resume Analyzer project as of July 2026.*
