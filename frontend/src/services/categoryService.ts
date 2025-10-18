import axiosInstance from '@/utils/axios';
import { API_ENDPOINTS } from '@/config/api';
import { ApiResponse } from '@/types';

export interface Category {
  id: number;
  name: string;
  description?: string;
  parent_id?: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export const categoryService = {
  /**
   * Get all active categories
   */
  async getAllCategories(): Promise<ApiResponse<Category[]>> {
    const response = await axiosInstance.get(API_ENDPOINTS.CATEGORIES.ALL);
    return response.data;
  },

  /**
   * Get category by ID
   */
  async getCategoryById(id: number): Promise<ApiResponse<Category>> {
    const response = await axiosInstance.get(`${API_ENDPOINTS.CATEGORIES.ALL}/${id}`);
    return response.data;
  },
};

