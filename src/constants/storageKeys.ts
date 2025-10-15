export const STORAGE_KEYS = {
  token: 'TOKEN_ID',
  staffID: 'USER_STAFFID',
  staffFullName: 'USER_STAFFFULLNAME',
  staffCode: 'USER_STAFFCODE',
  userTypeID: 'USER_USERTYPEID',
  companyID: 'USER_COMPANYID',
  companyName: 'USER_COMPANYNAME',
  staffInfoID: 'USER_STAFFINFOID',
  departmentID: 'USER_DEPARTMENTID',
  departmentName: 'USER_DEPARTMENTNAME',
  imagesPath: 'USER_IMAGESPATH',
  statusID: 'USER_STATUSID',
  isRequestApprove: 'USER_ISREQUESTAPPROVE',
};

export type StorageKey = keyof typeof STORAGE_KEYS;

export interface StoredUser {
  staffID?: number;
  staffFullName?: string;
  staffCode?: string;
  userTypeID?: number;
  companyID?: number;
  companyName?: string;
  staffInfoID?: number;
  departmentID?: number;
  departmentName?: string;
  imagesPath?: string;
  statusID?: number;
  isRequestApprove?: boolean;
}

