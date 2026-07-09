# Myth Cloth UI

Frontend web application for managing a Myth Cloth collector catalog.

Built with React + TypeScript + Vite.

## Features

- Figurines
- Collections
- Catalogs
- Purchases
- Distributors
- Anniversaries
- Charts and stats pages
- Security (roles and permissions)
- Authentication (Facebook and Google login)

## Tech Stack

- React 19
- TypeScript
- Vite
- Material UI (MUI)
- React Router
- Axios

## Prerequisites

Install before running the app:

1. Node.js 20 LTS or newer
2. npm 10 or newer
3. Git

## Quick Start (Recommended)

1. Clone repository.

```bash
git clone https://github.com/mythcloth-hub/myth-cloth-ui.git
cd myth-cloth-ui
```

2. Install dependencies.

```bash
npm install
```

3. Create local environment file.

```bash
cat > .env <<'ENV'
VITE_API_BASE_URL=http://localhost:9090/api/v1
VITE_GOOGLE_CLIENT_ID=your_google_client_id
VITE_FACEBOOK_APP_ID=your_facebook_app_id
ENV
```

4. Start dev server.

```bash
npm run dev
```

5. Open:

http://localhost:5173

## Environment Variables

This project currently uses the following frontend variables (from code usage):

| Variable | Required | Default | Description | Used In |
| --- | --- | --- | --- | --- |
| VITE_API_BASE_URL | No | http://localhost:9090/api/v1 | Base URL for backend API requests. Trailing slash is automatically trimmed. | src/api/httpClient.ts |
| VITE_GOOGLE_CLIENT_ID | For Google login | none | Google OAuth client ID for Google Sign-In button and token flow. | src/auth/AuthContext.tsx |
| VITE_FACEBOOK_APP_ID | For Facebook login | none | Facebook App ID used to initialize Facebook SDK and login flow. | src/auth/AuthContext.tsx, src/layout/MainLayout.tsx |

Notes:

- Only variables prefixed with `VITE_` are exposed to frontend code.
- After changing `.env`, restart the dev server.
- If social variables are missing, app still runs but social login will be disabled/blocked with a config notice.

## Backend Dependency

The frontend expects a backend API, by default:

- Base host: http://localhost:9090
- Base path: /api/v1

Expected auth endpoints:

- POST /api/v1/collectors/auth/facebook
- POST /api/v1/collectors/auth/google

Also ensure:

- CORS allows http://localhost:5173
- Protected endpoints accept `Authorization: Bearer <token>`

## Linux Mint Setup (Optional)

If you are on a fresh Linux Mint machine, a concise NVM-based setup:

```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y git curl build-essential ca-certificates
curl -fsSL https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.3/install.sh | bash
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh"
nvm install 20
nvm use 20
nvm alias default 20
node -v && npm -v && git --version
```

Then follow Quick Start above.

## Deploy on Render (Static Site)

1. Create a Static Site in Render and connect this repository.
2. Use:

```text
Build Command: npm install && npm run build
Publish Directory: dist
```

3. Add SPA rewrite rule:

```text
Source: /*
Destination: /index.html
Action: Rewrite
```

4. Add environment variables in Render:

```text
VITE_API_BASE_URL=https://your-backend-host/api/v1
VITE_GOOGLE_CLIENT_ID=your_google_client_id
VITE_FACEBOOK_APP_ID=your_facebook_app_id
```

Important:

- Vite injects `VITE_*` variables at build time.
- If you change Render env values, trigger a new deploy.

## Scripts

- `npm run dev`: start development server
- `npm run build`: type-check and build production files to `dist`
- `npm run preview`: preview production build locally
- `npm run lint`: run ESLint

## Common Issues

1. `npm install` fails
- Ensure Node.js version is supported.
- Remove `node_modules` and `package-lock.json`, then run `npm install` again.

2. API calls fail
- Verify backend is running and reachable.
- Confirm `VITE_API_BASE_URL` value.
- Confirm backend CORS includes `http://localhost:5173`.

3. Social login unavailable
- Confirm `VITE_GOOGLE_CLIENT_ID` and/or `VITE_FACEBOOK_APP_ID` are set.
- Restart dev server after editing `.env`.

4. `nvm` command not found after reboot
- Restart terminal or run `source ~/.bashrc` / `source ~/.zshrc`.

5. Port 5173 is busy

```bash
npm run dev -- --port 5174
```
