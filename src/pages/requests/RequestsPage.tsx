import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  IonContent,
  IonHeader,
  IonItem,
  IonLabel,
  IonList,
  IonPage,
  IonSearchbar,
  IonSegment,
  IonSegmentButton,
  IonSelect,
  IonSelectOption,
  IonSpinner,
  IonText,
  IonTitle,
  IonToolbar,
} from '@ionic/react';
import { useHistory } from 'react-router-dom';
import {
  getMyProposalProcessList,
  getNeedToHandleProcessList,
  getRequestList,
  getRequestWorkList,
} from '../../services/requestService';
import { formatDate } from '../../utils/date';
import {
  getWorkflowStatusColor,
  getWorkflowStatusLabel,
  getWorkHandlingStatusColor,
  getWorkHandlingStatusLabel,
} from '../../utils/status';

type RequestMode = 'processing' | 'handling';

interface RequestItem {
  WorkFlowID?: number;
  ProcessID?: number;
  Title?: string;
  DateCreated?: string;
  StatusID?: number;
  UserRequirementName?: string;
  UserPostName?: string;
  [key: string]: unknown;
}

interface StatusFilter {
  label: string;
  value: number;
}

const processingStatuses: StatusFilter[] = [
  { label: 'Tất cả', value: -100 },
  { label: 'Đang xử lý', value: 0 },
  { label: 'Khởi tạo lỗi', value: 2 },
  { label: 'Hoàn thành', value: 100 },
  { label: 'Không duyệt', value: 200 },
];

const handlingStatuses: StatusFilter[] = [
  { label: 'Cần xử lý', value: -100 },
  { label: 'Đã gửi', value: -10 },
  { label: 'Đang chờ', value: 0 },
  { label: 'Đang xử lý', value: 1 },
  { label: 'Hoàn thành', value: 2 },
];

const normaliseList = (response: any): RequestItem[] => {
  if (!response) return [];

  if (Array.isArray(response)) {
    return response;
  }

  if (Array.isArray(response?.data)) {
    return response.data;
  }

  if (Array.isArray(response?.result)) {
    return response.result;
  }

  return [];
};

const RequestsPage: React.FC = () => {
  const history = useHistory();
  const [mode, setMode] = useState<RequestMode>('processing');
  const [status, setStatus] = useState<number>(-100);
  const [searchText, setSearchText] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState<RequestItem[]>([]);
  const [error, setError] = useState<string | null>(null);

  const statusOptions = useMemo(
    () => (mode === 'processing' ? processingStatuses : handlingStatuses),
    [mode],
  );

  useEffect(() => {
    const timeout = setTimeout(() => setDebouncedSearch(searchText), 400);
    return () => clearTimeout(timeout);
  }, [searchText]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      let response: any;

      if (mode === 'processing') {
        response = await getRequestList({
          status,
          searchText: debouncedSearch,
          page: 1,
        });
      } else {
        switch (status) {
          case -100:
            response = await getNeedToHandleProcessList({
              searchText: debouncedSearch,
              page: 1,
            });
            break;
          case -10:
            response = await getMyProposalProcessList({
              searchText: debouncedSearch,
              page: 1,
            });
            break;
          default:
            response = await getRequestWorkList({
              status,
              searchText: debouncedSearch,
              page: 1,
            });
        }
      }

      setItems(normaliseList(response));
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Không thể tải danh sách yêu cầu.';
      setError(message);
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [mode, status, debouncedSearch]);

  useEffect(() => {
    const defaultStatus =
      (mode === 'processing' ? processingStatuses : handlingStatuses)[0].value;
    if (status !== defaultStatus) {
      setStatus(defaultStatus);
    }
  }, [mode, status]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSearchChange = (event: CustomEvent) => {
    setSearchText(event.detail.value ?? '');
  };

  const handleNavigate = (item: RequestItem) => {
    if (mode === 'processing' && item.WorkFlowID) {
      history.push(`/app/requests/workflow/${item.WorkFlowID}/${item.StatusID ?? 0}`);
    } else if (mode === 'handling' && item.ProcessID) {
      history.push(`/app/requests/process/${item.ProcessID}`);
    }
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar color="primary">
          <IonTitle>Yêu cầu</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent fullscreen className="ion-padding">
        <IonHeader collapse="condense">
          <IonToolbar>
            <IonTitle size="large">Yêu cầu</IonTitle>
          </IonToolbar>
        </IonHeader>

        <IonSearchbar
          value={searchText}
          onIonChange={handleSearchChange}
          debounce={0}
          placeholder="Tìm kiếm"
        />

        <IonSegment
          value={mode}
          className="ion-margin-top"
          onIonChange={(event) => setMode(event.detail.value as RequestMode)}
        >
          <IonSegmentButton value="processing">
            <IonLabel>Quy trình</IonLabel>
          </IonSegmentButton>
          <IonSegmentButton value="handling">
            <IonLabel>Công việc</IonLabel>
          </IonSegmentButton>
        </IonSegment>

        <IonItem className="ion-margin-top">
          <IonLabel>Trạng thái</IonLabel>
          <IonSelect
            value={status}
            interface="popover"
            onIonChange={(event) => setStatus(Number(event.detail.value))}
          >
            {statusOptions.map((option) => (
              <IonSelectOption key={option.value} value={option.value}>
                {option.label}
              </IonSelectOption>
            ))}
          </IonSelect>
        </IonItem>

        {loading ? (
          <div className="ion-padding ion-text-center">
            <IonSpinner />
          </div>
        ) : error ? (
          <IonText color="danger">
            <p className="ion-padding">{error}</p>
          </IonText>
        ) : items.length === 0 ? (
          <IonText color="medium">
            <p className="ion-padding">Không có dữ liệu phù hợp.</p>
          </IonText>
        ) : (
          <IonList>
            {items.map((item) => {
              const statusLabel =
                mode === 'processing'
                  ? getWorkflowStatusLabel(item.StatusID ?? 0)
                  : getWorkHandlingStatusLabel(item.StatusID ?? 0);
              const statusColor =
                mode === 'processing'
                  ? getWorkflowStatusColor(item.StatusID ?? 0)
                  : getWorkHandlingStatusColor(item.StatusID ?? 0);

              return (
                <IonItem
                  key={`${mode}-${item.WorkFlowID ?? item.ProcessID ?? Math.random()}`}
                  button
                  detail
                  onClick={() => handleNavigate(item)}
                >
                  <IonLabel>
                    <h3>{item.Title ?? 'Không có tiêu đề'}</h3>
                    <p>Ngày tạo: {formatDate(item.DateCreated)}</p>
                    <p>
                      Người đề xuất:{' '}
                      {item.UserRequirementName ?? item.UserPostName ?? 'Không rõ'}
                    </p>
                    <p>
                      <IonText style={{ color: statusColor }}>{statusLabel}</IonText>
                    </p>
                  </IonLabel>
                </IonItem>
              );
            })}
          </IonList>
        )}
      </IonContent>
    </IonPage>
  );
};

export default RequestsPage;

