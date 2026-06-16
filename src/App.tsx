import { AppProvider, useApp } from './lib/store';
import Layout from './components/Layout';
import LoginScreen from './components/LoginScreen';
import Dashboard from './components/Dashboard';
import Customers from './components/Customers';
import Contacts from './components/Contacts';
import FollowUps from './components/FollowUps';
import Problems from './components/Problems';
import Resources from './components/Resources';
import Reminders from './components/Reminders';
import Reports from './components/Reports';
import DataExport from './components/DataExport';
import Settings from './components/Settings';
import Trust from './components/Trust';

function AppContent() {
  const { isAuthenticated, currentPage, notification, clearNotification } = useApp();

  if (!isAuthenticated) {
    return <LoginScreen />;
  }

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard': return <Dashboard />;
      case 'customers': return <Customers />;
      case 'customer-detail': return <Customers />;
      case 'contacts': return <Contacts />;
      case 'followups': return <FollowUps />;
      case 'problems': return <Problems />;
      case 'resources': return <Resources />;
      case 'reminders': return <Reminders />;
      case 'reports': return <Reports />;
      case 'export': return <DataExport />;
      case 'settings': return <Settings />;
      case 'trust': return <Trust />;
      default: return <Dashboard />;
    }
  };

  return (
    <Layout>
      {renderPage()}

      {/* Notification toast */}
      {notification && (
        <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-3 rounded-xl shadow-lg text-sm font-medium animate-slide-up ${
          notification.type === 'success' ? 'bg-emerald-600 text-white' :
          notification.type === 'error' ? 'bg-red-600 text-white' :
          'bg-blue-600 text-white'
        }`} onClick={clearNotification}>
          <span>{notification.message}</span>
        </div>
      )}
    </Layout>
  );
}

function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}

export default App;
