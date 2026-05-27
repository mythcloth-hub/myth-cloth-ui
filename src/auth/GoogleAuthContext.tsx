import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { googleLogout, type CredentialResponse } from "@react-oauth/google";

type GoogleUser = {
  sub: string;
  name: string;
  email: string;
  picture?: string;
};

type GoogleAuthContextValue = {
  user: GoogleUser | null;
  token: string | null;
  isAuthenticated: boolean;
  loginWithGoogle: (response: CredentialResponse) => void;
  logout: () => void;
};

const USER_STORAGE_KEY = "mythClothGoogleUser";
const TOKEN_STORAGE_KEY = "mythClothGoogleToken";

const GoogleAuthContext = createContext<GoogleAuthContextValue>({
  user: null,
  token: null,
  isAuthenticated: false,
  loginWithGoogle: () => {},
  logout: () => {},
});

function decodeGoogleCredential(credential: string): GoogleUser | null {
  try {
    const [, payload] = credential.split(".");
    if (!payload) {
      return null;
    }

    const base64 = payload.replace(/-/g, "+").replace(/_/g, "/");
    const paddedBase64 = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), "=");
    const jsonPayload = atob(paddedBase64);
    const parsed = JSON.parse(jsonPayload) as GoogleUser;

    if (!parsed.email || !parsed.name || !parsed.sub) {
      return null;
    }

    return parsed;
  } catch {
    return null;
  }
}

function getStoredUser(): GoogleUser | null {
  const raw = localStorage.getItem(USER_STORAGE_KEY);
  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as GoogleUser;
  } catch {
    localStorage.removeItem(USER_STORAGE_KEY);
    return null;
  }
}

function getStoredToken(): string | null {
  return localStorage.getItem(TOKEN_STORAGE_KEY);
}

export function getGoogleAccessToken(): string | null {
  return localStorage.getItem(TOKEN_STORAGE_KEY);
}

export function GoogleAuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<GoogleUser | null>(() => getStoredUser());
  const [token, setToken] = useState<string | null>(() => getStoredToken());

  const loginWithGoogle = useCallback((response: CredentialResponse) => {
    if (!response.credential) {
      return;
    }

    const decodedUser = decodeGoogleCredential(response.credential);
    if (!decodedUser) {
      return;
    }

    setUser(decodedUser);
    setToken(response.credential);
    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(decodedUser));
    localStorage.setItem(TOKEN_STORAGE_KEY, response.credential);
  }, []);

  const logout = useCallback(() => {
    googleLogout();
    setUser(null);
    setToken(null);
    localStorage.removeItem(USER_STORAGE_KEY);
    localStorage.removeItem(TOKEN_STORAGE_KEY);
  }, []);

  const value = useMemo(
    () => ({
      user,
      token,
      isAuthenticated: Boolean(user && token),
      loginWithGoogle,
      logout,
    }),
    [loginWithGoogle, logout, token, user]
  );

  return <GoogleAuthContext.Provider value={value}>{children}</GoogleAuthContext.Provider>;
}

export function useGoogleAuth() {
  return useContext(GoogleAuthContext);
}
