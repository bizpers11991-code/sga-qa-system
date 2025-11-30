import { MsalProvider } from '@azure/msal-react';
import { BrowserRouter as Router } from 'react-router-dom';
import { msalInstance } from './auth/msalConfig';
import Login from './components/Login';
import useAuth from './hooks/useAuth';
import { RoutesComponent } from './routing/routes';
import { AppShell } from './components/layout';
import { useEffect } from 'react';
import { WeatherProvider } from './context/WeatherContext';

function AppContent() {
  const { isAuthenticated, user } = useAuth();

  useEffect(() => {
    console.log('[App] Authentication status:', isAuthenticated);
    console.log('[App] Current user:', user);
  }, [isAuthenticated, user]);

  if (!isAuthenticated) {
    console.log('[App] User not authenticated, showing login');
    return <Login />;
  }

  console.log('[App] User authenticated, showing app shell');
  return (
    <WeatherProvider autoRefreshMinutes={15}>
      <AppShell>
        <RoutesComponent />
      </AppShell>
    </WeatherProvider>
  );
}

function App() {
  useEffect(() => {
    console.log('[App] Application initialized');
    console.log('[App] Environment:', import.meta.env.MODE);
  }, []);

  return (
    <MsalProvider instance={msalInstance}>
      <Router>
        <AppContent />
      </Router>
    </MsalProvider>
  );
}

export default App;
