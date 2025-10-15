import React from 'react';
import {
  IonButton,
  IonContent,
  IonHeader,
  IonItem,
  IonLabel,
  IonList,
  IonPage,
  IonText,
  IonTitle,
  IonToolbar,
} from '@ionic/react';
import { useAuth } from '../../context/AuthContext';

const ProfilePage: React.FC = () => {
  const { user, logout } = useAuth();

  const infoItems = [
    { label: 'Mã nhân viên', value: user?.staffCode },
    { label: 'Họ tên', value: user?.staffFullName },
    { label: 'Đơn vị', value: user?.departmentName },
    { label: 'Công ty', value: user?.companyName },
  ].filter((item) => item.value);

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar color="primary">
          <IonTitle>Cá nhân</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent fullscreen>
        <IonHeader collapse="condense">
          <IonToolbar>
            <IonTitle size="large">Cá nhân</IonTitle>
          </IonToolbar>
        </IonHeader>

        <div className="ion-padding">
          <IonText color="medium">
            <h2>Thông tin tài khoản</h2>
          </IonText>

          <IonList inset>
            {infoItems.length === 0 ? (
              <IonItem>
                <IonLabel>Không có thông tin người dùng.</IonLabel>
              </IonItem>
            ) : (
              infoItems.map((item) => (
                <IonItem key={item.label}>
                  <IonLabel>
                    <h3>{item.label}</h3>
                    <p>{item.value}</p>
                  </IonLabel>
                </IonItem>
              ))
            )}
          </IonList>

          <IonButton
            expand="block"
            color="danger"
            className="ion-margin-top"
            onClick={logout}
          >
            Đăng xuất
          </IonButton>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default ProfilePage;

