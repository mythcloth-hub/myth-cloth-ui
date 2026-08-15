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

Important:

- Use `/index.html` (with leading slash). Using `index.html` can cause blank pages on direct deep-link refresh.

Quick verification after deploy:

```bash
curl -sSI https://your-domain.com/figurines/14 | sed -n '1,20p'
```

Expected:

- `HTTP 200`
- `content-type: text/html`
- Non-empty response body for `https://your-domain.com/figurines/14`

4. Add environment variables in Render:

```text
VITE_API_BASE_URL=https://your-backend-host/api/v1
VITE_GOOGLE_CLIENT_ID=your_google_client_id
VITE_FACEBOOK_APP_ID=your_facebook_app_id
```

Important:

- Vite injects `VITE_*` variables at build time.
- If you change Render env values, trigger a new deploy.

## Social Login Domain Registration (Google + Facebook)

Use this checklist whenever login works locally but fails in production.

### Google Login (Google Cloud Console)

1. Open Google Cloud Console.
2. Go to APIs & Services > Credentials.
3. Create or open your OAuth 2.0 Client ID (type: Web application).
4. In Authorized JavaScript origins, add all frontend origins that can host this UI:
	- http://localhost:5173
	- https://saintcollections.com
	- https://www.saintcollections.com
	- Any Render preview/static host where you test login
5. Save changes and ensure the client ID matches `VITE_GOOGLE_CLIENT_ID`.

Notes:

- For the current frontend Google Identity token flow, JavaScript origins are the critical setting.
- If you also implement backend OAuth code flow later, configure redirect URIs in the same client.

### Facebook Login (Meta App Dashboard)

1. Open Meta for Developers and select your app.
2. In Settings > Basic > App Domains, add hostnames:
	- saintcollections.com
	- www.saintcollections.com
3. In Facebook Login > Settings > Allowed Domains for the JavaScript SDK, add:
	- saintcollections.com
	- www.saintcollections.com
4. In Facebook Login > Settings > Valid OAuth Redirect URIs, add:
	- https://saintcollections.com/
	- https://www.saintcollections.com/
	- Any Render preview/static host where you test login
5. Ensure the App ID matches `VITE_FACEBOOK_APP_ID`.

Notes:

- App Domains and JS SDK Domains must be hostnames only (no scheme or path).
- OAuth Redirect URIs must be full HTTPS URLs.
- If login still fails for non-admin users, verify app mode and role/test-user access in Meta Dashboard.

## Deployment Troubleshooting (Render)

### White screen on deep-link refresh

- Symptom: route works when navigating inside the app, but direct refresh on a deep link (for example `/figurines/14`) shows a blank page.
- Cause: SPA rewrite is missing or misconfigured.
- Fix in Render Static Site rules:

```text
Source: /*
Destination: /index.html
Action: Rewrite
```

- Make sure destination is exactly `/index.html` (leading slash required).
- Redeploy and clear browser cache (or test in an incognito window).
- Verify deep link response:

```bash
curl -sSI https://your-domain.com/figurines/14 | sed -n '1,20p'
```

- Expected: `HTTP 200`, `content-type: text/html`, and non-empty response body.

## Scripts

- `npm run dev`: start development server
- `npm run build`: type-check and build production files to `dist`
- `npm run preview`: preview production build locally
- `npm run lint`: run ESLint

## UI Conventions

### DataGrid pages

- Use [src/components/ScrollableHintDataGrid.tsx](src/components/ScrollableHintDataGrid.tsx) instead of using `DataGrid` directly in page components.
- This keeps scroll behavior consistent across list pages:
	- hides native/browsers scrollbars inside grids
	- shows top and bottom scroll indicators when content overflows
	- keeps behavior aligned with the existing Manage Events interaction pattern
- Preserve page-level container sizing (`height`, `minHeight`, `width`) in each page, and pass it through `containerStyle`.

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

4. Facebook error: "Domain hosting the JavaScript SDK is not in your app's host domain list"
- Cause: Facebook app configuration is missing one or more frontend hostnames.
- In Meta App Dashboard, update all of the following:
	- Settings > Basic > App Domains:
		- saintcollections.com
		- www.saintcollections.com
	- Facebook Login > Settings > Allowed Domains for the JavaScript SDK:
		- saintcollections.com
		- www.saintcollections.com
	- Facebook Login > Settings > Valid OAuth Redirect URIs:
		- https://saintcollections.com/
		- https://www.saintcollections.com/
		- Add your Render preview/static hostname too if you test login there.
- Important:
	- Domain entries should be hostnames only (no scheme/path) in App Domains and JS SDK Domains.
	- OAuth redirect URI entries must include full https URL.
	- If you changed app mode/permissions, ensure app is Live and the test user/account is allowed.
- Verify active host in browser:
	- Final production host currently resolves to https://saintcollections.com/ (www redirects to apex).

5. Google error: "The given origin is not allowed for the given client ID"
- Add your current site origin in Google Cloud Console > APIs & Services > Credentials > OAuth client > Authorized JavaScript origins.
- Confirm `VITE_GOOGLE_CLIENT_ID` is from that same OAuth client.

6. `nvm` command not found after reboot
- Restart terminal or run `source ~/.bashrc` / `source ~/.zshrc`.

7. Port 5173 is busy

```bash
npm run dev -- --port 5174
```

