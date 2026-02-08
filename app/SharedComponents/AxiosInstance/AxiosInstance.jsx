import axios from "axios";

// Axios base instance
const axiosInstance = axios.create({
  baseURL: "https://server-inventory.vercel.app/api", // backend URL
  withCredentials: true, 
});

export const baseImageURL = "https://server-inventory.vercel.app";



export default axiosInstance;
