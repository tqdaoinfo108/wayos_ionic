import { request } from './api';

interface PaginationParams {
  page?: number;
  limit?: number;
}

interface SearchParams extends PaginationParams {
  status?: number;
  searchText?: string;
}

const DEFAULT_LIMIT = 10;

const withPaginationHeaders = ({ page, limit }: PaginationParams = {}) => ({
  page: String(page ?? 1),
  limit: String(limit ?? DEFAULT_LIMIT),
});

export const getRequestList = async ({
  status = -100,
  searchText = '',
  page = 1,
  limit = DEFAULT_LIMIT,
}: SearchParams = {}) => {
  const query = new URLSearchParams({
    typeWorkFlowID: '',
    keySearch: searchText,
    statusID: status.toString(),
  }).toString();

  return request('GET', `/workflow/listWorkflowsearch?${query}`, {
    headers: withPaginationHeaders({ page, limit }),
    page,
    limit,
  });
};

export const getRequestWorkList = async ({
  status = -100,
  searchText = '',
  page = 1,
  limit = DEFAULT_LIMIT,
}: SearchParams = {}) => {
  const query = new URLSearchParams({
    keySearch: searchText,
    statusID: status.toString(),
    fromDate: '',
    toDate: '',
    userID: 'null',
  }).toString();

  return request('GET', `/requestprocess/listprocess?${query}`, {
    headers: withPaginationHeaders({ page, limit }),
    page,
    limit,
  });
};

export const getListWorkFlowApprove = async (workFlowID: number) => {
  return request('GET', `/workflow/listworkflowapprove/${workFlowID}?workFlowID=${workFlowID}`);
};

export const getWorkFlowByID = async (workFlowID: number) => {
  return request('GET', `/workflow/getworkflowbyid/${workFlowID}?workFlowID=${workFlowID}`);
};

export const getWorkflowComment = async (workFlowID: number) => {
  return request(
    'GET',
    `/requestcomment/getlistrequestcommentbyworkflowid/${workFlowID}?workFlowID=${workFlowID}`,
  );
};

export const getProcessByID = async (processID: number) => {
  return request(
    'GET',
    `/requestprocess/getprocessbyid/${processID}?processID=${processID}`,
  );
};

export const getNeedToHandleProcessList = async ({
  searchText = '',
  page = 1,
  limit = DEFAULT_LIMIT,
}: PaginationParams & { searchText?: string } = {}) => {
  const query = new URLSearchParams({
    keySearch: searchText,
  }).toString();

  return request(
    'GET',
    `/requestprocess/listprocessneedmyapproval?${query}`,
    {
      headers: withPaginationHeaders({ page, limit }),
      page,
      limit,
    },
  );
};

export const getMyProposalProcessList = async ({
  searchText = '',
  page = 1,
  limit = DEFAULT_LIMIT,
}: PaginationParams & { searchText?: string } = {}) => {
  const query = new URLSearchParams({
    keySearch: searchText,
  }).toString();

  return request(
    'GET',
    `/requestprocess/listprocesscreatedbyme?${query}`,
    {
      headers: withPaginationHeaders({ page, limit }),
      page,
      limit,
    },
  );
};

export const createRequestCommentWorkflow = async (workFlowID: number, comment: string) => {
  return request('POST', `/requestcomment/createrequestcommentworkflow?workFlowID=${workFlowID}`, {
    body: { Comment: comment },
  });
};

export const getAttachmentList = async (processID?: number, workFlowID?: number) => {
  const query = new URLSearchParams({
    processID: processID?.toString() ?? '',
    workFlowID: workFlowID?.toString() ?? '',
  }).toString();

  return request('GET', `/requestattachment/listattachments?${query}`);
};

export const getRequestProcessComment = async (processID: number) => {
  return request(
    'GET',
    `/requestcomment/getrequestcommentchat?ProcessID=${processID}&CommentID=1`,
  );
};

export const createRequestProcessComment = async (
  processID: number,
  comment: string,
  staffInfoID: number,
) => {
  return request('POST', `/requestcomment/createrequestcomment?RequestProcessID=${processID}`, {
    body: {
      Comment: comment,
      staffInforID: staffInfoID,
    },
  });
};

export const updateWorkflowIsApprove = async (workFlowApproveID: number, statusID: number) => {
  return request(
    'PUT',
    `/workflow/updateworkflowisapprove?workFlowApproveID=${workFlowApproveID}`,
    {
      body: { IsApprove: statusID },
    },
  );
};

export const forwardWorkflow = async (workFlowID: number, staffID: number) => {
  return request(
    'PUT',
    `/workflow/forwardworkflow/4620?workFlowID=${workFlowID}&userForwardID=${staffID}`,
  );
};

export const getListStaffByDepartmentID = async (departmentID: number) => {
  return request(
    'GET',
    `/staff/getlistcompanystaffs?departmentID=${departmentID}`,
  );
};

