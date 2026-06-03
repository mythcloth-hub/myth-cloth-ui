import httpClient from "../api/httpClient";
import type { AuthApiResponse } from "./authSession";

export async function validateFacebookToken(accessToken: string): Promise<AuthApiResponse> {
  // Frontend only forwards the user token; backend should validate via Facebook debug_token.
  const res = await httpClient.post<AuthApiResponse>("/collectors/auth/facebook", { accessToken });
  return res.data;
}

export async function validateGoogleToken(idToken: string): Promise<AuthApiResponse> {
  // Frontend forwards Google ID token; backend must verify token signature/claims with Google.
  const res = await httpClient.post<AuthApiResponse>("/collectors/auth/google", { idToken });
  return res.data;
}
