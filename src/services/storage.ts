import { STORAGE_KEYS, StoredUser } from '../constants/storageKeys';

const isBrowser = typeof window !== 'undefined';

const getStorage = (): Storage | null => {
  if (!isBrowser) {
    return null;
  }
  try {
    return window.localStorage;
  } catch (error) {
    console.warn('LocalStorage is not available:', error);
    return null;
  }
};

const storage = getStorage();

export const getItem = (key: string): string | null => {
  return storage?.getItem(key) ?? null;
};

export const setItem = (key: string, value: string): void => {
  storage?.setItem(key, value);
};

export const removeItem = (key: string): void => {
  storage?.removeItem(key);
};

export const clearAuthStorage = (): void => {
  if (!storage) return;
  Object.values(STORAGE_KEYS).forEach((key) => storage.removeItem(key));
};

export const loadStoredUser = (): { token: string | null; user: StoredUser } => {
  const token = getItem(STORAGE_KEYS.token);
  const user: StoredUser = {
    staffID: parseNumber(getItem(STORAGE_KEYS.staffID)),
    staffFullName: getItem(STORAGE_KEYS.staffFullName) ?? undefined,
    staffCode: getItem(STORAGE_KEYS.staffCode) ?? undefined,
    userTypeID: parseNumber(getItem(STORAGE_KEYS.userTypeID)),
    companyID: parseNumber(getItem(STORAGE_KEYS.companyID)),
    companyName: getItem(STORAGE_KEYS.companyName) ?? undefined,
    staffInfoID: parseNumber(getItem(STORAGE_KEYS.staffInfoID)),
    departmentID: parseNumber(getItem(STORAGE_KEYS.departmentID)),
    departmentName: getItem(STORAGE_KEYS.departmentName) ?? undefined,
    imagesPath: getItem(STORAGE_KEYS.imagesPath) ?? undefined,
    statusID: parseNumber(getItem(STORAGE_KEYS.statusID)),
    isRequestApprove: parseBoolean(getItem(STORAGE_KEYS.isRequestApprove)),
  };
  return { token, user };
};

export const persistAuth = (token: string, user: Record<string, unknown>): StoredUser => {
  setItem(STORAGE_KEYS.token, token);

  const storedUser: StoredUser = {
    staffID: saveNumber(STORAGE_KEYS.staffID, user['StaffID']),
    staffFullName: saveString(STORAGE_KEYS.staffFullName, user['StaffFullName']),
    staffCode: saveString(STORAGE_KEYS.staffCode, user['StaffCode']),
    userTypeID: saveNumber(STORAGE_KEYS.userTypeID, user['UserTypeID']),
    companyID: saveNumber(STORAGE_KEYS.companyID, user['CompanyID']),
    companyName: saveString(STORAGE_KEYS.companyName, user['CompanyName']),
    staffInfoID: saveNumber(STORAGE_KEYS.staffInfoID, user['StaffInfoID']),
    departmentID: saveNumber(STORAGE_KEYS.departmentID, user['DepartmentID']),
    departmentName: saveString(STORAGE_KEYS.departmentName, user['DepartmentName']),
    imagesPath: saveString(STORAGE_KEYS.imagesPath, user['ImagesPath']),
    statusID: saveNumber(STORAGE_KEYS.statusID, user['StatusID']),
    isRequestApprove: saveBoolean(STORAGE_KEYS.isRequestApprove, user['IsRequestApprove']),
  };

  return storedUser;
};

const saveString = (key: string, value: unknown): string | undefined => {
  if (typeof value === 'string' && value.length > 0) {
    setItem(key, value);
    return value;
  }
  removeItem(key);
  return undefined;
};

const saveNumber = (key: string, value: unknown): number | undefined => {
  if (typeof value === 'number') {
    setItem(key, value.toString());
    return value;
  }
  if (typeof value === 'string' && value !== '') {
    const parsed = Number(value);
    if (!Number.isNaN(parsed)) {
      setItem(key, parsed.toString());
      return parsed;
    }
  }
  removeItem(key);
  return undefined;
};

const saveBoolean = (key: string, value: unknown): boolean | undefined => {
  if (typeof value === 'boolean') {
    setItem(key, value ? 'true' : 'false');
    return value;
  }
  if (value === '1' || value === 1 || value === 'true') {
    setItem(key, 'true');
    return true;
  }
  if (value === '0' || value === 0 || value === 'false') {
    setItem(key, 'false');
    return false;
  }
  removeItem(key);
  return undefined;
};

const parseNumber = (value: string | null): number | undefined => {
  if (!value) return undefined;
  const parsed = Number(value);
  return Number.isNaN(parsed) ? undefined : parsed;
};

const parseBoolean = (value: string | null): boolean | undefined => {
  if (value === null) return undefined;
  if (value === 'true' || value === '1') return true;
  if (value === 'false' || value === '0') return false;
  return undefined;
};

