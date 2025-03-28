import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";

const API = axios.create({
  baseURL: "http://44.225.181.72/api",
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
