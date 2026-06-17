export type AuthSession = {
  collectorId: number;
  displayName: string;
  email: string;
  profilePictureUrl?: string;
  accessToken: string;
  permissions: string[];
  tokenType: string;
  expiresInSeconds: number;
  expiresAtMs: number;
};

export type AuthApiResponse = {
  collectorId: number;
  displayName: string;
  email: string;
  profilePictureUrl?: string;
  picture?: string;
  accessToken: string;
  permissions?: string[];
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

type JwtPayload = {
  permissions?: unknown;
};

function decodeJwtPayload(token: string): JwtPayload | null {
  try {
    const parts = token.split(".");
    if (parts.length < 2) return null;

    const base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, "=");
    const decoded = atob(padded);
    return JSON.parse(decoded) as JwtPayload;
  } catch {
    return null;
  }
}

function getPermissionsFromToken(accessToken: string): string[] {
  const payload = decodeJwtPayload(accessToken);
  if (!payload) return [];

  if (!Array.isArray(payload.permissions)) {
    return [];
  }

  return payload.permissions.filter((permission): permission is string => typeof permission === "string");
}

function normalizePermissions(source: { permissions?: string[]; accessToken: string }): string[] {
  if (Array.isArray(source.permissions) && source.permissions.length > 0) {
    return source.permissions;
  }

  return getPermissionsFromToken(source.accessToken);
}

export function buildAuthSession(payload: AuthApiResponse): AuthSession {
  return {
    ...payload,
    profilePictureUrl: payload.profilePictureUrl ?? payload.picture,
    permissions: normalizePermissions(payload),
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
    const parsed = JSON.parse(raw) as Partial<AuthSession>;
    if (!parsed?.accessToken || !parsed?.expiresAtMs) {
      clearAuthSession();
      return null;
    }

    const hydrated: AuthSession = {
      collectorId: Number(parsed.collectorId),
      displayName: String(parsed.displayName ?? ""),
      email: String(parsed.email ?? ""),
      profilePictureUrl: parsed.profilePictureUrl,
      accessToken: parsed.accessToken,
      permissions: normalizePermissions({
        permissions: parsed.permissions,
        accessToken: parsed.accessToken,
      }),
      tokenType: String(parsed.tokenType ?? "Bearer"),
      expiresInSeconds: Number(parsed.expiresInSeconds ?? 0),
      expiresAtMs: Number(parsed.expiresAtMs),
    };

    return hydrated;
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
