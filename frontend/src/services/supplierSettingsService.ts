import axiosInstance from '@/utils/axios';
import { API_ENDPOINTS } from '@/config/api';
import { ApiResponse } from '@/types';

// Supplier Settings Interfaces
export interface SupplierSettings {
  user: {
    id: number;
    email: string;
    first_name: string;
    last_name: string;
    phone?: string;
    user_type: string;
    is_verified: boolean;
    created_at: string;
    two_factor_enabled?: boolean;
  };
  notification_settings: {
    id: number;
    supplier_id: number;
    email_new_requests: boolean;
    email_bid_updates: boolean;
    email_order_updates: boolean;
    sms_notifications: boolean;
    push_notifications: boolean;
    notification_frequency: string;
    created_at: string;
    updated_at: string;
  };
  privacy_settings: {
    id: number;
    supplier_id: number;
    profile_visibility: string;
    show_contact_info: boolean;
    show_portfolio: boolean;
    show_reviews: boolean;
    allow_messages: boolean;
    created_at: string;
    updated_at: string;
  };
  security_settings: {
    two_factor_enabled: boolean;
    email_verified: boolean;
    last_password_change?: string;
    account_created: string;
  };
  subscription_info: {
    subscription_plan: string;
    subscription_expires_at?: string;
    premium_status: boolean;
  };
}

export interface UpdateUserInfoData {
  first_name?: string;
  last_name?: string;
  phone?: string;
}

export interface ChangePasswordData {
  current_password: string;
  new_password: string;
  confirm_password: string;
}

export interface UpdateEmailData {
  new_email: string;
  current_password: string;
}

export interface ToggleTwoFactorData {
  enable: boolean;
  current_password: string;
}

export interface NotificationPreferencesData {
  email_new_requests?: boolean;
  email_bid_updates?: boolean;
  email_order_updates?: boolean;
  sms_notifications?: boolean;
  push_notifications?: boolean;
  notification_frequency?: string;
}

export interface PrivacySettingsData {
  profile_visibility?: string;
  show_contact_info?: boolean;
  show_portfolio?: boolean;
  show_reviews?: boolean;
  allow_messages?: boolean;
}

export interface AccountActivity {
  action_type: string;
  reason: string;
  created_at: string;
  performed_by?: number;
}

export interface DeleteAccountData {
  password: string;
  reason?: string;
}

export interface AccountDataExport {
  user_data: any;
  profile_data: any;
  notification_preferences: any;
  privacy_settings: any;
  bids: any[];
  orders: any[];
  portfolio: any[];
  account_activities: any[];
  export_date: string;
  export_type: string;
}

/**
 * Supplier Settings Service
 * Handles all supplier settings-related API calls
 */
export const supplierSettingsService = {
  /**
   * Get supplier settings
   */
  async getSettings(): Promise<ApiResponse<SupplierSettings>> {
    const response = await axiosInstance.get(API_ENDPOINTS.SUPPLIER_SETTINGS.BASE);
    return response.data;
  },

  /**
   * Update user information
   */
  async updateUserInfo(data: UpdateUserInfoData): Promise<ApiResponse<any>> {
    const response = await axiosInstance.put(API_ENDPOINTS.SUPPLIER_SETTINGS.USER_INFO, data);
    return response.data;
  },

  /**
   * Change password
   */
  async changePassword(data: ChangePasswordData): Promise<ApiResponse<any>> {
    const response = await axiosInstance.put(API_ENDPOINTS.SUPPLIER_SETTINGS.PASSWORD, data);
    return response.data;
  },

  /**
   * Update email
   */
  async updateEmail(data: UpdateEmailData): Promise<ApiResponse<any>> {
    const response = await axiosInstance.put(API_ENDPOINTS.SUPPLIER_SETTINGS.EMAIL, data);
    return response.data;
  },

  /**
   * Toggle two-factor authentication
   */
  async toggleTwoFactor(data: ToggleTwoFactorData): Promise<ApiResponse<any>> {
    const response = await axiosInstance.put(API_ENDPOINTS.SUPPLIER_SETTINGS.TWO_FACTOR, data);
    return response.data;
  },

  /**
   * Update notification preferences
   */
  async updateNotificationPreferences(data: NotificationPreferencesData): Promise<ApiResponse<any>> {
    const response = await axiosInstance.put(API_ENDPOINTS.SUPPLIER_SETTINGS.NOTIFICATIONS, data);
    return response.data;
  },

  /**
   * Update privacy settings
   */
  async updatePrivacySettings(data: PrivacySettingsData): Promise<ApiResponse<any>> {
    const response = await axiosInstance.put(API_ENDPOINTS.SUPPLIER_SETTINGS.PRIVACY, data);
    return response.data;
  },

  /**
   * Get account activity
   */
  async getAccountActivity(limit: number = 50): Promise<ApiResponse<AccountActivity[]>> {
    const response = await axiosInstance.get(API_ENDPOINTS.SUPPLIER_SETTINGS.ACTIVITY, {
      params: { limit }
    });
    return response.data;
  },

  /**
   * Delete account
   */
  async deleteAccount(data: DeleteAccountData): Promise<ApiResponse<any>> {
    const response = await axiosInstance.delete(API_ENDPOINTS.SUPPLIER_SETTINGS.DELETE_ACCOUNT, {
      data
    });
    return response.data;
  },

  /**
   * Export account data
   */
  async exportAccountData(): Promise<ApiResponse<AccountDataExport>> {
    const response = await axiosInstance.get(API_ENDPOINTS.SUPPLIER_SETTINGS.EXPORT);
    return response.data;
  },
};
