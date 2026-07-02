//src/utils/axiosInstance.ts
import axios from "axios";
import { useAuthStore } from "../store/authStore";

const axiosInstance = axios.create({
  baseURL: "http://localhost:8000/api/ecommerce/",
});

// 🔐 Request Interceptor
axiosInstance.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().access;

    console.log(" Axios Request Interceptor:");
    console.log("   URL:", config.url);
    console.log("   Token exists:", !!token);
    console.log("   Token:", token);

    if (token) {
      config.headers["Authorization"] = `Bearer ${token}`;
    } else {
      console.log("    No token found");
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// 🔄 Response Interceptor
axiosInstance.interceptors.response.use(
  (response) => {
    console.log("✅ Axios Response:", response.status, response.config.url);
    return response;
  },
  async (error) => {

    if (error.response?.status === 401) {
      console.log("❌ Token expired → Logout & Redirect");
      useAuthStore.getState().logoutAndRedirect();
      return Promise.reject(error);
    }

    return Promise.reject(error);
  }
);

export default axiosInstance;
