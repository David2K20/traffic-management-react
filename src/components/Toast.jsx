import React, { useEffect, useState } from 'react';
import { useApp } from '../context/AppContext';
import './Toast.css';

const Toast = ({ toast }) => {
  const { removeToast } = useApp();
  const [isVisible, setIsVisible] = useState(false);
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    // Trigger entrance animation
    const timer = setTimeout(() => setIsVisible(true), 10);
    return () => clearTimeout(timer);
  }, []);

  const handleClose = () => {
    setIsExiting(true);
    setTimeout(() => {
      removeToast(toast.id);
    }, 300); // Match exit animation duration
  };

  // Get icon and colors based on toast type
  const getToastConfig = (type) => {
    const configs = {
      success: {
        icon: '✓',
        bgClass: 'toast-success',
        iconClass: 'toast-icon-success'
      },
      error: {
        icon: '✕',
        bgClass: 'toast-error',
        iconClass: 'toast-icon-error'
      },
      warning: {
        icon: '⚠',
        bgClass: 'toast-warning',
        iconClass: 'toast-icon-warning'
      },
      info: {
        icon: 'ℹ',
        bgClass: 'toast-info',
        iconClass: 'toast-icon-info'
      }
    };
    return configs[type] || configs.info;
  };

  const config = getToastConfig(toast.type);

  return (
    <div 
      className={`toast ${config.bgClass} ${isVisible ? 'toast-show' : ''} ${isExiting ? 'toast-exit' : ''}`}
      role="alert"
      aria-live="polite"
    >
      <div className="toast-content">
        <div className={`toast-icon ${config.iconClass}`}>
          {config.icon}
        </div>
        <div className="toast-message">
          {toast.message}
        </div>
        <button 
          className="toast-close"
          onClick={handleClose}
          aria-label="Close notification"
          type="button"
        >
          ×
        </button>
      </div>
      <div 
        className="toast-progress"
        style={{
          animationDuration: `${toast.duration}ms`
        }}
      />
    </div>
  );
};

export default Toast;
