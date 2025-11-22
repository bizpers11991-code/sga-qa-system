import React from 'react';
import useAuth from '../hooks/useAuth';

const Login: React.FC = () => {
  const { login } = useAuth();

  return (
    <div className="flex items-center justify-center h-screen bg-gray-100">
      <div className="text-center">
        <img className="h-16 w-auto mx-auto mb-4" src="/assets/sga-logo.png" alt="SGA" />
        <h1 className="text-2xl font-bold mb-4">SGA Quality Assurance</h1>
        <p className="text-gray-600 mb-8">Please log in to continue.</p>
        <button
          onClick={() => login()}
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
        >
          Log In
        </button>
      </div>
    </div>
  );
};

export default Login;