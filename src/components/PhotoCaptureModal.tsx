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

interface LocationInfo {
  latitude: number;
  longitude: number;
  address: string;
  coordinates: string;
}

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

const reverseGeocode = async (latitude: number, longitude: number): Promise<string> => {
  try {
    // Sử dụng Nominatim OpenStreetMap API (miễn phí)
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1&accept-language=vi`,
      {
        headers: {
          'User-Agent': 'WayOS-Mobile-App',
        },
      }
    );
    
    if (!response.ok) {
      throw new Error('Không thể lấy địa chỉ');
    }
    
    const data = await response.json();
    
    // Tạo địa chỉ từ các thành phần
    const address = data.address || {};
    const parts: string[] = [];
    
    // Số nhà và đường
    if (address.house_number) parts.push(address.house_number);
    if (address.road) parts.push(address.road);
    
    // Phường/Xã
    const ward = address.suburb || address.village || address.neighbourhood;
    if (ward) parts.push(ward);
    
    // Quận/Huyện
    const district = address.city_district || address.town || address.municipality;
    if (district) parts.push(district);
    
    // Thành phố/Tỉnh
    const city = address.city || address.province || address.state;
    if (city) parts.push(city);
    
    // Quốc gia
    if (address.country) parts.push(address.country);
    
    return parts.length > 0 ? parts.join(', ') : data.display_name || 'Không xác định được địa chỉ';
  } catch (error) {
    console.error('Reverse geocoding error:', error);
    return 'Không thể lấy địa chỉ';
  }
};

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
  const [locationInfo, setLocationInfo] = useState<LocationInfo | null>(null);
  const [locationLoading, setLocationLoading] = useState<boolean>(true);
  const [locationError, setLocationError] = useState<string | null>(null);
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

      console.log('Requesting camera access...', constraints);
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      console.log('Camera stream obtained:', stream.getVideoTracks()[0].getSettings());
      streamRef.current = stream;

      if (videoRef.current) {
        const video = videoRef.current;
        
        // CRITICAL: Set srcObject and force load
        video.srcObject = stream;
        video.load(); // Force load the stream
        
        console.log('Video element srcObject set and load() called');
        
        // Wait for video to be ready
        await new Promise<void>((resolve) => {
          const timeoutId = setTimeout(() => {
            console.warn('Video metadata timeout');
            resolve();
          }, 8000);
          
          const onMetadata = () => {
            clearTimeout(timeoutId);
            console.log('✅ Video metadata loaded', {
              videoWidth: video.videoWidth,
              videoHeight: video.videoHeight,
              readyState: video.readyState,
            });
            resolve();
          };
          
          if (video.readyState >= HTMLMediaElement.HAVE_METADATA) {
            console.log('✅ Video already has metadata');
            onMetadata();
          } else {
            video.addEventListener('loadedmetadata', onMetadata, { once: true });
          }
        });
        
        // Force play
        try {
          video.muted = true; // Ensure muted for autoplay
          await video.play();
          console.log('✅ Video playing', {
            paused: video.paused,
            videoWidth: video.videoWidth,
            videoHeight: video.videoHeight,
            readyState: video.readyState
          });
        } catch (playError) {
          console.error('❌ Video play error:', playError);
          // Try one more time after a delay
          setTimeout(async () => {
            try {
              await video.play();
              console.log('✅ Video playing on retry');
            } catch (e) {
              console.error('❌ Video play retry failed:', e);
            }
          }, 500);
        }
      }

      setStreamState('ready');
    } catch (error) {
      console.error('Unable to start camera stream', error);
      setStreamError(
        error instanceof Error
          ? error.message
          : 'Không thể truy cập camera. Kiểm tra quyền và khả năng tương thích thiết bị.',
      );
      setStreamState('error');
    }
  }, []);

  const resolveLocation = useCallback(async () => {
    setLocationLoading(true);
    setLocationError(null);
    setLocationInfo(null);
    
    try {
      if (!('geolocation' in navigator)) {
        setLocationError('Thiết bị không hỗ trợ định vị.');
        setLocationLoading(false);
        return;
      }

      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 15000,
          maximumAge: 0,
        });
      });

      const { latitude, longitude } = position.coords;
      const coordinates = getCoordinatesLabel(latitude, longitude);
      
      // Lấy địa chỉ từ tọa độ
      const address = await reverseGeocode(latitude, longitude);
      
      setLocationInfo({
        latitude,
        longitude,
        address,
        coordinates,
      });
    } catch (error) {
      console.warn('Unable to fetch location', error);
      const errorMessage = error instanceof GeolocationPositionError
        ? error.code === 1
          ? 'Vui lòng cấp quyền truy cập vị trí.'
          : error.code === 2
          ? 'Không thể xác định vị trí.'
          : 'Hết thời gian chờ định vị.'
        : 'Không thể lấy vị trí. Kiểm tra quyền truy cập.';
      setLocationError(errorMessage);
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
      // Tính toán chiều cao overlay dựa trên số dòng text
      const baseOverlayHeight = Math.floor(height * 0.35);
      const overlayHeight = locationInfo?.address ? baseOverlayHeight : Math.floor(height * 0.28);
      
      const gradient = context.createLinearGradient(
        0,
        height,
        0,
        height - overlayHeight,
      );
      gradient.addColorStop(0, 'rgba(0,0,0,0.88)');
      gradient.addColorStop(0.7, 'rgba(0,0,0,0.5)');
      gradient.addColorStop(1, 'rgba(0,0,0,0)');

      context.fillStyle = gradient;
      context.fillRect(0, height - overlayHeight, width, overlayHeight);

      const padding = Math.floor(width * 0.05);
      let cursorY = height - overlayHeight + padding + 10;

      const drawTextLine = (
        text: string,
        fontSize: number,
        fontWeight: 'normal' | 'bold' = 'normal',
        color = 'white',
      ) => {
        context.font = `${fontWeight === 'bold' ? '700' : '500'} ${fontSize}px "Segoe UI", sans-serif`;
        context.fillStyle = color;
        context.shadowColor = 'rgba(0,0,0,0.8)';
        context.shadowBlur = 8;
        context.shadowOffsetX = 2;
        context.shadowOffsetY = 2;
        context.fillText(text, padding, cursorY);
        cursorY += fontSize + 10;
      };

      const drawMultilineText = (
        text: string,
        fontSize: number,
        maxWidth: number,
        fontWeight: 'normal' | 'bold' = 'normal',
        color = 'white',
      ) => {
        context.font = `${fontWeight === 'bold' ? '700' : '500'} ${fontSize}px "Segoe UI", sans-serif`;
        context.fillStyle = color;
        context.shadowColor = 'rgba(0,0,0,0.8)';
        context.shadowBlur = 8;
        context.shadowOffsetX = 2;
        context.shadowOffsetY = 2;

        const words = text.split(' ');
        let line = '';
        const lines: string[] = [];

        for (const word of words) {
          const testLine = line + (line ? ' ' : '') + word;
          const metrics = context.measureText(testLine);
          if (metrics.width > maxWidth && line) {
            lines.push(line);
            line = word;
          } else {
            line = testLine;
          }
        }
        if (line) lines.push(line);

        lines.forEach((lineText) => {
          context.fillText(lineText, padding, cursorY);
          cursorY += fontSize + 8;
        });
      };

      // Tiêu đề
      drawTextLine(titleLines || 'Nhập vật tư', Math.max(width * 0.042, 30), 'bold', '#ffffff');
      
      // Ngày giờ
      drawTextLine(formatDateTime(timestamp), Math.max(width * 0.034, 24), 'normal', '#e0e0e0');
      
      // Địa chỉ (nhiều dòng nếu cần)
      if (locationInfo?.address) {
        const maxTextWidth = width - (padding * 2);
        drawMultilineText(
          locationInfo.address,
          Math.max(width * 0.03, 22),
          maxTextWidth,
          'normal',
          '#ffd700'
        );
      } else if (locationLoading) {
        drawTextLine('Đang lấy địa chỉ...', Math.max(width * 0.03, 22), 'normal', '#ffeb3b');
      } else if (locationError) {
        drawTextLine(locationError, Math.max(width * 0.03, 22), 'normal', '#ff6b6b');
      }
      
      // Tọa độ GPS
      if (locationInfo?.coordinates) {
        drawTextLine(
          `GPS: ${locationInfo.coordinates}`,
          Math.max(width * 0.026, 18),
          'normal',
          '#b0b0b0'
        );
      }
    },
    [locationInfo, locationLoading, locationError, timestamp, titleLines],
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
          <IonTitle>Chụp ảnh</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent fullscreen className="photo-capture-content">
        <div className="photo-capture-wrapper">
          {streamError && !capturedDataUrl ? (
            <div className="photo-capture-error">
              <p>{streamError}</p>
              <IonButton color="primary" onClick={startStream}>
                <IonIcon icon={refreshOutline} slot="start" />
                Thử lại
              </IonButton>
            </div>
          ) : (
            <>
              <div className="photo-capture-preview">
                {showSpinner && (
                  <div className="photo-capture-loader">
                    <IonSpinner name="crescent" />
                    <p>Đang khởi động camera...</p>
                  </div>
                )}

                {showVideoPreview && (
                  <>
                    <video 
                      ref={videoRef} 
                      playsInline 
                      muted 
                      autoPlay 
                      className="photo-capture-video"
                    />
                    <div style={{
                      position: 'absolute',
                      top: '10px',
                      left: '10px',
                      background: 'rgba(255,0,0,0.7)',
                      color: 'white',
                      padding: '8px',
                      fontSize: '12px',
                      zIndex: 999,
                      borderRadius: '4px'
                    }}>
                      Video Element Active
                      <br/>Stream: {streamState}
                      <br/>Size: {videoRef.current?.videoWidth || 0}x{videoRef.current?.videoHeight || 0}
                      <br/>Ready: {videoRef.current?.readyState || 0}
                    </div>
                  </>
                )}

                {capturedDataUrl && (
                  <img src={capturedDataUrl} alt="Captured preview" className="photo-capture-image" />
                )}

                <canvas ref={canvasRef} hidden />
              </div>

              <div className="photo-capture-footer">
                <div className="photo-metadata">
                  <p className="photo-meta-title">{titleLines || 'Nhập vật tư'}</p>
                  <p className="photo-meta-time">{formatDateTime(timestamp)}</p>
                  {locationLoading && (
                    <p className="photo-meta-location loading">
                      <IonSpinner name="dots" style={{ width: '16px', height: '16px', marginRight: '6px' }} />
                      Đang lấy vị trí và địa chỉ...
                    </p>
                  )}
                  {!locationLoading && locationInfo && (
                    <>
                      <p className="photo-meta-address">{locationInfo.address}</p>
                      <p className="photo-meta-coordinates">GPS: {locationInfo.coordinates}</p>
                    </>
                  )}
                  {!locationLoading && locationError && (
                    <p className="photo-meta-location error">{locationError}</p>
                  )}
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
                      Chụp ảnh
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
                        Chụp lại
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
                        Lưu ảnh
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
            --height: 100%;
            --width: 100%;
          }
          .photo-capture-modal ion-backdrop {
            opacity: 1 !important;
          }
          .photo-capture-content {
            --background: #000;
            --padding-top: 0;
            --padding-bottom: 0;
            --padding-start: 0;
            --padding-end: 0;
          }
          .photo-capture-wrapper {
            display: flex;
            flex-direction: column;
            height: 100%;
            width: 100%;
            padding: 0;
            box-sizing: border-box;
            background: #000;
          }
          .photo-capture-preview {
            flex: 1;
            position: relative;
            display: block;
            background: #000;
            overflow: hidden;
            width: 100%;
            height: 100%;
          }
          .photo-capture-video {
            position: absolute !important;
            top: 0 !important;
            left: 0 !important;
            width: 100% !important;
            height: 100% !important;
            object-fit: cover !important;
            display: block !important;
            background: #000 !important;
            z-index: 1 !important;
          }
          .photo-capture-image {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            object-fit: contain;
            display: block;
            z-index: 2;
          }
          .photo-capture-loader {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 12px;
            color: #fff;
            z-index: 10;
          }
          .photo-capture-footer {
            position: relative;
            padding: 16px;
            display: flex;
            flex-direction: column;
            gap: 12px;
            color: #f1f1f1;
            background: rgba(0, 0, 0, 0.8);
            z-index: 100;
          }
          .photo-metadata {
            font-size: 14px;
            line-height: 1.6;
          }
          .photo-meta-title {
            font-weight: 700;
            font-size: 15px;
            margin-bottom: 4px;
          }
          .photo-meta-time {
            font-size: 13px;
            opacity: 0.9;
            margin-bottom: 8px;
          }
          .photo-meta-address {
            font-size: 13px;
            color: #ffd700;
            font-weight: 500;
            line-height: 1.5;
            margin-bottom: 4px;
          }
          .photo-meta-coordinates {
            font-size: 11px;
            opacity: 0.7;
            font-family: monospace;
          }
          .photo-meta-location {
            font-size: 12px;
            display: flex;
            align-items: center;
            margin-top: 4px;
          }
          .photo-meta-location.loading {
            color: #ffeb3b;
          }
          .photo-meta-location.error {
            color: #ff6b6b;
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
