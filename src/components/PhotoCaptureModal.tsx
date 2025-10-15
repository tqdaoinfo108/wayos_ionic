import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  IonButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonIcon,
  IonModal,
  IonSpinner,
  IonTitle,
  IonToolbar,
} from '@ionic/react';
import {
  cameraOutline,
  closeOutline,
  refreshOutline,
  saveOutline,
} from 'ionicons/icons';

export interface PhotoCaptureModalProps {
  isOpen: boolean;
  title: string;
  onCancel: () => void;
  onComplete: (file: File, previewDataUrl: string) => Promise<void>;
}

type StreamState = 'idle' | 'loading' | 'ready' | 'error';

const formatDateTime = (value: Date): string =>
  new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).format(value);

const getCoordinatesLabel = (latitude: number, longitude: number): string =>
  `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;

const PhotoCaptureModal: React.FC<PhotoCaptureModalProps> = ({
  isOpen,
  title,
  onCancel,
  onComplete,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [streamState, setStreamState] = useState<StreamState>('idle');
  const [streamError, setStreamError] = useState<string | null>(null);
  const [capturedDataUrl, setCapturedDataUrl] = useState<string | null>(null);
  const [locationLabel, setLocationLabel] = useState<string>('Fetching location...');
  const [locationLoading, setLocationLoading] = useState<boolean>(true);
  const [timestamp, setTimestamp] = useState<Date>(() => new Date());
  const [busy, setBusy] = useState<boolean>(false);

  const titleLines = useMemo(() => title.trim(), [title]);

  const stopStream = useCallback(() => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    setStreamState('idle');
  }, []);

  const startStream = useCallback(async () => {
    setStreamState('loading');
    setStreamError(null);

    try {
      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: { ideal: 'environment' },
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
        audio: false,
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      setStreamState('ready');
    } catch (error) {
      console.error('Unable to start camera stream', error);
      setStreamError(
        error instanceof Error
          ? error.message
          : 'Unable to access the camera. Check permissions and device compatibility.',
      );
      setStreamState('error');
    }
  }, []);

  const resolveLocation = useCallback(async () => {
    setLocationLoading(true);
    setLocationLabel('Fetching location...');
    try {
      if (!('geolocation' in navigator)) {
        setLocationLabel('Location not supported on this device.');
        setLocationLoading(false);
        return;
      }

      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
        });
      });

      const { latitude, longitude } = position.coords;
      setLocationLabel(getCoordinatesLabel(latitude, longitude));
    } catch (error) {
      console.warn('Unable to fetch location', error);
      setLocationLabel('Unable to fetch location. Check permissions.');
    } finally {
      setLocationLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!isOpen) {
      stopStream();
      setCapturedDataUrl(null);
      setStreamError(null);
      return;
    }

    setTimestamp(new Date());
    setCapturedDataUrl(null);
    void startStream();
    void resolveLocation();

    return () => {
      stopStream();
    };
  }, [isOpen, startStream, stopStream, resolveLocation]);

  const drawOverlay = useCallback(
    (context: CanvasRenderingContext2D, width: number, height: number) => {
      const overlayHeight = Math.floor(height * 0.28);
      const gradient = context.createLinearGradient(
        0,
        height,
        0,
        height - overlayHeight,
      );
      gradient.addColorStop(0, 'rgba(0,0,0,0.85)');
      gradient.addColorStop(0.7, 'rgba(0,0,0,0.45)');
      gradient.addColorStop(1, 'rgba(0,0,0,0)');

      context.fillStyle = gradient;
      context.fillRect(0, height - overlayHeight, width, overlayHeight);

      const padding = Math.floor(width * 0.05);
      let cursorY = height - overlayHeight + padding;

      const drawTextLine = (
        text: string,
        fontSize: number,
        fontWeight: 'normal' | 'bold' = 'normal',
        color = 'white',
      ) => {
        context.font = `${fontWeight === 'bold' ? '700' : '500'} ${fontSize}px "Segoe UI", sans-serif`;
        context.fillStyle = color;
        context.shadowColor = 'rgba(0,0,0,0.6)';
        context.shadowBlur = 6;
        context.shadowOffsetX = 2;
        context.shadowOffsetY = 2;
        context.fillText(text, padding, cursorY);
        cursorY += fontSize + 8;
      };

      drawTextLine(titleLines || 'Material Intake', Math.max(width * 0.04, 28), 'bold');
      drawTextLine(formatDateTime(timestamp), Math.max(width * 0.032, 22));
      drawTextLine(
        locationLabel,
        Math.max(width * 0.028, 18),
        'normal',
        locationLoading ? 'rgba(255,200,0,0.85)' : 'white',
      );
    },
    [locationLabel, locationLoading, timestamp, titleLines],
  );

  const handleCapture = useCallback(async () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;

    if (!video || !canvas) {
      return;
    }

    if (video.readyState < HTMLMediaElement.HAVE_CURRENT_DATA) {
      return;
    }

    const width = video.videoWidth || 1280;
    const height = video.videoHeight || 720;

    canvas.width = width;
    canvas.height = height;

    const context = canvas.getContext('2d');
    if (!context) {
      return;
    }

    context.drawImage(video, 0, 0, width, height);
    drawOverlay(context, width, height);

    const dataUrl = canvas.toDataURL('image/png');
    setCapturedDataUrl(dataUrl);

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  }, [drawOverlay]);

  const handleRetake = useCallback(() => {
    setCapturedDataUrl(null);
    setTimestamp(new Date());
    void startStream();
    void resolveLocation();
  }, [resolveLocation, startStream]);

  const handleSave = useCallback(async () => {
    if (!capturedDataUrl) {
      return;
    }

    setBusy(true);
    try {
      const response = await fetch(capturedDataUrl);
      const blob = await response.blob();
      const file = new File([blob], `material-${Date.now()}.png`, { type: 'image/png' });
      await onComplete(file, capturedDataUrl);
      setCapturedDataUrl(null);
    } catch (error) {
      console.error('Unable to process captured image', error);
    } finally {
      setBusy(false);
    }
  }, [capturedDataUrl, onComplete]);

  const showVideoPreview = streamState === 'ready' && !capturedDataUrl;
  const showSpinner = streamState === 'loading';

  return (
    <IonModal isOpen={isOpen} onDidDismiss={onCancel} className="photo-capture-modal">
      <IonHeader translucent>
        <IonToolbar color="dark">
          <IonButtons slot="start">
            <IonButton onClick={onCancel}>
              <IonIcon icon={closeOutline} slot="icon-only" />
            </IonButton>
          </IonButtons>
          <IonTitle>Capture Photo</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent fullscreen className="photo-capture-content">
        <div className="photo-capture-wrapper">
          {streamError && !capturedDataUrl ? (
            <div className="photo-capture-error">
              <p>{streamError}</p>
              <IonButton color="primary" onClick={startStream}>
                <IonIcon icon={refreshOutline} slot="start" />
                Retry
              </IonButton>
            </div>
          ) : (
            <>
              <div className="photo-capture-preview">
                {showSpinner && (
                  <div className="photo-capture-loader">
                    <IonSpinner name="crescent" />
                    <p>Initializing camera...</p>
                  </div>
                )}

                {showVideoPreview && (
                  <video ref={videoRef} playsInline muted autoPlay className="photo-capture-video" />
                )}

                {capturedDataUrl && (
                  <img src={capturedDataUrl} alt="Captured preview" className="photo-capture-image" />
                )}

                <canvas ref={canvasRef} hidden />
              </div>

              <div className="photo-capture-footer">
                <div className="photo-metadata">
                  <p className="photo-meta-title">{titleLines || 'Material Intake'}</p>
                  <p className="photo-meta-time">{formatDateTime(timestamp)}</p>
                  <p className="photo-meta-location">
                    {locationLoading ? 'Fetching location...' : locationLabel}
                  </p>
                </div>

                <div className="photo-capture-actions">
                  {!capturedDataUrl ? (
                    <IonButton
                      expand="block"
                      color="primary"
                      disabled={streamState !== 'ready' || busy}
                      onClick={() => void handleCapture()}
                    >
                      <IonIcon icon={cameraOutline} slot="start" />
                      Capture
                    </IonButton>
                  ) : (
                    <div className="photo-capture-actions-row">
                      <IonButton
                        color="medium"
                        fill="outline"
                        onClick={handleRetake}
                        disabled={busy}
                      >
                        <IonIcon icon={refreshOutline} slot="start" />
                        Retake
                      </IonButton>
                      <IonButton
                        color="success"
                        onClick={() => void handleSave()}
                        disabled={busy}
                      >
                        {busy ? (
                          <IonSpinner slot="start" name="dots" />
                        ) : (
                          <IonIcon icon={saveOutline} slot="start" />
                        )}
                        Save
                      </IonButton>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </IonContent>

      <style>
        {`
          .photo-capture-modal {
            --background: #000;
          }
          .photo-capture-content {
            --background: #000;
          }
          .photo-capture-wrapper {
            display: flex;
            flex-direction: column;
            height: 100%;
            padding: 16px;
            box-sizing: border-box;
          }
          .photo-capture-preview {
            flex: 1;
            position: relative;
            display: flex;
            align-items: center;
            justify-content: center;
            background: #111;
            border-radius: 16px;
            overflow: hidden;
          }
          .photo-capture-video,
          .photo-capture-image {
            max-width: 100%;
            max-height: 100%;
            object-fit: contain;
          }
          .photo-capture-loader {
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 12px;
            color: #fff;
          }
          .photo-capture-footer {
            margin-top: 16px;
            display: flex;
            flex-direction: column;
            gap: 12px;
            color: #f1f1f1;
          }
          .photo-metadata {
            font-size: 14px;
            line-height: 1.4;
          }
          .photo-meta-title {
            font-weight: 600;
          }
          .photo-meta-time {
            font-size: 13px;
          }
          .photo-meta-location {
            font-size: 12px;
            opacity: 0.85;
          }
          .photo-capture-actions {
            display: flex;
            justify-content: center;
          }
          .photo-capture-actions-row {
            display: flex;
            gap: 12px;
          }
          .photo-capture-error {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            text-align: center;
            gap: 16px;
            color: #fff;
            padding: 24px;
          }
          @media (max-width: 768px) {
            .photo-capture-wrapper {
              padding: 12px;
            }
            .photo-capture-actions-row {
              flex-direction: column;
              width: 100%;
            }
            .photo-capture-actions-row ion-button {
              width: 100%;
            }
          }
        `}
      </style>
    </IonModal>
  );
};

export default PhotoCaptureModal;
