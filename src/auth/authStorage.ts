export type AuthProviderId = "google" | "facebook";

export type AuthUser = {
  id: string;
  name: string;
  email?: string;
  picture?: string;
  provider: AuthProviderId;
};

type StoredAuthState = {
  provider: AuthProviderId;
  token: string;
  user: AuthUser;
};

const AUTH_PROVIDER_STORAGE_KEY = "mythClothAuthProvider";
const AUTH_TOKEN_STORAGE_KEY = "mythClothAuthToken";
const AUTH_USER_STORAGE_KEY = "mythClothAuthUser";

export function getStoredAuthProvider(): AuthProviderId | null {
  const provider = localStorage.getItem(AUTH_PROVIDER_STORAGE_KEY);
  if (provider === "google" || provider === "facebook") {
    return provider;
  }

  return null;
}

export function getStoredAuthToken(): string | null {
  return localStorage.getItem(AUTH_TOKEN_STORAGE_KEY);
}

export function getStoredAuthUser(): AuthUser | null {
  const raw = localStorage.getItem(AUTH_USER_STORAGE_KEY);
  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as AuthUser;
  } catch {
    localStorage.removeItem(AUTH_USER_STORAGE_KEY);
    return null;
  }
}

export function setStoredAuthState(state: StoredAuthState) {
  localStorage.setItem(AUTH_PROVIDER_STORAGE_KEY, state.provider);
  localStorage.setItem(AUTH_TOKEN_STORAGE_KEY, state.token);
  localStorage.setItem(AUTH_USER_STORAGE_KEY, JSON.stringify(state.user));
}

export function clearStoredAuthState() {
  localStorage.removeItem(AUTH_PROVIDER_STORAGE_KEY);
  localStorage.removeItem(AUTH_TOKEN_STORAGE_KEY);
  localStorage.removeItem(AUTH_USER_STORAGE_KEY);
}
