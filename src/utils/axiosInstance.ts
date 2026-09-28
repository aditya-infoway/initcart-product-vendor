//src/utils/axiosInstance.ts
import axios from "axios";
import { useAuthStore } from "../store/authStore";

const axiosInstance = axios.create({
  baseURL: "http://localhost:8000/api/ecommerce/",
});

//  Request Interceptor
axiosInstance.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().access;


    if (token) {
      config.headers["Authorization"] = `Bearer ${token}`;
    } 

    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor
axiosInstance.interceptors.response.use(
  (response) => {

    return response;
  },
  async (error) => {

    if (error.response?.status === 401) {

      useAuthStore.getState().logoutAndRedirect();
      return Promise.reject(error);
    }

    return Promise.reject(error);
  }
);

export default axiosInstance;
