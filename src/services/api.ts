import type { StoredUser } from '../constants/storageKeys';
import { STORAGE_KEYS } from '../constants/storageKeys';
import { clearAuthStorage, getItem, persistAuth, setItem } from './storage';

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE';

export interface RequestOptions {
  body?: Record<string, unknown> | undefined | null;
  headers?: Record<string, string>;
  page?: number;
  limit?: number;
  skipAuth?: boolean;
}

const isBrowser = typeof window !== 'undefined';

const API_BASE_URL = isBrowser
  ? 'https://quocdung.sitienbmt.workers.dev/?url=http://freeofficeapi.gvbsoft.vn/api'
  : 'http://freeofficeapi.gvbsoft.vn/api';

const buildHeaders = (
  customHeaders: Record<string, string> | undefined,
  token: string | null,
  page: number | undefined,
  limit: number | undefined,
): Headers => {
  const headers = new Headers({
    'Content-Type': 'application/json',
    Accept: 'application/json',
    Page: `${page ?? 1}`,
    Limit: `${limit ?? 10000}`,
  });

  if (customHeaders) {
    Object.entries(customHeaders).forEach(([key, value]) => {
      headers.set(key, value);
    });
  }

  if (token) {
    headers.set('Authorization', token);
  }

  return headers;
};

export const request = async <T = unknown>(
  method: HttpMethod,
  endpoint: string,
  opts: RequestOptions = {},
): Promise<T> => {
  const { body, headers: customHeaders, page, limit, skipAuth } = opts;
  const token = skipAuth ? null : getItem(STORAGE_KEYS.token);
  const headers = buildHeaders(customHeaders, token, page, limit);

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(
      `Request failed: ${response.status} ${response.statusText} - ${errorBody}`,
    );
  }

  const text = await response.text();
  if (!text) {
    return null as T;
  }

  try {
    return JSON.parse(text) as T;
  } catch (error) {
    throw new Error('Unable to parse JSON response');
  }
};

export interface AuthPayload {
  TokenID: string;
  [key: string]: unknown;
}

export interface LoginResponse {
  token?: AuthPayload;
  [key: string]: unknown;
}

export const persistLogin = (response: LoginResponse): StoredUser => {
  if (!response?.token?.TokenID) {
    throw new Error('Missing token data in response');
  }

  const token = response.token.TokenID;
  return persistAuth(token, response.token);
};

export const clearLoginState = (): void => {
  clearAuthStorage();
};

export const updateToken = (token: string): void => {
  setItem(STORAGE_KEYS.token, token);
};
