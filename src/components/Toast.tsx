import React, { useEffect } from 'react';
import { CheckmarkCircle02Icon, Cancel01Icon, InformationCircleIcon } from 'hugeicons-react';

interface ToastProps {
  message: string;
  type: 'success' | 'error' | 'info';
  onClose: () => void;
  duration?: number;
}

const Toast: React.FC<ToastProps> = ({ message, type, onClose, duration = 5000 }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const getStyles = () => {
    switch (type) {
      case 'success':
        return {
          bg: 'bg-green-600',
          icon: <CheckmarkCircle02Icon size={24} className="text-white" />
        };
      case 'error':
        return {
          bg: 'bg-red-600',
          icon: <Cancel01Icon size={24} className="text-white" />
        };
      case 'info':
        return {
          bg: 'bg-[#1a8ca5]',
          icon: <InformationCircleIcon size={24} className="text-white" />
        };
      default:
        return {
          bg: 'bg-gray-800',
          icon: <InformationCircleIcon size={24} className="text-white" />
        };
    }
  };

  const styles = getStyles();

  return (
    <div
      className={`fixed bottom-20 left-4 right-4 ${styles.bg} text-white px-4 py-3 rounded-lg shadow-lg flex items-center gap-3 z-50 animate-slide-up`}
      onClick={onClose}
    >
      {styles.icon}
      <p className="flex-1 text-sm font-medium">{message}</p>
      <button
        onClick={onClose}
        className="text-white hover:text-gray-200 transition-colors"
      >
        <Cancel01Icon size={20} />
      </button>
    </div>
  );
};

export default Toast;
