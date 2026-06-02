import { validateFacebookToken } from "./facebookApi";
import {
  AUTH_SESSION_CHANGED_EVENT,
  AUTH_SESSION_STORAGE_KEY,
  buildAuthSession,
  clearAuthSession,
  getValidAuthSession,
  saveAuthSession,
  type AuthSession,
} from "./authSession";
import { createContext, useContext, useState, useCallback, useMemo, useEffect } from "react";
import { Alert, Snackbar } from "@mui/material";

type AuthNotice = {
  message: string;
  severity: "success" | "error" | "info";
};

type AuthContextType = {
  isAuthenticated: boolean;
  session: AuthSession | null;
  facebookEnabled: boolean;
  loginWithFacebook: () => void;
  loginWithGoogle: () => void;
  logout: () => void;
};

export const AuthContext = createContext<AuthContextType>({
  isAuthenticated: false,
  session: null,
  facebookEnabled: true,
  loginWithFacebook: () => { },
  loginWithGoogle: () => { },
  logout: () => { },
});

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<AuthSession | null>(() => getValidAuthSession());
  const [notice, setNotice] = useState<AuthNotice | null>(null);

  useEffect(() => {
    const syncSession = () => {
      setSession(getValidAuthSession());
    };

    const onStorage = (event: StorageEvent) => {
      if (event.key === AUTH_SESSION_STORAGE_KEY) {
        syncSession();
      }
    };

    window.addEventListener(AUTH_SESSION_CHANGED_EVENT, syncSession);
    window.addEventListener("storage", onStorage);

    return () => {
      window.removeEventListener(AUTH_SESSION_CHANGED_EVENT, syncSession);
      window.removeEventListener("storage", onStorage);
    };
  }, []);

  // Facebook login handler
  const loginWithFacebook = useCallback(() => {
    if (!window.FB) {
      setNotice({ message: "Facebook SDK not loaded yet.", severity: "error" });
      return;
    }
    window.FB.login(
      function (response: any) {
        if (response.authResponse) {
          const accessToken = response.authResponse.accessToken;
          // Use an async IIFE inside the callback
          (async () => {
            try {
              const authResponse = await validateFacebookToken(accessToken);
              const nextSession = buildAuthSession(authResponse);
              saveAuthSession(nextSession);
              setSession(nextSession);
              setNotice({ message: `Welcome, ${nextSession.displayName}!`, severity: "success" });
            } catch (err) {
              setNotice({ message: "Login failed. Please try again.", severity: "error" });
            }
          })();
        } else {
          // User cancelled login or did not fully authorize.
        }
      },
      { scope: "public_profile,email" }
    );
  }, []);

  // Placeholder for Google login
  const loginWithGoogle = useCallback(() => {
    alert("Google login not implemented yet.");
  }, []);

  const logout = useCallback(() => {
    clearAuthSession();
    setSession(null);
    setNotice({ message: "You have been logged out.", severity: "info" });
    // Optionally, log out from Facebook as well
    if (window.FB) {
      window.FB.logout();
    }
  }, []);

  const value = useMemo(
    () => ({
      isAuthenticated: Boolean(session),
      session,
      facebookEnabled: true,
      loginWithFacebook,
      loginWithGoogle,
      logout,
    }),
    [session, loginWithFacebook, loginWithGoogle, logout]
  );

  return (
    <>
      <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
      <Snackbar
        open={Boolean(notice)}
        autoHideDuration={3000}
        onClose={() => setNotice(null)}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <Alert severity={notice?.severity ?? "info"} onClose={() => setNotice(null)}>
          {notice?.message}
        </Alert>
      </Snackbar>
    </>
  );
}