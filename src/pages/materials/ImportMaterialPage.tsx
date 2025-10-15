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
  { key: 'ImageIn1', label: 'Material photo 1' },
  { key: 'ImageIn2', label: 'Material photo 2' },
  { key: 'ImageIn3', label: 'Material photo 3' },
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
          error instanceof Error ? error.message : 'Unable to generate intake title automatically.',
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
      showToast(error instanceof Error ? error.message : 'Unable to load lookup data.');
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
          throw new Error('Upload succeeded but server did not return a path.');
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

        showToast('Photo uploaded successfully.', 'success');
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

        showToast(error instanceof Error ? error.message : 'Unable to upload photo.');
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
      errors.push('Select a project.');
    }
    if (!form.TypeTrackingBillID) {
      errors.push('Select a material type.');
    }
    if (!form.DeliveryVehicleID) {
      errors.push('Select a delivery vehicle.');
    }
    if (!form.TitleBill) {
      errors.push('Unable to generate ticket title. Please refresh and try again.');
    }
    if (!form.Amount || form.Amount <= 0) {
      errors.push('Quantity must be greater than zero.');
    }

    const hasInboundImage = inboundSlots.some(
      (slot) => images[slot.key].publicPath && images[slot.key].publicPath !== '',
    );
    if (!hasInboundImage) {
      errors.push('Attach at least one material photo.');
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
        showToast('Saved intake ticket successfully.', 'success');
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
        showToast('Server returned an empty response.');
      }
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Unable to save intake ticket.');
    } finally {
      setSubmitting(false);
    }
  };

  const renderImageCard = (slot: ImageSlot, label: string) => {
    const state = images[slot];
    const hasUpload = state.publicPath && state.publicPath !== '';

    return (
      <IonCard key={slot}>
        <IonCardContent className="ion-text-center">
          <IonText color="medium">
            <h3>{label}</h3>
          </IonText>
          <div
            style={{
              width: '100%',
              height: '180px',
              marginTop: '12px',
              borderRadius: '8px',
              border: '1px dashed var(--ion-color-medium)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              overflow: 'hidden',
              background: 'var(--ion-color-light)',
            }}
          >
            {state.uploading ? (
              <IonSpinner />
            ) : state.previewUrl ? (
              <img
                src={state.previewUrl ?? ''}
                alt={label}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            ) : hasUpload ? (
              <IonText color="success">
                <p>Upload completed</p>
              </IonText>
            ) : (
              <IonText color="medium">
                <p>No photo</p>
              </IonText>
            )}
          </div>

          <div
            className="ion-margin-top"
            style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', justifyContent: 'center' }}
          >
            <IonButton
              color="primary"
              disabled={state.uploading}
              onClick={() =>
                setCaptureConfig({
                  slot,
                  title: form.TitleBill || 'Material Intake',
                })
              }
            >
              <IonIcon icon={cameraOutline} slot="start" />
              Capture Photo
            </IonButton>
            <IonButton
              color="medium"
              fill="outline"
              disabled={state.uploading}
              onClick={() => handleTriggerCapture(slot)}
            >
              Upload file
            </IonButton>
            {(hasUpload || state.previewUrl) && (
              <IonButton
                color="medium"
                fill="clear"
                disabled={state.uploading}
                onClick={() => handleRemoveImage(slot)}
              >
                <IonIcon icon={closeCircleOutline} slot="start" />
                Remove
              </IonButton>
            )}
          </div>

          <input
            ref={inputRefs[slot]}
            type="file"
            accept="image/*"
            capture="environment"
            hidden
            onChange={(event) => void handleFileSelected(slot, event)}
          />
        </IonCardContent>
      </IonCard>
    );
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar color="light">
          <IonButtons slot="start">
            <IonBackButton defaultHref="/app/reports" />
          </IonButtons>
          <IonTitle>Material Intake</IonTitle>
          <IonButtons slot="end">
            <IonButton onClick={() => void refreshTitle(true)} disabled={titleLoading}>
              <IonIcon icon={refreshOutline} slot="start" />
              Refresh title
            </IonButton>
          </IonButtons>
        </IonToolbar>
        {(lookupsLoading || titleLoading || submitting) && <IonProgressBar type="indeterminate" />}
      </IonHeader>

      <IonContent fullscreen className="ion-padding">
        <IonHeader collapse="condense">
          <IonToolbar>
            <IonTitle size="large">Material Intake</IonTitle>
          </IonToolbar>
        </IonHeader>

        <IonCard>
          <IonCardContent>
            <IonText color="medium">
              <h3>Ticket information</h3>
            </IonText>

            <IonItem className="ion-margin-top">
              <IonLabel position="stacked">Project *</IonLabel>
              <IonSelect
                interface="popover"
                placeholder="Select project"
                value={form.ProjectID ?? ''}
                onIonChange={(event) =>
                  setForm((prev) => ({
                    ...prev,
                    ProjectID: toOptionalNumber(event.detail.value),
                  }))
                }
              >
                <IonSelectOption value="">Not selected</IonSelectOption>
                {projectOptions.map((option) => (
                  <IonSelectOption key={`project-${option.value}`} value={option.value}>
                    {option.label}
                  </IonSelectOption>
                ))}
              </IonSelect>
            </IonItem>

            <IonItem className="ion-margin-top">
              <IonLabel position="stacked">Material type *</IonLabel>
              <IonSelect
                interface="popover"
                placeholder="Select material type"
                value={form.TypeTrackingBillID ?? ''}
                onIonChange={(event) =>
                  setForm((prev) => ({
                    ...prev,
                    TypeTrackingBillID: toOptionalNumber(event.detail.value),
                  }))
                }
              >
                <IonSelectOption value="">Not selected</IonSelectOption>
                {trackingTypeOptions.map((option) => (
                  <IonSelectOption key={`type-${option.value}`} value={option.value}>
                    {option.label}
                  </IonSelectOption>
                ))}
              </IonSelect>
            </IonItem>

            <IonItem className="ion-margin-top">
              <IonLabel position="stacked">Delivery vehicle *</IonLabel>
              <IonSelect
                interface="popover"
                placeholder="Select delivery vehicle"
                value={form.DeliveryVehicleID ?? ''}
                onIonChange={(event) => handleDeliverySelect(event.detail.value)}
              >
                <IonSelectOption value="">Not selected</IonSelectOption>
                {deliveryVehicleOptions.map((option) => (
                  <IonSelectOption key={`vehicle-${option.value}`} value={option.value}>
                    {option.label}
                  </IonSelectOption>
                ))}
              </IonSelect>
            </IonItem>

            <IonItem className="ion-margin-top" lines="none">
              <IonLabel position="stacked">Ticket title</IonLabel>
              <IonText color="dark">
                <p className="ion-padding-start ion-padding-end ion-no-margin">
                  {titleLoading ? 'Generating title...' : form.TitleBill || 'Not available'}
                </p>
              </IonText>
            </IonItem>

            <IonItem className="ion-margin-top">
              <IonLabel position="stacked">Quantity *</IonLabel>
              <IonInput
                type="number"
                inputmode="decimal"
                value={amountText}
                placeholder="0"
                onIonChange={(event) => handleAmountChange(event.detail.value)}
              />
            </IonItem>
          </IonCardContent>
        </IonCard>

        <IonCard>
          <IonCardContent>
            <IonText color="medium">
              <h3>Material photos (up to 3)</h3>
              <p className="ion-no-margin">At least one photo is required.</p>
            </IonText>
            <IonGrid className="ion-margin-top">
              <IonRow>
                {inboundSlots.map(({ key, label }) => (
                  <IonCol size="12" sizeMd="6" key={key}>
                    {renderImageCard(key, label)}
                  </IonCol>
                ))}
              </IonRow>
            </IonGrid>
          </IonCardContent>
        </IonCard>
      </IonContent>

      <IonFooter>
        <IonToolbar>
          <IonButtons slot="start">
            <IonButton fill="outline" color="medium" routerLink="/app/reports">
              Back
            </IonButton>
          </IonButtons>
          <IonButtons slot="end">
            <IonButton color="primary" disabled={submitting} onClick={() => void handleSubmit()}>
              {submitting ? <IonSpinner slot="start" /> : <IonIcon icon={saveOutline} slot="start" />}
              Save ticket
            </IonButton>
          </IonButtons>
        </IonToolbar>
      </IonFooter>

      <PhotoCaptureModal
        isOpen={captureConfig !== null}
        title={captureConfig?.title ?? form.TitleBill ?? 'Material Intake'}
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
