import { clearStoredAuthState, getStoredAuthToken, setStoredAuthState, type AuthUser } from "./authStorage";

const LEGACY_GOOGLE_USER: AuthUser = {
  id: "legacy-google-user",
  name: "Google User",
  provider: "google",
};

export function getGoogleAccessToken(): string | null {
  return getStoredAuthToken();
}

export function setGoogleAccessToken(token: string) {
  setStoredAuthState({
    provider: "google",
    token,
    user: LEGACY_GOOGLE_USER,
  });
}

export function clearGoogleAccessToken() {
  clearStoredAuthState();
}
