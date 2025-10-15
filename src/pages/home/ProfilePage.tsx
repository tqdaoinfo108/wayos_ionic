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
  IonAvatar,
  IonIcon,
  IonCard,
  IonCardContent,
} from '@ionic/react';
import { 
  personCircleOutline, 
  businessOutline, 
  idCardOutline,
  briefcaseOutline 
} from 'ionicons/icons';
import { useAuth } from '../../context/AuthContext';

const ProfilePage: React.FC = () => {
  const { user, logout } = useAuth();

  const infoItems = [
    { 
      label: 'Mã nhân viên', 
      value: user?.staffCode, 
      icon: idCardOutline,
      color: '#2563eb' 
    },
    { 
      label: 'Họ tên', 
      value: user?.staffFullName, 
      icon: personCircleOutline,
      color: '#10b981' 
    },
    { 
      label: 'Đơn vị', 
      value: user?.departmentName, 
      icon: briefcaseOutline,
      color: '#f59e0b' 
    },
    { 
      label: 'Công ty', 
      value: user?.companyName, 
      icon: businessOutline,
      color: '#8b5cf6' 
    },
  ].filter((item) => item.value);

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar color="primary">
          <IonTitle>Cá nhân</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent fullscreen style={{ '--background': '#f8fafc' }}>
        <IonHeader collapse="condense">
          <IonToolbar>
            <IonTitle size="large">Cá nhân</IonTitle>
          </IonToolbar>
        </IonHeader>

        <div className="ion-padding" style={{ paddingBottom: '80px' }}>
          <IonCard style={{
            margin: '0 0 24px',
            boxShadow: '0 4px 12px rgba(15, 23, 42, 0.04)',
            borderRadius: '16px',
            border: '1px solid #e2e8f0',
            background: 'linear-gradient(135deg, #e8f1ff 0%, #f8fbff 100%)'
          }}>
            <IonCardContent style={{ padding: '32px 24px', textAlign: 'center' }}>
              <div style={{
                width: '80px',
                height: '80px',
                borderRadius: '50%',
                background: 'rgba(37, 99, 235, 0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px',
                border: '3px solid white',
                boxShadow: '0 4px 12px rgba(37, 99, 235, 0.2)'
              }}>
                <IonIcon 
                  icon={personCircleOutline} 
                  style={{ 
                    fontSize: '48px', 
                    color: '#2563eb' 
                  }} 
                />
              </div>
              <IonText>
                <h2 style={{ 
                  margin: '0 0 4px', 
                  fontSize: '20px', 
                  fontWeight: '700',
                  color: '#0f172a'
                }}>
                  {user?.staffFullName || 'Người dùng'}
                </h2>
                <p style={{ 
                  margin: 0, 
                  fontSize: '14px',
                  color: '#475569'
                }}>
                  {user?.departmentName || 'Chưa có thông tin'}
                </p>
              </IonText>
            </IonCardContent>
          </IonCard>

          <div style={{ marginBottom: '16px' }}>
            <IonText>
              <h3 style={{ 
                margin: '0 0 12px 4px', 
                fontSize: '17px',
                fontWeight: '600',
                color: '#0f172a',
                letterSpacing: '-0.01em'
              }}>
                Thông tin tài khoản
              </h3>
            </IonText>
          </div>

          <IonList 
            inset 
            style={{
              borderRadius: '16px',
              overflow: 'hidden',
              boxShadow: '0 4px 12px rgba(15, 23, 42, 0.04)',
              border: '1px solid #e2e8f0',
              marginBottom: '24px'
            }}
          >
            {infoItems.length === 0 ? (
              <IonItem style={{ '--background': '#ffffff' }}>
                <IonLabel>
                  <p style={{ 
                    textAlign: 'center', 
                    padding: '20px 0',
                    color: '#64748b'
                  }}>
                    Không có thông tin người dùng.
                  </p>
                </IonLabel>
              </IonItem>
            ) : (
              infoItems.map((item, index) => (
                <IonItem 
                  key={item.label}
                  style={{ 
                    '--background': '#ffffff',
                    '--border-color': '#e2e8f0',
                    '--padding-start': '16px',
                    '--inner-padding-end': '16px',
                    '--min-height': '68px'
                  }}
                  lines={index < infoItems.length - 1 ? 'full' : 'none'}
                >
                  <div style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '12px',
                    background: `${item.color}15`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginRight: '16px'
                  }}>
                    <IonIcon 
                      icon={item.icon} 
                      style={{ 
                        fontSize: '20px', 
                        color: item.color 
                      }} 
                    />
                  </div>
                  <IonLabel>
                    <h3 style={{ 
                      margin: '0 0 4px',
                      fontSize: '13px',
                      color: '#64748b',
                      fontWeight: '500'
                    }}>
                      {item.label}
                    </h3>
                    <p style={{ 
                      margin: 0,
                      fontSize: '15px',
                      color: '#0f172a',
                      fontWeight: '600'
                    }}>
                      {item.value}
                    </p>
                  </IonLabel>
                </IonItem>
              ))
            )}
          </IonList>

          <IonButton
            expand="block"
            color="danger"
            onClick={logout}
            style={{
              '--border-radius': '12px',
              height: '48px',
              fontSize: '15px',
              fontWeight: '600'
            }}
          >
            Đăng xuất
          </IonButton>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default ProfilePage;

