/**
 * Utility to provide user-friendly error messages for authentication errors
 */

interface ErrorMessageMap {
  [key: string]: string;
}

const errorMessages: ErrorMessageMap = {
  // Authentication errors
  'Invalid email or password': 'The email or password you entered is incorrect. Please try again.',
  'Invalid credentials': 'The email or password you entered is incorrect. Please try again.',
  'Unauthorized': 'You are not authorized to access this resource. Please login again.',
  'Token expired': 'Your session has expired. Please login again.',
  'Invalid token': 'Your session is invalid. Please login again.',
  
  // Registration errors
  'Email already registered': 'This email address is already registered. Please login or use a different email.',
  'Duplicate entry': 'This email address is already registered. Please login or use a different email.',
  'User already exists': 'An account with this email already exists. Please login or reset your password.',
  
  // Validation errors
  'Validation error': 'Please check your input and try again.',
  'Invalid email': 'Please enter a valid email address.',
  'Password too short': 'Your password must be at least 8 characters long.',
  'Passwords do not match': 'The passwords you entered do not match.',
  
  // Network errors
  'Network Error': 'Unable to connect to the server. Please check your internet connection and try again.',
  'Request failed': 'The request failed. Please try again later.',
  'timeout': 'The request timed out. Please check your connection and try again.',
  
  // Server errors
  'Internal Server Error': 'Something went wrong on our end. Please try again later.',
  'Service Unavailable': 'The service is temporarily unavailable. Please try again in a few minutes.',
  'Bad Gateway': 'Unable to reach the server. Please try again later.',
  
  // Rate limiting
  'Too many requests': 'Too many attempts. Please wait a few minutes before trying again.',
  'Rate limit exceeded': 'Too many attempts. Please wait a few minutes before trying again.',
  
  // Email verification
  'Email not verified': 'Please verify your email address before logging in. Check your inbox for the verification link.',
  'Invalid verification token': 'The verification link is invalid or has expired. Please request a new one.',
  
  // Account status
  'Account inactive': 'Your account is inactive. Please contact support for assistance.',
  'Account suspended': 'Your account has been suspended. Please contact support for more information.',
  'Account deleted': 'This account has been deleted.',
  
  // Password reset
  'Invalid reset token': 'The password reset link is invalid or has expired. Please request a new one.',
  'Reset token expired': 'The password reset link has expired. Please request a new one.',
};

/**
 * Get a user-friendly error message
 * @param error - The error object or message
 * @returns User-friendly error message
 */
export const getUserFriendlyError = (error: any): string => {
  // If it's a string, check if we have a mapped message
  if (typeof error === 'string') {
    return errorMessages[error] || error;
  }
  
  // If it's an error object with a message
  if (error?.message) {
    const message = error.message;
    // Check for exact match
    if (errorMessages[message]) {
      return errorMessages[message];
    }
    
    // Check for partial match (case-insensitive)
    const lowerMessage = message.toLowerCase();
    for (const key in errorMessages) {
      if (lowerMessage.includes(key.toLowerCase())) {
        return errorMessages[key];
      }
    }
    
    return message;
  }
  
  // If it's a response error
  if (error?.response?.data?.message) {
    return getUserFriendlyError(error.response.data.message);
  }
  
  // If it's a network error
  if (error?.code === 'ECONNABORTED') {
    return errorMessages['timeout'];
  }
  
  if (error?.code === 'ERR_NETWORK') {
    return errorMessages['Network Error'];
  }
  
  // Default fallback
  return 'An unexpected error occurred. Please try again.';
};

/**
 * Check if an error is a network error
 */
export const isNetworkError = (error: any): boolean => {
  return (
    error?.code === 'ERR_NETWORK' ||
    error?.code === 'ECONNABORTED' ||
    error?.message === 'Network Error' ||
    !navigator.onLine
  );
};

/**
 * Check if an error is an authentication error
 */
export const isAuthError = (error: any): boolean => {
  const status = error?.response?.status || error?.status;
  return status === 401 || status === 403;
};

/**
 * Check if an error is a validation error
 */
export const isValidationError = (error: any): boolean => {
  const status = error?.response?.status || error?.status;
  return status === 400 || status === 422;
};

/**
 * Check if an error is a rate limit error
 */
export const isRateLimitError = (error: any): boolean => {
  const status = error?.response?.status || error?.status;
  return status === 429;
};

/**
 * Format validation errors from backend
 */
export const formatValidationErrors = (error: any): string => {
  if (error?.response?.data?.errors && Array.isArray(error.response.data.errors)) {
    return error.response.data.errors
      .map((err: any) => err.message || err.msg)
      .join('. ');
  }
  
  return getUserFriendlyError(error);
};

