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

## Linux Mint Fresh Install Guide (From Scratch)

If you have a fresh Linux Mint install, follow this exact order.

If you only want the fastest path to run the app, use:

- Full End-to-End Setup -> Path A (NVM + project setup + run)

Choose one Node.js installation path:

- Path A (recommended): NVM (best for development and switching versions)
- Path B (alternative): NodeSource (system-wide installation)

### Which One Should I Choose?

| Scenario | Recommended Option | Why |
| --- | --- | --- |
| You work on multiple projects with different Node versions | NVM | Easy switching per project (`nvm use`) |
| You want project-safe installs without `sudo npm ...` | NVM | Avoids most global permission issues |
| You want one system-wide Node install managed by apt | NodeSource | Simpler for single-version environments |
| You prefer standard system paths like `/usr/bin/node` | NodeSource | Predictable path and package-manager workflow |
| You are unsure which to pick | NVM | Most flexible and safest default for development |

### Install Node Only (Quick Commands)

Use one block only, then continue to Local Setup (Step by Step).

Path A: NVM (recommended)

```bash
# Refresh package index and upgrade installed packages
sudo apt update && sudo apt upgrade -y
# Install required tools: git, curl, compiler tools, and trusted certificates
sudo apt install -y git curl build-essential ca-certificates
# Download and run the official NVM installer
curl -fsSL https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.3/install.sh | bash
# Point to NVM installation folder
export NVM_DIR="$HOME/.nvm"
# Load NVM into this terminal session
[ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh"
# Install Node.js 20 (LTS major)
nvm install 20
# Activate Node.js 20 for current shell
nvm use 20
# Make Node.js 20 the default for new shells
nvm alias default 20
# Verify installed versions
node -v && npm -v && git --version
```

Path B: NodeSource (system-wide)

```bash
# Refresh package index and upgrade installed packages
sudo apt update && sudo apt upgrade -y
# Install required tools: git, curl, compiler tools, and trusted certificates
sudo apt install -y git curl build-essential ca-certificates
# Add NodeSource LTS repository to apt sources
curl -fsSL https://deb.nodesource.com/setup_lts.x | sudo -E bash -
# Install system-wide Node.js from NodeSource
sudo apt install -y nodejs
# Verify installed versions
node -v && npm -v && git --version
```

### Full End-to-End Setup (From Zero to Running App)

Use one block only, based on your chosen Node installation path.

Path A: NVM + project setup + run

```bash
# Refresh package index and upgrade installed packages
sudo apt update && sudo apt upgrade -y
# Install required tools for cloning and building packages
sudo apt install -y git curl build-essential ca-certificates
# Install NVM
curl -fsSL https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.3/install.sh | bash
# Configure and load NVM in this session
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh"
# Install and activate Node.js 20, and keep it as default
nvm install 20
nvm use 20
nvm alias default 20
# Clone the frontend repository and enter project directory
git clone https://github.com/mythcloth-hub/myth-cloth-ui.git
cd myth-cloth-ui
# Install JavaScript dependencies from package-lock.json/package.json
npm install
# Create .env with required social login variables
cat > .env << 'EOF'
VITE_GOOGLE_CLIENT_ID=your_google_client_id
VITE_FACEBOOK_APP_ID=your_facebook_app_id
EOF
# Start Vite development server
npm run dev
```

Path B: NodeSource + project setup + run

```bash
# Refresh package index and upgrade installed packages
sudo apt update && sudo apt upgrade -y
# Install required tools for cloning and building packages
sudo apt install -y git curl build-essential ca-certificates
# Add NodeSource LTS repo and install system-wide Node.js
curl -fsSL https://deb.nodesource.com/setup_lts.x | sudo -E bash -
sudo apt install -y nodejs
# Clone the frontend repository and enter project directory
git clone https://github.com/mythcloth-hub/myth-cloth-ui.git
cd myth-cloth-ui
# Install JavaScript dependencies
npm install
# Create .env with required social login variables
cat > .env << 'EOF'
VITE_GOOGLE_CLIENT_ID=your_google_client_id
VITE_FACEBOOK_APP_ID=your_facebook_app_id
EOF
# Start Vite development server
npm run dev
```

After the server starts, open:

http://localhost:5173

### 1. Update your system packages

```bash
sudo apt update && sudo apt upgrade -y
```

### 2. Install required base tools

```bash
sudo apt install -y git curl build-essential ca-certificates
```

### 3. Install Node.js with NVM (recommended)

NVM makes it easy to manage Node versions and avoids permission issues.

Install NVM:

```bash
# Download and run the official NVM installer
curl -fsSL https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.3/install.sh | bash
```

Load NVM in the current terminal:

```bash
# Set NVM directory location
export NVM_DIR="$HOME/.nvm"
# Load NVM for current terminal session
[ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh"
```

Install and use Node 20 LTS:

```bash
# Install Node.js 20 (LTS major)
nvm install 20
# Switch current terminal to Node.js 20
nvm use 20
# Make Node.js 20 default in future terminal sessions
nvm alias default 20
```

Verify tooling:

```bash
node -v
npm -v
git --version
```

Expected:

- Node version should be 20.x or newer
- npm should be installed and working

### 4. Alternative: Install Node.js LTS with NodeSource (system-wide)

Use this if you prefer apt-managed, system-wide Node.js instead of NVM.

Add the NodeSource LTS repository:

```bash
# Add NodeSource LTS apt repository
curl -fsSL https://deb.nodesource.com/setup_lts.x | sudo -E bash -
```

Install Node.js:

```bash
# Install Node.js from apt (NodeSource repository)
sudo apt install -y nodejs
```

Verify:

```bash
node -v
npm -v
```

Note:

- Do not mix NVM and NodeSource in the same shell session unless you know which one is active.
- If both are installed, running which node helps confirm which binary is being used.

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
# Clone repository from GitHub
git clone https://github.com/mythcloth-hub/myth-cloth-ui.git
# Enter project directory
cd myth-cloth-ui
```

2. (If using NVM) confirm you are using the right Node version:

```bash
# Activate Node.js 20 in this terminal (NVM users)
nvm use 20
```

3. Install dependencies:

```bash
# Install dependencies listed in package.json
npm install
```

4. Configure environment variables.

This project uses Vite environment variables for social login.

Create or update .env in the project root with:

```env
VITE_GOOGLE_CLIENT_ID=your_google_client_id
VITE_FACEBOOK_APP_ID=your_facebook_app_id
```

Notes:

- If these values are missing, the app still starts, but Facebook and Google login actions will show configuration errors.
- Only variables prefixed with VITE_ are available in the frontend.

5. Start the development server:

```bash
# Start local development server (Vite)
npm run dev
```

6. Open the app in your browser:

http://localhost:5173

7. Confirm frontend can reach backend:

- Open browser developer tools (F12) and go to Network.
- Trigger any screen that loads API data.
- Verify requests go to http://localhost:9090/api/v1 and return successful status codes.

## First-Time Setup (One-Command Sequence)

After system dependencies are installed, this sequence gets you running quickly:

```bash
# Clone the repository and move into it
git clone https://github.com/mythcloth-hub/myth-cloth-ui.git
cd myth-cloth-ui
# Load NVM in case this is a new terminal
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh"
# Use Node.js 20 for this project
nvm use 20
# Install project dependencies
npm install
# Copy .env to .env.local if .env exists (safe no-op otherwise)
cp .env .env.local 2>/dev/null || true
# Start development server
npm run dev
```

If no .env exists yet, create one manually using the variables shown above.

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
- If you get EACCES permission errors, avoid sudo npm install and use NVM-managed Node.

2. API calls fail or return network errors:
- Verify backend is running on port 9090.
- Confirm backend routes are exposed under /api/v1.
- If backend uses a different URL, update src/api/httpClient.ts.
- Verify backend CORS allows http://localhost:5173.

3. Facebook or Google login unavailable:
- Verify .env contains VITE_FACEBOOK_APP_ID and VITE_GOOGLE_CLIENT_ID.
- Restart npm run dev after changing .env.

4. nvm command not found after reboot (NVM users):
- Restart terminal or run source ~/.bashrc (or source ~/.zshrc).
- Re-run nvm use 20 before running npm commands.

5. Port 5173 already in use:
- Stop the process using that port, or run Vite on another port:

```bash
# Run dev server on alternate port if 5173 is busy
npm run dev -- --port 5174
```

6. Wrong Node version after installing NodeSource:
- Run which node and confirm it points to /usr/bin/node.
- Open a new terminal session and run node -v again.

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
