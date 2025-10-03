import React, { useState, useEffect } from 'react';

interface ToastProps {
  message: string;
  type: 'success' | 'error' | 'info';
  onClose: () => void;
  duration?: number;
}

const Toast: React.FC<ToastProps> = ({ message, type, onClose, duration = 4000 }) => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(onClose, 300); // Allow fade out animation
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const getToastStyles = () => {
    const baseStyles = {
      position: 'fixed' as const,
      top: '20px',
      left: '50%',
      zIndex: 10001,
      padding: '16px 24px',
      borderRadius: '12px',
      color: 'white',
      fontWeight: '600',
      fontSize: '14px',
      maxWidth: '90vw',
      textAlign: 'center' as const,
      boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)',
      backdropFilter: 'blur(10px)',
      WebkitBackdropFilter: 'blur(10px)',
      border: '1px solid rgba(255, 255, 255, 0.2)',
      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
      opacity: isVisible ? 1 : 0,
      transform: isVisible ? 'translateX(-50%) translateY(0)' : 'translateX(-50%) translateY(-20px)',
    };

    switch (type) {
      case 'success':
        return {
          ...baseStyles,
          background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
        };
      case 'error':
        return {
          ...baseStyles,
          background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
        };
      case 'info':
        return {
          ...baseStyles,
          background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
        };
      default:
        return baseStyles;
    }
  };

  const getIcon = () => {
    switch (type) {
      case 'success':
        return '✅';
      case 'error':
        return '❌';
      case 'info':
        return 'ℹ️';
      default:
        return '';
    }
  };

  return (
    <div style={getToastStyles()}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <span style={{ fontSize: '16px' }}>{getIcon()}</span>
        <span>{message}</span>
        <button
          onClick={() => {
            setIsVisible(false);
            setTimeout(onClose, 300);
          }}
          style={{
            background: 'none',
            border: 'none',
            color: 'white',
            fontSize: '18px',
            cursor: 'pointer',
            padding: '0',
            marginLeft: '8px',
            opacity: 0.7,
            transition: 'opacity 0.2s',
          }}
          onMouseOver={(e) => e.currentTarget.style.opacity = '1'}
          onMouseOut={(e) => e.currentTarget.style.opacity = '0.7'}
        >
          ×
        </button>
      </div>
    </div>
  );
};

interface ToastContextType {
  showToast: (message: string, type: 'success' | 'error' | 'info', duration?: number) => void;
}

const ToastContext = React.createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Array<{ id: number; message: string; type: 'success' | 'error' | 'info'; duration?: number }>>([]);

  const showToast = (message: string, type: 'success' | 'error' | 'info', duration?: number) => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type, duration }]);
  };

  const removeToast = (id: number) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {toasts.map(toast => (
        <Toast
          key={toast.id}
          message={toast.message}
          type={toast.type}
          duration={toast.duration}
          onClose={() => removeToast(toast.id)}
        />
      ))}
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = React.useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

export default Toast;