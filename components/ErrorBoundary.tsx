import React from 'react';
import { ErrorBoundary as ReactErrorBoundary, FallbackProps } from 'react-error-boundary';
import { AlertTriangle, RefreshCcw, RotateCcw } from 'lucide-react';
import { STORAGE_KEYS } from '../constants';

const ErrorFallback: React.FC<FallbackProps> = () => {
  const handleReload = () => {
    window.location.reload();
  };

  const handleResetData = () => {
    try {
      const keysToDelete = Object.keys(localStorage).filter((key) => key.startsWith(STORAGE_KEYS.PREFIX));
      keysToDelete.forEach((key) => localStorage.removeItem(key));
    } catch (error) {
      console.error('Could not clear saved VisaTax data.', error);
    }
    window.location.reload();
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex items-center justify-center px-4">
      <div className="max-w-lg w-full bg-white border border-slate-200 rounded-2xl shadow-lg p-6 sm:p-8">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-lg bg-rose-100 text-rose-600 shrink-0">
            <AlertTriangle size={20} />
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-900">Something went wrong</h1>
            <p className="text-sm text-slate-600 mt-1">
              The calculator hit an unexpected error. Your browser may recover by reloading.
            </p>
          </div>
        </div>

        <div className="mt-5 p-4 rounded-xl bg-blue-50 border border-blue-100">
          <p className="text-xs text-blue-800">
            If the issue continues, reset saved local data and retry.
          </p>
        </div>

        <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-3">
          <button
            onClick={handleReload}
            className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-medium transition-colors"
          >
            <RefreshCcw size={16} />
            Reload App
          </button>
          <button
            onClick={handleResetData}
            className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium transition-colors"
          >
            <RotateCcw size={16} />
            Reset Saved Data
          </button>
        </div>
      </div>
    </div>
  );
};

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

export const ErrorBoundary: React.FC<ErrorBoundaryProps> = ({ children }) => {
  return (
    <ReactErrorBoundary
      FallbackComponent={ErrorFallback}
      onError={(error, info) => {
        console.error('VisaTax crashed with an unexpected runtime error.', error, info);
      }}
    >
      {children}
    </ReactErrorBoundary>
  );
};
