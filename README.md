# MindScribe AI — Secure Intelligent Journal on Google Cloud Run

A production-grade, secure, multi-tenant journal web application architected for the **Google Cloud Run Hackathon**.

Featuring **Firebase Authentication**, **per-user scoped Cloud Firestore** (`/users/{uid}/*`), **Server-Side Gemini 1.5 AI** via **Google Secret Manager**, and cryptographic **Bearer Token verification** middleware.

---

## 🛡️ Hackathon Security Architecture

| Security Requirement | Implementation |
| :--- | :--- |
| **No Hardcoded Secrets** | Zero secrets in client JS, git history, or Docker layers. `.env.example` provided. |
| **Google Secret Manager** | `GEMINI_API_KEY` injected into Cloud Run container at runtime via `--set-secrets`. |
| **Per-User Scoped Firestore** | Strict path isolation: `/users/{userId}/entries/{entryId}`. Enforced by `firestore.rules` and backend service. |
| **Server-Side Gemini AI** | Frontend never sees the API key; AI reflection & prompt generation happen exclusively in Express on Cloud Run. |
| **Bearer ID Token Verification** | Frontend attaches `Authorization: Bearer <Firebase_ID_Token>`. Backend middleware verifies claims and sets `req.user.uid`. |

---

## 📁 Project Structure

```
cloudrun-journal-app/
├── .env.example              # Environment variables template (safe for git)
├── .gitignore                # Excludes secrets, node_modules, and dist builds
├── Dockerfile                # Multi-stage container build for Cloud Run
├── firestore.rules           # Production security rules enforcing user ownership
├── firestore.indexes.json    # Composite query indexes for Firestore
├── deploy.sh                 # Fast Cloud Run deployment script with Secret Manager
├── cloudbuild.yaml           # CI/CD Cloud Build configuration
│
├── server/                   # Node.js + Express Cloud Run Service
│   ├── package.json
│   └── src/
│       ├── index.js          # Express app entry, static SPA serving & signal handling
│       ├── config/
│       │   ├── env.js        # Zod environment variable validation
│       │   ├── firebase.js   # Firebase Admin SDK with Application Default Credentials (ADC)
│       │   └── gemini.js     # Server-side Google Generative AI client
│       ├── middleware/
│       │   ├── auth.js       # ID Token verification (Bearer <token> -> req.user.uid)
│       │   ├── security.js   # Helmet CSP, CORS, Rate Limiting
│       │   └── errorHandler.js # Centralized safe error handler
│       ├── services/
│       │   ├── firestoreService.js # Scoped Firestore CRUD (/users/{uid}/entries)
│       │   └── geminiService.js    # AI reflections & psychological prompt generator
│       └── routes/
│           ├── authRoutes.js # Protected /api/me testing endpoint
│           ├── journalRoutes.js # /api/entries CRUD endpoints
│           ├── aiRoutes.js   # /api/ai/reflect and /api/ai/prompts
│           └── healthRoutes.js # /healthz and /readyz probes for Cloud Run
│
└── client/                   # React + Vite + Tailwind CSS SPA
    ├── package.json
    ├── vite.config.js        # Local proxy to http://localhost:8080
    ├── tailwind.config.js
    └── src/
        ├── firebase/config.js     # Client Firebase Auth initialization
        ├── context/AuthContext.jsx # Reactive auth state & ID token management
        ├── services/api.js        # Axios client with auto Bearer token interceptor
        └── components/
            ├── Navbar.jsx         # Header with profile & tab switcher
            ├── AuthModal.jsx      # Google & Email/Password login
            ├── ApiMeTester.jsx    # Interactive /api/me pipeline validator
            ├── JournalList.jsx    # Search, mood filter, and card grid
            ├── JournalEditor.jsx  # Rich journal editor with mood & tag picker
            ├── AiInsights.jsx     # Psychological reflection viewer & prompt generator
            └── SecurityBadge.jsx  # Security compliance checklist
```

---

## 🚀 Quick Start (Local Development)

### 1. Prerequisites
- Node.js 20+ installed
- A Firebase / Google Cloud project with **Authentication** and **Firestore** enabled

### 2. Configure Environment Variables
Copy the `.env.example` file:
```bash
# In the root directory:
cp .env.example .env
```
Fill in your Firebase Web App configuration (`VITE_FIREBASE_*`) and `GEMINI_API_KEY`.

### 3. Install Dependencies & Start

**Run Backend:**
```bash
cd server
npm install
npm run dev
# Server will run on http://localhost:8080
```

**Run Frontend:**
```bash
cd ../client
npm install
npm run dev
# Frontend will run on http://localhost:5173 with proxy to backend
```

---

## 🔒 Testing the Authentication Flow End-to-End

1. Open `http://localhost:5173` and click **"Sign In / Register"** (or use Google Sign-In).
2. Once signed in, click the **"Verify /api/me"** button in the navigation header.
3. The interactive modal will show:
   - **Active Firebase ID Token**: The raw cryptographically signed JWT.
   - **Test 1 (Authorized)**: Calls `GET /api/me` with `Authorization: Bearer <token>`. The backend verifies the token and returns:
     ```json
     {
       "status": "authenticated",
       "message": "Firebase token verified successfully by Cloud Run backend.",
       "user": {
         "uid": "USER_FIREBASE_UID",
         "email": "user@example.com"
       },
       "securityCheck": {
         "tokenVerifiedServerSide": true,
         "perUserFirestoreScope": "/users/USER_FIREBASE_UID/*"
       }
     }
     ```
   - **Test 2 (Gatekeeper Check)**: Intentionally sends a request without the token to verify the backend returns `401 Unauthorized`.

---

## ☁️ Deploying to Google Cloud Run

### 1. Store Gemini Secret in Google Secret Manager
```bash
# Create the secret in Google Secret Manager
echo -n "YOUR_GEMINI_API_KEY" | gcloud secrets create GEMINI_API_KEY \
  --data-file=- \
  --project="YOUR_GCP_PROJECT_ID"

# Grant the Cloud Run default service account access to read the secret
PROJECT_NUMBER=$(gcloud projects describe YOUR_GCP_PROJECT_ID --format='value(projectNumber)')
gcloud secrets add-iam-policy-binding GEMINI_API_KEY \
  --member="serviceAccount:${PROJECT_NUMBER}-compute@developer.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor" \
  --project="YOUR_GCP_PROJECT_ID"
```

### 2. Deploy with One Command
Run the included deployment script:
```bash
chmod +x deploy.sh
./deploy.sh
```

Or run `gcloud run deploy` directly:
```bash
gcloud run deploy mindscribe-journal \
  --source . \
  --region us-central1 \
  --platform managed \
  --allow-unauthenticated \
  --set-env-vars="NODE_ENV=production,GCP_PROJECT_ID=YOUR_GCP_PROJECT_ID" \
  --set-secrets="GEMINI_API_KEY=GEMINI_API_KEY:latest"
```

### 3. Deploy Firestore Security Rules
```bash
firebase deploy --only firestore:rules,firestore:indexes
```

---

## 📜 License
MIT License. Built for the Google Cloud Run Hackathon.
