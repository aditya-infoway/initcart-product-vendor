/* import axios from "axios";

// ==== update your backend base url ====
const apiClient = axios.create({
  baseURL: "http://127.0.0.1:8000/api/", // <-- correct base
});

// ---- Attach Token Automatically ----
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem("access");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default apiClient;
 */

// src/api/apiClient.ts
import axios from "axios";
import { isTokenExpired } from "../utils/tokenUtils";
import { useAuthStore } from "../store/authStore";

const API_BASE = "http://localhost:8000/api/";
const REFRESH_URL = API_BASE + "token/refresh/";

const apiClient = axios.create({
  baseURL: API_BASE,
  timeout: 15000,
});

// ---- REQUEST INTERCEPTOR ----
apiClient.interceptors.request.use((config) => {
  const access = localStorage.getItem("access");

  if (access && !isTokenExpired(access)) {
    config.headers.Authorization = `Bearer ${access}`;
  }

  return config;
});

// ---- RESPONSE INTERCEPTOR ----
apiClient.interceptors.response.use(
  (res) => res,
  async (err) => {
    const original = err.config;

    if (err.response?.status !== 401 || original._retry) {
      return Promise.reject(err);
    }

    original._retry = true;

    const refresh = localStorage.getItem("refresh");

    if (!refresh || isTokenExpired(refresh)) {
      useAuthStore.getState().logoutAndRedirect();
      return Promise.reject(err);
    }

    try {
      const res = await axios.post(REFRESH_URL, { refresh });

      const newAccess = res.data.access;

      localStorage.setItem("access", newAccess);
      useAuthStore.getState().setNewAccess(newAccess);

      original.headers.Authorization = "Bearer " + newAccess;

      return apiClient(original);
    } catch (e) {
      useAuthStore.getState().logoutAndRedirect();
      return Promise.reject(e);
    }
  }
);

export default apiClient;
