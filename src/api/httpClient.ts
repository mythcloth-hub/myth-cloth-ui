
import axios from "axios";
import { getGoogleAccessToken } from "../auth/GoogleAuthContext";

const httpClient = axios.create({
  baseURL: "http://localhost:8080/api/v1",
  headers: {
    "Content-Type": "application/json",
  },
});

// Log all outgoing requests
httpClient.interceptors.request.use((config) => {
  const token = getGoogleAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  console.log("[API REQUEST]", config.method?.toUpperCase(), config.url, config.params, config.data);
  return config;
});

export default httpClient;