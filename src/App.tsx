import { MsalProvider } from '@azure/msal-react';
import { msalInstance } from './auth/msalConfig';
import Login from './components/Login';
import useAuth from './hooks/useAuth';
import AppRouter from './routing/routes';

function AppContent() {
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <Login />;
  }

  return <AppRouter />;
}

function App() {
  return (
    <MsalProvider instance={msalInstance}>
      <AppContent />
    </MsalProvider>
  );
}

export default App;
