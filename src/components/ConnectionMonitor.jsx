import React, { useState, useEffect } from 'react';
import { FaWifi, FaExclamationTriangle, FaExclamationCircle } from 'react-icons/fa';

const ConnectionMonitor = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showOfflineMessage, setShowOfflineMessage] = useState(false);
  const [connectionQuality, setConnectionQuality] = useState('good');

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setShowOfflineMessage(false);
      testConnectionQuality();
    };

    const handleOffline = () => {
      setIsOnline(false);
      setShowOfflineMessage(true);
    };

    // Test connection quality
    const testConnectionQuality = async () => {
      try {
        const startTime = Date.now();
        const response = await fetch('/api/ping', { 
          method: 'HEAD',
          cache: 'no-cache'
        });
        const endTime = Date.now();
        const latency = endTime - startTime;

        if (latency > 2000) {
          setConnectionQuality('poor');
        } else if (latency > 1000) {
          setConnectionQuality('fair');
        } else {
          setConnectionQuality('good');
        }
      } catch (error) {
        setConnectionQuality('poor');
      }
    };

    // Initial connection quality test
    if (isOnline) {
      testConnectionQuality();
    }

    // Set up event listeners
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Test connection quality periodically
    const connectionTest = setInterval(() => {
      if (navigator.onLine) {
        testConnectionQuality();
      }
    }, 30000); // Test every 30 seconds

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(connectionTest);
    };
  }, [isOnline]);

  // Auto-hide offline message after going back online
  useEffect(() => {
    if (isOnline && showOfflineMessage) {
      const timer = setTimeout(() => {
        setShowOfflineMessage(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [isOnline, showOfflineMessage]);

  // Don't show anything if online and no message to show
  if (isOnline && !showOfflineMessage) {
    return null;
  }

  const getStatusColor = () => {
    if (!isOnline) return 'bg-red-500 text-white';
    if (connectionQuality === 'poor') return 'bg-yellow-500 text-white';
    if (connectionQuality === 'fair') return 'bg-orange-500 text-white';
    return 'bg-green-500 text-white';
  };

  const getStatusIcon = () => {
    if (!isOnline) return <FaExclamationCircle className="w-4 h-4" />;
    if (connectionQuality === 'poor' || connectionQuality === 'fair') {
      return <FaExclamationTriangle className="w-4 h-4" />;
    }
    return <FaWifi className="w-4 h-4" />;
  };

  const getStatusText = () => {
    if (!isOnline) return 'You are offline';
    if (isOnline && showOfflineMessage) return 'Connection restored';
    if (connectionQuality === 'poor') return 'Slow connection detected';
    if (connectionQuality === 'fair') return 'Connection quality is fair';
    return 'Connected';
  };

  return (
    <div className={`fixed top-0 left-0 right-0 z-50 ${getStatusColor()} px-4 py-2`}>
      <div className="flex items-center justify-center space-x-2 text-sm font-medium">
        {getStatusIcon()}
        <span>{getStatusText()}</span>
        {!isOnline && (
          <span className="text-xs opacity-90">
            - Some features may not work properly
          </span>
        )}
      </div>
    </div>
  );
};

export default ConnectionMonitor;
