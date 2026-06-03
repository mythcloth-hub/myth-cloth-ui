import { validateFacebookToken, validateGoogleToken } from "./facebookApi";
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
  googleEnabled: boolean;
  loginWithFacebook: () => void;
  loginWithGoogle: () => void;
  logout: () => void;
};

export const AuthContext = createContext<AuthContextType>({
  isAuthenticated: false,
  session: null,
  facebookEnabled: true,
  googleEnabled: true,
  loginWithFacebook: () => { },
  loginWithGoogle: () => { },
  logout: () => { },
});

export function useAuth() {
  return useContext(AuthContext);
}

type GoogleIdTokenPayload = {
  picture?: string;
};

function parseGooglePictureFromIdToken(idToken: string): string | undefined {
  try {
    const parts = idToken.split(".");
    if (parts.length < 2) return undefined;

    const base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, "=");
    const decoded = atob(padded);
    const payload = JSON.parse(decoded) as GoogleIdTokenPayload;
    return payload.picture;
  } catch {
    return undefined;
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<AuthSession | null>(() => getValidAuthSession());
  const [notice, setNotice] = useState<AuthNotice | null>(null);
  const facebookAppId = import.meta.env.VITE_FACEBOOK_APP_ID as string | undefined;
  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined;

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
    if (!facebookAppId) {
      setNotice({ message: "Facebook login is not configured (missing VITE_FACEBOOK_APP_ID).", severity: "error" });
      return;
    }

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
  }, [facebookAppId]);

  type GoogleCredentialResponse = {
    credential?: string;
  };

  type GooglePromptMomentNotification = {
    isNotDisplayed?: () => boolean;
    isSkippedMoment?: () => boolean;
    getNotDisplayedReason?: () => string;
    getSkippedReason?: () => string;
  };

  const loginWithGoogle = useCallback(() => {
    if (!googleClientId) {
      setNotice({ message: "Google login is not configured (missing VITE_GOOGLE_CLIENT_ID).", severity: "error" });
      return;
    }

    if (!window.google?.accounts?.id) {
      setNotice({ message: "Google SDK not loaded yet.", severity: "error" });
      return;
    }

    window.google.accounts.id.initialize({
      client_id: googleClientId,
      use_fedcm_for_prompt: false,
      callback: async (response: GoogleCredentialResponse) => {
        const idToken = response?.credential;
        if (!idToken) {
          setNotice({ message: "Google login did not return a token.", severity: "error" });
          return;
        }

        try {
          const authResponse = await validateGoogleToken(idToken);
          const pictureFromToken = parseGooglePictureFromIdToken(idToken);
          const nextSession = buildAuthSession({
            ...authResponse,
            picture: authResponse.picture ?? pictureFromToken,
          });
          saveAuthSession(nextSession);
          setSession(nextSession);
          setNotice({ message: `Welcome, ${nextSession.displayName}!`, severity: "success" });
        } catch (err) {
          setNotice({ message: "Google login failed. Please try again.", severity: "error" });
        }
      },
    });

    window.google.accounts.id.prompt((notification: GooglePromptMomentNotification) => {
      const wasNotDisplayed = notification?.isNotDisplayed?.() ?? false;
      const wasSkipped = notification?.isSkippedMoment?.() ?? false;

      if (!wasNotDisplayed && !wasSkipped) return;

      const reason =
        notification?.getNotDisplayedReason?.() ||
        notification?.getSkippedReason?.() ||
        "unknown";

      setNotice({
        severity: "info",
        message:
          reason === "opt_out_or_no_session" || reason === "suppressed_by_user"
            ? "Google sign-in is blocked in this browser. Enable third-party sign-in/FedCM in site settings and try again."
            : `Google sign-in prompt was not shown (${reason}). Check browser sign-in/privacy settings and try again.`,
      });
    });
  }, [googleClientId]);

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
      facebookEnabled: Boolean(facebookAppId),
      googleEnabled: Boolean(googleClientId),
      loginWithFacebook,
      loginWithGoogle,
      logout,
    }),
    [session, facebookAppId, googleClientId, loginWithFacebook, loginWithGoogle, logout]
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