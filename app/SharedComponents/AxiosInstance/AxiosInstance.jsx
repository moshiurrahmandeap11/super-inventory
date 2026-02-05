import axios from "axios";

// Axios base instance
const axiosInstance = axios.create({
  baseURL: "http://localhost:5000/api", // backend URL
  withCredentials: true, 
});

export const baseImageURL = "http://localhost:5000";



export default axiosInstance;
