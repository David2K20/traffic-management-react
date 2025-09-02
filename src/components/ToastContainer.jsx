import React from 'react';
import { useApp } from '../context/AppContext';
import Toast from './Toast';
import './ToastContainer.css';

const ToastContainer = () => {
  const { state } = useApp();
  const { toasts } = state;

  // Don't render container if no toasts
  if (!toasts || toasts.length === 0) {
    return null;
  }

  return (
    <div className="toast-container" role="region" aria-label="Notifications">
      {toasts.map((toast) => (
        <Toast key={toast.id} toast={toast} />
      ))}
    </div>
  );
};

export default ToastContainer;
