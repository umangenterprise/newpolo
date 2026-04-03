import axios from "axios";

const resolveBaseUrlForMobile = (rawUrl) => {
  if (!rawUrl) return rawUrl;

  try {
    const parsed = new URL(rawUrl);
    const isLocalhost = ["localhost", "127.0.0.1"].includes(parsed.hostname);
    const hasWindow = typeof window !== "undefined";
    const mobileHost =
      hasWindow && !["localhost", "127.0.0.1"].includes(window.location.hostname)
        ? window.location.hostname
        : "";

    if (isLocalhost && mobileHost) {
      parsed.hostname = mobileHost;
    }

    return parsed.toString().replace(/\/$/, "");
  } catch {
    return rawUrl;
  }
};

const apiBaseUrl = resolveBaseUrlForMobile(import.meta.env.VITE_API_URL || "http://localhost:5000/api");

const api = axios.create({
  baseURL: apiBaseUrl
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("umang_token");

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

export default api;
