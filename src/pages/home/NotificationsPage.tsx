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
  IonIcon,
  IonText,
  IonCard,
  IonCardContent,
} from '@ionic/react';
import { notificationsOffOutline } from 'ionicons/icons';

const NotificationsPage: React.FC = () => (
  <IonPage>
    <IonHeader>
      <IonToolbar color="primary">
        <IonTitle>Thông báo</IonTitle>
      </IonToolbar>
    </IonHeader>
    <IonContent fullscreen style={{ '--background': '#f8fafc' }}>
      <IonHeader collapse="condense">
        <IonToolbar>
          <IonTitle size="large">Thông báo</IonTitle>
        </IonToolbar>
      </IonHeader>
      
      <div className="ion-padding" style={{ paddingBottom: '80px' }}>
        <IonCard style={{
          margin: '80px 0',
          boxShadow: '0 4px 12px rgba(15, 23, 42, 0.04)',
          borderRadius: '16px',
          border: '1px solid #e2e8f0'
        }}>
          <IonCardContent style={{ 
            padding: '48px 24px',
            textAlign: 'center'
          }}>
            <div style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              background: 'rgba(100, 116, 139, 0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px'
            }}>
              <IonIcon 
                icon={notificationsOffOutline} 
                style={{ 
                  fontSize: '32px', 
                  color: '#64748b' 
                }} 
              />
            </div>
            <IonText>
              <h3 style={{ 
                margin: '0 0 8px', 
                fontSize: '17px', 
                fontWeight: '600',
                color: '#0f172a'
              }}>
                Không có thông báo
              </h3>
              <p style={{ 
                margin: 0, 
                fontSize: '14px',
                color: '#64748b',
                lineHeight: '1.5'
              }}>
                Bạn sẽ nhìn thấy thông báo mới khi có cập nhật.
              </p>
            </IonText>
          </IonCardContent>
        </IonCard>
      </div>
    </IonContent>
  </IonPage>
);

export default NotificationsPage;

