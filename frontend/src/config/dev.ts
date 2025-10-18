// Development mode configuration
export const DEV_MODE = import.meta.env.DEV; // true in development
export const MOCK_AUTH = false; // Set to true to bypass authentication for testing (now using real backend)

// Mock user data for testing
export const MOCK_CUSTOMER = {
  id: 1,
  email: 'customer@test.com',
  first_name: 'John',
  last_name: 'Doe',
  phone: '+1234567890',
  user_type: 'customer' as const,
  is_verified: true,
  is_active: true,
  account_status: 'active' as const,
  last_login: new Date().toISOString(),
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

export const MOCK_SUPPLIER = {
  id: 2,
  email: 'supplier@test.com',
  first_name: 'Jane',
  last_name: 'Smith',
  phone: '+1234567890',
  user_type: 'supplier' as const,
  is_verified: true,
  is_active: true,
  account_status: 'active' as const,
  last_login: new Date().toISOString(),
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

