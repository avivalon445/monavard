import React from 'react';
import { useAuth } from '@/context/AuthContext';
import { MOCK_AUTH } from '@/config/dev';
import { Navigate } from 'react-router-dom';

const DevLogin: React.FC = () => {
  const { setMockUser, isAuthenticated } = useAuth();

  // If not in mock mode, redirect to normal login
  if (!MOCK_AUTH) {
    return <Navigate to="/login" replace />;
  }

  // If already authenticated, redirect to dashboard
  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="card p-8 text-center">
          <div className="mb-6">
            <div className="w-20 h-20 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-10 h-10 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Development Mode</h1>
            <p className="text-gray-600 mb-4">
              Choose a user type to test the interface without backend authentication
            </p>
            <div className="inline-block px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm font-medium">
              Mock Authentication Enabled
            </div>
          </div>

          <div className="space-y-4">
            <button
              onClick={() => setMockUser('customer')}
              className="w-full p-6 border-2 border-primary-200 rounded-xl hover:border-primary-500 hover:bg-primary-50 transition-all group"
            >
              <div className="flex items-center space-x-4">
                <div className="w-16 h-16 bg-primary-100 rounded-xl flex items-center justify-center group-hover:bg-primary-200 transition-colors">
                  <svg className="w-8 h-8 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <div className="text-left flex-1">
                  <h3 className="text-xl font-bold text-gray-900">Login as Customer</h3>
                  <p className="text-sm text-gray-600">Test customer dashboard and features</p>
                </div>
                <svg className="w-6 h-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </button>

            <button
              onClick={() => setMockUser('supplier')}
              className="w-full p-6 border-2 border-green-200 rounded-xl hover:border-green-500 hover:bg-green-50 transition-all group"
            >
              <div className="flex items-center space-x-4">
                <div className="w-16 h-16 bg-green-100 rounded-xl flex items-center justify-center group-hover:bg-green-200 transition-colors">
                  <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
                <div className="text-left flex-1">
                  <h3 className="text-xl font-bold text-gray-900">Login as Supplier</h3>
                  <p className="text-sm text-gray-600">Test supplier dashboard and features</p>
                </div>
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </button>
          </div>

          <div className="mt-8 p-4 bg-blue-50 rounded-lg">
            <h4 className="font-semibold text-blue-900 mb-2">💡 Development Tips</h4>
            <ul className="text-sm text-blue-800 text-left space-y-1">
              <li>• No backend required for testing</li>
              <li>• All data is mocked locally</li>
              <li>• Switch users anytime by logging out</li>
              <li>• Set MOCK_AUTH=false in dev.ts for real API</li>
            </ul>
          </div>

          <div className="mt-6">
            <a href="/" className="text-sm text-gray-600 hover:text-gray-900">
              ← Back to Home
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DevLogin;

