import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { googleLogout, type CredentialResponse } from "@react-oauth/google";
import { registerCollectorWithFacebook, registerCollectorWithGoogle } from "../api/collectorAuthApi";
import {
  clearStoredAuthState,
  getStoredAuthProvider,
  getStoredAuthToken,
  getStoredAuthUser,
  setStoredAuthState,
  type AuthProviderId,
  type AuthUser,
} from "./authStorage";

type AuthContextValue = {
  provider: AuthProviderId | null;
  user: AuthUser | null;
  token: string | null;
  isAuthenticated: boolean;
  facebookEnabled: boolean;
  loginWithGoogle: (response: CredentialResponse) => Promise<void>;
  loginWithFacebook: () => Promise<void>;
  logout: () => void;
};

type FacebookAuthResponse = {
  accessToken: string;
};

type FacebookProfileResponse = {
  id: string;
  name: string;
  email?: string;
  picture?: {
    data?: {
      url?: string;
    };
  };
};

type FacebookLoginStatus = {
  status: "connected" | "not_authorized" | "unknown";
  authResponse?: FacebookAuthResponse;
};

type FacebookSdk = {
  init: (params: { appId: string; cookie: boolean; xfbml: boolean; version: string }) => void;
  login: (
    callback: (response: FacebookLoginStatus) => void,
    options: { scope: string }
  ) => void;
  logout: (callback: () => void) => void;
  api: (
    path: string,
    params: { fields: string },
    callback: (response: FacebookProfileResponse) => void
  ) => void;
};

type FacebookWindow = Window & typeof globalThis & {
  FB?: FacebookSdk;
  fbAsyncInit?: () => void;
};

const facebookAppId = import.meta.env.VITE_FACEBOOK_APP_ID;
const facebookEnabled = Boolean(facebookAppId);

const AuthContext = createContext<AuthContextValue>({
  provider: null,
  user: null,
  token: null,
  isAuthenticated: false,
  facebookEnabled,
  loginWithGoogle: async () => {},
  loginWithFacebook: async () => {},
  logout: () => {},
});

function decodeGoogleCredential(credential: string): AuthUser | null {
  try {
    const [, payload] = credential.split(".");
    if (!payload) {
      return null;
    }

    const base64 = payload.replace(/-/g, "+").replace(/_/g, "/");
    const paddedBase64 = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), "=");
    const jsonPayload = atob(paddedBase64);
    const parsed = JSON.parse(jsonPayload) as {
      sub?: string;
      name?: string;
      email?: string;
      picture?: string;
    };

    if (!parsed.name || !parsed.sub) {
      return null;
    }

    return {
      id: parsed.sub,
      name: parsed.name,
      email: parsed.email,
      picture: parsed.picture,
      provider: "google",
    };
  } catch {
    return null;
  }
}

function getFacebookSdk(windowObject: FacebookWindow) {
  return windowObject.FB;
}

function loadFacebookSdk(appId: string): Promise<FacebookSdk> {
  const windowObject = window as FacebookWindow;
  const existingSdk = getFacebookSdk(windowObject);

  if (existingSdk) {
    return Promise.resolve(existingSdk);
  }

  return new Promise((resolve, reject) => {
    const scriptId = "facebook-jssdk";
    const existingScript = document.getElementById(scriptId) as HTMLScriptElement | null;

    windowObject.fbAsyncInit = () => {
      const sdk = getFacebookSdk(windowObject);
      if (!sdk) {
        reject(new Error("Facebook SDK did not initialize."));
        return;
      }

      sdk.init({
        appId,
        cookie: true,
        xfbml: false,
        version: "v22.0",
      });
      resolve(sdk);
    };

    if (existingScript) {
      return;
    }

    const script = document.createElement("script");
    script.id = scriptId;
    script.async = true;
    script.defer = true;
    script.src = "https://connect.facebook.net/en_US/sdk.js";
    script.onerror = () => reject(new Error("Failed to load Facebook SDK."));
    document.body.appendChild(script);
  });
}

function loginWithFacebookSdk(appId: string): Promise<{ token: string; user: AuthUser }> {
  return loadFacebookSdk(appId).then(
    (sdk) =>
      new Promise((resolve, reject) => {
        sdk.login(
          (loginResponse) => {
            const token = loginResponse.authResponse?.accessToken;
            if (loginResponse.status !== "connected" || !token) {
              reject(new Error("Facebook login was cancelled or did not return an access token."));
              return;
            }
            console.log("[Facebook Login] Access Token:", token);

            sdk.api(
              "/me",
              { fields: "id,name,email,picture.width(128).height(128)" },
              (profileResponse) => {
                if (!profileResponse.id || !profileResponse.name) {
                  reject(new Error("Facebook profile data is incomplete."));
                  return;
                }

                resolve({
                  token,
                  user: {
                    id: profileResponse.id,
                    name: profileResponse.name,
                    email: profileResponse.email,
                    picture: profileResponse.picture?.data?.url,
                    provider: "facebook",
                  },
                });
              }
            );
          },
          { scope: "public_profile,email" }
        );
      })
  );
}

function clearProviderSession(provider: AuthProviderId | null) {
  if (provider === "google") {
    googleLogout();
    return;
  }

  if (provider === "facebook") {
    const sdk = (window as FacebookWindow).FB;
    sdk?.logout(() => {});
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [provider, setProvider] = useState<AuthProviderId | null>(() => getStoredAuthProvider());
  const [user, setUser] = useState<AuthUser | null>(() => getStoredAuthUser());
  const [token, setToken] = useState<string | null>(() => getStoredAuthToken());

  const persistAuth = useCallback((nextProvider: AuthProviderId, nextUser: AuthUser, nextToken: string) => {
    setProvider(nextProvider);
    setUser(nextUser);
    setToken(nextToken);
    setStoredAuthState({ provider: nextProvider, user: nextUser, token: nextToken });
  }, []);

  const loginWithGoogle = useCallback(
    async (response: CredentialResponse) => {
      if (!response.credential) {
        return;
      }

      const decodedUser = decodeGoogleCredential(response.credential);
      if (!decodedUser) {
        return;
      }

      persistAuth("google", decodedUser, response.credential);
      await registerCollectorWithGoogle();
    },
    [persistAuth]
  );

  const loginWithFacebook = useCallback(async () => {
    if (!facebookAppId) {
      throw new Error("Facebook App ID is missing.");
    }

    const authResult = await loginWithFacebookSdk(facebookAppId);
    persistAuth("facebook", authResult.user, authResult.token);
    await registerCollectorWithFacebook();
  }, [persistAuth]);

  const logout = useCallback(() => {
    clearProviderSession(provider);
    setProvider(null);
    setUser(null);
    setToken(null);
    clearStoredAuthState();
  }, [provider]);

  const value = useMemo(
    () => ({
      provider,
      user,
      token,
      isAuthenticated: Boolean(provider && user && token),
      facebookEnabled,
      loginWithGoogle,
      loginWithFacebook,
      logout,
    }),
    [loginWithFacebook, loginWithGoogle, logout, provider, token, user]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
