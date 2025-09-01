// Date formatting utilities
export const formatDate = (dateString, options = {}) => {
  const defaultOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  };
  
  const finalOptions = { ...defaultOptions, ...options };
  return new Date(dateString).toLocaleDateString('en-US', finalOptions);
};

export const getRelativeTime = (dateString) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffInMs = now - date;
  const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
  const diffInHours = Math.floor(diffInMinutes / 60);
  const diffInDays = Math.floor(diffInHours / 24);

  if (diffInMinutes < 1) return 'Just now';
  if (diffInMinutes < 60) return `${diffInMinutes} minute${diffInMinutes > 1 ? 's' : ''} ago`;
  if (diffInHours < 24) return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
  if (diffInDays < 7) return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;
  
  return formatDate(dateString, { year: 'numeric', month: 'short', day: 'numeric' });
};

export const getDaysUntilExpiry = (expiryDate) => {
  const today = new Date();
  const expiry = new Date(expiryDate);
  const diffInMs = expiry - today;
  return Math.ceil(diffInMs / (1000 * 60 * 60 * 24));
};

// Status and priority helpers
export const getStatusColor = (status) => {
  switch (status) {
    case 'pending': return 'warning';
    case 'resolved': return 'success';
    case 'rejected': return 'danger';
    default: return 'default';
  }
};

export const getPriorityColor = (priority) => {
  switch (priority) {
    case 'high': return 'danger';
    case 'medium': return 'warning';
    case 'low': return 'success';
    default: return 'default';
  }
};

// Form validation utilities
export const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validatePhoneNumber = (phone) => {
  const phoneRegex = /^[0-9]{10,11}$/;
  return phoneRegex.test(phone.replace(/\D/g, ''));
};

export const validatePlateNumber = (plateNumber) => {
  // Basic validation for plate number format
  const plateRegex = /^[A-Z0-9]{6,8}$/i;
  return plateRegex.test(plateNumber.replace(/[\s-]/g, ''));
};

// Image utilities
export const compressImage = (file, maxWidth = 800, quality = 0.8) => {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    img.onload = () => {
      const ratio = Math.min(maxWidth / img.width, maxWidth / img.height);
      canvas.width = img.width * ratio;
      canvas.height = img.height * ratio;
      
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      canvas.toBlob(resolve, 'image/jpeg', quality);
    };
    
    img.src = URL.createObjectURL(file);
  });
};

// Search and filter utilities
export const filterComplaints = (complaints, filters) => {
  return complaints.filter(complaint => {
    const { searchTerm, status, priority, category } = filters;
    
    const matchesSearch = !searchTerm || 
      complaint.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      complaint.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      complaint.offenderPlate.toLowerCase().includes(searchTerm.toLowerCase()) ||
      complaint.reportedByName.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = status === 'all' || complaint.status === status;
    const matchesPriority = priority === 'all' || complaint.priority === priority;
    const matchesCategory = category === 'all' || complaint.category === category;
    
    return matchesSearch && matchesStatus && matchesPriority && matchesCategory;
  });
};

// Sort utilities
export const sortComplaints = (complaints, sortBy = 'date', sortOrder = 'desc') => {
  return [...complaints].sort((a, b) => {
    let aValue, bValue;
    
    switch (sortBy) {
      case 'date':
        aValue = new Date(a.dateReported);
        bValue = new Date(b.dateReported);
        break;
      case 'priority':
        const priorityOrder = { high: 3, medium: 2, low: 1 };
        aValue = priorityOrder[a.priority];
        bValue = priorityOrder[b.priority];
        break;
      case 'status':
        const statusOrder = { pending: 3, resolved: 2, rejected: 1 };
        aValue = statusOrder[a.status];
        bValue = statusOrder[b.status];
        break;
      default:
        aValue = a[sortBy];
        bValue = b[sortBy];
    }
    
    if (sortOrder === 'asc') {
      return aValue > bValue ? 1 : -1;
    } else {
      return aValue < bValue ? 1 : -1;
    }
  });
};
