import { Redirect, Route } from 'react-router-dom';
import {
  IonApp,
  IonIcon,
  IonLabel,
  IonRouterOutlet,
  IonTabBar,
  IonTabButton,
  IonTabs,
  setupIonicReact,
} from '@ionic/react';
import { IonReactRouter } from '@ionic/react-router';
import {
  appsOutline,
  homeOutline,
  notificationsOutline,
  personOutline,
} from 'ionicons/icons';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import LoginPage from './pages/auth/LoginPage';
import DashboardPage from './pages/home/DashboardPage';
import ApplicationsPage from './pages/home/ApplicationsPage';
import NotificationsPage from './pages/home/NotificationsPage';
import ProfilePage from './pages/home/ProfilePage';
import RequestsPage from './pages/requests/RequestsPage';
import WorkflowDetailPage from './pages/requests/WorkflowDetailPage';
import ProcessDetailPage from './pages/requests/ProcessDetailPage';
import ReportsPage from './pages/reports/ReportsPage';
import ImportMaterialPage from './pages/materials/ImportMaterialPage';
import ExportMaterialPage from './pages/materials/ExportMaterialPage';
import SupportPage from './pages/support/SupportPage';

/* Core CSS required for Ionic components to work properly */
import '@ionic/react/css/core.css';

/* Basic CSS for apps built with Ionic */
import '@ionic/react/css/normalize.css';
import '@ionic/react/css/structure.css';
import '@ionic/react/css/typography.css';

/* Optional CSS utils that can be commented out */
import '@ionic/react/css/padding.css';
import '@ionic/react/css/float-elements.css';
import '@ionic/react/css/text-alignment.css';
import '@ionic/react/css/text-transformation.css';
import '@ionic/react/css/flex-utils.css';
import '@ionic/react/css/display.css';

/* Ionic Dark Mode */
import '@ionic/react/css/palettes/dark.system.css';

/* Theme variables */
import './theme/variables.css';

setupIonicReact();

const Tabs: React.FC = () => (
  <IonTabs>
    <IonRouterOutlet>
      <Route exact path="/app/dashboard" component={DashboardPage} />
      <Route exact path="/app/applications" component={ApplicationsPage} />
      <Route exact path="/app/notifications" component={NotificationsPage} />
      <Route exact path="/app/profile" component={ProfilePage} />
      <Route exact path="/app/requests" component={RequestsPage} />
      <Route
        exact
        path="/app/requests/workflow/:workflowId/:statusId?"
        component={WorkflowDetailPage}
      />
      <Route
        exact
        path="/app/requests/process/:processId"
        component={ProcessDetailPage}
      />
      <Route exact path="/app/reports" component={ReportsPage} />
      <Route exact path="/app/import-material" component={ImportMaterialPage} />
      <Route exact path="/app/export-material" component={ExportMaterialPage} />
      <Route exact path="/app/support" component={SupportPage} />
      <Route exact path="/app">
        <Redirect to="/app/dashboard" />
      </Route>
    </IonRouterOutlet>

    <IonTabBar slot="bottom">
      <IonTabButton tab="dashboard" href="/app/dashboard">
        <IonIcon aria-hidden="true" icon={homeOutline} />
        <IonLabel>Dashboard</IonLabel>
      </IonTabButton>
      <IonTabButton tab="applications" href="/app/applications">
        <IonIcon aria-hidden="true" icon={appsOutline} />
        <IonLabel>Ứng dụng</IonLabel>
      </IonTabButton>
      <IonTabButton tab="notifications" href="/app/notifications">
        <IonIcon aria-hidden="true" icon={notificationsOutline} />
        <IonLabel>Thông báo</IonLabel>
      </IonTabButton>
      <IonTabButton tab="profile" href="/app/profile">
        <IonIcon aria-hidden="true" icon={personOutline} />
        <IonLabel>Cá nhân</IonLabel>
      </IonTabButton>
    </IonTabBar>
  </IonTabs>
);

const App: React.FC = () => (
  <IonApp>
    <AuthProvider>
      <IonReactRouter>
        <IonRouterOutlet>
          <Route exact path="/login" component={LoginPage} />
          <ProtectedRoute path="/app" component={Tabs} />
          <Route exact path="/">
            <Redirect to="/app/dashboard" />
          </Route>
        </IonRouterOutlet>
      </IonReactRouter>
    </AuthProvider>
  </IonApp>
);

export default App;

