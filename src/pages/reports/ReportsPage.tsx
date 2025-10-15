import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  IonButton,
  IonButtons,
  IonCard,
  IonCardContent,
  IonContent,
  IonDatetime,
  IonHeader,
  IonIcon,
  IonItem,
  IonLabel,
  IonList,
  IonModal,
  IonPage,
  IonRefresher,
  IonRefresherContent,
  IonSearchbar,
  IonSegment,
  IonSegmentButton,
  IonSelect,
  IonSelectOption,
  IonSpinner,
  IonText,
  IonTitle,
  IonToolbar,
  useIonToast,
} from '@ionic/react';
import type { RefresherCustomEvent } from '@ionic/react';
import { addOutline, documentTextOutline, downloadOutline } from 'ionicons/icons';
import { useHistory } from 'react-router-dom';
import {
  ExportTrackingFilters,
  ImportTrackingFilters,
  LookupItem,
  TrackingBillItem,
  getDeliveryVehicles,
  getExportTrackingBills,
  getExportTrackingReport,
  getImportTrackingBills,
  getImportTrackingReport,
  getTrackingTypes,
  getVehicleTypes,
  searchProviders,
} from '../../services/billTrackingService';
import { ProjectItem, getProjects } from '../../services/projectService';
import { formatDate } from '../../utils/date';
import { LookupOption, mapLookupOptions, toOptionalNumber } from '../../utils/lookup';

type ReportTab = 'import' | 'export';

interface DetailState {
  tab: ReportTab;
  item: TrackingBillItem;
}

const toIsoDate = (value: Date): string => {
  const year = value.getFullYear();
  const month = `${value.getMonth() + 1}`.padStart(2, '0');
  const day = `${value.getDate()}`.padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const today = new Date();
const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);

const INITIAL_IMPORT_FILTERS: ImportTrackingFilters = {
  timeStart: toIsoDate(monthStart),
  timeEnd: toIsoDate(today),
  keySearch: '',
};

const INITIAL_EXPORT_FILTERS: ExportTrackingFilters = {
  timeStart: toIsoDate(monthStart),
  timeEnd: toIsoDate(today),
  keySearch: '',
};

const getFieldValue = (
  source: Record<string, unknown>,
  candidates: string[],
): unknown => {
  for (const key of candidates) {
    if (Object.prototype.hasOwnProperty.call(source, key)) {
      const value = source[key];
      if (value !== null && value !== undefined && value !== '') {
        return value;
      }
    }
  }
  return undefined;
};

const ReportsPage: React.FC = () => {
  const history = useHistory();
  const [presentToast] = useIonToast();

  const [activeTab, setActiveTab] = useState<ReportTab>('import');
  const [importFilters, setImportFilters] = useState<ImportTrackingFilters>({
    ...INITIAL_IMPORT_FILTERS,
  });
  const [exportFilters, setExportFilters] = useState<ExportTrackingFilters>({
    ...INITIAL_EXPORT_FILTERS,
  });

  const [projects, setProjects] = useState<ProjectItem[]>([]);
  const [providers, setProviders] = useState<LookupItem[]>([]);
  const [trackingTypes, setTrackingTypes] = useState<LookupItem[]>([]);
  const [vehicleTypes, setVehicleTypes] = useState<LookupItem[]>([]);
  const [deliveryVehicles, setDeliveryVehicles] = useState<LookupItem[]>([]);

  const [lookupLoading, setLookupLoading] = useState<boolean>(false);
  const [lookupError, setLookupError] = useState<string | null>(null);

  const [importItems, setImportItems] = useState<TrackingBillItem[]>([]);
  const [exportItems, setExportItems] = useState<TrackingBillItem[]>([]);

  const [importLoading, setImportLoading] = useState<boolean>(false);
  const [exportLoading, setExportLoading] = useState<boolean>(false);

  const [importError, setImportError] = useState<string | null>(null);
  const [exportError, setExportError] = useState<string | null>(null);

  const [downloading, setDownloading] = useState<boolean>(false);
  const [detailState, setDetailState] = useState<DetailState | null>(null);

  const projectOptions = useMemo<LookupOption[]>(
    () =>
      mapLookupOptions(
        projects,
        ['ProjectID', 'projectID', 'ID', 'Id'],
        ['ProjectName', 'Name', 'FullName', 'label'],
      ),
    [projects],
  );

  const providerOptions = useMemo<LookupOption[]>(
    () =>
      mapLookupOptions(
        providers,
        ['ProviderID', 'providerID', 'ID', 'Id'],
        ['ProviderName', 'Name', 'FullName', 'label'],
      ),
    [providers],
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
        ['DeliveryVehicleName', 'Name', 'VehicleName', 'label'],
      ),
    [deliveryVehicles],
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
        providerResponse,
        trackingTypeResponse,
        vehicleTypeResponse,
        deliveryVehicleResponse,
      ] = await Promise.all([
        getProjects(),
        searchProviders(),
        getTrackingTypes(),
        getVehicleTypes(),
        getDeliveryVehicles(),
      ]);

      setProjects(projectResponse ?? []);
      setProviders(providerResponse ?? []);
      setTrackingTypes(trackingTypeResponse ?? []);
      setVehicleTypes(vehicleTypeResponse ?? []);
      setDeliveryVehicles(deliveryVehicleResponse ?? []);
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
    let isActive = true;

    const initLookups = async () => {
      await loadLookups();
    };

    if (isActive) {
      void initLookups();
    }

    return () => {
      isActive = false;
    };
  }, [loadLookups]);

  const fetchImportItems = useCallback(async () => {
    setImportLoading(true);
    setImportError(null);
    try {
      const data = await getImportTrackingBills(importFilters, { page: 1, limit: 50 });
      setImportItems(data ?? []);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Khong the tai danh sach phieu nhap';
      setImportError(message);
      handleLookupToast(message);
    } finally {
      setImportLoading(false);
    }
  }, [importFilters, handleLookupToast]);

  const fetchExportItems = useCallback(async () => {
    setExportLoading(true);
    setExportError(null);
    try {
      const data = await getExportTrackingBills(exportFilters, { page: 1, limit: 50 });
      setExportItems(data ?? []);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Khong the tai danh sach phieu xuat';
      setExportError(message);
      handleLookupToast(message);
    } finally {
      setExportLoading(false);
    }
  }, [exportFilters, handleLookupToast]);

  useEffect(() => {
    void fetchImportItems();
  }, [fetchImportItems]);

  useEffect(() => {
    void fetchExportItems();
  }, [fetchExportItems]);

  const handleRefresh = useCallback(
    async (event: RefresherCustomEvent) => {
      try {
        if (activeTab === 'import') {
          await fetchImportItems();
        } else {
          await fetchExportItems();
        }
      } finally {
        event.detail.complete();
      }
    },
    [activeTab, fetchExportItems, fetchImportItems],
  );

  const updateImportFilter = <Key extends keyof ImportTrackingFilters>(
    key: Key,
    value: ImportTrackingFilters[Key],
  ) => {
    setImportFilters((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const updateExportFilter = <Key extends keyof ExportTrackingFilters>(
    key: Key,
    value: ExportTrackingFilters[Key],
  ) => {
    setExportFilters((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const resetFilters = () => {
    if (activeTab === 'import') {
      setImportFilters({ ...INITIAL_IMPORT_FILTERS });
    } else {
      setExportFilters({ ...INITIAL_EXPORT_FILTERS });
    }
  };

  const parseDateValue = (value?: string | string[] | null): string | undefined => {
    if (!value) return undefined;
    const firstValue = Array.isArray(value) ? value[0] : value;
    if (!firstValue) return undefined;
    return firstValue.slice(0, 10);
  };

  const handleReportDownload = async () => {
    setDownloading(true);
    try {
      const result =
        activeTab === 'import'
          ? await getImportTrackingReport(importFilters)
          : await getExportTrackingReport(exportFilters);

      const fileName = `${activeTab === 'import' ? 'bao-cao-nhap' : 'bao-cao-xuat'}-${Date.now()}.json`;
      const blob = new Blob([JSON.stringify(result, null, 2)], {
        type: 'application/json;charset=utf-8',
      });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = fileName;
      document.body.appendChild(anchor);
      anchor.click();
      document.body.removeChild(anchor);
      URL.revokeObjectURL(url);

      handleLookupToast('Da tai xong bao cao', 'success');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Khong the tai bao cao';
      handleLookupToast(message);
    } finally {
      setDownloading(false);
    }
  };

  const handleCreateNew = () => {
    history.push(activeTab === 'import' ? '/app/import-material' : '/app/export-material');
  };

  const renderImportFilters = () => (
    <IonCard>
      <IonCardContent>
        <IonText color="medium">
          <h3>Thong tin loc</h3>
        </IonText>

        <IonSearchbar
          value={importFilters.keySearch ?? ''}
          placeholder="Tim kiem ma phieu, don vi, tai xe..."
          debounce={400}
          onIonChange={(event) =>
            updateImportFilter('keySearch', event.detail.value ?? '')
          }
          className="ion-margin-top"
        />

        <IonItem className="ion-margin-top">
          <IonLabel position="stacked">Tu ngay</IonLabel>
          <IonDatetime
            presentation="date"
            value={importFilters.timeStart ?? ''}
            onIonChange={(event) =>
              updateImportFilter('timeStart', parseDateValue(event.detail.value))
            }
          />
        </IonItem>

        <IonItem className="ion-margin-top">
          <IonLabel position="stacked">Den ngay</IonLabel>
          <IonDatetime
            presentation="date"
            value={importFilters.timeEnd ?? ''}
            onIonChange={(event) =>
              updateImportFilter('timeEnd', parseDateValue(event.detail.value))
            }
          />
        </IonItem>

        <IonItem className="ion-margin-top">
          <IonLabel position="stacked">Du an</IonLabel>
          <IonSelect
            interface="popover"
            placeholder="Chon du an"
            value={importFilters.projectID ?? ''}
            onIonChange={(event) =>
              updateImportFilter('projectID', toOptionalNumber(event.detail.value))
            }
          >
            <IonSelectOption value="">Tat ca</IonSelectOption>
            {projectOptions.map((option) => (
              <IonSelectOption key={`project-${option.value}`} value={option.value}>
                {option.label}
              </IonSelectOption>
            ))}
          </IonSelect>
        </IonItem>

        <IonItem className="ion-margin-top">
          <IonLabel position="stacked">Nha cung cap</IonLabel>
          <IonSelect
            interface="popover"
            placeholder="Tat ca"
            value={importFilters.providerID ?? ''}
            onIonChange={(event) =>
              updateImportFilter('providerID', toOptionalNumber(event.detail.value))
            }
          >
            <IonSelectOption value="">Tat ca</IonSelectOption>
            {providerOptions.map((option) => (
              <IonSelectOption key={`provider-${option.value}`} value={option.value}>
                {option.label}
              </IonSelectOption>
            ))}
          </IonSelect>
        </IonItem>

        <IonItem className="ion-margin-top">
          <IonLabel position="stacked">Loai phieu</IonLabel>
          <IonSelect
            interface="popover"
            placeholder="Tat ca"
            value={importFilters.typeTrackingBillID ?? ''}
            onIonChange={(event) =>
              updateImportFilter(
                'typeTrackingBillID',
                toOptionalNumber(event.detail.value),
              )
            }
          >
            <IonSelectOption value="">Tat ca</IonSelectOption>
            {trackingTypeOptions.map((option) => (
              <IonSelectOption key={`type-${option.value}`} value={option.value}>
                {option.label}
              </IonSelectOption>
            ))}
          </IonSelect>
        </IonItem>

        <IonItem className="ion-margin-top">
          <IonLabel position="stacked">Loai phuong tien</IonLabel>
          <IonSelect
            interface="popover"
            placeholder="Tat ca"
            value={importFilters.typeVehicleID ?? ''}
            onIonChange={(event) =>
              updateImportFilter('typeVehicleID', toOptionalNumber(event.detail.value))
            }
          >
            <IonSelectOption value="">Tat ca</IonSelectOption>
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
            placeholder="Tat ca"
            value={importFilters.deliveryVehicleID ?? ''}
            onIonChange={(event) =>
              updateImportFilter(
                'deliveryVehicleID',
                toOptionalNumber(event.detail.value),
              )
            }
          >
            <IonSelectOption value="">Tat ca</IonSelectOption>
            {deliveryVehicleOptions.map((option) => (
              <IonSelectOption key={`delivery-${option.value}`} value={option.value}>
                {option.label}
              </IonSelectOption>
            ))}
          </IonSelect>
        </IonItem>

        <div className="ion-text-right ion-margin-top">
          <IonButton fill="clear" color="medium" onClick={resetFilters}>
            Dat lai
          </IonButton>
        </div>
      </IonCardContent>
    </IonCard>
  );

  const renderExportFilters = () => (
    <IonCard>
      <IonCardContent>
        <IonText color="medium">
          <h3>Thong tin loc</h3>
        </IonText>

        <IonSearchbar
          value={exportFilters.keySearch ?? ''}
          placeholder="Tim kiem ma phieu, don vi, tai xe..."
          debounce={400}
          onIonChange={(event) =>
            updateExportFilter('keySearch', event.detail.value ?? '')
          }
          className="ion-margin-top"
        />

        <IonItem className="ion-margin-top">
          <IonLabel position="stacked">Tu ngay</IonLabel>
          <IonDatetime
            presentation="date"
            value={exportFilters.timeStart ?? ''}
            onIonChange={(event) =>
              updateExportFilter('timeStart', parseDateValue(event.detail.value))
            }
          />
        </IonItem>

        <IonItem className="ion-margin-top">
          <IonLabel position="stacked">Den ngay</IonLabel>
          <IonDatetime
            presentation="date"
            value={exportFilters.timeEnd ?? ''}
            onIonChange={(event) =>
              updateExportFilter('timeEnd', parseDateValue(event.detail.value))
            }
          />
        </IonItem>

        <IonItem className="ion-margin-top">
          <IonLabel position="stacked">Du an nguon</IonLabel>
          <IonSelect
            interface="popover"
            placeholder="Chon du an nguon"
            value={exportFilters.projectIdFrom ?? ''}
            onIonChange={(event) =>
              updateExportFilter('projectIdFrom', toOptionalNumber(event.detail.value))
            }
          >
            <IonSelectOption value="">Tat ca</IonSelectOption>
            {projectOptions.map((option) => (
              <IonSelectOption key={`from-${option.value}`} value={option.value}>
                {option.label}
              </IonSelectOption>
            ))}
          </IonSelect>
        </IonItem>

        <IonItem className="ion-margin-top">
          <IonLabel position="stacked">Du an nhan</IonLabel>
          <IonSelect
            interface="popover"
            placeholder="Chon du an dich"
            value={exportFilters.projectIDTo ?? ''}
            onIonChange={(event) =>
              updateExportFilter('projectIDTo', toOptionalNumber(event.detail.value))
            }
          >
            <IonSelectOption value="">Tat ca</IonSelectOption>
            {projectOptions.map((option) => (
              <IonSelectOption key={`to-${option.value}`} value={option.value}>
                {option.label}
              </IonSelectOption>
            ))}
          </IonSelect>
        </IonItem>

        <IonItem className="ion-margin-top">
          <IonLabel position="stacked">Nha cung cap</IonLabel>
          <IonSelect
            interface="popover"
            placeholder="Tat ca"
            value={exportFilters.providerID ?? ''}
            onIonChange={(event) =>
              updateExportFilter('providerID', toOptionalNumber(event.detail.value))
            }
          >
            <IonSelectOption value="">Tat ca</IonSelectOption>
            {providerOptions.map((option) => (
              <IonSelectOption key={`export-provider-${option.value}`} value={option.value}>
                {option.label}
              </IonSelectOption>
            ))}
          </IonSelect>
        </IonItem>

        <IonItem className="ion-margin-top">
          <IonLabel position="stacked">Loai phieu</IonLabel>
          <IonSelect
            interface="popover"
            placeholder="Tat ca"
            value={exportFilters.typeTrackingBillID ?? ''}
            onIonChange={(event) =>
              updateExportFilter(
                'typeTrackingBillID',
                toOptionalNumber(event.detail.value),
              )
            }
          >
            <IonSelectOption value="">Tat ca</IonSelectOption>
            {trackingTypeOptions.map((option) => (
              <IonSelectOption key={`export-type-${option.value}`} value={option.value}>
                {option.label}
              </IonSelectOption>
            ))}
          </IonSelect>
        </IonItem>

        <IonItem className="ion-margin-top">
          <IonLabel position="stacked">Loai phuong tien</IonLabel>
          <IonSelect
            interface="popover"
            placeholder="Tat ca"
            value={exportFilters.typeVehicleID ?? ''}
            onIonChange={(event) =>
              updateExportFilter('typeVehicleID', toOptionalNumber(event.detail.value))
            }
          >
            <IonSelectOption value="">Tat ca</IonSelectOption>
            {vehicleTypeOptions.map((option) => (
              <IonSelectOption key={`export-vehicle-${option.value}`} value={option.value}>
                {option.label}
              </IonSelectOption>
            ))}
          </IonSelect>
        </IonItem>

        <IonItem className="ion-margin-top">
          <IonLabel position="stacked">Phuong tien giao nhan</IonLabel>
          <IonSelect
            interface="popover"
            placeholder="Tat ca"
            value={exportFilters.deliveryVehicleID ?? ''}
            onIonChange={(event) =>
              updateExportFilter(
                'deliveryVehicleID',
                toOptionalNumber(event.detail.value),
              )
            }
          >
            <IonSelectOption value="">Tat ca</IonSelectOption>
            {deliveryVehicleOptions.map((option) => (
              <IonSelectOption key={`export-delivery-${option.value}`} value={option.value}>
                {option.label}
              </IonSelectOption>
            ))}
          </IonSelect>
        </IonItem>

        <div className="ion-text-right ion-margin-top">
          <IonButton fill="clear" color="medium" onClick={resetFilters}>
            Dat lai
          </IonButton>
        </div>
      </IonCardContent>
    </IonCard>
  );

  const renderEmptyState = (message: string) => (
    <IonText color="medium">
      <p className="ion-padding">{message}</p>
    </IonText>
  );

  const renderList = () => {
    const items = activeTab === 'import' ? importItems : exportItems;
    const loading = activeTab === 'import' ? importLoading : exportLoading;
    const error = activeTab === 'import' ? importError : exportError;

    if (loading) {
      return (
        <div className="ion-padding ion-text-center">
          <IonSpinner />
          <IonText color="medium">
            <p className="ion-no-margin ion-margin-top">Dang tai du lieu...</p>
          </IonText>
        </div>
      );
    }

    if (error) {
      return (
        <IonText color="danger">
          <p className="ion-padding">{error}</p>
        </IonText>
      );
    }

    if (items.length === 0) {
      return renderEmptyState('Khong co du lieu phu hop voi bo loc hien tai.');
    }

    return (
      <IonList inset>
        {items.map((item, index) => {
          const code =
            (getFieldValue(item, [
              'Code',
              'TrackingBillCode',
              'ExportTrackingBillCode',
              'DocumentCode',
            ]) as string) ?? `Phieu ${index + 1}`;
          const projectName = getFieldValue(item, [
            'ProjectName',
            'ProjectNameFrom',
            'ProjectNameTo',
          ]) as string;
          const providerName = getFieldValue(item, [
            'ProviderName',
            'DeliveryName',
            'CompanyName',
          ]) as string;
          const driverName = getFieldValue(item, ['NameDriver', 'DriverName']) as string;
          const dateValue = getFieldValue(item, [
            'DateCreated',
            'CreatedDate',
            'TimeImport',
            'TimeExport',
          ]) as string;
          const quantityRaw = getFieldValue(item, ['Amount', 'Quantity', 'TotalAmount']);
          const quantityValue =
            quantityRaw === undefined || quantityRaw === null
              ? undefined
              : String(quantityRaw);
          const statusLabel = getFieldValue(item, [
            'StatusName',
            'TypeTrackingBillName',
            'StateName',
          ]) as string;

          return (
            <IonItem
              key={`tracking-${code}-${index}`}
              button
              detail
              onClick={() =>
                setDetailState({
                  tab: activeTab,
                  item,
                })
              }
            >
              <IonLabel>
                <h3>{code}</h3>
                {projectName && <p>Du an: {projectName}</p>}
                {providerName && <p>Nha cung cap: {providerName}</p>}
                {driverName && <p>Tai xe: {driverName}</p>}
                {quantityValue !== undefined && <p>So luong: {quantityValue}</p>}
                {dateValue && <p>Thoi gian: {formatDate(String(dateValue))}</p>}
                {statusLabel && (
                  <p>
                    Trang thai: <IonText color="primary">{statusLabel}</IonText>
                  </p>
                )}
              </IonLabel>
            </IonItem>
          );
        })}
      </IonList>
    );
  };

  const renderDetailModal = (): React.ReactElement | null => {
    if (!detailState) return null;

    const entries = Object.entries(detailState.item);

    return (
      <IonModal isOpen onDidDismiss={() => setDetailState(null)}>
        <IonHeader>
          <IonToolbar>
            <IonTitle>
              {detailState.tab === 'import' ? 'Chi tiet phieu nhap' : 'Chi tiet phieu xuat'}
            </IonTitle>
            <IonButtons slot="end">
              <IonButton onClick={() => setDetailState(null)}>Dong</IonButton>
            </IonButtons>
          </IonToolbar>
        </IonHeader>
        <IonContent>
          <IonList>
            {entries.map(([key, value]) => (
              <IonItem key={key}>
                <IonLabel>
                  <h3>{key}</h3>
                  <p>{
                    typeof value === 'object' && value !== null
                      ? JSON.stringify(value)
                      : String(value ?? '')
                  }</p>
                </IonLabel>
              </IonItem>
            ))}
          </IonList>
        </IonContent>
      </IonModal>
    );
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar color="light">
          <IonTitle>Bao cao</IonTitle>
          <IonButtons slot="end">
            <IonButton
              color="primary"
              disabled={downloading}
              onClick={() => void handleReportDownload()}
            >
              <IonIcon icon={downloadOutline} slot="start" />
              Bao cao
            </IonButton>
            <IonButton color="primary" onClick={handleCreateNew}>
              <IonIcon icon={addOutline} slot="start" />
              Them moi
            </IonButton>
          </IonButtons>
        </IonToolbar>
      </IonHeader>
      <IonContent fullscreen className="ion-padding">
        <IonHeader collapse="condense">
          <IonToolbar>
            <IonTitle size="large">Bao cao</IonTitle>
          </IonToolbar>
        </IonHeader>

        <IonRefresher slot="fixed" onIonRefresh={(event) => void handleRefresh(event)}>
          <IonRefresherContent />
        </IonRefresher>

        <IonSegment
          value={activeTab}
          onIonChange={(event) => setActiveTab(event.detail.value as ReportTab)}
        >
          <IonSegmentButton value="import">
            <IonIcon icon={documentTextOutline} />
            <IonLabel>Nhap vat tu</IonLabel>
          </IonSegmentButton>
          <IonSegmentButton value="export">
            <IonIcon icon={documentTextOutline} />
            <IonLabel>Xuat vat tu</IonLabel>
          </IonSegmentButton>
        </IonSegment>

        {lookupLoading && (
          <div className="ion-padding ion-text-center">
            <IonSpinner />
            <IonText color="medium">
              <p className="ion-no-margin ion-margin-top">Dang tai danh muc...</p>
            </IonText>
          </div>
        )}

        {lookupError && (
          <IonText color="danger">
            <p className="ion-padding">{lookupError}</p>
          </IonText>
        )}

        {activeTab === 'import' ? renderImportFilters() : renderExportFilters()}
        {renderList()}
        {renderDetailModal()}
      </IonContent>
    </IonPage>
  );
};

export default ReportsPage;
