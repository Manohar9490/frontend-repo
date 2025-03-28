import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";

const API = axios.create({
  baseURL: "http://100.20.92.101:5000/api",
  withCredentials: true,
});

API.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem("token");
  console.log("Attaching token:", token);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default API;
