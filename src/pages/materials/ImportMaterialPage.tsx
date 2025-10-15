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
  isPlatform,
  useIonToast,
} from '@ionic/react';
import {
  cameraOutline,
  checkmarkCircleOutline,
  closeCircleOutline,
  refreshOutline,
  saveOutline,
} from 'ionicons/icons';
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
import './ImportMaterialPage.css';

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
  { key: 'ImageIn1', label: 'áº¢nh váº­t tÆ° 1' },
  { key: 'ImageIn2', label: 'áº¢nh váº­t tÆ° 2' },
  { key: 'ImageIn3', label: 'áº¢nh váº­t tÆ° 3' },
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

  const isNativeMobile = isPlatform('android') || isPlatform('ios');
  const [isCompactViewport, setIsCompactViewport] = useState<boolean>(() => {
    if (typeof window === 'undefined') {
      return isNativeMobile;
    }
    return window.matchMedia('(max-width: 767px)').matches;
  });

  useEffect(() => {
    if (typeof window === 'undefined') {
      return undefined;
    }

    const mediaQuery = window.matchMedia('(max-width: 767px)');
    const handleMediaChange = (event: MediaQueryListEvent) => {
      setIsCompactViewport(event.matches);
    };

    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleMediaChange);
    } else {
      mediaQuery.addListener(handleMediaChange);
    }

    return () => {
      if (mediaQuery.removeEventListener) {
        mediaQuery.removeEventListener('change', handleMediaChange);
      } else {
        mediaQuery.removeListener(handleMediaChange);
      }
    };
  }, [setIsCompactViewport]);

  const selectInterface = isNativeMobile || isCompactViewport ? 'action-sheet' : 'popover';
  const selectInterfaceOptions = useMemo(
    () => ({
      cssClass: 'import-select-interface',
    }),
    [],
  );

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
          error instanceof Error ? error.message : 'KhÃ´ng thá»ƒ táº¡o tiÃªu Ä‘á» phiáº¿u tá»± Ä‘á»™ng.',
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
      showToast(error instanceof Error ? error.message : 'KhÃ´ng thá»ƒ táº£i dá»¯ liá»‡u tra cá»©u.');
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
          throw new Error('Táº£i lÃªn thÃ nh cÃ´ng nhÆ°ng mÃ¡y chá»§ khÃ´ng tráº£ vá» Ä‘Æ°á»ng dáº«n.');
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

        showToast('ÄÃ£ táº£i áº£nh lÃªn thÃ nh cÃ´ng.', 'success');
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

        showToast(error instanceof Error ? error.message : 'KhÃ´ng thá»ƒ táº£i áº£nh lÃªn.');
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
      errors.push('Vui lÃ²ng chá»n dá»± Ã¡n.');
    }
    if (!form.TypeTrackingBillID) {
      errors.push('Vui lÃ²ng chá»n loáº¡i váº­t tÆ°.');
    }
    if (!form.DeliveryVehicleID) {
      errors.push('Vui lÃ²ng chá»n phÆ°Æ¡ng tiá»‡n váº­n chuyá»ƒn.');
    }
    if (!form.TitleBill) {
      errors.push('KhÃ´ng thá»ƒ táº¡o tiÃªu Ä‘á» phiáº¿u. Vui lÃ²ng lÃ m má»›i vÃ  thá»­ láº¡i.');
    }
    if (!form.Amount || form.Amount <= 0) {
      errors.push('Sá»‘ lÆ°á»£ng pháº£i lá»›n hÆ¡n 0.');
    }

    const hasInboundImage = inboundSlots.some(
      (slot) => images[slot.key].publicPath && images[slot.key].publicPath !== '',
    );
    if (!hasInboundImage) {
      errors.push('Vui lÃ²ng chá»¥p Ã­t nháº¥t má»™t áº£nh váº­t tÆ°.');
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
        showToast('ÄÃ£ lÆ°u phiáº¿u nháº­p thÃ nh cÃ´ng.', 'success');
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
        showToast('MÃ¡y chá»§ tráº£ vá» pháº£n há»“i trá»‘ng.');
      }
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'KhÃ´ng thá»ƒ lÆ°u phiáº¿u nháº­p.');
    } finally {
      setSubmitting(false);
    }
  };

  const renderImageCard = (slot: ImageSlot, label: string) => {
    const state = images[slot];
    const hasUpload = Boolean(state.publicPath);
    const slotNumber = slot.replace('ImageIn', '');

    return (
      <div key={slot} className="image-card">
        <IonText>
          <p className="image-card__title">Ảnh {slotNumber}</p>
        </IonText>

        <div className={`image-card__media${state.previewUrl ? ' image-card__media--preview' : ''}`}>
          {state.uploading ? (
            <div className="image-card__state">
              <IonSpinner color="primary" />
              <p className="image-card__state-text">Đang tải lên...</p>
            </div>
          ) : state.previewUrl ? (
            <>
              <img src={state.previewUrl} alt={label} className="image-card__preview" />
              <IonButton
                className="image-card__remove"
                fill="solid"
                color="light"
                size="small"
                onClick={() => handleRemoveImage(slot)}
              >
                <IonIcon icon={closeCircleOutline} />
              </IonButton>
            </>
          ) : hasUpload ? (
            <div className="image-card__state image-card__state--success">
              <IonIcon icon={checkmarkCircleOutline} className="image-card__state-icon" />
              <p className="image-card__state-text">Đã tải lên</p>
            </div>
          ) : (
            <div className="image-card__state image-card__state--empty">
              <IonIcon icon={cameraOutline} className="image-card__state-icon" />
              <p className="image-card__state-text">Chưa có ảnh</p>
            </div>
          )}
        </div>

        <div className="image-card__actions">
          <IonButton
            className="image-card__button image-card__button--primary"
            expand="block"
            color="primary"
            disabled={state.uploading}
            onClick={() =>
              setCaptureConfig({
                slot,
                title: form.TitleBill || 'Nhập vật tư',
              })
            }
          >
            <IonIcon icon={cameraOutline} slot="start" />
            Chụp ảnh
          </IonButton>
          <IonButton
            className="image-card__button image-card__button--outline"
            expand="block"
            fill="outline"
            color="medium"
            disabled={state.uploading}
            onClick={() => handleTriggerCapture(slot)}
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
            <IonButton
              onClick={() => void refreshTitle(true)}
              disabled={titleLoading}
              aria-label="Làm mới tiêu đề"
            >
              <IonIcon icon={refreshOutline} />
            </IonButton>
          </IonButtons>
        </IonToolbar>
        {(lookupsLoading || titleLoading || submitting) && <IonProgressBar type="indeterminate" />}
      </IonHeader>

      <IonContent fullscreen className="import-page">
        <IonHeader collapse="condense">
          <IonToolbar>
            <IonTitle size="large">Nhập vật tư</IonTitle>
          </IonToolbar>
        </IonHeader>

        <div className="import-page__container">
          <div className="import-page__hero">
            <h1 className="import-page__hero-title">Tạo phiếu nhập vật tư</h1>
            <p className="import-page__hero-subtitle">
              Điền thông tin và chụp ảnh vật tư để tạo phiếu nhập kho nhanh chóng, chính xác.
            </p>
          </div>

          <IonCard className="import-card">
            <IonCardContent className="import-card__content">
              <IonText>
                <h2 className="import-card__title">Thông tin phiếu</h2>
              </IonText>

              <IonItem lines="none" className="form-field">
                <IonLabel position="stacked" className="form-field__label">
                  Dự án <span className="form-field__required">*</span>
                </IonLabel>
                <IonSelect
                  className="form-field__control"
                  interface={selectInterface}
                  interfaceOptions={selectInterfaceOptions}
                  placeholder="Chọn dự án"
                  value={form.ProjectID ?? ''}
                  onIonChange={(event) =>
                    setForm((prev) => ({
                      ...prev,
                      ProjectID: toOptionalNumber(event.detail.value),
                    }))
                  }
                >
                  <IonSelectOption value="">Chưa chọn</IonSelectOption>
                  {projectOptions.map((option) => (
                    <IonSelectOption key={`project-${option.value}`} value={option.value}>
                      {option.label}
                    </IonSelectOption>
                  ))}
                </IonSelect>
              </IonItem>

              <IonItem lines="none" className="form-field">
                <IonLabel position="stacked" className="form-field__label">
                  Loại vật tư <span className="form-field__required">*</span>
                </IonLabel>
                <IonSelect
                  className="form-field__control"
                  interface={selectInterface}
                  interfaceOptions={selectInterfaceOptions}
                  placeholder="Chọn loại vật tư"
                  value={form.TypeTrackingBillID ?? ''}
                  onIonChange={(event) =>
                    setForm((prev) => ({
                      ...prev,
                      TypeTrackingBillID: toOptionalNumber(event.detail.value),
                    }))
                  }
                >
                  <IonSelectOption value="">Chưa chọn</IonSelectOption>
                  {trackingTypeOptions.map((option) => (
                    <IonSelectOption key={`type-${option.value}`} value={option.value}>
                      {option.label}
                    </IonSelectOption>
                  ))}
                </IonSelect>
              </IonItem>

              <IonItem lines="none" className="form-field">
                <IonLabel position="stacked" className="form-field__label">
                  Phương tiện vận chuyển <span className="form-field__required">*</span>
                </IonLabel>
                <IonSelect
                  className="form-field__control"
                  interface={selectInterface}
                  interfaceOptions={selectInterfaceOptions}
                  placeholder="Chọn phương tiện"
                  value={form.DeliveryVehicleID ?? ''}
                  onIonChange={(event) => handleDeliverySelect(event.detail.value)}
                >
                  <IonSelectOption value="">Chưa chọn</IonSelectOption>
                  {deliveryVehicleOptions.map((option) => (
                    <IonSelectOption key={`vehicle-${option.value}`} value={option.value}>
                      {option.label}
                    </IonSelectOption>
                  ))}
                </IonSelect>
              </IonItem>

              <div className="import-tip">
                <IonText>
                  <p className="import-tip__title">Tiêu đề phiếu</p>
                  <p className="import-tip__value">
                    {titleLoading ? 'Đang tạo tiêu đề...' : form.TitleBill || 'Chưa có tiêu đề'}
                  </p>
                </IonText>
              </div>

              <IonItem lines="none" className="form-field">
                <IonLabel position="stacked" className="form-field__label">
                  Số lượng <span className="form-field__required">*</span>
                </IonLabel>
                <IonInput
                  className="form-field__control"
                  type="number"
                  inputmode="decimal"
                  value={amountText}
                  placeholder="0"
                  onIonChange={(event) => handleAmountChange(event.detail.value)}
                />
              </IonItem>
            </IonCardContent>
          </IonCard>

          <IonCard className="import-card import-card--photos">
            <IonCardContent className="import-card__content import-card__content--photos">
              <IonText>
                <h2 className="import-card__title">Hình ảnh vật tư</h2>
                <p className="import-card__description">Tối thiểu 1 ảnh, tối đa 3 ảnh</p>
              </IonText>
              <IonGrid className="image-grid">
                <IonRow>
                  {inboundSlots.map(({ key, label }) => (
                    <IonCol size="12" sizeMd="6" sizeLg="4" key={key} className="image-grid__col">
                      {renderImageCard(key, label)}
                    </IonCol>
                  ))}
                </IonRow>
              </IonGrid>
            </IonCardContent>
          </IonCard>
        </div>
      </IonContent>

      <IonFooter className="import-footer">
        <IonToolbar className="import-footer__toolbar">
          <div className="import-footer__actions">
            <IonButton
              className="import-footer__button import-footer__button--secondary"
              fill="clear"
              color="medium"
              routerLink="/app/applications"
            >
              Hủy
            </IonButton>
            <IonButton
              className="import-footer__button import-footer__button--primary"
              color="primary"
              disabled={submitting}
              onClick={() => void handleSubmit()}
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


