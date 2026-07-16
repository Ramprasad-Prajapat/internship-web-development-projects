# Production Deployment Guide

This document describes the production deployment configuration, required environment variables, and build sequence for the AI English Learning Website.

## Architecture & Service Names

- **Frontend**: Single Page Application (SPA) built using React 18, Vite 5, TypeScript, and TailwindCSS. Deployed on **Vercel** as `ai-english-learning-website`.
- **Backend**: Spring Boot 3.3.2 REST API running on Java 21 inside Docker. Deployed on **Render** as `ai-english-learning-backend`.
- **Database**: Managed MySQL instance hosted on **Aiven** (service `mysql-15b0f2a4`, default database `defaultdb`).

## Root Directories

- **Frontend**: `project-1/AI-English-Learning-Website/frontend`
- **Backend**: `project-1/AI-English-Learning-Website/backend`

## Environment Variables Configuration

> [!WARNING]
> Never commit or hardcode actual production credentials in source code. All values must be supplied via secure console configuration managers.

### Backend Environment Variables (Render Web Service)

| Variable Name | Description | Example / Default Value |
| --- | --- | --- |
| `SPRING_PROFILES_ACTIVE` | Active Spring profile for settings | `prod` |
| `DB_URL` | JDBC URL for MySQL database | `jdbc:mysql://<AIVEN_HOST>:<AIVEN_PORT>/defaultdb?sslmode=require&serverTimezone=UTC` |
| `DB_USERNAME` | Username for database access | `avnadmin` |
| `DB_PASSWORD` | Password for database access | *[Redacted]* |
| `DB_DRIVER` | Database JDBC driver | `com.mysql.cj.jdbc.Driver` |
| `JWT_SECRET` | Cryptographically secure 64-character signing secret | *[Redacted]* |
| `DDL_AUTO` | JPA Hibernate schema action (recommend `update`) | `update` |
| `CORS_ALLOWED_ORIGINS` | Permitted client origins (comma-separated, no trailing slash) | `https://<vercel-project-name>.vercel.app,http://localhost:5173` |
| `SEED_ADMIN` | Enable or disable seeder for administrative accounts | `true` |
| `ADMIN_EMAIL` | Admin account email to seed on startup | `admin@english.com` |
| `ADMIN_PASSWORD` | Strong password for admin account | *[Redacted]* |
| `ADMIN_NAME` | Display name of the admin user | `Admin User` |

### Frontend Environment Variables (Vercel Production)

| Variable Name | Description | Configured Value |
| --- | --- | --- |
| `VITE_API_MODE` | Active service provider mode | `backend` |
| `VITE_API_BASE_URL` | Target base URL of Spring Boot REST API | `https://<actual-render-backend>.onrender.com/api` |
| `VITE_ENABLE_MOCK_FALLBACK` | Block silent mock localStorage fallback on error | `false` |

## Build and Compilation Commands

### Backend (Local Compilation check)
Using the Maven wrapper:
- Windows: `.\mvnw.cmd clean package`
- Linux/macOS: `./mvnw clean package`

### Frontend (Local compilation check)
- Install: `npm ci`
- Build: `npm run build`

## Health Endpoint

- Path: `/api/health`
- Access: Publicly accessible, requires no authentication headers.
- Health Response Schema:
  ```json
  {
    "status": "UP",
    "service": "ai-english-learning-backend",
    "database": "ai_english",
    "timestamp": 1721118123456
  }
  ```

## Deployment Sequence

1. **Aiven MySQL**: Check service is `Running` and gather MySQL host, port, username, password, and DB name.
2. **Render Backend**:
   - Create a Web Service inside Render project `prj-d8lt6c58nd3s73a7k3i0`.
   - Set runtime to **Docker**.
   - Set root directory to `project-1/AI-English-Learning-Website/backend`.
   - Specify the relative Dockerfile path if prompted.
   - Enter all required backend environment variables.
   - Deploy and monitor the logs for database connection confirmation (`HikariPool-1 - Start completed`) and seeder execution.
3. **Vercel Frontend**:
   - Create/link the frontend project under Vercel team `ramprasad-prajapats-projects`.
   - Set framework preset to **Vite**.
   - Set root directory to `project-1/AI-English-Learning-Website/frontend`.
   - Setup environment variables: `VITE_API_MODE=backend`, `VITE_API_BASE_URL`, and `VITE_ENABLE_MOCK_FALLBACK=false`.
   - Trigger build and retrieve the live production deployment URL.
4. **CORS Tuning**:
   - Go to Render backend environment configurations.
   - Update `CORS_ALLOWED_ORIGINS` to contain the live Vercel URL (e.g. `https://ai-english-learning-website.vercel.app`).
   - Trigger a redeployment on Render to apply the safe CORS rules.

## Troubleshooting Steps

- **CORS Errors**: Check browser console. Ensure that the Vercel URL has no trailing slashes and matches the value in Render's `CORS_ALLOWED_ORIGINS` exactly.
- **Port Binding Issues**: Render assigns a dynamic port via the `PORT` environment variable. Ensure the container runs on `${PORT:8080}` as defined in `application-prod.yml`.
- **Database Connection Failure**: Verify SSL requirements are configured on the connection string (`?sslmode=require`) and Render has network permission to connect to the Aiven instance.
- **Vercel SPA Refresh 404**: React Router handles routes client-side. The `vercel.json` SPA rewrite rule must route all unmatched requests back to `/index.html` to resolve load-time 404s.
