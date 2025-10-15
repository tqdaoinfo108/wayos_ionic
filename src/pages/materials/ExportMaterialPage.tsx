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
  IonTextarea,
  IonTitle,
  IonToggle,
  IonToolbar,
  useIonToast,
} from '@ionic/react';
import { cameraOutline, closeCircleOutline, saveOutline } from 'ionicons/icons';
import { useHistory } from 'react-router-dom';
import {
  ExportTrackingBillPayload,
  LookupItem,
  createExportTrackingBill,
  getDeliveryVehicles,
  getTrackingTypes,
  getUnits,
  getVehicleTypes,
  uploadPublicFile,
} from '../../services/billTrackingService';
import { getProjects, ProjectItem } from '../../services/projectService';
import { LookupOption, mapLookupOptions, toOptionalNumber } from '../../utils/lookup';

type ImageSlot = 'ImageExport1' | 'ImageExport2' | 'ImageExport3' | 'ImageSign';

interface ExportFormState extends ExportTrackingBillPayload {
  TypeVehicleID?: number;
  DeliveryVehicleID?: number;
}

interface MediaState {
  previewUrl: string | null;
  publicPath: string | null;
  uploading: boolean;
}

const steps = [
  {
    key: 'project',
    title: 'Thong tin du an',
    description: 'Chon du an nguon va du an dich',
  },
  {
    key: 'vehicle',
    title: 'Thong tin phuong tien',
    description: 'Nhap thong tin tai xe va phuong tien',
  },
  {
    key: 'material',
    title: 'Thong tin vat tu',
    description: 'Chon loai phieu, don vi va so luong',
  },
  {
    key: 'media',
    title: 'Hinh anh & Chu ky',
    description: 'Bo sung hinh anh minh chung va chu ky',
  },
];

const initialFormState: ExportFormState = {
  ExportTrackingBillID: 0,
  ProjectIDFrom: undefined,
  ProjectIDTo: undefined,
  TypeTrackingBillID: undefined,
  NameDriver: '',
  CCCD: '',
  LicensePlate: '',
  UnitID: undefined,
  Amount: undefined,
  Description: '',
  ImageExport1: '',
  ImageExport2: '',
  ImageExport3: '',
  ImageSign: '',
  IsCheck: true,
  IsApprove: true,
  TypeVehicleID: undefined,
  DeliveryVehicleID: undefined,
};

const initialMediaState: MediaState = {
  previewUrl: null,
  publicPath: null,
  uploading: false,
};

const ExportMaterialPage: React.FC = () => {
  const history = useHistory();
  const [presentToast] = useIonToast();

  const [currentStep, setCurrentStep] = useState<number>(0);
  const [form, setForm] = useState<ExportFormState>(initialFormState);

  const [projects, setProjects] = useState<ProjectItem[]>([]);
  const [trackingTypes, setTrackingTypes] = useState<LookupItem[]>([]);
  const [vehicleTypes, setVehicleTypes] = useState<LookupItem[]>([]);
  const [deliveryVehicles, setDeliveryVehicles] = useState<LookupItem[]>([]);
  const [units, setUnits] = useState<LookupItem[]>([]);

  const [lookupLoading, setLookupLoading] = useState<boolean>(false);
  const [lookupError, setLookupError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState<boolean>(false);

  const [mediaStates, setMediaStates] = useState<Record<ImageSlot, MediaState>>({
    ImageExport1: { ...initialMediaState },
    ImageExport2: { ...initialMediaState },
    ImageExport3: { ...initialMediaState },
    ImageSign: { ...initialMediaState },
  });

  const inputRefs: Record<ImageSlot, MutableRefObject<HTMLInputElement | null>> = {
    ImageExport1: useRef<HTMLInputElement>(null),
    ImageExport2: useRef<HTMLInputElement>(null),
    ImageExport3: useRef<HTMLInputElement>(null),
    ImageSign: useRef<HTMLInputElement>(null),
  };

  const projectOptions = useMemo<LookupOption[]>(
    () =>
      mapLookupOptions(
        projects,
        ['ProjectID', 'projectID', 'ID', 'Id'],
        ['ProjectName', 'Name', 'FullName', 'label'],
      ),
    [projects],
  );

  const trackingTypeOptions = useMemo<LookupOption[]>(
    () =>
      mapLookupOptions(
        trackingTypes,
        ['TypeTrackingBillID', 'ID', 'Id'],
        ['TypeTrackingBillName', 'Name', 'label'],
      ),
    [trackingTypes],
  );

  const vehicleTypeOptions = useMemo<LookupOption[]>(
    () =>
      mapLookupOptions(
        vehicleTypes,
        ['TypeVehicleID', 'ID', 'Id'],
        ['TypeVehicleName', 'Name', 'label'],
      ),
    [vehicleTypes],
  );

  const deliveryVehicleOptions = useMemo<LookupOption[]>(
    () =>
      mapLookupOptions(
        deliveryVehicles,
        ['DeliveryVehicleID', 'ID', 'Id'],
        ['DeliveryVehicleName', 'VehicleName', 'Name', 'label'],
      ),
    [deliveryVehicles],
  );

  const unitOptions = useMemo<LookupOption[]>(
    () =>
      mapLookupOptions(
        units,
        ['UnitID', 'ID', 'Id'],
        ['UnitName', 'Name', 'label'],
      ),
    [units],
  );

  const updateForm = useCallback(
    <Key extends keyof ExportFormState>(key: Key, value: ExportFormState[Key]) => {
      setForm((prev) => ({
        ...prev,
        [key]: value,
      }));
    },
    [],
  );

  const handleLookupToast = useCallback(
    (message: string, color: 'danger' | 'success' | 'primary' = 'danger') => {
      presentToast({
        message,
        duration: 3000,
        color,
        position: 'bottom',
      });
    },
    [presentToast],
  );

  const loadLookups = useCallback(async () => {
    setLookupLoading(true);
    setLookupError(null);

    try {
      const [
        projectResponse,
        trackingTypeResponse,
        vehicleTypeResponse,
        deliveryVehicleResponse,
        unitResponse,
      ] = await Promise.all([
        getProjects(),
        getTrackingTypes(),
        getVehicleTypes(),
        getDeliveryVehicles(),
        getUnits(),
      ]);

      setProjects(projectResponse ?? []);
      setTrackingTypes(trackingTypeResponse ?? []);
      setVehicleTypes(vehicleTypeResponse ?? []);
      setDeliveryVehicles(deliveryVehicleResponse ?? []);
      setUnits(unitResponse ?? []);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Khong the tai du lieu danh muc';
      setLookupError(message);
      handleLookupToast(message);
    } finally {
      setLookupLoading(false);
    }
  }, [handleLookupToast]);

  useEffect(() => {
    void loadLookups();
  }, [loadLookups]);

  useEffect(() => {
    if (form.TypeTrackingBillID || trackingTypeOptions.length === 0) {
      return;
    }

    const defaultOption =
      trackingTypeOptions.find((option) =>
        option.label.toLowerCase().includes('xuat'),
      ) ?? trackingTypeOptions[0];

    if (defaultOption) {
      updateForm('TypeTrackingBillID', toOptionalNumber(defaultOption.value));
    }
  }, [form.TypeTrackingBillID, trackingTypeOptions, updateForm]);

  useEffect(() => {
    return () => {
      Object.values(mediaStates).forEach((state) => {
        if (state.previewUrl) {
          URL.revokeObjectURL(state.previewUrl);
        }
      });
    };
  }, [mediaStates]);

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

    setMediaStates((prev) => ({
      ...prev,
      [slot]: {
        ...prev[slot],
        uploading: true,
      },
    }));

    let previewUrl: string | null = null;

    try {
      previewUrl = URL.createObjectURL(file);
      const result = await uploadPublicFile(file, { subDirectory: 'ExportTrackingBill' });
      if (!result?.publicPath) {
        throw new Error('May chu khong tra ve duong dan tep.');
      }

      updateForm(slot, result.publicPath);
      setMediaStates((prev) => {
        const previous = prev[slot];
        if (previous.previewUrl) {
          URL.revokeObjectURL(previous.previewUrl);
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

      handleLookupToast('Da tai anh thanh cong', 'success');
    } catch (error) {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
      setMediaStates((prev) => ({
        ...prev,
        [slot]: {
          previewUrl: null,
          publicPath: null,
          uploading: false,
        },
      }));

      const message = error instanceof Error ? error.message : 'Khong the xu ly hinh anh';
      handleLookupToast(message);
    }
  };

  const handleRemoveImage = (slot: ImageSlot) => {
    updateForm(slot, '');
    setMediaStates((prev) => {
      const previous = prev[slot];
      if (previous.previewUrl) {
        URL.revokeObjectURL(previous.previewUrl);
      }
      return {
        ...prev,
        [slot]: { ...initialMediaState },
      };
    });
  };

  const validateStep = (stepIndex: number): string[] => {
    const errors: string[] = [];

    switch (stepIndex) {
      case 0: {
        if (!form.ProjectIDFrom) {
          errors.push('Chua chon du an nguon.');
        }
        if (!form.ProjectIDTo) {
          errors.push('Chua chon du an dich.');
        }
        if (form.ProjectIDFrom && form.ProjectIDTo && form.ProjectIDFrom === form.ProjectIDTo) {
          errors.push('Du an nguon va du an dich khong duoc trung nhau.');
        }
        break;
      }
      case 1: {
        if (!form.NameDriver || form.NameDriver.trim().length === 0) {
          errors.push('Vui long nhap ten tai xe.');
        }
        if (!form.CCCD || !/^\d{9,12}$/.test(form.CCCD.trim())) {
          errors.push('CCCD khong hop le (9-12 chu so).');
        }
        if (!form.LicensePlate || form.LicensePlate.trim().length === 0) {
          errors.push('Bien so xe khong duoc de trong.');
        }
        break;
      }
      case 2: {
        if (!form.TypeTrackingBillID) {
          errors.push('Vui long chon loai phieu.');
        }
        if (!form.UnitID) {
          errors.push('Vui long chon don vi tinh.');
        }
        if (form.Amount === undefined || form.Amount === null || Number(form.Amount) <= 0) {
          errors.push('So luong phai lon hon 0.');
        }
        break;
      }
      case 3: {
        if (!form.ImageExport1) {
          errors.push('Can them it nhat mot anh vat tu.');
        }
        if (!form.ImageSign) {
          errors.push('Can them chu ky xac nhan.');
        }
        break;
      }
      default:
        break;
    }

    return errors;
  };

  const goToStepWithError = (errorsByStep: string[][]): boolean => {
    const firstErrorIndex = errorsByStep.findIndex((list) => list.length > 0);
    if (firstErrorIndex > -1) {
      setCurrentStep(firstErrorIndex);
      handleLookupToast(errorsByStep[firstErrorIndex].join(' '));
      return true;
    }
    return false;
  };

  const handleNext = () => {
    const errors = validateStep(currentStep);
    if (errors.length > 0) {
      handleLookupToast(errors.join(' '));
      return;
    }

    setCurrentStep((prev) => Math.min(prev + 1, steps.length - 1));
  };

  const handlePrev = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 0));
  };

  const buildPayload = (): ExportTrackingBillPayload => {
    const payload: ExportTrackingBillPayload = {
      ExportTrackingBillID: form.ExportTrackingBillID ?? 0,
      ProjectIDFrom: form.ProjectIDFrom,
      ProjectIDTo: form.ProjectIDTo,
      TypeTrackingBillID: form.TypeTrackingBillID,
      NameDriver: form.NameDriver?.trim() ?? '',
      CCCD: form.CCCD?.trim() ?? '',
      LicensePlate: form.LicensePlate?.trim() ?? '',
      UnitID: form.UnitID,
      Amount: form.Amount,
      Description: form.Description?.trim() ?? '',
      ImageExport1: form.ImageExport1 ?? '',
      ImageExport2: form.ImageExport2 ?? '',
      ImageExport3: form.ImageExport3 ?? '',
      ImageSign: form.ImageSign ?? '',
      IsCheck: form.IsCheck ?? true,
      IsApprove: form.IsApprove ?? true,
      TypeVehicleID: form.TypeVehicleID,
      DeliveryVehicleID: form.DeliveryVehicleID,
    };

    return payload;
  };

  const handleSubmit = async () => {
    const errorsByStep = steps.map((_, index) => validateStep(index));
    if (goToStepWithError(errorsByStep)) {
      return;
    }

    setSubmitting(true);
    try {
      const payload = buildPayload();
      const result = await createExportTrackingBill(payload);

      if (result) {
        handleLookupToast('Da tai anh thanh cong', 'success');
        history.goBack();
      } else {
        handleLookupToast('Khong nhan duoc phan hoi tu may chu');
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Khong the xu ly hinh anh';
      handleLookupToast(message);
    } finally {
      setSubmitting(false);
    }
  };

  const renderProjectStep = () => (
    <IonCard>
      <IonCardContent>
        <IonText color="medium">
          <h3>Thong tin du an</h3>
        </IonText>

        <IonItem className="ion-margin-top">
          <IonLabel position="stacked">Du an nguon</IonLabel>
          <IonSelect
            interface="popover"
            placeholder="Chon du an nguon"
            value={form.ProjectIDFrom ?? ''}
            onIonChange={(event) =>
              updateForm('ProjectIDFrom', toOptionalNumber(event.detail.value))
            }
          >
            <IonSelectOption value="">Chua chon</IonSelectOption>
            {projectOptions.map((option) => (
              <IonSelectOption key={`from-${option.value}`} value={option.value}>
                {option.label}
              </IonSelectOption>
            ))}
          </IonSelect>
        </IonItem>

        <IonItem className="ion-margin-top">
          <IonLabel position="stacked">Du an dich</IonLabel>
          <IonSelect
            interface="popover"
            placeholder="Chon du an dich"
            value={form.ProjectIDTo ?? ''}
            onIonChange={(event) =>
              updateForm('ProjectIDTo', toOptionalNumber(event.detail.value))
            }
          >
            <IonSelectOption value="">Chua chon</IonSelectOption>
            {projectOptions.map((option) => (
              <IonSelectOption key={`to-${option.value}`} value={option.value}>
                {option.label}
              </IonSelectOption>
            ))}
          </IonSelect>
        </IonItem>
      </IonCardContent>
    </IonCard>
  );

  const renderVehicleStep = () => (
    <IonCard>
      <IonCardContent>
        <IonText color="medium">
          <h3>Thong tin phuong tien</h3>
        </IonText>

        <IonItem className="ion-margin-top">
          <IonLabel position="stacked">Ten tai xe</IonLabel>
          <IonInput
            value={form.NameDriver}
            placeholder="Nhap ten tai xe"
            onIonChange={(event) => updateForm('NameDriver', event.detail.value ?? '')}
          />
        </IonItem>

        <IonItem className="ion-margin-top">
          <IonLabel position="stacked">So CCCD</IonLabel>
          <IonInput
            value={form.CCCD}
            placeholder="012345678901"
            inputmode="numeric"
            maxlength={12}
            onIonChange={(event) => updateForm('CCCD', event.detail.value ?? '')}
          />
        </IonItem>

        <IonItem className="ion-margin-top">
          <IonLabel position="stacked">Bien so xe</IonLabel>
          <IonInput
            value={form.LicensePlate}
            placeholder="47C-12345"
            onIonChange={(event) => updateForm('LicensePlate', event.detail.value ?? '')}
          />
        </IonItem>

        <IonItem className="ion-margin-top">
          <IonLabel position="stacked">Loai phuong tien</IonLabel>
          <IonSelect
            interface="popover"
            placeholder="Chon loai phuong tien"
            value={form.TypeVehicleID ?? ''}
            onIonChange={(event) =>
              updateForm('TypeVehicleID', toOptionalNumber(event.detail.value))
            }
          >
            <IonSelectOption value="">Chua chon</IonSelectOption>
            {vehicleTypeOptions.map((option) => (
              <IonSelectOption key={`vehicle-${option.value}`} value={option.value}>
                {option.label}
              </IonSelectOption>
            ))}
          </IonSelect>
        </IonItem>

        <IonItem className="ion-margin-top">
          <IonLabel position="stacked">Phuong tien giao nhan</IonLabel>
          <IonSelect
            interface="popover"
            placeholder="Chon phuong tien giao nhan"
            value={form.DeliveryVehicleID ?? ''}
            onIonChange={(event) =>
              updateForm('DeliveryVehicleID', toOptionalNumber(event.detail.value))
            }
          >
            <IonSelectOption value="">Chua chon</IonSelectOption>
            {deliveryVehicleOptions.map((option) => (
              <IonSelectOption key={`delivery-${option.value}`} value={option.value}>
                {option.label}
              </IonSelectOption>
            ))}
          </IonSelect>
        </IonItem>
      </IonCardContent>
    </IonCard>
  );

  const renderMaterialStep = () => (
    <IonCard>
      <IonCardContent>
        <IonText color="medium">
          <h3>Thong tin vat tu</h3>
        </IonText>

        <IonItem className="ion-margin-top">
          <IonLabel position="stacked">Loai phieu</IonLabel>
          <IonSelect
            interface="popover"
            placeholder="Chon loai phieu"
            value={form.TypeTrackingBillID ?? ''}
            onIonChange={(event) =>
              updateForm('TypeTrackingBillID', toOptionalNumber(event.detail.value))
            }
          >
            <IonSelectOption value="">Chua chon</IonSelectOption>
            {trackingTypeOptions.map((option) => (
              <IonSelectOption key={`type-${option.value}`} value={option.value}>
                {option.label}
              </IonSelectOption>
            ))}
          </IonSelect>
        </IonItem>

        <IonItem className="ion-margin-top">
          <IonLabel position="stacked">Don vi tinh</IonLabel>
          <IonSelect
            interface="popover"
            placeholder="Chon don vi tinh"
            value={form.UnitID ?? ''}
            onIonChange={(event) => updateForm('UnitID', toOptionalNumber(event.detail.value))}
          >
            <IonSelectOption value="">Chua chon</IonSelectOption>
            {unitOptions.map((option) => (
              <IonSelectOption key={`unit-${option.value}`} value={option.value}>
                {option.label}
              </IonSelectOption>
            ))}
          </IonSelect>
        </IonItem>

        <IonItem className="ion-margin-top">
          <IonLabel position="stacked">So luong</IonLabel>
          <IonInput
            type="number"
            inputmode="decimal"
            value={form.Amount ?? ''}
            placeholder="0.0"
            onIonChange={(event) =>
              updateForm('Amount', event.detail.value ? Number(event.detail.value) : undefined)
            }
          />
        </IonItem>

        <IonItem className="ion-margin-top" lines="none">
          <IonLabel>Da kiem tra</IonLabel>
          <IonToggle
            checked={form.IsCheck ?? true}
            onIonChange={(event) => updateForm('IsCheck', event.detail.checked)}
          />
        </IonItem>

        <IonItem lines="none">
          <IonLabel>Da duyet</IonLabel>
          <IonToggle
            checked={form.IsApprove ?? true}
            onIonChange={(event) => updateForm('IsApprove', event.detail.checked)}
          />
        </IonItem>

        <IonItem className="ion-margin-top" lines="none">
          <IonLabel position="stacked">Mo ta bo sung</IonLabel>
        </IonItem>
        <IonTextarea
          value={form.Description ?? ''}
          placeholder="Ghi chu, mo ta vat tu..."
          autoGrow
          onIonChange={(event) => updateForm('Description', event.detail.value ?? '')}
        />
      </IonCardContent>
    </IonCard>
  );

  const renderMediaSlot = (slot: ImageSlot, label: string) => {
    const state = mediaStates[slot];
    const hasUploadedPath = (form[slot] ?? '') !== '' || state.publicPath;

    return (
      <IonCol size="12" sizeMd="6" key={slot}>
        <IonCard>
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
            ) : hasUploadedPath ? (
              <IonText color="success">
                <p>Da tai len</p>
              </IonText>
            ) : (
              <IonText color="medium">
                <p>Chua co hinh anh</p>
              </IonText>
            )}
          </div>

          <div className="ion-margin-top">
            <IonButton
              color="primary"
              onClick={() => handleTriggerCapture(slot)}
              fill="solid"
              disabled={state.uploading}
            >
              <IonIcon icon={cameraOutline} slot="start" />
              Chup anh
            </IonButton>
            {hasUploadedPath && (
              <IonButton
                color="medium"
                fill="clear"
                disabled={state.uploading}
                onClick={() => handleRemoveImage(slot)}
              >
                <IonIcon icon={closeCircleOutline} slot="start" />
                Xoa
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
    </IonCol>
    );
  };

  const renderMediaStep = () => (
    <IonCard>
      <IonCardContent>
        <IonText color="medium">
          <h3>Hinh anh minh chung</h3>
        </IonText>

        <IonGrid>
          <IonRow>
            {renderMediaSlot('ImageExport1', 'Anh vat tu 1')}
            {renderMediaSlot('ImageExport2', 'Anh vat tu 2')}
            {renderMediaSlot('ImageExport3', 'Anh vat tu 3')}
            {renderMediaSlot('ImageSign', 'Chu ky xac nhan')}
          </IonRow>
        </IonGrid>
      </IonCardContent>
    </IonCard>
  );

  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return renderProjectStep();
      case 1:
        return renderVehicleStep();
      case 2:
        return renderMaterialStep();
      case 3:
        return renderMediaStep();
      default:
        return null;
    }
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar color="light">
          <IonButtons slot="start">
            <IonBackButton defaultHref="/app/reports" />
          </IonButtons>
          <IonTitle>Tao phieu xuat vat tu</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent fullscreen className="ion-padding">
        <IonHeader collapse="condense">
          <IonToolbar>
            <IonTitle size="large">Tao phieu xuat vat tu</IonTitle>
          </IonToolbar>
        </IonHeader>

        <IonProgressBar value={(currentStep + 1) / steps.length} className="ion-margin-bottom" />

        <IonText color="primary">
          <h2>{steps[currentStep].title}</h2>
          <p>{steps[currentStep].description}</p>
        </IonText>

        {lookupLoading ? (
          <div className="ion-text-center ion-margin-top">
            <IonSpinner />
            <IonText color="medium">
              <p>Dang tai danh muc...</p>
            </IonText>
          </div>
        ) : null}

        {lookupError && (
          <IonText color="danger">
            <p className="ion-margin-top">{lookupError}</p>
          </IonText>
        )}

        {renderStepContent()}

        <div className="ion-margin-top ion-text-right">
          {currentStep > 0 && (
            <IonButton fill="outline" color="medium" onClick={handlePrev}>
              Quay lai
            </IonButton>
          )}
          {currentStep < steps.length - 1 ? (
            <IonButton color="primary" onClick={handleNext}>
              Tiep tuc
            </IonButton>
          ) : (
            <IonButton color="primary" onClick={() => void handleSubmit()} disabled={submitting}>
              {submitting ? <IonSpinner slot="start" /> : <IonIcon icon={saveOutline} slot="start" />}
              Luu phieu
            </IonButton>
          )}
        </div>
      </IonContent>
    </IonPage>
  );
};

export default ExportMaterialPage;



