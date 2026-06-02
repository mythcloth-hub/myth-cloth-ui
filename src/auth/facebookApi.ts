import httpClient from "../api/httpClient";
import type { AuthApiResponse } from "./authSession";

export async function validateFacebookToken(accessToken: string): Promise<AuthApiResponse> {
  // Frontend only forwards the user token; backend should validate via Facebook debug_token.
  const res = await httpClient.post<AuthApiResponse>("/collectors/auth/facebook", { accessToken });
  return res.data;
}
