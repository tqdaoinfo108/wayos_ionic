import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  IonBackButton,
  IonButton,
  IonButtons,
  IonCard,
  IonCardContent,
  IonCol,
  IonContent,
  IonFooter,
  IonGrid,
  IonHeader,
  IonIcon,
  IonLoading,
  IonModal,
  IonPage,
  IonItem,
  IonRadio,
  IonRadioGroup,
  IonRow,
  IonSpinner,
  IonLabel,
  IonText,
  IonTextarea,
  IonTitle,
  IonToast,
  IonToolbar,
} from '@ionic/react';
import {
  arrowRedoCircleOutline,
  banOutline,
  checkmarkCircleOutline,
  closeCircleOutline,
  timeOutline,
} from 'ionicons/icons';
import { useHistory, useParams } from 'react-router-dom';
import DiscussionThread, {
  DiscussionMessage,
} from '../../components/DiscussionThread';
import { useAuth } from '../../context/AuthContext';
import {
  createRequestCommentWorkflow,
  forwardWorkflow,
  getAttachmentList,
  getListStaffByDepartmentID,
  getListWorkFlowApprove,
  getWorkFlowByID,
  getWorkflowComment,
  updateWorkflowIsApprove,
} from '../../services/requestService';
import { formatDate } from '../../utils/date';
import './WorkflowDetailPage.css';

interface WorkflowDetailParams {
  workflowId: string;
  statusId?: string;
}

interface AttachmentFile {
  fileName: string;
  filePath: string;
}

interface WorkflowInfo {
  title: string;
  typeWorkFlowID: number;
  typeWorkFlowName: string;
  departmentUserRequirement: string;
  userRequirementName: string;
  dateCreated: string;
  fieldDetails: string;
}

interface WorkflowApprovalStep {
  title: string;
  name: string;
  timestamp: string;
  statusStepID: number;
  statusText: string;
  backgroundColor: string;
  pipelineColor: string;
  icon: string;
  isNotApprove: boolean;
  userApproveID?: number;
  workFlowApproveID?: number;
  workFlowID?: number;
  userForwardName?: string;
}

interface DepartmentStaff {
  staffID: number;
  fullName: string;
  departmentName: string;
}

type AnyRecord = Record<string, unknown>;

const getStringField = (record: AnyRecord | undefined, key: string): string => {
  if (!record) {
    return '';
  }
  const value = record[key];
  if (typeof value === 'string') {
    return value;
  }
  if (value === undefined || value === null) {
    return '';
  }
  return String(value);
};

const parseIntOrUndefined = (value: unknown): number | undefined => {
  if (typeof value === 'number') return value;
  if (typeof value === 'string') {
    const parsed = Number(value);
    if (!Number.isNaN(parsed)) return parsed;
  }
  return undefined;
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

const getIconForStatus = (status: number): string => {
  switch (status) {
    case 100:
      return checkmarkCircleOutline;
    case 200:
      return closeCircleOutline;
    case 2:
      return banOutline;
    case 0:
      return timeOutline;
    case -20:
      return arrowRedoCircleOutline;
    default:
      return timeOutline;
  }
};

const getBackgroundColor = (statusID: number, isNotApprove: boolean): string => {
  if (isNotApprove) {
    return 'var(--ion-color-medium-shade)';
  }

  switch (statusID) {
    case -1:
      return '#ffca28';
    case 0:
      return 'var(--ion-color-primary)';
    case 2:
      return '#ffb300';
    case 100:
      return 'var(--ion-color-success)';
    case 200:
      return 'var(--ion-color-danger)';
    default:
      return 'var(--ion-color-medium)';
  }
};

const convertSteps = (
  payload: AnyRecord | null,
  statusID: number,
): WorkflowApprovalStep[] => {
  const data = Array.isArray((payload as AnyRecord)?.['data'])
    ? ((payload as AnyRecord)['data'] as AnyRecord[])
    : [];
  if (data.length === 0) {
    return [];
  }
  let previousLocked = false;

  return data.map((raw: AnyRecord, index: number) => {
    const item = (raw ?? {}) as AnyRecord;
    const statusStepID = Number(item?.['IsApprove'] ?? 0);
    const timestamp = formatDateTime(
      typeof item?.['DateCreated'] === 'string'
        ? (item['DateCreated'] as string)
        : undefined,
    );

    let statusText: string;
    switch (statusStepID) {
      case -1:
        statusText = 'Trạng thái | Huỷ';
        break;
      case 0:
        statusText = 'Trạng thái | Đang chờ duyệt';
        break;
      case 2:
        statusText = 'Trạng thái | Tạo lỗi';
        break;
      case 100:
        statusText = timestamp;
        break;
      case 200:
        statusText = 'Trạng thái | Không duyệt';
        break;
      default:
        statusText = 'Trạng thái | Không rõ';
    }

    if (previousLocked) {
      statusText = 'Trạng thái | Chưa duyệt';
    }

    const backgroundColor = getBackgroundColor(statusStepID, previousLocked);
    let pipelineColor = backgroundColor;

    if (
      index < data.length - 1 &&
        Number(((data[index + 1] as AnyRecord) ?? {})['IsApprove'] ?? 0) === 0 &&
        (statusStepID === 0 || statusID === 200)
      ) {
        pipelineColor = 'var(--ion-color-medium)';
      }

    if (statusStepID === 200 || statusStepID === 0) {
      previousLocked = true;
    }

      return {
        title: getStringField(item, 'DepartmentApproveName'),
        name: getStringField(item, 'UserApproveName'),
        timestamp,
        statusStepID,
        statusText,
        backgroundColor,
        pipelineColor,
        icon: getIconForStatus(statusStepID),
        isNotApprove: statusStepID === 0,
        userApproveID: parseIntOrUndefined(item?.['UserApproveID']),
        workFlowApproveID: parseIntOrUndefined(item?.['WorkFlowApproveID']),
        workFlowID: parseIntOrUndefined(item?.['WorkFlowID']),
        userForwardID: Number(item?.['UserForwardID'] ?? 0),
        userForwardName: getStringField(item, 'UserForwardName') || undefined,
      };
    });
  };

const normaliseAttachments = (payload: AnyRecord | null): AttachmentFile[] => {
  const list = Array.isArray((payload as AnyRecord)?.['data'])
    ? ((payload as AnyRecord)['data'] as AnyRecord[])
    : [];
  return list
    .map((item) => ({
      fileName: getStringField(item, 'FileName') || 'Tệp tin',
      filePath: getStringField(item, 'FilePath'),
    }))
    .filter((item: AttachmentFile) => Boolean(item.filePath));
};

const normaliseComments = (payload: AnyRecord | null): DiscussionMessage[] => {
  const list = Array.isArray((payload as AnyRecord)?.['data'])
    ? ((payload as AnyRecord)['data'] as AnyRecord[])
    : [];
  return list.map((item, index) => {
    const rawId = item?.['CommentID'];
    const id =
      typeof rawId === 'number' || typeof rawId === 'string' ? rawId : index;

    return {
      id,
      author: getStringField(item, 'UserComment') || 'Không rõ',
      timestamp: formatDateTime(
        typeof item?.['DateCreated'] === 'string'
          ? (item['DateCreated'] as string)
          : undefined,
      ),
      content: getStringField(item, 'ContentComment'),
    };
  });
};

const WorkflowDetailPage: React.FC = () => {
  const { workflowId, statusId } = useParams<WorkflowDetailParams>();
  const history = useHistory();
  const { user } = useAuth();

  const workflowIDNumber = Number(workflowId);
  const currentStatusID = Number(statusId ?? '-100');

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [steps, setSteps] = useState<WorkflowApprovalStep[]>([]);
  const [info, setInfo] = useState<WorkflowInfo | null>(null);
  const [attachments, setAttachments] = useState<AttachmentFile[]>([]);
  const [comments, setComments] = useState<DiscussionMessage[]>([]);
  const [sendingComment, setSendingComment] = useState(false);
  const [toast, setToast] = useState<{ open: boolean; message: string }>({
    open: false,
    message: '',
  });
  const [actionLoading, setActionLoading] = useState(false);
  const [reasonPrompt, setReasonPrompt] = useState<{
    open: boolean;
    status: 200 | 2;
  }>({ open: false, status: 200 });
  const [reasonValue, setReasonValue] = useState('');
  const [forwardModalOpen, setForwardModalOpen] = useState(false);
  const [forwardReason, setForwardReason] = useState('');
  const [forwardStaff, setForwardStaff] = useState<number | undefined>(
    undefined,
  );
  const [forwardStaffs, setForwardStaffs] = useState<DepartmentStaff[]>([]);
  const [forwardLoading, setForwardLoading] = useState(false);

  useEffect(() => {
    const load = async () => {
      if (!Number.isFinite(workflowIDNumber)) {
        setError('Không tìm thấy yêu cầu.');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const [
          stepsPayload,
          infoPayload,
          commentsPayload,
          attachmentsPayload,
        ] = await Promise.all([
          getListWorkFlowApprove(workflowIDNumber),
          getWorkFlowByID(workflowIDNumber),
          getWorkflowComment(workflowIDNumber),
          getAttachmentList(undefined, workflowIDNumber),
        ]);

        const stepsData = stepsPayload as AnyRecord | null;
        const infoData = infoPayload as AnyRecord | null;
        const commentsData = commentsPayload as AnyRecord | null;
        const attachmentsData = attachmentsPayload as AnyRecord | null;

        setSteps(convertSteps(stepsData, currentStatusID));
        if (infoData) {
          setInfo({
            title: getStringField(infoData, 'Title'),
            typeWorkFlowID: Number(infoData?.['TypeWorkFlowID'] ?? 0),
            typeWorkFlowName: getStringField(infoData, 'TypeWorkFlowName'),
            departmentUserRequirement: getStringField(
              infoData,
              'DepartmentUserRequirement',
            ),
            userRequirementName: getStringField(infoData, 'UserRequirementName'),
            dateCreated: getStringField(infoData, 'DateCreated'),
            fieldDetails: getStringField(infoData, 'FieldDetails'),
          });
        } else {
          setInfo(null);
        }
        setComments(normaliseComments(commentsData));
        setAttachments(normaliseAttachments(attachmentsData));
        setError(null);
      } catch (err) {
        const message =
          err instanceof Error ? err.message : 'Không thể tải chi tiết yêu cầu.';
        setError(message);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [workflowIDNumber, currentStatusID]);

  const pendingStep = useMemo(
    () => steps.find((step) => step.isNotApprove),
    [steps],
  );

  const canApprove = useMemo(() => {
    if (!pendingStep || !user?.staffID) return false;
    return pendingStep.userApproveID === user.staffID;
  }, [pendingStep, user?.staffID]);

  const handleSendComment = useCallback(
    async (message: string) => {
        try {
          setSendingComment(true);
          await createRequestCommentWorkflow(workflowIDNumber, message);
          const refreshed = await getWorkflowComment(workflowIDNumber);
          setComments(normaliseComments(refreshed as AnyRecord | null));
          setToast({ open: true, message: 'Đã gửi thảo luận.' });
      } catch (err) {
        const messageError =
          err instanceof Error ? err.message : 'Không thể gửi thảo luận.';
        setToast({ open: true, message: messageError });
      } finally {
        setSendingComment(false);
      }
    },
    [workflowIDNumber],
  );

  const refreshData = useCallback(async () => {
    const [stepsPayload, commentsPayload, attachmentsPayload] =
      await Promise.all([
        getListWorkFlowApprove(workflowIDNumber),
        getWorkflowComment(workflowIDNumber),
        getAttachmentList(undefined, workflowIDNumber),
      ]);
    setSteps(convertSteps(stepsPayload as AnyRecord | null, currentStatusID));
    setComments(normaliseComments(commentsPayload as AnyRecord | null));
    setAttachments(
      normaliseAttachments(attachmentsPayload as AnyRecord | null),
    );
  }, [workflowIDNumber, currentStatusID]);

  const handleApprove = async () => {
    if (!pendingStep?.workFlowApproveID) {
      setToast({ open: true, message: 'Không thể xác định bước duyệt.' });
      return;
    }
    try {
      setActionLoading(true);
      await updateWorkflowIsApprove(pendingStep.workFlowApproveID, 100);
      setToast({ open: true, message: 'Đã duyệt yêu cầu.' });
      await refreshData();
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Không thể duyệt yêu cầu.';
      setToast({ open: true, message });
    } finally {
      setActionLoading(false);
    }
  };

  const handleReasonAction = async (status: 200 | 2, reason: string) => {
    if (!pendingStep?.workFlowApproveID) {
      setToast({ open: true, message: 'Không thể xác định bước duyệt.' });
      return;
    }

    if (!reason.trim()) {
      setToast({ open: true, message: 'Vui lòng nhập lý do.' });
      return;
    }

    try {
      setActionLoading(true);
      await createRequestCommentWorkflow(workflowIDNumber, reason.trim());
      await updateWorkflowIsApprove(pendingStep.workFlowApproveID, status);
      setToast({
        open: true,
        message: status === 200 ? 'Đã từ chối yêu cầu.' : 'Đã trả lại yêu cầu.',
      });
      history.goBack();
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Không thể cập nhật trạng thái.';
      setToast({ open: true, message });
    } finally {
      setActionLoading(false);
    }
  };

  const openReasonPrompt = (status: 200 | 2) => {
    setReasonValue('');
    setReasonPrompt({ open: true, status });
  };

  const handleOpenForward = async () => {
    if (!user?.departmentID) {
      setToast({
        open: true,
        message: 'Không xác định được phòng ban của bạn.',
      });
      return;
    }

    try {
      setForwardLoading(true);
      let defaultStaffId =
        forwardStaffs.length > 0 ? forwardStaffs[0]?.staffID : undefined;
      if (forwardStaffs.length === 0) {
        const payload = await getListStaffByDepartmentID(user.departmentID);
        const payloadData = (payload as AnyRecord | null)?.['data'];
        if (Array.isArray(payloadData)) {
          const mapped = (payloadData as AnyRecord[])
            .map((item) => {
              const staffID = parseIntOrUndefined(item?.['StaffID']);
              if (!staffID) {
                return null;
              }
              return {
                staffID,
                fullName: getStringField(item, 'FullName'),
                departmentName: getStringField(item, 'DepartmentName'),
              } as DepartmentStaff;
            })
            .filter((staff): staff is DepartmentStaff => staff !== null);
          setForwardStaffs(mapped);
          defaultStaffId = mapped[0]?.staffID;
        }
      }
      setForwardStaff(defaultStaffId);
      setForwardReason('');
      setForwardModalOpen(true);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Không thể lấy danh sách nhân viên.';
      setToast({ open: true, message });
    } finally {
      setForwardLoading(false);
    }
  };

  const handleForward = async () => {
    if (!forwardReason.trim() || !forwardStaff) {
      setToast({
        open: true,
        message: 'Vui lòng chọn người duyệt và nhập lý do.',
      });
      return;
    }

    try {
      setActionLoading(true);
      await createRequestCommentWorkflow(workflowIDNumber, forwardReason.trim());
      await forwardWorkflow(workflowIDNumber, forwardStaff);
      setToast({ open: true, message: 'Đã chuyển tiếp yêu cầu.' });
      setForwardModalOpen(false);
      history.goBack();
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Không thể chuyển tiếp yêu cầu.';
      setToast({ open: true, message });
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar color="primary">
          <IonButtons slot="start">
            <IonBackButton defaultHref="/app/requests" />
          </IonButtons>
          <IonTitle>Quy trình xét duyệt</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent fullscreen>
        {loading ? (
          <div className="ion-text-center ion-padding">
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
                        <h2>Thông tin chung</h2>
                      </IonText>
                      <p>
                        <strong>Tên đề xuất:</strong> {info?.title ?? ''}
                      </p>
                      <p>
                        <strong>Biểu mẫu:</strong> {info?.typeWorkFlowName ?? ''}
                      </p>
                      <p>
                        <strong>Ngày tạo:</strong>{' '}
                        {formatDate(info?.dateCreated)}
                      </p>
                      <p>
                        <strong>Người đề xuất:</strong>{' '}
                        {info?.userRequirementName ?? ''}
                      </p>
                      <p>
                        <strong>Phòng ban:</strong>{' '}
                        {info?.departmentUserRequirement ?? ''}
                      </p>
                    </IonCardContent>
                  </IonCard>
                </IonCol>
              </IonRow>

              {info?.fieldDetails ? (
                <IonRow>
                  <IonCol size="12">
                    <IonCard>
                      <IonCardContent>
                        <IonText color="dark">
                          <h2>Chi tiết biểu mẫu</h2>
                        </IonText>
                        <div
                          className="workflow-field-details"
                          dangerouslySetInnerHTML={{
                            __html: info.fieldDetails,
                          }}
                        />
                      </IonCardContent>
                    </IonCard>
                  </IonCol>
                </IonRow>
              ) : null}

              <IonRow>
                <IonCol size="12">
                  <IonCard>
                    <IonCardContent>
                      <IonText color="dark">
                        <h2>Tiến trình duyệt</h2>
                      </IonText>
                      <div className="workflow-timeline">
                        {steps.map((step, index) => (
                          <div key={`${step.title}-${step.timestamp}`} className="workflow-step">
                            <div className="workflow-step__indicator">
                              <div
                                className="workflow-step__dot"
                                style={{ backgroundColor: step.backgroundColor }}
                              >
                                <IonIcon icon={step.icon} />
                              </div>
                              {index < steps.length - 1 && (
                                <div
                                  className="workflow-step__connector"
                                  style={{
                                    backgroundColor: step.pipelineColor,
                                  }}
                                />
                              )}
                            </div>
                            <div className="workflow-step__content">
                              <p className="workflow-step__title">{step.title}</p>
                              <p className="workflow-step__name">{step.name}</p>
                              <IonText color="medium">
                                <p>{step.statusText}</p>
                              </IonText>
                              {step.userForwardName ? (
                                <IonText color="medium">
                                  <p>Chuyển tiếp tới: {step.userForwardName}</p>
                                </IonText>
                              ) : null}
                            </div>
                          </div>
                        ))}
                      </div>
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

      {canApprove && (
        <IonFooter>
          <IonToolbar>
            <IonGrid>
              <IonRow>
                <IonCol size="6">
                  <IonButton
                    expand="block"
                    color="success"
                    onClick={handleApprove}
                    disabled={actionLoading}
                  >
                    Duyệt
                  </IonButton>
                </IonCol>
                <IonCol size="6">
                  <IonButton
                    expand="block"
                    color="danger"
                    onClick={() => openReasonPrompt(200)}
                    disabled={actionLoading}
                  >
                    Không duyệt
                  </IonButton>
                </IonCol>
              </IonRow>
              <IonRow className="ion-margin-top">
                <IonCol size="6">
                  <IonButton
                    expand="block"
                    color="warning"
                    onClick={() => openReasonPrompt(2)}
                    disabled={actionLoading}
                  >
                    Trả lại
                  </IonButton>
                </IonCol>
                <IonCol size="6">
                  <IonButton
                    expand="block"
                    color="tertiary"
                    onClick={handleOpenForward}
                    disabled={actionLoading || forwardLoading}
                  >
                    Chuyển tiếp
                  </IonButton>
                </IonCol>
              </IonRow>
            </IonGrid>
          </IonToolbar>
        </IonFooter>
      )}

      <IonLoading isOpen={actionLoading && !loading} message="Đang xử lý..." />

      <IonToast
        isOpen={toast.open}
        message={toast.message}
        duration={2000}
        onDidDismiss={() => setToast({ open: false, message: '' })}
      />

      <IonModal
        isOpen={reasonPrompt.open}
        onDidDismiss={() => {
          setReasonPrompt((prev) => ({ ...prev, open: false }));
          setReasonValue('');
        }}
      >
        <IonHeader>
          <IonToolbar>
            <IonTitle>
              {reasonPrompt.status === 200
                ? 'Lý do không duyệt'
                : 'Lý do trả lại'}
            </IonTitle>
          </IonToolbar>
        </IonHeader>
        <IonContent className="ion-padding">
          <IonTextarea
            placeholder="Nhập lý do..."
            autoGrow
            onIonChange={(event) => {
              const reason = event.detail.value ?? '';
              setReasonValue(reason);
            }}
            value={reasonValue}
          />
          <IonButton
            className="ion-margin-top"
            expand="block"
            onClick={() => {
              const reason = reasonValue;
              setReasonValue('');
              setReasonPrompt((prev) => ({ ...prev, open: false }));
              handleReasonAction(reasonPrompt.status, reason);
            }}
          >
            Xác nhận
          </IonButton>
          <IonButton
            fill="clear"
            expand="block"
            onClick={() => {
              setReasonValue('');
              setReasonPrompt((prev) => ({ ...prev, open: false }));
            }}
          >
            Huỷ
          </IonButton>
        </IonContent>
      </IonModal>

      <IonModal
        isOpen={forwardModalOpen}
        onDidDismiss={() => {
          setForwardModalOpen(false);
          setForwardReason('');
        }}
      >
        <IonHeader>
          <IonToolbar>
            <IonTitle>Chuyển tiếp</IonTitle>
          </IonToolbar>
        </IonHeader>
        <IonContent className="ion-padding">
          <IonText color="dark">
            <h3>Chọn người duyệt</h3>
          </IonText>
          <IonRadioGroup
            value={forwardStaff}
            onIonChange={(event) => setForwardStaff(event.detail.value)}
          >
            {forwardStaffs.map((staff) => (
              <IonItem key={staff.staffID}>
                <IonRadio slot="start" value={staff.staffID} />
                <IonLabel>
                  <h3>{staff.fullName}</h3>
                  <p>{staff.departmentName}</p>
                </IonLabel>
              </IonItem>
            ))}
          </IonRadioGroup>

          <IonText color="dark">
            <h3 className="ion-margin-top">Lý do</h3>
          </IonText>
          <IonTextarea
            placeholder="Nhập lý do chuyển tiếp..."
            autoGrow
            value={forwardReason}
            onIonChange={(event) => setForwardReason(event.detail.value ?? '')}
          />

          <IonButton
            className="ion-margin-top"
            expand="block"
            onClick={handleForward}
            disabled={actionLoading}
          >
            Xác nhận
          </IonButton>
          <IonButton
            fill="clear"
            expand="block"
            onClick={() => {
              setForwardModalOpen(false);
              setForwardReason('');
            }}
          >
            Huỷ
          </IonButton>
        </IonContent>
      </IonModal>
    </IonPage>
  );
};

export default WorkflowDetailPage;
