import axios from "axios";

const getDefaultApiUrl = () => {
  if (typeof window === "undefined") {
    return "http://localhost:5000/api";
  }

  const host = window.location.hostname.toLowerCase();
  if (host === "umangbags.shop" || host === "www.umangbags.shop") {
    return "https://api.umangbags.shop/api";
  }

  return "http://localhost:5000/api";
};

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

const configuredApiUrl = import.meta.env.VITE_API_URL?.trim();
const apiBaseUrl = resolveBaseUrlForMobile(configuredApiUrl || getDefaultApiUrl());

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
