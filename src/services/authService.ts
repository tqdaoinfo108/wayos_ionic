import CryptoJS from 'crypto-js';
import type { StoredUser } from '../constants/storageKeys';
import {
  LoginResponse,
  clearLoginState,
  persistLogin,
  request,
} from './api';

export interface LoginResult {
  token: string;
  user: StoredUser;
}

export const login = async (
  username: string,
  password: string,
): Promise<LoginResult> => {
  const hashedPassword = CryptoJS.MD5(password).toString();

  const response = await request<LoginResponse>('POST', '/authentication/login', {
    body: {
      StaffCode: username,
      Passwords: hashedPassword,
      IsMobile: true,
    },
    skipAuth: true,
  });

  const storedUser = persistLogin(response);

  return {
    token: response.token!.TokenID,
    user: storedUser,
  };
};

export const logout = (): void => {
  clearLoginState();
};

