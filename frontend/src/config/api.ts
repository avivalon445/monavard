export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api/v1';

export const API_ENDPOINTS = {
  // Auth
  AUTH: {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    LOGOUT: '/auth/logout',
    REFRESH_TOKEN: '/auth/refresh-token',
    VERIFY_EMAIL: '/auth/verify-email',
    FORGOT_PASSWORD: '/auth/forgot-password',
    RESET_PASSWORD: '/auth/reset-password',
    CHANGE_PASSWORD: '/auth/change-password',
    ME: '/auth/me',
  },
  
  // Requests (Customer)
  REQUESTS: {
    BASE: '/requests',
    CREATE: '/requests',
    BY_ID: (id: number) => `/requests/${id}`,
    CUSTOMER: '/requests',
    FILES: (id: number) => `/requests/${id}/files`,
    STATS: '/requests/stats/summary',
    BIDS: (id: number) => `/requests/${id}/bids`,
  },
  
  // Supplier Requests
  SUPPLIER_REQUESTS: {
    BASE: '/supplier/requests',
    BY_ID: (id: number) => `/supplier/requests/${id}`,
    STATS: '/supplier/requests/stats/summary',
  },
  
  // Supplier Orders
  SUPPLIER_ORDERS: {
    BASE: '/supplier/orders',
    BY_ID: (id: number) => `/supplier/orders/${id}`,
    STATS: '/supplier/orders/stats/summary',
    UPDATE_STATUS: (id: number) => `/supplier/orders/${id}/status`,
    ADD_UPDATE: (id: number) => `/supplier/orders/${id}/updates`,
  },
  
  // Bids (Customer)
  BIDS: {
    BASE: '/bids',
    CREATE: '/bids',
    BY_ID: (id: number) => `/bids/${id}`,
    CUSTOMER: '/bids/customer',
    ACCEPT: (id: number) => `/bids/${id}/accept`,
    REJECT: (id: number) => `/bids/${id}/reject`,
    STATS: '/bids/stats/summary',
  },
  
// Supplier Bids
SUPPLIER_BIDS: {
  BASE: '/supplier/bids',
  CREATE: '/supplier/bids',
  BY_ID: (id: number) => `/supplier/bids/${id}`,
  UPDATE: (id: number) => `/supplier/bids/${id}`,
  CANCEL: (id: number) => `/supplier/bids/${id}/cancel`,
  STATS: '/supplier/bids/stats/summary',
},
  
  // Orders
  ORDERS: {
    BASE: '/orders',
    DETAILS: (id: number) => `/orders/${id}`,
    STATS: '/orders/stats/summary',
    CANCEL: (id: number) => `/orders/${id}/cancel`,
    CONFIRM_DELIVERY: (id: number) => `/orders/${id}/confirm-delivery`,
    COMPLETE: (id: number) => `/orders/${id}/complete`,
  },
  
  // Categories
  CATEGORIES: {
    ALL: '/categories',
    BASE: '/categories',
    BY_ID: (id: number) => `/categories/${id}`,
  },
  
  // Profile
  PROFILE: {
    CUSTOMER: '/profile/customer',
    USER: '/profile/user',
    NOTIFICATIONS: '/profile/notifications',
    CHANGE_PASSWORD: '/profile/change-password',
    TOGGLE_2FA: '/profile/toggle-2fa',
    DELETE_ACCOUNT: '/profile/delete-account',
  },
  
  // Dashboard
  DASHBOARD: {
    CUSTOMER: '/dashboard/customer',
    SUPPLIER: '/dashboard/supplier',
    STATS: '/dashboard/stats',
  },
  
  // Analytics
  ANALYTICS: {
    BASE: '/analytics',
    OVERVIEW: '/analytics/overview',
    FINANCIAL: '/analytics/financial',
    PERFORMANCE: '/analytics/performance',
    CATEGORIES: '/analytics/categories',
    COMPETITIVE: '/analytics/competitive',
  },

  // Supplier Profile
  SUPPLIER_PROFILE: {
    BASE: '/supplier/profile',
    USER_INFO: '/supplier/profile/user-info',
    NOTIFICATIONS: '/supplier/profile/notifications',
    PRIVACY: '/supplier/profile/privacy',
    CATEGORIES: '/supplier/profile/categories',
    CATEGORY_BY_ID: (id: number) => `/supplier/profile/categories/${id}`,
    FILES: '/supplier/profile/files',
    FILE_BY_ID: (id: number) => `/supplier/profile/files/${id}`,
  },

  // Supplier Portfolio
  SUPPLIER_PORTFOLIO: {
    BASE: '/supplier/portfolio',
    BY_ID: (id: number) => `/supplier/portfolio/${id}`,
    STATS: '/supplier/portfolio/stats',
    CATEGORIES: '/supplier/portfolio/categories',
    FEATURED: (id: number) => `/supplier/portfolio/${id}/featured`,
    ORDER: '/supplier/portfolio/order',
  },

  // Supplier Financial
  SUPPLIER_FINANCIAL: {
    BASE: '/supplier/financial',
    REPORT: '/supplier/financial/report',
    SUMMARY: '/supplier/financial/summary',
    TAX: '/supplier/financial/tax',
    COMMISSION: '/supplier/financial/commission',
  },

  // Supplier Settings
  SUPPLIER_SETTINGS: {
    BASE: '/supplier/settings',
    USER_INFO: '/supplier/settings/user-info',
    PASSWORD: '/supplier/settings/password',
    EMAIL: '/supplier/settings/email',
    TWO_FACTOR: '/supplier/settings/two-factor',
    NOTIFICATIONS: '/supplier/settings/notifications',
    PRIVACY: '/supplier/settings/privacy',
    ACTIVITY: '/supplier/settings/activity',
    DELETE_ACCOUNT: '/supplier/settings/account',
    EXPORT: '/supplier/settings/export',
  },
  
  // Notifications
  NOTIFICATIONS: {
    BASE: '/notifications',
    MARK_READ: (id: number) => `/notifications/${id}/read`,
    MARK_ALL_READ: '/notifications/read-all',
  },
};

