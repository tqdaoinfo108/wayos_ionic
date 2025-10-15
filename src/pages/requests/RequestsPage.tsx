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
          <IonTitle>Quy trình</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent fullscreen style={{ '--background': '#f8fafc' }}>
        <IonHeader collapse="condense">
          <IonToolbar>
            <IonTitle size="large">Quy trình</IonTitle>
          </IonToolbar>
        </IonHeader>

        <div className="ion-padding" style={{ paddingBottom: '80px', maxWidth: '1200px', margin: '0 auto' }}>
          <IonSearchbar
            value={searchText}
            onIonChange={handleSearchChange}
            debounce={0}
            placeholder="Tìm kiếm yêu cầu..."
            style={{
              '--background': '#ffffff',
              '--border-radius': '12px',
              '--box-shadow': '0 2px 8px rgba(15, 23, 42, 0.04)',
              padding: '0',
              marginBottom: '16px'
            }}
          />

          <IonSegment
            value={mode}
            onIonChange={(event) => setMode(event.detail.value as RequestMode)}
            style={{
              '--background': '#ffffff',
              borderRadius: '12px',
              padding: '4px',
              marginBottom: '16px',
              boxShadow: '0 2px 8px rgba(15, 23, 42, 0.04)'
            }}
          >
            <IonSegmentButton value="processing">
              <IonLabel style={{ fontWeight: '600', fontSize: '14px' }}>Quy trình</IonLabel>
            </IonSegmentButton>
            <IonSegmentButton value="handling">
              <IonLabel style={{ fontWeight: '600', fontSize: '14px' }}>Công việc</IonLabel>
            </IonSegmentButton>
          </IonSegment>

          <IonItem 
            lines="none"
            style={{
              '--background': '#f8fafc',
              '--padding-start': '16px',
              '--inner-padding-end': '16px',
              borderRadius: '12px',
              marginBottom: '16px',
              border: '1px solid #e2e8f0'
            }}
          >
            <IonLabel style={{ 
              fontSize: '14px',
              fontWeight: '600',
              color: '#0f172a'
            }}>
              Trạng thái
            </IonLabel>
            <IonSelect
              value={status}
              interface="popover"
              onIonChange={(event) => setStatus(Number(event.detail.value))}
              style={{ fontWeight: '500' }}
            >
              {statusOptions.map((option) => (
                <IonSelectOption key={option.value} value={option.value}>
                  {option.label}
                </IonSelectOption>
              ))}
            </IonSelect>
          </IonItem>

          {loading ? (
            <div className="ion-padding ion-text-center" style={{ marginTop: '60px' }}>
              <IonSpinner color="primary" />
              <p style={{ marginTop: '16px', color: '#64748b', fontSize: '14px' }}>
                Đang tải...
              </p>
            </div>
          ) : error ? (
            <div style={{
              background: '#fee',
              border: '1px solid #fcc',
              borderRadius: '12px',
              padding: '20px',
              textAlign: 'center',
              marginTop: '20px'
            }}>
              <IonText color="danger">
                <p style={{ margin: 0, fontSize: '14px' }}>{error}</p>
              </IonText>
            </div>
          ) : items.length === 0 ? (
            <div style={{
              background: '#ffffff',
              border: '1px solid #e2e8f0',
              borderRadius: '12px',
              padding: '40px 20px',
              textAlign: 'center',
              marginTop: '20px',
              boxShadow: '0 2px 8px rgba(15, 23, 42, 0.04)'
            }}>
              <IonText color="medium">
                <p style={{ margin: 0, fontSize: '14px' }}>Không có dữ liệu phù hợp.</p>
              </IonText>
            </div>
          ) : (
            <div style={{
              background: '#ffffff',
              borderRadius: '12px',
              overflow: 'hidden',
              border: '1px solid #e2e8f0',
              boxShadow: '0 2px 8px rgba(15, 23, 42, 0.04)'
            }}>
              <IonList style={{ background: 'transparent' }}>
                {items.map((item, index) => {
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
                      lines={index < items.length - 1 ? 'full' : 'none'}
                      style={{
                        '--background': '#ffffff',
                        '--border-color': '#e2e8f0',
                        '--padding-start': '16px',
                        '--inner-padding-end': '16px',
                        '--min-height': '88px'
                      }}
                    >
                      <IonLabel>
                        <h3 style={{
                          fontSize: '15px',
                          fontWeight: '600',
                          color: '#0f172a',
                          margin: '0 0 8px',
                          lineHeight: '1.4'
                        }}>
                          {item.Title ?? 'Không có tiêu đề'}
                        </h3>
                        <p style={{
                          fontSize: '13px',
                          color: '#64748b',
                          margin: '0 0 4px'
                        }}>
                          Ngày tạo: {formatDate(item.DateCreated)}
                        </p>
                        <p style={{
                          fontSize: '13px',
                          color: '#64748b',
                          margin: '0 0 6px'
                        }}>
                          {item.UserRequirementName ?? item.UserPostName ?? 'Không rõ'}
                        </p>
                        <div style={{
                          display: 'inline-block',
                          padding: '4px 10px',
                          borderRadius: '6px',
                          background: `${statusColor}20`,
                          fontSize: '12px',
                          fontWeight: '600',
                          color: statusColor
                        }}>
                          {statusLabel}
                        </div>
                      </IonLabel>
                    </IonItem>
                  );
                })}
              </IonList>
            </div>
          )}
        </div>
      </IonContent>
    </IonPage>
  );
};

export default RequestsPage;

