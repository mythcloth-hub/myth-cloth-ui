import httpClient from "../api/httpClient";
import type { AuthApiResponse } from "./authSession";

export type DemoAvailabilityResponse = {
  enabled: boolean;
  providerUserId: string;
  name: string;
  email: string;
};

export async function getDemoAvailability(): Promise<DemoAvailabilityResponse> {
  const res = await httpClient.get<DemoAvailabilityResponse>("/demos");
  return res.data;
}

export async function loginWithDemoUser(): Promise<AuthApiResponse> {
  const res = await httpClient.post<AuthApiResponse>("/collectors/auth/local", {});
  return res.data;
}
