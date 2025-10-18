import axiosInstance from '@/utils/axios';
import { API_ENDPOINTS } from '@/config/api';
import { ApiResponse, CompleteProfile } from '@/types';

/**
 * Get complete customer profile with all settings
 */
export const getCustomerProfile = async (): Promise<ApiResponse<CompleteProfile>> => {
  const response = await axiosInstance.get<ApiResponse<CompleteProfile>>(
    API_ENDPOINTS.PROFILE.CUSTOMER
  );
  
  return response.data;
};

/**
 * Update user basic information
 */
export const updateUserInfo = async (data: {
  first_name?: string;
  last_name?: string;
  phone?: string;
  email?: string;
}): Promise<ApiResponse> => {
  const response = await axiosInstance.put<ApiResponse>(
    API_ENDPOINTS.PROFILE.USER,
    data
  );
  
  return response.data;
};

/**
 * Update customer profile
 */
export const updateCustomerProfile = async (data: {
  company_name?: string;
  address?: string;
  city?: string;
  country?: string;
  postal_code?: string;
  website?: string;
  bio?: string;
  industry?: string;
  company_size?: string;
  preferred_currency?: string;
  language?: string;
  date_of_birth?: string;
  gender?: string;
  email_visibility?: string;
  profile_visibility?: string;
  activity_status?: string;
}): Promise<ApiResponse> => {
  const response = await axiosInstance.put<ApiResponse>(
    API_ENDPOINTS.PROFILE.CUSTOMER,
    data
  );
  
  return response.data;
};

/**
 * Update notification settings
 */
export const updateNotificationSettings = async (data: {
  email_new_bids?: boolean;
  email_order_updates?: boolean;
  email_messages?: boolean;
  email_promotions?: boolean;
  sms_order_updates?: boolean;
  sms_messages?: boolean;
  push_notifications?: boolean;
  real_time_notifications?: boolean;
  frequency?: string;
}): Promise<ApiResponse> => {
  const response = await axiosInstance.put<ApiResponse>(
    API_ENDPOINTS.PROFILE.NOTIFICATIONS,
    data
  );
  
  return response.data;
};

/**
 * Change password
 */
export const changePassword = async (
  currentPassword: string,
  newPassword: string
): Promise<ApiResponse> => {
  const response = await axiosInstance.post<ApiResponse>(
    API_ENDPOINTS.PROFILE.CHANGE_PASSWORD,
    { currentPassword, newPassword }
  );
  
  return response.data;
};

/**
 * Toggle two-factor authentication
 */
export const toggleTwoFactor = async (enabled: boolean): Promise<ApiResponse> => {
  const response = await axiosInstance.post<ApiResponse>(
    API_ENDPOINTS.PROFILE.TOGGLE_2FA,
    { enabled }
  );
  
  return response.data;
};

/**
 * Delete account
 */
export const deleteAccount = async (password: string): Promise<ApiResponse> => {
  const response = await axiosInstance.post<ApiResponse>(
    API_ENDPOINTS.PROFILE.DELETE_ACCOUNT,
    { password }
  );
  
  return response.data;
};

