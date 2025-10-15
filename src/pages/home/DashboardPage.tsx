import React from 'react';
import { 
  IonContent, 
  IonHeader, 
  IonPage, 
  IonTitle, 
  IonToolbar,
  IonCard,
  IonCardContent,
  IonIcon,
  IonText
} from '@ionic/react';
import { 
  statsChartOutline, 
  checkmarkCircleOutline,
  timeOutline,
  trendingUpOutline 
} from 'ionicons/icons';

const DashboardPage: React.FC = () => {
  const stats = [
    { 
      title: 'Tổng yêu cầu', 
      value: '0', 
      icon: statsChartOutline, 
      color: '#2563eb',
      bgColor: 'rgba(37, 99, 235, 0.1)' 
    },
    { 
      title: 'Đã hoàn thành', 
      value: '0', 
      icon: checkmarkCircleOutline, 
      color: '#10b981',
      bgColor: 'rgba(16, 185, 129, 0.1)' 
    },
    { 
      title: 'Đang xử lý', 
      value: '0', 
      icon: timeOutline, 
      color: '#f59e0b',
      bgColor: 'rgba(245, 158, 11, 0.1)' 
    },
    { 
      title: 'Hiệu suất', 
      value: '0%', 
      icon: trendingUpOutline, 
      color: '#8b5cf6',
      bgColor: 'rgba(139, 92, 246, 0.1)' 
    },
  ];

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar color="primary">
          <IonTitle>Dashboard</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent fullscreen className="ion-padding" style={{ '--background': '#f8fafc' }}>
        <IonHeader collapse="condense">
          <IonToolbar>
            <IonTitle size="large">Dashboard</IonTitle>
          </IonToolbar>
        </IonHeader>

        <div style={{ paddingBottom: '80px' }}>
          <div style={{ 
            background: 'linear-gradient(135deg, #e8f1ff 0%, #f8fbff 100%)',
            borderRadius: '16px',
            padding: '24px 20px',
            marginBottom: '24px',
            boxShadow: '0 4px 12px rgba(15, 23, 42, 0.04)'
          }}>
            <IonText>
              <h1 style={{ 
                fontSize: '22px', 
                fontWeight: '700', 
                margin: '0 0 8px',
                color: '#0f172a'
              }}>
                Chào mừng quay trở lại
              </h1>
              <p style={{ 
                margin: '0',
                color: '#475569',
                fontSize: '14px'
              }}>
                Theo dõi hoạt động và hiệu suất công việc của bạn
              </p>
            </IonText>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
            gap: '12px',
            marginBottom: '24px'
          }}>
            {stats.map((stat, index) => (
              <IonCard 
                key={index}
                style={{
                  margin: 0,
                  boxShadow: '0 4px 12px rgba(15, 23, 42, 0.04)',
                  borderRadius: '16px',
                  border: '1px solid #e2e8f0'
                }}
              >
                <IonCardContent style={{ padding: '20px' }}>
                  <div style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '12px',
                    background: stat.bgColor,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: '12px'
                  }}>
                    <IonIcon 
                      icon={stat.icon} 
                      style={{ 
                        fontSize: '20px', 
                        color: stat.color 
                      }} 
                    />
                  </div>
                  <IonText>
                    <p style={{ 
                      margin: '0 0 4px', 
                      fontSize: '13px', 
                      color: '#64748b' 
                    }}>
                      {stat.title}
                    </p>
                    <h2 style={{ 
                      margin: 0, 
                      fontSize: '24px', 
                      fontWeight: '700',
                      color: '#0f172a'
                    }}>
                      {stat.value}
                    </h2>
                  </IonText>
                </IonCardContent>
              </IonCard>
            ))}
          </div>

          <IonCard style={{
            margin: 0,
            boxShadow: '0 4px 12px rgba(15, 23, 42, 0.04)',
            borderRadius: '16px',
            border: '1px solid #e2e8f0'
          }}>
            <IonCardContent style={{ padding: '24px' }}>
              <IonText color="medium">
                <p style={{ margin: 0, textAlign: 'center' }}>
                  Không có dữ liệu để hiển thị
                </p>
              </IonText>
            </IonCardContent>
          </IonCard>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default DashboardPage;


