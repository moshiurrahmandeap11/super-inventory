import axios from "axios";

// Axios base instance
const axiosInstance = axios.create({
  baseURL: "https://server-inventory-hrle.onrender.com/api", // backend URL
  withCredentials: false, 
});

export const baseImageURL = "https://server-inventory-hrle.onrender.com";



export default axiosInstance;
