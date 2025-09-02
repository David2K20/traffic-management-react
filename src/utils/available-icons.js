// Available icons in react-icons/fa for network/wifi/connection status
// This is a reference file to avoid import errors

// ✅ Available WiFi/Network icons:
export const AVAILABLE_ICONS = {
  // WiFi and Network
  FaWifi: 'FaWifi', // ✅ Available - WiFi signal
  FaGlobe: 'FaGlobe', // ✅ Available - Global network
  FaGlobeAmericas: 'FaGlobeAmericas', // ✅ Available - Globe 
  FaNetworkWired: 'FaNetworkWired', // ✅ Available - Wired network
  FaSignal: 'FaSignal', // ✅ Available - Signal bars
  FaRss: 'FaRss', // ✅ Available - RSS/Signal icon
  
  // Status and Error icons
  FaExclamationTriangle: 'FaExclamationTriangle', // ✅ Available - Warning
  FaExclamationCircle: 'FaExclamationCircle', // ✅ Available - Error circle
  FaCheckCircle: 'FaCheckCircle', // ✅ Available - Success
  FaTimesCircle: 'FaTimesCircle', // ✅ Available - Error/Cancel
  FaInfoCircle: 'FaInfoCircle', // ✅ Available - Info
  
  // Action icons
  FaRedo: 'FaRedo', // ✅ Available - Retry/Refresh
  FaUndo: 'FaUndo', // ✅ Available - Undo
  FaSync: 'FaSync', // ✅ Available - Sync
  FaSyncAlt: 'FaSyncAlt', // ✅ Available - Alternative sync
  FaSpinner: 'FaSpinner', // ✅ Available - Loading spinner
  
  // Other useful icons
  FaPlug: 'FaPlug', // ✅ Available - Connection/Plug
  FaLink: 'FaLink', // ✅ Available - Link/Connection
  FaUnlink: 'FaUnlink', // ✅ Available - Broken link
};

// ❌ Icons that are NOT available in react-icons/fa:
export const UNAVAILABLE_ICONS = {
  'FaWifiSlash': 'Not available - use FaExclamationCircle instead',
  'FaSignalSlash': 'Not available - use FaExclamationTriangle instead',
  'FaGlobeSlash': 'Not available - use FaTimesCircle instead',
};

// Recommended icon combinations for different states:
export const ICON_RECOMMENDATIONS = {
  online: 'FaWifi',
  offline: 'FaExclamationCircle',
  connecting: 'FaSpinner',
  error: 'FaExclamationTriangle',
  success: 'FaCheckCircle',
  retry: 'FaRedo',
  sync: 'FaSync',
  poor_connection: 'FaExclamationTriangle',
  good_connection: 'FaWifi',
};

// Usage examples:
/*
import { FaWifi, FaExclamationCircle, FaExclamationTriangle } from 'react-icons/fa';

// Instead of FaWifiSlash (not available), use:
{isOnline ? <FaWifi /> : <FaExclamationCircle />}

// For connection quality:
{connectionQuality === 'good' ? <FaWifi /> : <FaExclamationTriangle />}
*/
