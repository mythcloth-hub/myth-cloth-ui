
import axios from "axios";
import { clearAuthSession, getAuthorizationHeaderValue } from "../auth/authSession";

const httpClient = axios.create({
  baseURL: "http://localhost:9090/api/v1",
  headers: {
    "Content-Type": "application/json",
  },
});

// Log all outgoing requests
httpClient.interceptors.request.use((config) => {
  const authorizationHeader = getAuthorizationHeaderValue();
  if (authorizationHeader) {
    config.headers.Authorization = authorizationHeader;
  }

  console.log("[API REQUEST]", config.method?.toUpperCase(), config.url, config.params, config.data);
  return config;
});

httpClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error?.response?.status === 401) {
      clearAuthSession();
    }
    return Promise.reject(error);
  }
);

export default httpClient;