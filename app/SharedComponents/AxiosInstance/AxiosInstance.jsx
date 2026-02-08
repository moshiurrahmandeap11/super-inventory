import axios from "axios";

// Axios base instance
const axiosInstance = axios.create({
  baseURL: "https://server-inventory.vercel.app/api", // backend URL
  withCredentials: true, // This is IMPORTANT for cookies
});

export const baseImageURL = "https://server-inventory.vercel.app";

// Add request interceptor to include credentials
axiosInstance.interceptors.request.use(
  (config) => {
    // Add any auth token if stored in localStorage
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor to handle errors
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Handle unauthorized access
      console.error("Unauthorized access - redirecting to login");
      localStorage.removeItem("token");
      localStorage.removeItem("userId");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;