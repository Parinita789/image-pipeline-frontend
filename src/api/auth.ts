import api from "./axios";
import type { APIResponse, LoginResponse } from "../types";

export async function login(email: string, password: string) {
  const res = await api.post<APIResponse<LoginResponse>>("/auth/login", {
    email,
    password,
  });
  return res.data.data;
}

export async function register(
  email: string,
  password: string,
  firstName: string,
  lastName: string
) {
  const res = await api.post<APIResponse<{ message: string }>>(
    "/auth/register",
    { email, password, firstName, lastName }
  );
  return res.data;
}

export async function forgotPassword(email: string) {
  const res = await api.post<APIResponse<null>>("/auth/forgot-password", {
    email,
  });
  return res.data;
}

export async function resetPassword(token: string, newPassword: string) {
  const res = await api.post<APIResponse<null>>("/auth/reset-password", {
    token,
    newPassword,
  });
  return res.data;
}

export async function changePassword(
  currentPassword: string,
  newPassword: string
) {
  const res = await api.post<APIResponse<null>>("/auth/change-password", {
    currentPassword,
    newPassword,
  });
  return res.data;
}
