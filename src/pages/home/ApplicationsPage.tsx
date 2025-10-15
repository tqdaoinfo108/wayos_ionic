import React, { useState } from 'react';
import type { CSSProperties } from 'react';
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
  IonTitle,
  IonToolbar,
} from '@ionic/react';
import {
  appsOutline,
  callOutline,
  documentTextOutline,
  helpCircleOutline,
  logOutOutline,
  swapHorizontalOutline,
} from 'ionicons/icons';
import { useHistory } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import './ApplicationsPage.css';

interface QuickAction {
  title: string;
  subtitle: string;
  accentColor: string;
  accentSurface: string;
  path: string;
  icon: string;
}

const quickActions: QuickAction[] = [
  {
    title: 'Quy trình',
    subtitle: 'Theo dõi và xử lý yêu cầu nhanh chóng',
    accentColor: '#2563eb',
    accentSurface: 'rgba(37, 99, 235, 0.14)',
    path: '/app/requests',
    icon: documentTextOutline,
  },
  {
    title: 'Báo cáo',
    subtitle: 'Theo dõi chỉ số hoạt động trực quan',
    accentColor: '#0ea5e9',
    accentSurface: 'rgba(14, 165, 233, 0.16)',
    path: '/app/reports',
    icon: appsOutline,
  },
  {
    title: 'Nhập vật tư',
    subtitle: 'Tạo và quản lý phiếu nhập kho',
    accentColor: '#10b981',
    accentSurface: 'rgba(16, 185, 129, 0.16)',
    path: '/app/import-material',
    icon: swapHorizontalOutline,
  },
  {
    title: 'Xuất vật tư',
    subtitle: 'Tự động hóa quy trình giao hàng',
    accentColor: '#f97316',
    accentSurface: 'rgba(249, 115, 22, 0.16)',
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
      <IonContent fullscreen className="applications-page ion-padding">
        <IonHeader collapse="condense">
          <IonToolbar>
            <IonTitle size="large">Ứng dụng</IonTitle>
          </IonToolbar>
        </IonHeader>

        <div className="page-hero">
          <div>
            <h1>Ứng dụng WayOS</h1>
            <p>Lựa chọn tác vụ để bắt đầu làm việc hiệu quả và đồng nhất.</p>
          </div>
        </div>

        <section className="section">
          <div className="section-header">
            <h2>Chức năng chính</h2>
            <p>Truy cập nhanh các quy trình quản lý thường dùng.</p>
          </div>
          <IonGrid className="quick-actions-grid">
            <IonRow>
              {quickActions.map((action) => (
                <IonCol size="6" sizeMd="6" sizeLg="3" key={action.title}>
                  <IonCard
                    button
                    className="quick-action-card"
                    style={
                      {
                        '--accent-color': action.accentColor,
                        '--accent-surface': action.accentSurface,
                      } as CSSProperties
                    }
                    onClick={() => history.push(action.path)}
                  >
                    <IonCardContent>
                      <div className="icon-wrapper">
                        <IonIcon icon={action.icon} />
                      </div>
                      <h3>{action.title}</h3>
                      <p>{action.subtitle}</p>
                    </IonCardContent>
                  </IonCard>
                </IonCol>
              ))}
            </IonRow>
          </IonGrid>
        </section>

        <section className="section">
          <div className="section-header">
            <h2>Tiện ích hỗ trợ</h2>
            <p>Tìm kiếm tài liệu và thông tin liên hệ cần thiết.</p>
          </div>
          <IonList inset className="support-list">
            <IonItem button detail onClick={() => history.push('/app/support')}>
              <IonIcon icon={helpCircleOutline} slot="start" />
              <IonLabel>
                <h3>Hướng dẫn sử dụng</h3>
                <p>Bộ tài liệu và video thông tin</p>
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

        <section className="section">
          <IonCard button className="logout-card" onClick={() => setConfirmLogout(true)}>
            <IonCardContent className="ion-text-center">
              <div className="logout-icon">
                <IonIcon icon={logOutOutline} />
              </div>
              <h3>Đăng xuất</h3>
              <p>Thoát khỏi ứng dụng WayOS</p>
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
