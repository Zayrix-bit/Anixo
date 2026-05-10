import { backendApi } from "./api";

export const login = async (email, password, cfToken) => {
  const { data } = await backendApi.post("/auth/login", { email, password, cfToken });
  return data;
};

export const register = async (username, email, password, cfToken) => {
  const { data } = await backendApi.post("/auth/register", { username, email, password, cfToken });
  return data;
};

export const getMe = async () => {
  const { data } = await backendApi.get("/auth/me");
  return data;
};

export const updateMe = async (profileData) => {
  const { data } = await backendApi.put("/auth/me", profileData);
  return data;
};

export const forgotPassword = async (email) => {
  const { data } = await backendApi.post("/auth/forgot-password", { email });
  return data;
};

export const resetPassword = async (token, password) => {
  const { data } = await backendApi.post(`/auth/reset-password/${token}`, { password });
  return data;
};

export const getAnilistAuthUrl = () => {
  const token = localStorage.getItem('token');
  const baseUrl = backendApi.defaults.baseURL || "";
  // In production, baseURL might be empty if using relative paths
  const absoluteBaseUrl = baseUrl || window.location.origin + '/api';
  return `${absoluteBaseUrl}/auth/anilist?token=${token}`;
};

export const disconnectAnilist = async () => {
  const { data } = await backendApi.post("/auth/anilist/disconnect");
  return data;
};
