export const API_ROUTES = {
  LOGIN: '/api/auth/login',
  REGISTER: '/api/auth/register',
  LOGOUT: '/api/auth/logout',
  FORGOT_PASSWORD: '/api/auth/forgot-password',
  DASHBOARD_STATS: '/api/dashboard-stats',
  GOLD_RATE: '/api/gold-rate',
  ITEMS: '/api/items',
  SETTINGS: '/api/settings',
  HISTORY: '/api/history',
  CUSTOMERS: '/api/customers',
  BILLS: '/api/bills',
};

export const PASSWORD_RULES = {
  MIN_LENGTH: 8,
  MESSAGE: 'Password must be at least 8 characters and meet all security criteria.',
};

export const GOLD_PURITIES = {
  K22: '22K',
  K24: '24K',
};

export const DEFAULTS = {
  GST_PERCENTAGE: 3.0,
  PURITY: '22K',
};
