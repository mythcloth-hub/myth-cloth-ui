import { createContext, useContext } from "react";

export const AuthContext = createContext({
  isAuthenticated: false,
  facebookEnabled: true,
  loginWithFacebook: async () => {},
  loginWithGoogle: async () => {},
  logout: () => {},
});

export function useAuth() {
  return useContext(AuthContext);
}
