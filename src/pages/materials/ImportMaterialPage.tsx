import React, {
  ChangeEvent,
  MutableRefObject,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
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
  IonInput,
  IonItem,
  IonLabel,
  IonPage,
  IonProgressBar,
  IonRow,
  IonSelect,
  IonSelectOption,
  IonSpinner,
  IonText,
  IonTitle,
  IonToolbar,
  useIonToast,
} from '@ionic/react';
import { cameraOutline, closeCircleOutline, refreshOutline, saveOutline } from 'ionicons/icons';
import {
  LookupItem,
  createTrackingBill,
  getDeliveryVehicles,
  getTrackingBillLatest,
  getTrackingBillTitle,
  getTrackingTypes,
  uploadPublicFile,
} from '../../services/billTrackingService';
import { getProjects, ProjectItem } from '../../services/projectService';
import { mapLookupOptions, toOptionalNumber } from '../../utils/lookup';
import PhotoCaptureModal from '../../components/PhotoCaptureModal';

type ImageSlot = 'ImageIn1' | 'ImageIn2' | 'ImageIn3';

interface ImageState {
  previewUrl: string | null;
  publicPath: string | null;
  uploading: boolean;
}

interface ImportFormState {
  TitleBill: string;
  TypeTrackingBillID?: number;
  ProjectID?: number;
  DeliveryVehicleID?: number;
  Amount?: number;
  ImageIn1?: string | null;
  ImageIn2?: string | null;
  ImageIn3?: string | null;
}

const inboundSlots: Array<{ key: ImageSlot; label: string }> = [
  { key: 'ImageIn1', label: 'Ảnh vật tư 1' },
  { key: 'ImageIn2', label: 'Ảnh vật tư 2' },
  { key: 'ImageIn3', label: 'Ảnh vật tư 3' },
];

const initialImageState: ImageState = { previewUrl: null, publicPath: null, uploading: false };

const ImportMaterialPage: React.FC = () => {
  const [presentToast] = useIonToast();
  const [lookupsLoading, setLookupsLoading] = useState(false);
  const [titleLoading, setTitleLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [isFirstTitleFetch, setIsFirstTitleFetch] = useState(true);

  const [projects, setProjects] = useState<ProjectItem[]>([]);
  const [trackingTypes, setTrackingTypes] = useState<LookupItem[]>([]);
  const [deliveryVehicles, setDeliveryVehicles] = useState<LookupItem[]>([]);

  const [form, setForm] = useState<ImportFormState>({
    TitleBill: '',
    TypeTrackingBillID: undefined,
    ProjectID: undefined,
    DeliveryVehicleID: undefined,
    Amount: undefined,
    ImageIn1: null,
    ImageIn2: null,
    ImageIn3: null,
  });

  const [amountText, setAmountText] = useState('');

  const [images, setImages] = useState<Record<ImageSlot, ImageState>>({
    ImageIn1: { ...initialImageState },
    ImageIn2: { ...initialImageState },
    ImageIn3: { ...initialImageState },
  });

  const inputRefs: Record<ImageSlot, MutableRefObject<HTMLInputElement | null>> = {
    ImageIn1: useRef<HTMLInputElement>(null),
    ImageIn2: useRef<HTMLInputElement>(null),
    ImageIn3: useRef<HTMLInputElement>(null),
  };

  const [captureConfig, setCaptureConfig] = useState<{ slot: ImageSlot; title: string } | null>(null);

  const extractTitleValue = useCallback((value: unknown): string => {
    if (!value) return '';
    if (typeof value === 'string') return value;
    if (typeof value === 'object') {
      const container = value as Record<string, unknown>;
      const candidate =
        container['data'] ??
        container['Data'] ??
        container['result'] ??
        container['Result'] ??
        container['title'] ??
        container['Title'];
      return typeof candidate === 'string' ? candidate : '';
    }
    return '';
  }, []);

  const projectOptions = useMemo(
    () =>
      mapLookupOptions(
        projects,
        ['ProjectID', 'projectID', 'ID', 'Id'],
        ['ProjectName', 'ProjectShortName', 'Name', 'label'],
      ),
    [projects],
  );

  const trackingTypeOptions = useMemo(
    () =>
      mapLookupOptions(
        trackingTypes,
        ['TypeTrackingBillID', 'ID', 'Id'],
        ['TypeTrackingBillName', 'TypeName', 'Name', 'label'],
      ),
    [trackingTypes],
  );

  const deliveryVehicleOptions = useMemo(
    () =>
      mapLookupOptions(
        deliveryVehicles,
        ['DeliveryVehicleID', 'ID', 'Id'],
        ['DeliveryVehicleName', 'NumberVehicle', 'Name', 'label'],
      ),
    [deliveryVehicles],
  );

  const showToast = useCallback(
    (message: string, color: 'success' | 'danger' | 'warning' = 'danger') => {
      presentToast({
        message,
        color,
        duration: 3000,
        position: 'bottom',
      });
    },
    [presentToast],
  );

  const revokePreviewUrls = useCallback(() => {
    Object.values(images).forEach((state) => {
      if (state.previewUrl) {
        URL.revokeObjectURL(state.previewUrl);
      }
    });
  }, [images]);

  const resetImages = useCallback(() => {
    revokePreviewUrls();
    setImages({
      ImageIn1: { ...initialImageState },
      ImageIn2: { ...initialImageState },
      ImageIn3: { ...initialImageState },
    });
  }, [revokePreviewUrls]);

  useEffect(
    () => () => {
      revokePreviewUrls();
    },
    [revokePreviewUrls],
  );

  const fetchTitle = useCallback(
    async (projectId: number, typeId: number, deliveryId: number, forceFirstFetch = false) => {
      if (!projectId || !typeId || !deliveryId) {
        setForm((prev) => ({ ...prev, TitleBill: '' }));
        return;
      }
      try {
        setTitleLoading(true);
        const response = await getTrackingBillTitle({
          projectID: projectId ?? 0,
          typeTrackingBillID: typeId ?? 0,
          deliveryVehicleID: deliveryId ?? 0,
          isFirst: (forceFirstFetch || isFirstTitleFetch) ?? false,
        });
        const title = extractTitleValue(response);
        setForm((prev) => ({
          ...prev,
          TitleBill: title,
        }));
        if (isFirstTitleFetch || forceFirstFetch) {
          setIsFirstTitleFetch(false);
        }
      } catch (error) {
        showToast(
          error instanceof Error ? error.message : 'Không thể tạo tiêu đề phiếu tự động.',
        );
      } finally {
        setTitleLoading(false);
      }
    },
    [extractTitleValue, isFirstTitleFetch, showToast],
  );

  const refreshTitle = useCallback(
    async (forceFirstFetch = false) => {
      const projectId = form.ProjectID ?? 0;
      const typeId = form.TypeTrackingBillID ?? 0;
      const deliveryId = form.DeliveryVehicleID ?? 0;

      await fetchTitle(projectId, typeId, deliveryId, forceFirstFetch);
    },
    [fetchTitle, form.ProjectID, form.TypeTrackingBillID, form.DeliveryVehicleID],
  );

  const applyLatestTrackingBill = useCallback(
    (latest: Record<string, unknown>, deliveryList?: LookupItem[]) => {
      const projectId = toOptionalNumber(latest['ProjectID']);
      const typeId = toOptionalNumber(latest['TypeTrackingBillID']);
      const deliveryId = toOptionalNumber(latest['DeliveryVehicleID']);
      const amountValue = toOptionalNumber(latest['Amount']);

      setForm((prev) => ({
        ...prev,
        ProjectID: projectId ?? prev.ProjectID,
        TypeTrackingBillID: typeId ?? prev.TypeTrackingBillID,
        DeliveryVehicleID: deliveryId ?? prev.DeliveryVehicleID,
        Amount: amountValue ?? prev.Amount,
      }));

      const deliverySource = deliveryList ?? deliveryVehicles;

      if (amountValue !== undefined) {
        setAmountText(amountValue.toString());
      } else if (deliveryId) {
        const vehicle = deliverySource.find(
          (item) => toOptionalNumber(item['DeliveryVehicleID']) === deliveryId,
        );
        const containerCount = toOptionalNumber(vehicle?.['NumberContainer']);
        if (containerCount !== undefined) {
          setAmountText(containerCount.toString());
          setForm((prev) => ({ ...prev, Amount: containerCount }));
        }
      }

      if (projectId && typeId && deliveryId) {
        void fetchTitle(projectId, typeId, deliveryId, true);
      }
    },
    [deliveryVehicles, fetchTitle],
  );

  const loadLookups = useCallback(async () => {
    setLookupsLoading(true);
    try {
      const [projectList, trackingTypeList, deliveryList] = await Promise.all([
        getProjects(),
        getTrackingTypes(),
        getDeliveryVehicles(),
      ]);

      setProjects(projectList ?? []);
      setTrackingTypes(trackingTypeList ?? []);
      setDeliveryVehicles(deliveryList ?? []);

      const latest = await getTrackingBillLatest();
      if (latest) {
        applyLatestTrackingBill(latest, deliveryList ?? []);
      }

      await refreshTitle(true);
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Không thể tải dữ liệu tra cứu.');
    } finally {
      setLookupsLoading(false);
    }
  }, [applyLatestTrackingBill, refreshTitle, showToast]);

  useEffect(() => {
    void loadLookups();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!lookupsLoading) {
      void refreshTitle();
    }
  }, [form.ProjectID, form.TypeTrackingBillID, form.DeliveryVehicleID, lookupsLoading, refreshTitle]);

  const handleAmountChange = (value: string | null | undefined) => {
    const nextValue = value ?? '';
    setAmountText(nextValue);
    const parsed = Number(nextValue);
    setForm((prev) => ({
      ...prev,
      Amount: Number.isNaN(parsed) ? undefined : parsed,
    }));
  };

  const handleDeliverySelect = (value: unknown) => {
    const numericValue = toOptionalNumber(value);
    setForm((prev) => ({
      ...prev,
      DeliveryVehicleID: numericValue,
    }));

    if (numericValue) {
      const selected = deliveryVehicles.find(
        (item) => toOptionalNumber(item['DeliveryVehicleID']) === numericValue,
      );
      const containerCount = toOptionalNumber(selected?.['NumberContainer']);
      if (containerCount !== undefined) {
        setAmountText(containerCount.toString());
        setForm((prev) => ({
          ...prev,
          Amount: containerCount,
        }));
      }
    }
  };

  const uploadMedia = useCallback(
    async (slot: ImageSlot, file: File, previewOverride?: string) => {
      const createdObjectUrl = !previewOverride;
      const previewUrl = previewOverride ?? URL.createObjectURL(file);

      setImages((prev) => ({
        ...prev,
        [slot]: {
          ...prev[slot],
          uploading: true,
        },
      }));

      try {
        const result = await uploadPublicFile(file, { subDirectory: 'TrackingBill' });
        if (!result?.publicPath) {
          throw new Error('Tải lên thành công nhưng máy chủ không trả về đường dẫn.');
        }

        setForm((prev) => ({
          ...prev,
          [slot]: result.publicPath ?? null,
        }));

        setImages((prev) => {
          const previousPreview = prev[slot].previewUrl;
          if (previousPreview && previousPreview !== previewUrl && !previousPreview.startsWith('data:')) {
            URL.revokeObjectURL(previousPreview);
          }

          return {
            ...prev,
            [slot]: {
              previewUrl,
              publicPath: result.publicPath ?? null,
              uploading: false,
            },
          };
        });

        showToast('Đã tải ảnh lên thành công.', 'success');
      } catch (error) {
        if (createdObjectUrl) {
          URL.revokeObjectURL(previewUrl);
        }

        setImages((prev) => ({
          ...prev,
          [slot]: {
            previewUrl: null,
            publicPath: null,
            uploading: false,
          },
        }));

        setForm((prev) => ({
          ...prev,
          [slot]: null,
        }));

        showToast(error instanceof Error ? error.message : 'Không thể tải ảnh lên.');
      }
    },
    [showToast],
  );

  const handleTriggerCapture = (slot: ImageSlot) => {
    const ref = inputRefs[slot].current;
    if (ref) {
      ref.click();
    }
  };

  const handleFileSelected = async (slot: ImageSlot, event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) {
      return;
    }

    await uploadMedia(slot, file);
  };

  const handleRemoveImage = (slot: ImageSlot) => {
    setForm((prev) => ({
      ...prev,
      [slot]: '',
    }));

    setImages((prev) => {
      const previous = prev[slot];
      if (previous.previewUrl) {
        URL.revokeObjectURL(previous.previewUrl);
      }
      return {
        ...prev,
        [slot]: { ...initialImageState },
      };
    });
  };

  const validateForm = (): string[] => {
    const errors: string[] = [];

    if (!form.ProjectID) {
      errors.push('Vui lòng chọn dự án.');
    }
    if (!form.TypeTrackingBillID) {
      errors.push('Vui lòng chọn loại vật tư.');
    }
    if (!form.DeliveryVehicleID) {
      errors.push('Vui lòng chọn phương tiện vận chuyển.');
    }
    if (!form.TitleBill) {
      errors.push('Không thể tạo tiêu đề phiếu. Vui lòng làm mới và thử lại.');
    }
    if (!form.Amount || form.Amount <= 0) {
      errors.push('Số lượng phải lớn hơn 0.');
    }

    const hasInboundImage = inboundSlots.some(
      (slot) => images[slot.key].publicPath && images[slot.key].publicPath !== '',
    );
    if (!hasInboundImage) {
      errors.push('Vui lòng chụp ít nhất một ảnh vật tư.');
    }

    return errors;
  };

  const handleSubmit = async () => {
    const errors = validateForm();
    if (errors.length > 0) {
      showToast(errors.join(' '));
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        TitleBill: form.TitleBill,
        TypeTrackingBillID: form.TypeTrackingBillID ?? null,
        ProjectID: form.ProjectID ?? null,
        DeliveryVehicleID: form.DeliveryVehicleID ?? null,
        DateBill: new Date().toISOString(),
        Amount: form.Amount ?? 0,
        ImageIn1: form.ImageIn1 ?? images.ImageIn1.publicPath ?? '',
        ImageIn2: form.ImageIn2 ?? images.ImageIn2.publicPath ?? '',
        ImageIn3: form.ImageIn3 ?? images.ImageIn3.publicPath ?? '',
        ImageOut1: '',
        ImageOut2: '',
        ImageOut3: '',
        FileReceive: '',
        IsError: 0,
        Violate: 0,
        FileExact: '',
        ViolationRuleID: 0,
        HandlingPlanID: 0,
      };

      const result = await createTrackingBill(payload);
      if (result) {
        showToast('Đã lưu phiếu nhập thành công.', 'success');
        resetImages();
        setForm((prev) => ({
          ...prev,
          Amount: undefined,
          ImageIn1: '',
          ImageIn2: '',
          ImageIn3: '',
        }));
        setAmountText('');
        setIsFirstTitleFetch(true);
        await refreshTitle(true);
      } else {
        showToast('Máy chủ trả về phản hồi trống.');
      }
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Không thể lưu phiếu nhập.');
    } finally {
      setSubmitting(false);
    }
  };

  const renderImageCard = (slot: ImageSlot, label: string) => {
    const state = images[slot];
    const hasUpload = state.publicPath && state.publicPath !== '';
    const slotNumber = slot.replace('ImageIn', '');

    return (
      <div key={slot} style={{
        background: '#ffffff',
        borderRadius: '12px',
        border: '1px solid #e2e8f0',
        padding: '16px',
        boxShadow: '0 2px 8px rgba(15, 23, 42, 0.04)'
      }}>
        <IonText>
          <p style={{
            margin: '0 0 12px',
            fontSize: '14px',
            fontWeight: '600',
            color: '#0f172a'
          }}>
            Ảnh {slotNumber}
          </p>
        </IonText>
        
        <div
          style={{
            width: '100%',
            height: '200px',
            borderRadius: '10px',
            border: state.previewUrl ? 'none' : '2px dashed #cbd5e1',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
            background: state.previewUrl ? '#000' : '#f8fafc',
            position: 'relative',
            marginBottom: '12px'
          }}
        >
          {state.uploading ? (
            <div style={{ textAlign: 'center' }}>
              <IonSpinner color="primary" />
              <p style={{ 
                margin: '8px 0 0', 
                fontSize: '13px', 
                color: '#64748b' 
              }}>
                Đang tải lên...
              </p>
            </div>
          ) : state.previewUrl ? (
            <>
              <img
                src={state.previewUrl ?? ''}
                alt={label}
                style={{ 
                  width: '100%', 
                  height: '100%', 
                  objectFit: 'contain' 
                }}
              />
              <IonButton
                fill="solid"
                color="light"
                size="small"
                onClick={() => handleRemoveImage(slot)}
                style={{
                  position: 'absolute',
                  top: '8px',
                  right: '8px',
                  '--border-radius': '8px',
                  opacity: 0.95
                }}
              >
                <IonIcon icon={closeCircleOutline} />
              </IonButton>
            </>
          ) : hasUpload ? (
            <div style={{ textAlign: 'center', color: '#10b981' }}>
              <IonIcon 
                icon={cameraOutline} 
                style={{ fontSize: '32px', marginBottom: '8px' }} 
              />
              <p style={{ margin: 0, fontSize: '13px', fontWeight: '500' }}>
                Đã tải lên
              </p>
            </div>
          ) : (
            <div style={{ textAlign: 'center', color: '#94a3b8' }}>
              <IonIcon 
                icon={cameraOutline} 
                style={{ fontSize: '32px', marginBottom: '8px' }} 
              />
              <p style={{ margin: 0, fontSize: '13px' }}>
                Chưa có ảnh
              </p>
            </div>
          )}
        </div>

        <div style={{ 
          display: 'flex', 
          gap: '8px', 
          flexDirection: 'column'
        }}>
          <IonButton
            expand="block"
            color="primary"
            size="default"
            disabled={state.uploading}
            onClick={() =>
              setCaptureConfig({
                slot,
                title: form.TitleBill || 'Nhập vật tư',
              })
            }
            style={{
              '--border-radius': '10px',
              height: '44px',
              fontSize: '14px',
              fontWeight: '600'
            }}
          >
            <IonIcon icon={cameraOutline} slot="start" />
            Chụp ảnh
          </IonButton>
          <IonButton
            expand="block"
            fill="outline"
            color="medium"
            size="default"
            disabled={state.uploading}
            onClick={() => handleTriggerCapture(slot)}
            style={{
              '--border-radius': '10px',
              height: '44px',
              fontSize: '14px',
              fontWeight: '600'
            }}
          >
            Chọn từ thiết bị
          </IonButton>
        </div>

        <input
          ref={inputRefs[slot]}
          type="file"
          accept="image/*"
          capture="environment"
          hidden
          onChange={(event) => void handleFileSelected(slot, event)}
        />
      </div>
    );
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar color="primary">
          <IonButtons slot="start">
            <IonBackButton defaultHref="/app/applications" />
          </IonButtons>
          <IonTitle>Nhập vật tư</IonTitle>
          <IonButtons slot="end">
            <IonButton onClick={() => void refreshTitle(true)} disabled={titleLoading}>
              <IonIcon icon={refreshOutline} />
            </IonButton>
          </IonButtons>
        </IonToolbar>
        {(lookupsLoading || titleLoading || submitting) && <IonProgressBar type="indeterminate" />}
      </IonHeader>

      <IonContent fullscreen style={{ '--background': '#f8fafc' }}>
        <IonHeader collapse="condense">
          <IonToolbar>
            <IonTitle size="large">Nhập vật tư</IonTitle>
          </IonToolbar>
        </IonHeader>

        <div className="ion-padding" style={{ paddingBottom: '100px', maxWidth: '1200px', margin: '0 auto' }}>
          {/* Header Section */}
          <div style={{
            background: 'linear-gradient(135deg, #e8f1ff 0%, #f8fbff 100%)',
            borderRadius: '16px',
            padding: '24px 20px',
            marginBottom: '20px',
            boxShadow: '0 4px 12px rgba(15, 23, 42, 0.04)'
          }}>
            <IonText>
              <h1 style={{
                fontSize: '20px',
                fontWeight: '700',
                margin: '0 0 8px',
                color: '#0f172a'
              }}>
                Tạo phiếu nhập vật tư
              </h1>
              <p style={{
                margin: '0',
                color: '#475569',
                fontSize: '14px',
                lineHeight: '1.5'
              }}>
                Điền thông tin và chụp ảnh vật tư để tạo phiếu nhập kho
              </p>
            </IonText>
          </div>

          {/* Form Card */}
          <IonCard style={{
            margin: '0 0 16px',
            boxShadow: '0 4px 12px rgba(15, 23, 42, 0.04)',
            borderRadius: '16px',
            border: '1px solid #e2e8f0'
          }}>
            <IonCardContent style={{ padding: '24px' }}>
              <IonText>
                <h2 style={{
                  fontSize: '17px',
                  fontWeight: '600',
                  margin: '0 0 20px',
                  color: '#0f172a',
                  letterSpacing: '-0.01em'
                }}>
                  Thông tin phiếu
                </h2>
              </IonText>

              <IonItem lines="none" style={{ 
                '--background': '#f8fafc',
                '--padding-start': '16px',
                '--inner-padding-end': '16px',
                borderRadius: '12px',
                marginBottom: '16px'
              }}>
                <IonLabel position="stacked" style={{ 
                  marginBottom: '8px',
                  fontSize: '14px',
                  fontWeight: '600',
                  color: '#0f172a'
                }}>
                  Dự án <span style={{ color: '#dc2626' }}>*</span>
                </IonLabel>
                <IonSelect
                  interface="popover"
                  placeholder="Chọn dự án"
                  value={form.ProjectID ?? ''}
                  onIonChange={(event) =>
                    setForm((prev) => ({
                      ...prev,
                      ProjectID: toOptionalNumber(event.detail.value),
                    }))
                  }
                  style={{ 
                    '--padding-start': '0',
                    '--padding-end': '0',
                    fontWeight: '500',
                    color: '#0f172a'
                  }}
                >
                  <IonSelectOption value="">Chưa chọn</IonSelectOption>
                  {projectOptions.map((option) => (
                    <IonSelectOption key={`project-${option.value}`} value={option.value}>
                      {option.label}
                    </IonSelectOption>
                  ))}
                </IonSelect>
              </IonItem>

              <IonItem lines="none" style={{ 
                '--background': '#f8fafc',
                '--padding-start': '16px',
                '--inner-padding-end': '16px',
                borderRadius: '12px',
                marginBottom: '16px'
              }}>
                <IonLabel position="stacked" style={{ 
                  marginBottom: '8px',
                  fontSize: '14px',
                  fontWeight: '600',
                  color: '#0f172a'
                }}>
                  Loại vật tư <span style={{ color: '#dc2626' }}>*</span>
                </IonLabel>
                <IonSelect
                  interface="popover"
                  placeholder="Chọn loại vật tư"
                  value={form.TypeTrackingBillID ?? ''}
                  onIonChange={(event) =>
                    setForm((prev) => ({
                      ...prev,
                      TypeTrackingBillID: toOptionalNumber(event.detail.value),
                    }))
                  }
                  style={{ 
                    '--padding-start': '0',
                    '--padding-end': '0',
                    fontWeight: '500',
                    color: '#0f172a'
                  }}
                >
                  <IonSelectOption value="">Chưa chọn</IonSelectOption>
                  {trackingTypeOptions.map((option) => (
                    <IonSelectOption key={`type-${option.value}`} value={option.value}>
                      {option.label}
                    </IonSelectOption>
                  ))}
                </IonSelect>
              </IonItem>

              <IonItem lines="none" style={{ 
                '--background': '#f8fafc',
                '--padding-start': '16px',
                '--inner-padding-end': '16px',
                borderRadius: '12px',
                marginBottom: '16px'
              }}>
                <IonLabel position="stacked" style={{ 
                  marginBottom: '8px',
                  fontSize: '14px',
                  fontWeight: '600',
                  color: '#0f172a'
                }}>
                  Phương tiện vận chuyển <span style={{ color: '#dc2626' }}>*</span>
                </IonLabel>
                <IonSelect
                  interface="popover"
                  placeholder="Chọn phương tiện"
                  value={form.DeliveryVehicleID ?? ''}
                  onIonChange={(event) => handleDeliverySelect(event.detail.value)}
                  style={{ 
                    '--padding-start': '0',
                    '--padding-end': '0',
                    fontWeight: '500',
                    color: '#0f172a'
                  }}
                >
                  <IonSelectOption value="">Chưa chọn</IonSelectOption>
                  {deliveryVehicleOptions.map((option) => (
                    <IonSelectOption key={`vehicle-${option.value}`} value={option.value}>
                      {option.label}
                    </IonSelectOption>
                  ))}
                </IonSelect>
              </IonItem>

              <div style={{
                background: '#e0f2fe',
                border: '1px solid #bae6fd',
                borderRadius: '12px',
                padding: '16px',
                marginBottom: '16px'
              }}>
                <IonText>
                  <p style={{
                    margin: '0 0 4px',
                    fontSize: '13px',
                    fontWeight: '600',
                    color: '#0369a1',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px'
                  }}>
                    Tiêu đề phiếu
                  </p>
                  <p style={{
                    margin: 0,
                    fontSize: '15px',
                    fontWeight: '600',
                    color: '#0c4a6e',
                    lineHeight: '1.5'
                  }}>
                    {titleLoading ? 'Đang tạo tiêu đề...' : form.TitleBill || 'Chưa có tiêu đề'}
                  </p>
                </IonText>
              </div>

              <IonItem lines="none" style={{ 
                '--background': '#f8fafc',
                '--padding-start': '16px',
                '--inner-padding-end': '16px',
                borderRadius: '12px'
              }}>
                <IonLabel position="stacked" style={{ 
                  marginBottom: '8px',
                  fontSize: '14px',
                  fontWeight: '600',
                  color: '#0f172a'
                }}>
                  Số lượng <span style={{ color: '#dc2626' }}>*</span>
                </IonLabel>
                <IonInput
                  type="number"
                  inputmode="decimal"
                  value={amountText}
                  placeholder="0"
                  onIonChange={(event) => handleAmountChange(event.detail.value)}
                  style={{ 
                    '--padding-start': '0',
                    '--padding-end': '0',
                    fontWeight: '500',
                    color: '#0f172a',
                    fontSize: '15px'
                  }}
                />
              </IonItem>
            </IonCardContent>
          </IonCard>

          {/* Photos Card */}
          <IonCard style={{
            margin: '0',
            boxShadow: '0 4px 12px rgba(15, 23, 42, 0.04)',
            borderRadius: '16px',
            border: '1px solid #e2e8f0'
          }}>
            <IonCardContent style={{ padding: '24px' }}>
              <IonText>
                <h2 style={{
                  fontSize: '17px',
                  fontWeight: '600',
                  margin: '0 0 4px',
                  color: '#0f172a',
                  letterSpacing: '-0.01em'
                }}>
                  Hình ảnh vật tư
                </h2>
                <p style={{
                  margin: '0 0 20px',
                  fontSize: '13px',
                  color: '#64748b'
                }}>
                  Tối thiểu 1 ảnh, tối đa 3 ảnh
                </p>
              </IonText>
              <IonGrid style={{ padding: 0 }}>
                <IonRow>
                  {inboundSlots.map(({ key, label }) => (
                    <IonCol size="12" sizeMd="6" sizeLg="4" key={key} style={{ padding: '0 8px 16px' }}>
                      {renderImageCard(key, label)}
                    </IonCol>
                  ))}
                </IonRow>
              </IonGrid>
            </IonCardContent>
          </IonCard>
        </div>
      </IonContent>

      <IonFooter style={{
        boxShadow: '0 -4px 12px rgba(15, 23, 42, 0.06)',
        borderTop: '1px solid #e2e8f0'
      }}>
        <IonToolbar style={{ '--background': '#ffffff', padding: '8px 16px' }}>
          <div style={{
            display: 'flex',
            gap: '12px',
            justifyContent: 'flex-end',
            maxWidth: '1200px',
            margin: '0 auto'
          }}>
            <IonButton 
              fill="clear" 
              color="medium" 
              routerLink="/app/applications"
              style={{ '--border-radius': '12px' }}
            >
              Hủy
            </IonButton>
            <IonButton 
              color="primary" 
              disabled={submitting} 
              onClick={() => void handleSubmit()}
              style={{
                '--border-radius': '12px',
                fontWeight: '600'
              }}
            >
              {submitting ? <IonSpinner slot="start" /> : <IonIcon icon={saveOutline} slot="start" />}
              Lưu phiếu
            </IonButton>
          </div>
        </IonToolbar>
      </IonFooter>

      <PhotoCaptureModal
        isOpen={captureConfig !== null}
        title={captureConfig?.title ?? form.TitleBill ?? 'Nhập vật tư'}
        onCancel={() => setCaptureConfig(null)}
        onComplete={async (file: File, previewDataUrl: string) => {
          const slot = captureConfig?.slot;
          if (!slot) {
            return;
          }
          await uploadMedia(slot, file, previewDataUrl);
          setCaptureConfig(null);
        }}
      />
    </IonPage>
  );
};

export default ImportMaterialPage;
