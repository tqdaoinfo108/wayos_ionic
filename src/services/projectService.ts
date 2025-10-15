import { request } from './api';
import { LookupItem, normaliseListResponse } from './billTrackingService';

export type ProjectItem = LookupItem & {
  ProjectID?: number;
  ProjectName?: string;
  Name?: string;
};

const projectEndpoints = [
  '/projects/list',
  '/project/listproject',
  '/project/listprojects',
  '/project/getlistproject',
  '/project/getprojects',
];

export const getProjects = async (keySearch = ''): Promise<ProjectItem[]> => {
  const query = keySearch.trim()
    ? `?${new URLSearchParams({ keySearch }).toString()}`
    : '';

  let lastError: unknown = null;

  for (const endpoint of projectEndpoints) {
    try {
      const response = await request('GET', `${endpoint}${query}`);
      return normaliseListResponse(response);
    } catch (error) {
      lastError = error;
    }
  }

  if (lastError instanceof Error) {
    throw lastError;
  }

  throw new Error('Unable to fetch project list');
};
