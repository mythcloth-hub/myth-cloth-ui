import httpClient from "./httpClient";

export const registerCollectorWithGoogle = async (): Promise<void> => {
  await httpClient.post("/collectors/auth/google");
};

export const registerCollectorWithFacebook = async (): Promise<void> => {
  await httpClient.post("/collectors/auth/facebook");
};
