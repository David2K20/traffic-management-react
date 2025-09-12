// Complaint categories configuration with role-based access control

// Categories accessible to all users (regular citizens)
export const PUBLIC_CATEGORIES = [
  { value: 'wrong_parking', label: 'Wrong Parking' },
  { value: 'noise_pollution', label: 'Noise Pollution' },
  { value: 'blocked_driveway', label: 'Blocked Driveway' },
  { value: 'illegal_horn', label: 'Illegal Use of Horn' },
  { value: 'others', label: 'Others' }
];

// Categories only accessible to officials (admin/law enforcement)
export const OFFICIAL_ONLY_CATEGORIES = [
  { value: 'overspeeding', label: 'Overspeeding' },
  { value: 'no_seatbelt', label: 'No Seatbelt' },
  { value: 'phone_driving', label: 'Phone Use While Driving' }
];

// All categories combined (for officials)
export const ALL_CATEGORIES = [
  ...PUBLIC_CATEGORIES.slice(0, -1), // All public categories except 'Others'
  ...OFFICIAL_ONLY_CATEGORIES,
  { value: 'others', label: 'Others' } // Keep 'Others' at the end
];

// Helper function to get categories based on user role
export const getCategoriesByRole = (userRole) => {
  if (userRole === 'admin') {
    return ALL_CATEGORIES;
  }
  return PUBLIC_CATEGORIES;
};

// Helper function to check if a category is restricted
export const isCategoryRestricted = (categoryValue) => {
  return OFFICIAL_ONLY_CATEGORIES.some(cat => cat.value === categoryValue);
};
