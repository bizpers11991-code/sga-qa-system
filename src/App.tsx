import { MsalProvider } from '@azure/msal-react';
import { msalInstance } from './auth/msalConfig';
import Login from './components/Login';
import useAuth from './hooks/useAuth';

function AppContent() {
  const { isAuthenticated, user } = useAuth();

  if (!isAuthenticated) {
    return <Login />;
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-amber-600 text-white p-4">
        <div className="container mx-auto">
          <h1 className="text-2xl font-bold">SGA QA System</h1>
          {user && <p className="text-sm">Welcome, {user.name || user.username}</p>}
        </div>
      </header>

      <main className="container mx-auto p-4">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Quality Assurance Dashboard</h2>
          <p className="text-gray-600">
            Enterprise quality assurance application for Safety Grooving Australia.
          </p>
          <p className="text-gray-600 mt-2">
            Integrated with Microsoft 365 ecosystem (Dataverse, SharePoint, Entra ID).
          </p>
        </div>
      </main>
    </div>
  );
}

function App() {
  return (
    <MsalProvider instance={msalInstance}>
      <AppContent />
    </MsalProvider>
  );
}

export default App;
