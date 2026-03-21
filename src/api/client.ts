import axios from "axios";
import { tokenStorage } from "../utils/tokenStorage";

const BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:3000";

export const TOKEN_KEY = "auth_token";

export const apiClient = axios.create({
  baseURL: `${BASE_URL}/api`,
  timeout: 15000,
  headers: { "Content-Type": "application/json" },
});

// Attach JWT to every request
apiClient.interceptors.request.use(async (config) => {
  const token = await tokenStorage.getItem(TOKEN_KEY);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Normalise error shape so callers get a consistent ApiError
apiClient.interceptors.response.use(
  (res) => res,
  (error) => {
    const message: string = error.response?.data?.message ?? error.response?.data?.error ?? error.message ?? "An unexpected error occurred";
    const status: number | undefined = error.response?.status;

    // Attach a normalised error for consumers
    const normalised = new Error(message) as Error & { status?: number };
    normalised.status = status;
    return Promise.reject(normalised);
  },
);
