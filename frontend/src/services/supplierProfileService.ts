import axiosInstance from '@/utils/axios';
import { API_ENDPOINTS } from '@/config/api';
import { ApiResponse } from '@/types';

// Supplier Profile Interfaces
export interface SupplierProfile {
  id: number;
  user_id: number;
  company_name: string;
  business_license?: string;
  tax_id?: string;
  address?: string;
  city?: string;
  country?: string;
  website?: string;
  description?: string;
  is_approved: boolean;
  rating: number;
  review_count: number;
  approval_date?: string;
  created_at: string;
  updated_at: string;
  profile_completion: number;
  last_profile_update?: string;
  avatar_url?: string;
  operating_hours?: any;
  service_areas?: string[];
  company_size?: string;
  year_established?: number;
  subscription_plan: string;
  subscription_expires_at?: string;
  featured_supplier: boolean;
  premium_status: boolean;
  verification_status: string;
  verification_date?: string;
  verification_notes?: string;
  profile_completion_score: number;
  visibility_status: string;
  business_hours?: string;
  timezone?: string;
  portfolio_description?: string;
  awards_recognitions?: any[];
  insurance_coverage?: string;
  environmental_certifications?: any[];
  social_media_links?: any;
}

export interface SupplierUser {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  phone?: string;
  user_type: string;
  is_verified: boolean;
  created_at: string;
  two_factor_enabled?: boolean;
}

export interface NotificationSettings {
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
}

export interface PrivacySettings {
  id: number;
  supplier_id: number;
  profile_visibility: string;
  show_contact_info: boolean;
  show_portfolio: boolean;
  show_reviews: boolean;
  allow_messages: boolean;
  created_at: string;
  updated_at: string;
}

export interface SupplierCategory {
  id: number;
  supplier_id: number;
  category_id: number;
  expertise_level: string;
  experience_years: number;
  portfolio_items?: string;
  certifications?: string;
  created_at: string;
  category_name?: string;
}

export interface SupplierFile {
  id: number;
  supplier_id: number;
  file_category: string;
  original_name: string;
  filename: string;
  file_path: string;
  file_type: string;
  file_size: number;
  description?: string;
  is_public: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface CompleteSupplierProfile {
  user: SupplierUser;
  profile: SupplierProfile;
  notification_settings: NotificationSettings;
  privacy_settings: PrivacySettings;
  categories: SupplierCategory[];
  files: SupplierFile[];
}

export interface UpdateSupplierProfileData {
  company_name?: string;
  business_license?: string;
  tax_id?: string;
  address?: string;
  city?: string;
  country?: string;
  website?: string;
  description?: string;
  avatar_url?: string;
  company_size?: string;
  year_established?: number;
  portfolio_description?: string;
  awards_recognitions?: any[];
  insurance_coverage?: string;
  environmental_certifications?: any[];
  social_media_links?: any;
  operating_hours?: any;
  service_areas?: string[];
  timezone?: string;
  business_hours?: string;
}

export interface UpdateUserInfoData {
  first_name?: string;
  last_name?: string;
  phone?: string;
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

export interface SupplierCategoryData {
  category_id: number;
  expertise_level: string;
  experience_years: number;
  portfolio_items?: string;
  certifications?: string;
}

export interface FileUploadData {
  file_category: string;
  original_name: string;
  filename: string;
  file_path: string;
  file_type: string;
  file_size: number;
  description?: string;
  is_public?: boolean;
}

/**
 * Supplier Profile Service
 * Handles all supplier profile-related API calls
 */
export const supplierProfileService = {
  /**
   * Get complete supplier profile
   */
  async getProfile(): Promise<ApiResponse<CompleteSupplierProfile>> {
    const response = await axiosInstance.get(API_ENDPOINTS.SUPPLIER_PROFILE.BASE);
    return response.data;
  },

  /**
   * Update supplier profile
   */
  async updateProfile(data: UpdateSupplierProfileData): Promise<ApiResponse<any>> {
    const response = await axiosInstance.put(API_ENDPOINTS.SUPPLIER_PROFILE.BASE, data);
    return response.data;
  },

  /**
   * Update user information
   */
  async updateUserInfo(data: UpdateUserInfoData): Promise<ApiResponse<any>> {
    const response = await axiosInstance.put(API_ENDPOINTS.SUPPLIER_PROFILE.USER_INFO, data);
    return response.data;
  },

  /**
   * Update notification preferences
   */
  async updateNotificationPreferences(data: NotificationPreferencesData): Promise<ApiResponse<any>> {
    const response = await axiosInstance.put(API_ENDPOINTS.SUPPLIER_PROFILE.NOTIFICATIONS, data);
    return response.data;
  },

  /**
   * Update privacy settings
   */
  async updatePrivacySettings(data: PrivacySettingsData): Promise<ApiResponse<any>> {
    const response = await axiosInstance.put(API_ENDPOINTS.SUPPLIER_PROFILE.PRIVACY, data);
    return response.data;
  },

  /**
   * Add supplier category
   */
  async addCategory(data: SupplierCategoryData): Promise<ApiResponse<any>> {
    const response = await axiosInstance.post(API_ENDPOINTS.SUPPLIER_PROFILE.CATEGORIES, data);
    return response.data;
  },

  /**
   * Update supplier category
   */
  async updateCategory(categoryId: number, data: Partial<SupplierCategoryData>): Promise<ApiResponse<any>> {
    const response = await axiosInstance.put(API_ENDPOINTS.SUPPLIER_PROFILE.CATEGORY_BY_ID(categoryId), data);
    return response.data;
  },

  /**
   * Remove supplier category
   */
  async removeCategory(categoryId: number): Promise<ApiResponse<any>> {
    const response = await axiosInstance.delete(API_ENDPOINTS.SUPPLIER_PROFILE.CATEGORY_BY_ID(categoryId));
    return response.data;
  },

  /**
   * Upload supplier file
   */
  async uploadFile(data: FileUploadData): Promise<ApiResponse<any>> {
    const response = await axiosInstance.post(API_ENDPOINTS.SUPPLIER_PROFILE.FILES, data);
    return response.data;
  },

  /**
   * Delete supplier file
   */
  async deleteFile(fileId: number): Promise<ApiResponse<any>> {
    const response = await axiosInstance.delete(API_ENDPOINTS.SUPPLIER_PROFILE.FILE_BY_ID(fileId));
    return response.data;
  },
};
