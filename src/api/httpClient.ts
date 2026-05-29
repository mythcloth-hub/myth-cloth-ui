
import axios from "axios";
import { getStoredAuthProvider, getStoredAuthToken } from "../auth/authStorage";

const httpClient = axios.create({
  baseURL: "http://localhost:9090/api/v1",
  headers: {
    "Content-Type": "application/json",
  },
});

// Log all outgoing requests
httpClient.interceptors.request.use((config) => {
  const token = getStoredAuthToken();
  const provider = getStoredAuthProvider();

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  if (provider) {
    config.headers["X-Auth-Provider"] = provider;
  }

  console.log("[API REQUEST]", config.method?.toUpperCase(), config.url, config.params, config.data);
  return config;
});

export default httpClient;