import React, { useState } from 'react';
import useAuth from '../hooks/useAuth';

const Login: React.FC = () => {
  const { login } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('[Login] Initiating MSAL login...');
      await login();
      console.log('[Login] Login successful');
    } catch (err: any) {
      console.error('[Login] Login failed:', err);
      setError(err.message || 'Login failed. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center h-screen bg-gray-100">
      <div className="text-center max-w-md p-8">
        <img className="h-20 w-auto mx-auto mb-6" src="/assets/sga-logo.png" alt="SGA" />
        <h1 className="text-3xl font-bold mb-4 text-gray-800">SGA Quality Assurance</h1>
        <p className="text-gray-600 mb-8">Please log in with your Microsoft account to continue.</p>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            <p className="text-sm">{error}</p>
          </div>
        )}

        <button
          onClick={handleLogin}
          disabled={loading}
          className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg shadow-md transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Logging in...' : 'Log In with Microsoft'}
        </button>

        <p className="text-xs text-gray-500 mt-4">
          This application requires a valid SGA Microsoft 365 account
        </p>
      </div>
    </div>
  );
};

export default Login;