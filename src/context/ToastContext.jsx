import React, { createContext, useContext, useState, useCallback } from 'react';

const ToastContext = createContext();

export function ToastProvider({ children }) {
  const [toast, setToast] = useState(null);

  const showToast = useCallback((message, type = 'success') => {
    setToast({ message, type, id: Date.now() });
    // Auto hide after 4 seconds
    setTimeout(() => {
      setToast(null);
    }, 4000);
  }, []);

  return (
    <ToastContext.Provider value={{ toast, showToast }}>
      {children}
      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[9999]">
          <div className={`flex items-center gap-3 px-4 py-3 rounded-lg border shadow-lg backdrop-blur-sm ${
            toast.type === 'success'
              ? 'bg-green-900/70 border-green-500/30 text-green-100'
              : 'bg-red-900/70 border-red-500/30 text-red-100'
          }`}>
            {toast.type === 'success' ? (
              <svg className="w-5 h-5 text-green-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 6L9 17l-5-5" />
              </svg>
            ) : (
              <svg className="w-5 h-5 text-red-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            )}
            <div className="flex flex-col">
              <span className="font-bold text-sm">{toast.message}</span>
              {toast.type === 'success' && (
                <span className="text-xs opacity-60">Ad-free streaming activated</span>
              )}
            </div>
          </div>
        </div>
      )}
      <style>{`
        @keyframes slide-up {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-slide-up {
          animation: slide-up 0.2s ease-out forwards;
        }
      `}</style>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}
