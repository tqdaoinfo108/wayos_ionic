import React from 'react';
import {
  IonContent,
  IonHeader,
  IonItem,
  IonLabel,
  IonList,
  IonPage,
  IonTitle,
  IonToolbar,
} from '@ionic/react';

const NotificationsPage: React.FC = () => (
  <IonPage>
    <IonHeader>
      <IonToolbar color="primary">
        <IonTitle>Thông báo</IonTitle>
      </IonToolbar>
    </IonHeader>
    <IonContent fullscreen>
      <IonHeader collapse="condense">
        <IonToolbar>
          <IonTitle size="large">Thông báo</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonList className="ion-padding">
        <IonItem>
          <IonLabel>
            <h3>Không có thông báo</h3>
            <p>Bạn sẽ nhìn thấy thông báo mới khi có cập nhật.</p>
          </IonLabel>
        </IonItem>
      </IonList>
    </IonContent>
  </IonPage>
);

export default NotificationsPage;

