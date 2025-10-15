import React, { useEffect, useMemo, useState } from 'react';
import {
  IonButton,
  IonCard,
  IonCardContent,
  IonContent,
  IonHeader,
  IonIcon,
  IonImg,
  IonInput,
  IonItem,
  IonLabel,
  IonLoading,
  IonPage,
  IonText,
  IonTitle,
  IonToast,
  IonToolbar,
} from '@ionic/react';
import { eyeOffOutline, eyeOutline, lockClosedOutline, personOutline } from 'ionicons/icons';
import { useHistory } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const LoginPage: React.FC = () => {
  const history = useHistory();
  const { login, loading, error, token } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [successToast, setSuccessToast] = useState(false);
  const [errorToast, setErrorToast] = useState(false);

  useEffect(() => {
    if (token) {
      setSuccessToast(true);
      history.replace('/app/dashboard');
    }
  }, [token, history]);

  useEffect(() => {
    if (error) {
      setErrorToast(true);
    }
  }, [error]);

  const logoSrc = useMemo(() => '/icons/icon-192x192.png', []);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError(null);

    if (!username.trim() || !password.trim()) {
      setFormError('Vui lòng nhập tên đăng nhập và mật khẩu.');
      setErrorToast(true);
      return;
    }

    try {
      await login(username.trim(), password.trim());
    } catch (err) {
      if (err instanceof Error) {
        setFormError(err.message);
      } else {
        setFormError('Không thể đăng nhập, vui lòng thử lại.');
      }
      setErrorToast(true);
    }
  };

  return (
    <IonPage>
      <IonHeader translucent>
        <IonToolbar>
          <IonTitle className="ion-text-center">WayOS</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent fullscreen className="ion-padding">
        <form onSubmit={handleSubmit}>
          <IonCard>
            <IonCardContent>
              <div className="ion-text-center ion-margin-bottom">
                <IonImg
                  src={logoSrc}
                  alt="WayOS logo"
                  style={{ width: 96, height: 96, margin: '0 auto' }}
                />
              </div>
              <IonText color="primary">
                <h2 className="ion-text-center">Đăng nhập</h2>
              </IonText>
              <IonItem className="ion-margin-top">
                <IonIcon icon={personOutline} slot="start" />
                <IonLabel position="stacked">Tài khoản</IonLabel>
                <IonInput
                  value={username}
                  onIonChange={(event) => setUsername(event.detail.value ?? '')}
                  autocomplete="username"
                  inputMode="text"
                  placeholder="Nhập tên đăng nhập"
                  required
                />
              </IonItem>
              <IonItem className="ion-margin-top">
                <IonIcon icon={lockClosedOutline} slot="start" />
                <IonLabel position="stacked">Mật khẩu</IonLabel>
                <IonInput
                  value={password}
                  onIonChange={(event) => setPassword(event.detail.value ?? '')}
                  type={showPassword ? 'text' : 'password'}
                  autocomplete="current-password"
                  placeholder="Nhập mật khẩu"
                  required
                />
                <IonIcon
                  icon={showPassword ? eyeOffOutline : eyeOutline}
                  slot="end"
                  aria-hidden="true"
                  onClick={() => setShowPassword((prev) => !prev)}
                  style={{ cursor: 'pointer' }}
                />
              </IonItem>
              {(formError || error) && (
                <IonText color="danger">
                  <p className="ion-text-center ion-margin-top">
                    {formError ?? error}
                  </p>
                </IonText>
              )}
              <IonButton
                type="submit"
                expand="block"
                className="ion-margin-top"
                disabled={loading}
              >
                {loading ? 'Đang đăng nhập…' : 'Đăng nhập'}
              </IonButton>
            </IonCardContent>
          </IonCard>
        </form>
      </IonContent>
      <IonLoading isOpen={loading} message="Đang xác thực..." translucent />
      <IonToast
        isOpen={successToast}
        message="Đăng nhập thành công."
        duration={1500}
        color="success"
        position="top"
        onDidDismiss={() => setSuccessToast(false)}
      />
      <IonToast
        isOpen={errorToast}
        message={formError ?? error ?? 'Đăng nhập thất bại.'}
        duration={2000}
        color="danger"
        position="top"
        onDidDismiss={() => setErrorToast(false)}
      />
    </IonPage>
  );
};

export default LoginPage;

