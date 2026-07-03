# Myth Cloth UI

Frontend web application for managing a Myth Cloth collector catalog.

This project is built with React + TypeScript + Vite and includes modules for:

- Figurines
- Collections
- Catalogs
- Purchases
- Distributors
- Anniversaries
- Charts and stats pages
- Security (roles and permissions)
- Authentication (Facebook and Google login support)

## Tech Stack

- React 19
- TypeScript
- Vite
- Material UI (MUI)
- React Router
- Axios

## Prerequisites

Install these tools on your new machine before running the app:

1. Node.js 20 LTS or newer
2. npm 10 or newer
3. Git

Recommended checks:

```bash
node -v
npm -v
git --version
```

## Backend Dependency

This frontend expects the backend API to be running locally at:

http://localhost:9090/api/v1

The base URL is currently configured in src/api/httpClient.ts. Start the backend before using the UI features that call APIs.

## Backend Setup Assumptions (Recommended)

Use this checklist for your backend service so this frontend works correctly.

1. Backend project is running on:

```text
http://localhost:9090
```

2. API base path is:

```text
/api/v1
```

3. Authentication endpoints exist:

```text
POST /api/v1/collectors/auth/facebook
POST /api/v1/collectors/auth/google
```

4. CORS allows requests from the frontend origin:

```text
http://localhost:5173
```

5. Protected endpoints accept `Authorization: Bearer <token>` headers.

The frontend automatically sends this header when a session token exists.

### Backend Verification Steps

Before starting the frontend, verify backend health:

1. Start backend service.
2. Open backend base URL in browser or check with curl.
3. Confirm API responds under `/api/v1`.
4. Confirm no CORS errors when frontend calls backend.
5. Confirm login endpoints return successful responses for valid tokens.

### If Your Backend URL Is Different

Update the Axios base URL in src/api/httpClient.ts:

```ts
const httpClient = axios.create({
	baseURL: "http://your-host:your-port/api/v1",
});
```

Then restart the frontend dev server.

## Local Setup (Step by Step)

1. Clone the repository:

```bash
git clone <your-repo-url>
cd myth-cloth-ui
```

2. Install dependencies:

```bash
npm install
```

3. Configure environment variables.

This project uses Vite environment variables for social login.

Create or update .env in the project root with:

```env
VITE_GOOGLE_CLIENT_ID=your_google_client_id
VITE_FACEBOOK_APP_ID=your_facebook_app_id
```

Notes:

- If these values are missing, the app still starts, but Facebook and Google login actions will show configuration errors.
- Only variables prefixed with VITE_ are available in the frontend.

4. Start the development server:

```bash
npm run dev
```

5. Open the app in your browser:

http://localhost:5173

## Available Scripts

- npm run dev: Start local dev server with hot reload.
- npm run build: Type-check and create production build in dist.
- npm run preview: Serve the production build locally.
- npm run lint: Run ESLint.

## Production Build

Build the app:

```bash
npm run build
```

Preview the production build locally:

```bash
npm run preview
```

## Common Setup Issues

1. npm install fails:
- Delete node_modules and package-lock.json, then run npm install again.
- Confirm you are on a supported Node.js version.

2. API calls fail or return network errors:
- Verify backend is running on port 9090.
- Confirm backend routes are exposed under /api/v1.
- If backend uses a different URL, update src/api/httpClient.ts.
- Verify backend CORS allows http://localhost:5173.

3. Facebook or Google login unavailable:
- Verify .env contains VITE_FACEBOOK_APP_ID and VITE_GOOGLE_CLIENT_ID.
- Restart npm run dev after changing .env.

## Project Structure (High Level)

- src/features: feature modules (figurines, collections, catalogs, purchases, etc.)
- src/auth: auth context and social auth API integration
- src/api: HTTP client configuration
- src/routes: application routing
- src/layout: main layout and navigation
- src/theme: theme context and theme definitions

## Quick Start Checklist

1. Install Node.js, npm, and Git
2. Clone repository and enter folder
3. Run npm install
4. Set .env values
5. Start backend at http://localhost:9090/api/v1
6. Run npm run dev
7. Open http://localhost:5173
