import React, { useState } from 'react';
import {
  IonAlert,
  IonCard,
  IonCardContent,
  IonCol,
  IonContent,
  IonGrid,
  IonHeader,
  IonIcon,
  IonItem,
  IonLabel,
  IonList,
  IonPage,
  IonRow,
  IonText,
  IonTitle,
  IonToolbar,
} from '@ionic/react';
import {
  appsOutline,
  callOutline,
  documentTextOutline,
  exitOutline,
  helpCircleOutline,
  logOutOutline,
  swapHorizontalOutline,
} from 'ionicons/icons';
import { useHistory } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

interface QuickAction {
  title: string;
  subtitle: string;
  color: string;
  path: string;
  icon: string;
}

const quickActions: QuickAction[] = [
  {
    title: 'Quy trình',
    subtitle: 'Theo dõi và xử lý yêu cầu',
    color: 'warning',
    path: '/app/requests',
    icon: documentTextOutline,
  },
  {
    title: 'Báo cáo',
    subtitle: 'Xem thống kê vật tư',
    color: 'tertiary',
    path: '/app/reports',
    icon: appsOutline,
  },
  {
    title: 'Nhập vật tư',
    subtitle: 'Ghi nhận phiếu nhập kho',
    color: 'success',
    path: '/app/import-material',
    icon: swapHorizontalOutline,
  },
  {
    title: 'Xuất vật tư',
    subtitle: 'Tạo phiếu xuất kho',
    color: 'danger',
    path: '/app/export-material',
    icon: swapHorizontalOutline,
  },
];

const ApplicationsPage: React.FC = () => {
  const history = useHistory();
  const { logout } = useAuth();
  const [confirmLogout, setConfirmLogout] = useState(false);

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar color="primary">
          <IonTitle>Ứng dụng</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent fullscreen className="ion-padding">
        <IonHeader collapse="condense">
          <IonToolbar>
            <IonTitle size="large">Ứng dụng</IonTitle>
          </IonToolbar>
        </IonHeader>

        <section>
          <IonText color="dark">
            <h2>Chức năng chính</h2>
          </IonText>
          <IonGrid>
            <IonRow>
              {quickActions.map((action) => (
                <IonCol size="12" sizeMd="6" key={action.title}>
                  <IonCard
                    button
                    color={action.color}
                    onClick={() => history.push(action.path)}
                  >
                    <IonCardContent>
                      <IonIcon icon={action.icon} size="large" />
                      <IonText color="light">
                        <h3 className="ion-margin-top ion-no-margin">{action.title}</h3>
                        <p>{action.subtitle}</p>
                      </IonText>
                    </IonCardContent>
                  </IonCard>
                </IonCol>
              ))}
            </IonRow>
          </IonGrid>
        </section>

        <section className="ion-margin-top">
          <IonText color="dark">
            <h2>Tiện ích</h2>
          </IonText>
          <IonList inset>
            <IonItem button detail onClick={() => history.push('/app/support')}>
              <IonIcon icon={helpCircleOutline} slot="start" />
              <IonLabel>
                <h3>Hỗ trợ</h3>
                <p>Hướng dẫn sử dụng</p>
              </IonLabel>
            </IonItem>
            <IonItem button detail onClick={() => history.push('/app/support')}>
              <IonIcon icon={callOutline} slot="start" />
              <IonLabel>
                <h3>Hotline</h3>
                <p>Liên hệ phòng hỗ trợ WayOS</p>
              </IonLabel>
            </IonItem>
          </IonList>
        </section>

        <section className="ion-margin-top">
          <IonCard color="light" button onClick={() => setConfirmLogout(true)}>
            <IonCardContent className="ion-text-center">
              <IonIcon icon={logOutOutline} size="large" color="danger" />
              <IonText color="danger">
                <h3 className="ion-margin-top ion-no-margin">Đăng xuất</h3>
                <p>Thoát khỏi ứng dụng</p>
              </IonText>
            </IonCardContent>
          </IonCard>
        </section>
      </IonContent>

      <IonAlert
        isOpen={confirmLogout}
        header="Đăng xuất"
        message="Bạn có chắc chắn muốn đăng xuất khỏi WayOS?"
        buttons={[
          {
            text: 'Hủy',
            role: 'cancel',
            handler: () => setConfirmLogout(false),
          },
          {
            text: 'Đăng xuất',
            role: 'destructive',
            cssClass: 'danger',
            handler: () => {
              logout();
              history.replace('/login');
            },
          },
        ]}
        onDidDismiss={() => setConfirmLogout(false)}
      />
    </IonPage>
  );
};

export default ApplicationsPage;

