import React from 'react';
import {
  IonContent,
  IonHeader,
  IonList,
  IonItem,
  IonLabel,
  IonPage,
  IonText,
  IonTitle,
  IonToolbar,
} from '@ionic/react';

const SupportPage: React.FC = () => (
  <IonPage>
    <IonHeader>
      <IonToolbar color="primary">
        <IonTitle>Hỗ trợ</IonTitle>
      </IonToolbar>
    </IonHeader>
    <IonContent fullscreen>
      <IonHeader collapse="condense">
        <IonToolbar>
          <IonTitle size="large">Hỗ trợ</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonList className="ion-padding">
        <IonItem>
          <IonLabel>
            <h3>Hướng dẫn sử dụng</h3>
            <p>Liên hệ phòng IT để được hỗ trợ chi tiết.</p>
          </IonLabel>
        </IonItem>
      </IonList>

      <IonText color="medium" className="ion-padding">
        <p>Email: support@example.com</p>
        <p>Điện thoại: 0123 456 789</p>
      </IonText>
    </IonContent>
  </IonPage>
);

export default SupportPage;

