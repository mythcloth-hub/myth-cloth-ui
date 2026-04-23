
import axios from "axios";

const httpClient = axios.create({
  baseURL: "http://localhost:8080/api/v1",
  headers: {
    "Content-Type": "application/json",
  },
});

// Log all outgoing requests
httpClient.interceptors.request.use((config) => {
  console.log("[API REQUEST]", config.method?.toUpperCase(), config.url, config.params, config.data);
  return config;
});

export default httpClient;