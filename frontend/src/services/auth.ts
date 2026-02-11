import api from "./api";
import type { User, TokenResponse } from "../types/user";

export async function postLogin(
  email: string,
  password: string
): Promise<TokenResponse> {
  const { data } = await api.post<TokenResponse>("/auth/login", {
    email,
    password,
  });
  return data;
}

export async function postRegister(
  username: string,
  email: string,
  password: string
): Promise<User> {
  const { data } = await api.post<User>("/auth/register", {
    username,
    email,
    password,
  });
  return data;
}

export async function postRefresh(
  refreshToken: string
): Promise<TokenResponse> {
  const { data } = await api.post<TokenResponse>("/auth/refresh", {
    refresh_token: refreshToken,
  });
  return data;
}

export async function getMe(): Promise<User> {
  const { data } = await api.get<User>("/users/me");
  return data;
}
