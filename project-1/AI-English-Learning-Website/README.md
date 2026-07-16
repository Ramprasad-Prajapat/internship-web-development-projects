# AI English Learning Website

A **free-first AI English learning web application** — designed for daily practice in speaking, writing, reading, vocabulary, grammar, homework, mistake tracking, and streak progress.

---

## 📌 Overview & Purpose

The **AI English Learning Website** provides an interactive, structured English learning experience. It includes daily multi-section lesson plans, practice centers for writing, speaking, and prepositions, personal AI notebooks for saving notes and imports, an automated mistake tracker, and progress reporting.

The project is structured into a modern decoupled architecture:
- **Frontend**: Single-Page Application (SPA) built with React, TypeScript, Vite, and Tailwind CSS.
- **Backend**: RESTful API built with Java 21, Spring Boot 3.3.2, Spring Security (JWT), and Spring Data JPA.
- **Database**: `ai_english` (supports H2 in-memory DB for rapid dev and MySQL for production persistence).

---

## 🛠 Tech Stack

### Frontend
- **Framework & Build Tool**: React 18, Vite 5, TypeScript 5
- **Styling**: Vanilla CSS + Tailwind CSS 3, Lucide React icons
- **Form Handling & Validation**: React Hook Form, Zod, @hookform/resolvers
- **HTTP Client**: Axios (configured with JWT interceptors and offline/mock fallback capabilities)
- **Routing**: React Router DOM v6

### Backend
- **Language & Framework**: Java 21, Spring Boot 3.3.2
- **Security**: Spring Security 6, JJWT (io.jsonwebtoken 0.12.6), BCrypt Password Encoding
- **Data Access**: Spring Data JPA / Hibernate ORM
- **Database**: `ai_english` (Default: H2 in-memory `jdbc:h2:mem:ai_english`; Configurable: MySQL `mysql-connector-j`)
- **Utilities**: Lombok

---

## 🔑 Demo Accounts

The backend automatically seeds two default accounts on startup (`DataSeeder.java`):

| Role | Email | Password | Access Rights |
|------|-------|----------|---------------|
| **Admin** | `admin@english.com` | `Admin123` | Full access including `/admin/*` management dashboard |
| **Demo User** | `demo@example.com` | `password123` | Learner access to lessons, practice center, notebook, & reports |

---

## ⚙️ Environment Variables

### Frontend (`frontend/.env`)
- `VITE_API_MODE`: Data source mode (`backend` to call Spring Boot API, `mock` to fallback to client-side localStorage).
- `VITE_API_BASE_URL`: Base URL of backend REST API (Default: `http://localhost:8080/api`).

### Backend (`backend/src/main/resources/application.yml`)
- `DB_URL`: JDBC Database Connection URL (Default: `jdbc:h2:mem:ai_english;DB_CLOSE_DELAY=-1;DB_CLOSE_ON_EXIT=FALSE`).
- `DB_USERNAME`: Database Username (Default: `sa`).
- `DB_PASSWORD`: Database Password (Default: empty).
- `DB_DRIVER`: JDBC Driver Class Name (Default: `org.h2.Driver`).
- `JWT_SECRET`: Secret key for signing JWT tokens.

*(Note: No secrets or production credentials should be committed into source control).*

---

## 🚀 Setup, Run & Build Commands

*(Commands documented from project `package.json` and Maven configuration — documented for execution by developers).*

### Backend (`backend/`)

```bash
# Navigate to backend directory
cd backend

# Compile project
./mvnw.cmd clean compile

# Run Spring Boot application (Port 8080)
./mvnw.cmd spring-boot:run

# Build executable JAR package
./mvnw.cmd clean package
```

### Frontend (`frontend/`)

```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Run Vite dev server (Port 5173)
npm run dev

# Run TypeScript type check & production build
npm run build

# Preview production build locally
npm run preview
```

---

## 📁 Folder Structure

```text
AI-English-Learning-Website/
├── backend/
│   ├── pom.xml
│   └── src/
│       └── main/
│           ├── java/com/english/learning/
│           │   ├── DataSeeder.java
│           │   ├── LearningApplication.java
│           │   ├── controller/         # REST Controllers (Auth, Lessons, Admin, Notebook, Mistakes, etc.)
│           │   ├── model/              # JPA Entities (User, LessonDay, UserNote, UserMistake, etc.)
│           │   ├── repository/         # Spring Data JPA Repositories
│           │   ├── security/           # JWT Filter, JwtService, SecurityConfig
│           │   └── service/            # Business Logic Services
│           └── resources/
│               ├── application.yml
│               └── application.yml.example
├── frontend/
│   ├── package.json
│   ├── vite.config.ts
│   ├── .env
│   └── src/
│       ├── App.tsx                     # Main Router & Protection Wrappers
│       ├── admin/                      # Admin Layout & Management Views
│       ├── components/                 # Reusable UI components (Layout, Common, Lesson)
│       ├── hooks/                      # Custom hooks (useAuth, etc.)
│       ├── pages/                      # Learner Pages (Dashboard, DailyLessons, PracticeCenter, etc.)
│       ├── services/                   # API Services (apiClient, authService, lessonService, etc.)
│       └── types/                      # TypeScript definitions
├── README.md                           # Main Project Overview & Documentation
├── PROJECT_SUMMARY.md                  # Comprehensive Architectural & Status Summary
├── API_DOCUMENTATION.md                # Confirmed REST API Endpoints Specification
├── TESTING_GUIDE.md                    # End-to-End Manual QA & Testing Procedures
└── FEATURE_CHECKLIST.md                # Feature Completion Matrix
```

---

## 📊 Current Status

- **Backend APIs**: Core endpoints for Authentication, Day Lessons, Admin Lesson Management, User Notes, User Mistakes, Progress Tracking, Homework, Self Check, Practice History, Reports, and Admin User Management are implemented and backed by JPA Entities.
- **Frontend Integration**: Frontend services use `apiClient.ts` configured in `VITE_API_MODE=backend` with request token interceptors and fail-safe error handling.
- **AI Integration**: Practice generators and evaluation tools utilize rule-based mock engines and browser Web Speech API. Real LLM API integration (e.g. Gemini/OpenAI API keys) is pending for a future phase.
- **Database**: Entity schema auto-updates via JPA on database `ai_english`. Connected to MySQL by default when env variables are provided; falls back to H2 in-memory DB if they are omitted.

---

## 🗄️ Database Setup & Fallback Behavior

### MySQL Setup (Persistent Mode)
To run the project with persistent MySQL storage, configure the following environment variables in your terminal before launching the backend:

```powershell
# Windows PowerShell Example
$env:DB_URL="jdbc:mysql://localhost:3306/ai_english?createDatabaseIfNotExist=true&useSSL=false&allowPublicKeyRetrieval=true&serverTimezone=UTC"
$env:DB_USERNAME="root"
$env:DB_PASSWORD="<your_mysql_password>"
$env:DB_DRIVER="com.mysql.cj.jdbc.Driver"
```

```bash
# Unix-like Shell Example
export DB_URL="jdbc:mysql://localhost:3306/ai_english?createDatabaseIfNotExist=true&useSSL=false&allowPublicKeyRetrieval=true&serverTimezone=UTC"
export DB_USERNAME="root"
export DB_PASSWORD="<your_mysql_password>"
export DB_DRIVER="com.mysql.cj.jdbc.Driver"
```

### In-Memory Fallback (H2 Mode)
If the above database environment variables are not provided, the Spring Boot application will fallback to an **in-memory H2 database** (`jdbc:h2:mem:ai_english`) automatically. 
* *Note: All created data in H2 mode is non-persistent and will be cleared upon backend server restart.*

---

## ✅ Testing Checklist & Verification Status

The project undergoes regular manual and unit verification. Below is the current checklist:

- **Backend compilation**: `Passed` (verified via Maven Wrapper clean compile)
- **Frontend build**: `Passed` (verified via Vite TypeScript and Rollup production build)
- **Admin Login & Flows**: `Passed` (verified admin dashboard, day lesson management, sections update, draft/publish status)
- **User Management**: `Passed` (verified admin panel for searching users, role filtering, and user disabling/enabling)
- **Authentication**: `Passed` (verified public forgot/reset password flow and authenticated change-password endpoint)
- **Learner Flows**: `Passed` (verified dashboard stats, note creation, mistake tracking, section completion, homework submissions, diagnostic self-checks, and reports history)
- **MySQL Persistence Test**: `Passed` (verified that user data, profiles, notes, mistakes, progress, homework, diagnostic self-checks, and activity logs successfully persist across backend service restarts)

---

## ⚠️ Known Limitations

1. **Browser Testing Automation**: Automated browser testing (via Playwright or Selenium) is not available in the sandboxed developer environment on Windows. All UI verifications are build-based, API-driven, and manual-QA verified.
2. **Old JWT Force Expiration**: The backend uses stateless JWTs. Force-expiring active JWT tokens upon password change or account disable is not supported. Disabling accounts prevents new logins immediately, but existing tokens remain valid until expiration.
3. **Mock AI Features**: AI practice review engines are currently mocked on the server-side with helper algorithms and rule-based feedback templates. Voice synthesis/recognition uses native browser Web Speech APIs. Real Gemini/OpenAI API integrations are not yet configured.
