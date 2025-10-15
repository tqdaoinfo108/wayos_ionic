import React from 'react';
import { Redirect, Route, type RouteProps } from 'react-router-dom';
import { IonContent, IonPage, IonSpinner } from '@ionic/react';
import { useAuth } from '../context/AuthContext';

interface ProtectedRouteProps extends RouteProps {
  component: React.ComponentType<any>;
}

const LoadingScreen: React.FC = () => (
  <IonPage>
    <IonContent className="ion-padding ion-text-center">
      <IonSpinner name="crescent" />
    </IonContent>
  </IonPage>
);

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  component: Component,
  ...rest
}) => {
  const { token, initialized } = useAuth();

  return (
    <Route
      {...rest}
      render={(props) => {
        if (!initialized) {
          return <LoadingScreen />;
        }

        if (!token) {
          return <Redirect to="/login" />;
        }

        return <Component {...props} />;
      }}
    />
  );
};

