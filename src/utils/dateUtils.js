/**
 * Date formatting utilities for consistent dd/mm/yyyy format across the app
 */

/**
 * Format a date to dd/mm/yyyy format
 * @param {Date|string|number} date - Date to format
 * @param {boolean} includeTime - Whether to include time (defaults to false)
 * @returns {string} Formatted date string
 */
export const formatDate = (date, includeTime = false) => {
  if (!date) return '';
  
  const dateObj = new Date(date);
  
  // Check if date is valid
  if (isNaN(dateObj.getTime())) {
    return '';
  }
  
  const day = dateObj.getDate().toString().padStart(2, '0');
  const month = (dateObj.getMonth() + 1).toString().padStart(2, '0');
  const year = dateObj.getFullYear();
  
  const formattedDate = `${day}/${month}/${year}`;
  
  if (includeTime) {
    const hours = dateObj.getHours().toString().padStart(2, '0');
    const minutes = dateObj.getMinutes().toString().padStart(2, '0');
    return `${formattedDate} ${hours}:${minutes}`;
  }
  
  return formattedDate;
};

/**
 * Format a date for time display only
 * @param {Date|string|number} date - Date to format
 * @returns {string} Formatted time string (HH:MM)
 */
export const formatTime = (date) => {
  if (!date) return '';
  
  const dateObj = new Date(date);
  
  if (isNaN(dateObj.getTime())) {
    return '';
  }
  
  const hours = dateObj.getHours().toString().padStart(2, '0');
  const minutes = dateObj.getMinutes().toString().padStart(2, '0');
  
  return `${hours}:${minutes}`;
};

/**
 * Format a date for datetime-local input
 * @param {Date|string|number} date - Date to format
 * @returns {string} Formatted datetime-local string
 */
export const formatDateForInput = (date) => {
  if (!date) return '';
  
  const dateObj = new Date(date);
  
  if (isNaN(dateObj.getTime())) {
    return '';
  }
  
  const year = dateObj.getFullYear();
  const month = (dateObj.getMonth() + 1).toString().padStart(2, '0');
  const day = dateObj.getDate().toString().padStart(2, '0');
  const hours = dateObj.getHours().toString().padStart(2, '0');
  const minutes = dateObj.getMinutes().toString().padStart(2, '0');
  
  return `${year}-${month}-${day}T${hours}:${minutes}`;
};

/**
 * Get relative time (e.g., "2 days ago", "in 5 days")
 * @param {Date|string|number} date - Date to compare
 * @returns {string} Relative time string
 */
export const getRelativeTime = (date) => {
  if (!date) return '';
  
  const dateObj = new Date(date);
  const now = new Date();
  
  if (isNaN(dateObj.getTime())) {
    return '';
  }
  
  const diffMs = dateObj.getTime() - now.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) {
    return 'Today';
  } else if (diffDays === 1) {
    return 'Tomorrow';
  } else if (diffDays === -1) {
    return 'Yesterday';
  } else if (diffDays > 0) {
    return `In ${diffDays} days`;
  } else {
    return `${Math.abs(diffDays)} days ago`;
  }
};

/**
 * Check if a date is expired (before today)
 * @param {Date|string|number} date - Date to check
 * @returns {boolean} True if expired
 */
export const isExpired = (date) => {
  if (!date) return false;
  
  const dateObj = new Date(date);
  const today = new Date();
  today.setHours(0, 0, 0, 0); // Start of today
  
  if (isNaN(dateObj.getTime())) {
    return false;
  }
  
  return dateObj < today;
};

/**
 * Check if a date is expiring soon (within specified days)
 * @param {Date|string|number} date - Date to check
 * @param {number} days - Number of days to consider as "soon" (default 30)
 * @returns {boolean} True if expiring soon
 */
export const isExpiringSoon = (date, days = 30) => {
  if (!date) return false;
  
  const dateObj = new Date(date);
  const today = new Date();
  const futureDate = new Date(today);
  futureDate.setDate(today.getDate() + days);
  
  if (isNaN(dateObj.getTime())) {
    return false;
  }
  
  return dateObj >= today && dateObj <= futureDate;
};

/**
 * Get days until expiry
 * @param {Date|string|number} date - Date to check
 * @returns {number} Days until expiry (negative if expired)
 */
export const getDaysUntilExpiry = (date) => {
  if (!date) return 0;
  
  const dateObj = new Date(date);
  const today = new Date();
  
  if (isNaN(dateObj.getTime())) {
    return 0;
  }
  
  const diffMs = dateObj.getTime() - today.getTime();
  return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
};
