import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  IonBackButton,
  IonButton,
  IonButtons,
  IonCard,
  IonCardContent,
  IonCol,
  IonContent,
  IonGrid,
  IonHeader,
  IonItem,
  IonLabel,
  IonModal,
  IonPage,
  IonProgressBar,
  IonRow,
  IonSpinner,
  IonText,
  IonTitle,
  IonToast,
  IonToolbar,
} from '@ionic/react';
import { useParams } from 'react-router-dom';
import DiscussionThread, {
  DiscussionMessage,
} from '../../components/DiscussionThread';
import { useAuth } from '../../context/AuthContext';
import {
  createRequestProcessComment,
  getAttachmentList,
  getProcessByID,
  getRequestProcessComment,
} from '../../services/requestService';
import { formatDate } from '../../utils/date';
import {
  getPriorityLabel,
  getWorkHandlingStatusLabel,
} from '../../utils/status';

interface ProcessDetailParams {
  processId: string;
}

interface ProcessInfo {
  title: string;
  userPostName: string;
  departmentUserPostName: string;
  userAssignName: string;
  departmentUserAssignName: string;
  userReferenceName: string;
  status: string;
  priority: string;
  datePost: string;
  dateComplete: string;
  percentProcess: number;
  description: string;
}

interface AttachmentFile {
  fileName: string;
  filePath: string;
}

const normaliseProcess = (payload: any): ProcessInfo | null => {
  if (!payload) return null;

  return {
    title: payload?.Title ?? '',
    userPostName: payload?.UserPostName ?? '',
    departmentUserPostName: payload?.DepartmentUserPostName ?? '',
    userAssignName: payload?.UserAssignName ?? '',
    departmentUserAssignName: payload?.DepartmentUserAssignName ?? '',
    userReferenceName: payload?.UserReferenceName ?? '',
    status: getWorkHandlingStatusLabel(payload?.StatusID ?? 0),
    priority: getPriorityLabel(payload?.PriorityID ?? 0),
    datePost: payload?.DatePost ?? '',
    dateComplete: payload?.DateComplete ?? '',
    percentProcess: Number(payload?.PercentProcess ?? 0),
    description: payload?.Description ?? '',
  };
};

const normaliseAttachments = (payload: any): AttachmentFile[] => {
  if (!payload || !Array.isArray(payload.data)) {
    return [];
  }
  return payload.data
    .map((item: any) => ({
      fileName: item?.FileName ?? 'Tệp tin',
      filePath: item?.FilePath ?? '',
    }))
    .filter((file: AttachmentFile) => Boolean(file.filePath));
};

const normaliseComments = (payload: any): DiscussionMessage[] => {
  if (!payload || !Array.isArray(payload.data)) {
    return [];
  }
  return payload.data.map((item: any, index: number) => ({
    id: item?.CommentID ?? index,
    author: item?.UserComment ?? 'Không rõ',
    timestamp: formatDateTime(item?.DateCreated),
    content: item?.ContentComment ?? '',
  }));
};

const formatDateTime = (value?: string | null): string => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
};

const ProcessDetailPage: React.FC = () => {
  const { processId } = useParams<ProcessDetailParams>();
  const processIDNumber = Number(processId);
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [process, setProcess] = useState<ProcessInfo | null>(null);
  const [attachments, setAttachments] = useState<AttachmentFile[]>([]);
  const [comments, setComments] = useState<DiscussionMessage[]>([]);
  const [sendingComment, setSendingComment] = useState(false);
  const [toast, setToast] = useState<{ open: boolean; message: string }>({
    open: false,
    message: '',
  });
  const [descriptionModalOpen, setDescriptionModalOpen] = useState(false);

  useEffect(() => {
    const load = async () => {
      if (!Number.isFinite(processIDNumber)) {
        setError('Không tìm thấy công việc.');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const [processPayload, commentsPayload, attachmentsPayload] =
          await Promise.all([
            getProcessByID(processIDNumber),
            getRequestProcessComment(processIDNumber),
            getAttachmentList(processIDNumber),
          ]);

        setProcess(normaliseProcess(processPayload));
        setComments(normaliseComments(commentsPayload));
        setAttachments(normaliseAttachments(attachmentsPayload));
        setError(null);
      } catch (err) {
        const message =
          err instanceof Error
            ? err.message
            : 'Không thể tải chi tiết công việc.';
        setError(message);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [processIDNumber]);

  const refreshComments = useCallback(async () => {
    const payload = await getRequestProcessComment(processIDNumber);
    setComments(normaliseComments(payload));
  }, [processIDNumber]);

  const handleSendComment = useCallback(
    async (message: string) => {
      if (!user?.staffInfoID) {
        setToast({
          open: true,
          message: 'Không xác định được thông tin người dùng.',
        });
        return;
      }

      try {
        setSendingComment(true);
        await createRequestProcessComment(
          processIDNumber,
          message,
          user.staffInfoID,
        );
        await refreshComments();
        setToast({ open: true, message: 'Đã gửi thảo luận.' });
      } catch (err) {
        const messageError =
          err instanceof Error ? err.message : 'Không thể gửi thảo luận.';
        setToast({ open: true, message: messageError });
      } finally {
        setSendingComment(false);
      }
    },
    [processIDNumber, refreshComments, user?.staffInfoID],
  );

  const progressValue = useMemo(() => {
    if (!process) return 0;
    const value = Number(process.percentProcess);
    if (Number.isNaN(value)) return 0;
    return Math.min(Math.max(value / 100, 0), 1);
  }, [process]);

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar color="primary">
          <IonButtons slot="start">
            <IonBackButton defaultHref="/app/requests" />
          </IonButtons>
          <IonTitle>Xử lý công việc</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent fullscreen>
        {loading ? (
          <div className="ion-padding ion-text-center">
            <IonSpinner />
          </div>
        ) : error ? (
          <div className="ion-padding">
            <IonText color="danger">
              <p>{error}</p>
            </IonText>
          </div>
        ) : (
          <>
            <IonGrid>
              <IonRow>
                <IonCol size="12">
                  <IonCard>
                    <IonCardContent>
                      <IonText color="dark">
                        <h2>Thông tin đề xuất</h2>
                      </IonText>
                      <IonListEntries
                        entries={[
                          {
                            label: 'Tên đề xuất',
                            value: process?.title ?? '',
                          },
                          {
                            label: 'Người đề xuất',
                            value: process?.userPostName ?? '',
                          },
                          {
                            label: 'Phòng ban',
                            value: process?.departmentUserPostName ?? '',
                          },
                        ]}
                      />
                    </IonCardContent>
                  </IonCard>
                </IonCol>
              </IonRow>

              <IonRow>
                <IonCol size="12">
                  <IonCard>
                    <IonCardContent>
                      <IonText color="dark">
                        <h2>Thông tin xử lý</h2>
                      </IonText>
                      <IonListEntries
                        entries={[
                          {
                            label: 'Người xử lý',
                            value: process?.userAssignName ?? '',
                          },
                          {
                            label: 'Phòng ban',
                            value: process?.departmentUserAssignName ?? '',
                          },
                          {
                            label: 'Người giám sát',
                            value: process?.userReferenceName ?? '',
                          },
                          {
                            label: 'Trạng thái',
                            value: process?.status ?? '',
                          },
                          {
                            label: 'Độ ưu tiên',
                            value: process?.priority ?? '',
                          },
                          {
                            label: 'Ngày tạo',
                            value: formatDate(process?.datePost),
                          },
                          {
                            label: 'Ngày hoàn thành',
                            value: formatDate(process?.dateComplete),
                          },
                        ]}
                      />

                      <IonText color="dark">
                        <h3 className="ion-margin-top">Tiến độ</h3>
                      </IonText>
                      <IonProgressBar value={progressValue} />
                      <IonText color="medium">
                        <p>{process?.percentProcess ?? 0}%</p>
                      </IonText>

                      <IonButton
                        className="ion-margin-top"
                        onClick={() => setDescriptionModalOpen(true)}
                        disabled={!process?.description}
                      >
                        Xem mô tả chi tiết
                      </IonButton>
                    </IonCardContent>
                  </IonCard>
                </IonCol>
              </IonRow>

              <IonRow>
                <IonCol size="12">
                  <IonCard>
                    <IonCardContent>
                      <IonText color="dark">
                        <h2>Tệp đính kèm</h2>
                      </IonText>
                      {attachments.length === 0 ? (
                        <IonText color="medium">
                          <p>Không có tệp đính kèm.</p>
                        </IonText>
                      ) : (
                        attachments.map((file) => (
                          <p key={file.filePath}>
                            <IonButton
                              fill="clear"
                              size="small"
                              onClick={() => window.open(file.filePath, '_blank')}
                            >
                              {file.fileName}
                            </IonButton>
                          </p>
                        ))
                      )}
                    </IonCardContent>
                  </IonCard>
                </IonCol>
              </IonRow>
            </IonGrid>

            <DiscussionThread
              messages={comments}
              onSend={handleSendComment}
              sending={sendingComment}
            />
          </>
        )}
      </IonContent>

      <IonToast
        isOpen={toast.open}
        message={toast.message}
        duration={2000}
        onDidDismiss={() => setToast({ open: false, message: '' })}
      />

      <IonModal
        isOpen={descriptionModalOpen}
        onDidDismiss={() => setDescriptionModalOpen(false)}
      >
        <IonHeader>
          <IonToolbar>
            <IonTitle>Mô tả chi tiết</IonTitle>
          </IonToolbar>
        </IonHeader>
        <IonContent className="ion-padding">
          <div
            dangerouslySetInnerHTML={{
              __html: process?.description ?? 'Không có mô tả.',
            }}
          />
          <IonButton
            className="ion-margin-top"
            expand="block"
            onClick={() => setDescriptionModalOpen(false)}
          >
            Đóng
          </IonButton>
        </IonContent>
      </IonModal>
    </IonPage>
  );
};

interface ListEntry {
  label: string;
  value: string;
}

const IonListEntries: React.FC<{ entries: ListEntry[] }> = ({ entries }) => (
  <>
    {entries.map((entry) => (
      <IonItem key={`${entry.label}-${entry.value}`} lines="none">
        <IonLabel>
          <p>{entry.label}</p>
          <h3>{entry.value}</h3>
        </IonLabel>
      </IonItem>
    ))}
  </>
);

export default ProcessDetailPage;
