import { useApp } from '../context/AppContext';

/**
 * Custom hook for toast notifications
 * Provides convenient methods for showing different types of toasts
 * Uses the global AppContext for state management
 */
export const useToast = () => {
  const { 
    addToast, 
    removeToast, 
    showSuccess, 
    showError, 
    showWarning, 
    showInfo,
    state 
  } = useApp();

  const { toasts } = state;

  const clearAll = () => {
    toasts.forEach(toast => removeToast(toast.id));
  };

  return {
    // Basic toast functions
    addToast,
    removeToast,
    
    // Convenience functions (with shorter names)
    success: showSuccess,
    error: showError,
    warning: showWarning,
    info: showInfo,
    
    // Legacy names for compatibility
    showSuccess,
    showError,
    showWarning,
    showInfo,
    
    // State
    toasts,
    
    // Utility functions
    clearAll,
    hasToasts: toasts.length > 0
  };
};

export default useToast;
