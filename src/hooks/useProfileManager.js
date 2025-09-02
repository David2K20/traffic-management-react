import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';

/**
 * Hook for managing user profile loading with retry logic and caching
 */
export const useProfileManager = () => {
  const [retryCount, setRetryCount] = useState(0);
  const [isRetrying, setIsRetrying] = useState(false);
  const [lastError, setLastError] = useState(null);
  
  const maxRetries = 3;
  const retryDelays = [1000, 2000, 5000]; // Progressive delays

  const retryProfileFetch = useCallback(async (userId, forceRefresh = false) => {
    if (retryCount >= maxRetries || isRetrying) {
      console.log('Max retries reached or already retrying');
      return { success: false, error: 'Max retries exceeded' };
    }

    setIsRetrying(true);
    setRetryCount(prev => prev + 1);

    try {
      console.log(`Retrying profile fetch (attempt ${retryCount + 1}/${maxRetries})...`);
      
      // Add delay before retry
      const delay = retryDelays[retryCount] || 5000;
      await new Promise(resolve => setTimeout(resolve, delay));

      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        setLastError(error);
        throw error;
      }

      // Reset retry state on success
      setRetryCount(0);
      setLastError(null);
      
      return { success: true, profile };
    } catch (error) {
      console.error(`Profile fetch retry ${retryCount + 1} failed:`, error);
      setLastError(error);
      return { success: false, error };
    } finally {
      setIsRetrying(false);
    }
  }, [retryCount, isRetrying]);

  const resetRetryState = useCallback(() => {
    setRetryCount(0);
    setIsRetrying(false);
    setLastError(null);
  }, []);

  return {
    retryCount,
    isRetrying,
    lastError,
    maxRetries,
    canRetry: retryCount < maxRetries && !isRetrying,
    retryProfileFetch,
    resetRetryState
  };
};

export default useProfileManager;
