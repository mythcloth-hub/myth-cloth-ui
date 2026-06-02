export type AuthSession = {
  collectorId: number;
  displayName: string;
  email: string;
  accessToken: string;
  tokenType: string;
  expiresInSeconds: number;
  expiresAtMs: number;
};

export type AuthApiResponse = {
  collectorId: number;
  displayName: string;
  email: string;
  accessToken: string;
  tokenType: string;
  expiresInSeconds: number;
};

export const AUTH_SESSION_STORAGE_KEY = "authSession";
export const AUTH_SESSION_CHANGED_EVENT = "auth-session-changed";

function notifyAuthSessionChanged() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(AUTH_SESSION_CHANGED_EVENT));
  }
}

export function buildAuthSession(payload: AuthApiResponse): AuthSession {
  return {
    ...payload,
    tokenType: payload.tokenType || "Bearer",
    expiresAtMs: Date.now() + payload.expiresInSeconds * 1000,
  };
}

export function isSessionExpired(session: AuthSession): boolean {
  return Date.now() >= session.expiresAtMs;
}

export function saveAuthSession(session: AuthSession) {
  if (typeof window === "undefined") return;

  localStorage.setItem(AUTH_SESSION_STORAGE_KEY, JSON.stringify(session));
  notifyAuthSessionChanged();
}

export function clearAuthSession() {
  if (typeof window === "undefined") return;

  localStorage.removeItem(AUTH_SESSION_STORAGE_KEY);
  notifyAuthSessionChanged();
}

export function loadAuthSession(): AuthSession | null {
  if (typeof window === "undefined") return null;

  const raw = localStorage.getItem(AUTH_SESSION_STORAGE_KEY);
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as AuthSession;
    if (!parsed?.accessToken || !parsed?.expiresAtMs) {
      clearAuthSession();
      return null;
    }
    return parsed;
  } catch {
    clearAuthSession();
    return null;
  }
}

export function getValidAuthSession(): AuthSession | null {
  const session = loadAuthSession();
  if (!session) return null;

  if (isSessionExpired(session)) {
    clearAuthSession();
    return null;
  }

  return session;
}

export function getAuthorizationHeaderValue(): string | null {
  const session = getValidAuthSession();
  if (!session) return null;

  return `${session.tokenType} ${session.accessToken}`;
}
