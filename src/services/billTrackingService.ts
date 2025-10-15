import { request } from './api';
import { STORAGE_KEYS } from '../constants/storageKeys';
import { getItem } from './storage';

interface PaginationOptions {
  page?: number;
  limit?: number;
}

export interface CommonFilterParams
  extends Record<string, string | number | null | undefined> {
  timeStart?: string;
  timeEnd?: string;
  keySearch?: string;
  projectID?: number;
  providerID?: number;
  typeTrackingBillID?: number;
  typeVehicleID?: number;
  deliveryVehicleID?: number;
}

export interface ImportTrackingFilters extends CommonFilterParams {}

export interface ExportTrackingFilters extends CommonFilterParams {
  projectIdFrom?: number;
  projectIDTo?: number;
}

export type TrackingBillItem = Record<string, unknown>;
export type LookupItem = Record<string, unknown>;
export type GenericObject = Record<string, unknown>;

const buildQuery = (params: Record<string, string | number | undefined | null>) => {
  const searchParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null) {
      return;
    }

    const stringValue = String(value).trim();
    if (stringValue.length === 0) {
      return;
    }

    searchParams.set(key, stringValue);
  });

  return searchParams.toString();
};

export const normaliseListResponse = (response: unknown): TrackingBillItem[] => {
  if (!response) return [];

  if (Array.isArray(response)) {
    return response;
  }

  if (typeof response === 'object' && response !== null) {
    const value = response as {
      data?: unknown;
      Data?: unknown;
      result?: unknown;
      Result?: unknown;
      items?: unknown;
      Items?: unknown;
    };
    if (Array.isArray(value.data)) return value.data;
    if (Array.isArray(value.Data)) return value.Data;
    if (Array.isArray(value.result)) return value.result;
    if (Array.isArray(value.Result)) return value.Result;
    if (Array.isArray(value.items)) return value.items;
    if (Array.isArray(value.Items)) return value.Items;
  }

  return [];
};

export const getImportTrackingBills = async (
  filters: ImportTrackingFilters,
  pagination: PaginationOptions = {},
) => {
  const { page = 1, limit = 20 } = pagination;
  const query = buildQuery(filters);

  const response = await request(
    'GET',
    `/trackingbill/list-tracking-bill-search${query ? `?${query}` : ''}`,
    {
      page,
      limit,
    },
  );

  return normaliseListResponse(response);
};

export const getImportTrackingReport = async (filters: ImportTrackingFilters) => {
  const query = buildQuery(filters);
  return request(
    'GET',
    `/trackingbill/report-tracking-bill-search${query ? `?${query}` : ''}`,
    {
      limit: 20000,
    },
  );
};

export const getExportTrackingBills = async (
  filters: ExportTrackingFilters,
  pagination: PaginationOptions = {},
) => {
  const { page = 1, limit = 20 } = pagination;
  const query = buildQuery(filters);

  const response = await request(
    'GET',
    `/exporttrackingbill/list-export-tracking-bill-search${query ? `?${query}` : ''}`,
    {
      page,
      limit,
    },
  );

  return normaliseListResponse(response);
};

export const getExportTrackingReport = async (filters: ExportTrackingFilters) => {
  const query = buildQuery(filters);
  return request(
    'GET',
    `/exporttrackingbill/report-export-tracking-bill-search${query ? `?${query}` : ''}`,
    {
      limit: 20000,
    },
  );
};

export const getTrackingTypes = async (keySearch = ''): Promise<LookupItem[]> => {
  const query = new URLSearchParams({ keySearch }).toString();
  const response = await request(
    'GET',
    `/typetrackingbill/list-type-tracking-bill?${query}`,
    {
      headers: {
        limit: '10000',
      },
    },
  );
  return normaliseListResponse(response);
};

export const getDeliveryVehicles = async (): Promise<LookupItem[]> => {
  const response = await request('GET', '/deliveryvehicles/list');
  return normaliseListResponse(response);
};

export const searchProviders = async (keySearch = ''): Promise<LookupItem[]> => {
  const query = buildQuery({ keySearch });
  const response = await request(
    'GET',
    `/providervehicles/search${query ? `?${query}` : ''}`,
  );
  return normaliseListResponse(response);
};

export const getVehicleTypes = async (): Promise<LookupItem[]> => {
  const response = await request('GET', '/typevehicles/all');
  return normaliseListResponse(response);
};

export const getUnits = async (): Promise<LookupItem[]> => {
  const response = await request('GET', '/unit/getlistunit');
  return normaliseListResponse(response);
};

export const getTrackingBillLatest = async (): Promise<GenericObject | null> => {
  const response = await request('GET', '/trackingbill/get-tracking-bill-lastest', {
    headers: {
      accept: 'application/json',
    },
  });

  if (response && typeof response === 'object' && 'data' in response) {
    const data = (response as { data?: GenericObject }).data;
    return (data && typeof data === 'object') ? data : null;
  }

  return null;
};

export interface TrackingBillTitleParams {
  projectID: number;
  typeTrackingBillID: number;
  deliveryVehicleID: number;
  isFirst: boolean;
}

export const getTrackingBillTitle = async ({
  projectID,
  typeTrackingBillID,
  deliveryVehicleID,
  isFirst,
}: TrackingBillTitleParams): Promise<string | null> => {
  const query = buildQuery({
    projectID,
    typeTrackingBillID,
    deliveryVehicleID,
    isFirst: isFirst ? 'true' : 'false',
  });

  const response = await request(
    'GET',
    `/trackingbill/get-title?${query}`,
    {
      headers: {
        accept: 'application/json',
      },
    },
  );

  if (typeof response === 'string') {
    return response;
  }

  if (response && typeof response === 'object') {
    const value = (response as { data?: unknown }).data;
    if (typeof value === 'string') {
      return value;
    }
  }

  return null;
};

export interface ExportTrackingBillPayload {
  ExportTrackingBillID?: number;
  ProjectIDFrom?: number | null;
  ProjectIDTo?: number | null;
  TypeTrackingBillID?: number | null;
  NameDriver?: string;
  CCCD?: string;
  LicensePlate?: string;
  UnitID?: number | null;
  Amount?: number | null;
  Description?: string;
  ImageExport1?: string;
  ImageExport2?: string;
  ImageExport3?: string;
  ImageSign?: string;
  IsCheck?: boolean;
  IsApprove?: boolean;
  [key: string]: unknown;
}

export const createExportTrackingBill = async (payload: ExportTrackingBillPayload) => {
  return request('POST', '/exporttrackingbill/create-export-tracking-bill', {
    body: payload,
    headers: {
      accept: 'application/json',
    },
  });
};

export interface TrackingBillPayload {
  TitleBill: string;
  TypeTrackingBillID?: number | null;
  ProjectID?: number | null;
  DeliveryVehicleID?: number | null;
  DateBill?: string;
  Amount?: number | null;
  ImageIn1?: string;
  ImageIn2?: string;
  ImageIn3?: string;
  ImageOut1?: string;
  ImageOut2?: string;
  ImageOut3?: string;
  FileReceive?: string;
  IsError?: number;
  Violate?: number;
  FileExact?: string;
  ViolationRuleID?: number;
  HandlingPlanID?: number;
  [key: string]: unknown;
}

export const createTrackingBill = async (payload: TrackingBillPayload) => {
  return request('POST', '/trackingbill/create-tracking-bill', {
    body: payload,
    headers: {
      accept: 'application/json',
    },
  });
};

export interface UploadFileOptions {
  subDirectory?: string;
}

export interface UploadFileResponse {
  publicPath?: string;
  [key: string]: unknown;
}

const FILE_UPLOAD_ENDPOINT = 'http://freeofficefile.gvbsoft.vn/api/publicupload';

export const uploadPublicFile = async (
  file: File,
  { subDirectory = 'RequestAttachment' }: UploadFileOptions = {},
): Promise<UploadFileResponse> => {
  const formData = new FormData();
  formData.append('File', file);
  formData.append('SubDirectory', subDirectory);

  const token = getItem(STORAGE_KEYS.token);

  const response = await fetch(FILE_UPLOAD_ENDPOINT, {
    method: 'POST',
    headers: {
      Accept: '*/*',
      ...(token ? { Authorization: token } : {}),
    },
    body: formData,
  });

  if (!response.ok) {
    const reason = await response.text();
    throw new Error(`Upload failed: ${response.status} ${response.statusText} - ${reason}`);
  }

  try {
    return (await response.json()) as UploadFileResponse;
  } catch (error) {
    throw new Error('Upload succeeded but response is not valid JSON');
  }
};
