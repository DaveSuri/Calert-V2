import React from 'react';

interface LoginScreenProps {
  onLogin: () => void;
}

const LoginScreen: React.FC<LoginScreenProps> = ({ onLogin }) => {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-purple-50 p-6">
      <main className="text-center">
        <div className="mb-8 flex items-center justify-center">
            <svg
              className="h-16 w-auto text-brand-primary"
              viewBox="0 0 24 24"
              fill="currentColor"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11zM7 10h5v5H7v-5z" />
            </svg>
            <h1 className="ml-4 text-6xl font-extrabold text-gray-800 tracking-tight">Calert</h1>
        </div>
        <p className="mx-auto mt-4 max-w-xl text-xl text-gray-600">
          Stop missing meetings. Calert provides unmissable, full-screen notifications for your Google Calendar events.
        </p>
        <div className="mt-12">
          <button
            onClick={onLogin}
            className="inline-flex items-center rounded-lg bg-brand-primary px-8 py-4 text-lg font-semibold text-white shadow-lg transition-transform duration-200 hover:scale-105 hover:bg-brand-secondary focus:outline-none focus:ring-4 focus:ring-indigo-300"
          >
            <svg className="mr-3 h-6 w-6" aria-hidden="true" focusable="false" data-prefix="fab" data-icon="google" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 488 512">
              <path fill="currentColor" d="M488 261.8C488 403.3 381.5 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 126 23.4 172.9 61.9l-69.8 69.8C320.5 112.3 286.9 96 248 96c-88.8 0-160.1 71.3-160.1 160s71.3 160 160.1 160c98.1 0 137.9-67.8 143.2-103.4H248v-85.3h236.1c2.3 12.7 3.9 26.9 3.9 41.4z"></path>
            </svg>
            Connect with Google Calendar
          </button>
        </div>
        <p className="mt-6 text-sm text-gray-500">
          We only request read-only access to your calendar events.
        </p>
      </main>
    </div>
  );
};

export default LoginScreen;