import axiosInstance from '@/utils/axios';
import { API_ENDPOINTS } from '@/config/api';
import { ApiResponse, Pagination } from '@/types';

// Supplier Portfolio Interfaces
export interface PortfolioItem {
  id: number;
  supplier_id: number;
  title: string;
  description: string;
  category_id?: number;
  image_url?: string;
  project_url?: string;
  completion_date?: string;
  client_name?: string;
  project_value?: number;
  technologies?: string[] | string;
  is_featured: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
  category_name?: string;
}

export interface PortfolioFilters {
  category_id?: number;
  is_featured?: boolean;
  limit?: number;
  offset?: number;
}

export interface PortfolioStatistics {
  total_items: number;
  featured_items: number;
  categories_covered: number;
  first_item_date?: string;
  last_item_date?: string;
  avg_project_value: number;
  total_project_value: number;
  category_breakdown: Array<{
    category_name: string;
    item_count: number;
    avg_value: number;
  }>;
}

export interface PortfolioCategory {
  id: number;
  name: string;
  item_count: number;
}

export interface CreatePortfolioItemData {
  title: string;
  description: string;
  category_id?: number;
  image_url?: string;
  project_url?: string;
  completion_date?: string;
  client_name?: string;
  project_value?: number;
  technologies?: string[];
  is_featured?: boolean;
  display_order?: number;
}

export interface UpdatePortfolioItemData {
  title?: string;
  description?: string;
  category_id?: number;
  image_url?: string;
  project_url?: string;
  completion_date?: string;
  client_name?: string;
  project_value?: number;
  technologies?: string[];
  is_featured?: boolean;
  display_order?: number;
}

export interface PortfolioOrderItem {
  id: number;
  display_order: number;
}

/**
 * Supplier Portfolio Service
 * Handles all supplier portfolio-related API calls
 */
export const supplierPortfolioService = {
  /**
   * Get supplier portfolio
   */
  async getPortfolio(filters: PortfolioFilters = {}): Promise<ApiResponse<PortfolioItem[], Pagination>> {
    const params = new URLSearchParams();
    if (filters.category_id) params.append('category_id', filters.category_id.toString());
    if (filters.is_featured !== undefined) params.append('is_featured', filters.is_featured.toString());
    if (filters.limit) params.append('limit', filters.limit.toString());
    if (filters.offset) params.append('offset', filters.offset.toString());

    const response = await axiosInstance.get(API_ENDPOINTS.SUPPLIER_PORTFOLIO.BASE, { params });
    return response.data;
  },

  /**
   * Get single portfolio item
   */
  async getPortfolioItem(itemId: number): Promise<ApiResponse<PortfolioItem>> {
    const response = await axiosInstance.get(API_ENDPOINTS.SUPPLIER_PORTFOLIO.BY_ID(itemId));
    return response.data;
  },

  /**
   * Create portfolio item
   */
  async createPortfolioItem(data: CreatePortfolioItemData): Promise<ApiResponse<{ id: number }>> {
    const response = await axiosInstance.post(API_ENDPOINTS.SUPPLIER_PORTFOLIO.BASE, data);
    return response.data;
  },

  /**
   * Update portfolio item
   */
  async updatePortfolioItem(itemId: number, data: UpdatePortfolioItemData): Promise<ApiResponse<any>> {
    const response = await axiosInstance.put(API_ENDPOINTS.SUPPLIER_PORTFOLIO.BY_ID(itemId), data);
    return response.data;
  },

  /**
   * Delete portfolio item
   */
  async deletePortfolioItem(itemId: number): Promise<ApiResponse<any>> {
    const response = await axiosInstance.delete(API_ENDPOINTS.SUPPLIER_PORTFOLIO.BY_ID(itemId));
    return response.data;
  },

  /**
   * Update portfolio order
   */
  async updatePortfolioOrder(orderData: PortfolioOrderItem[]): Promise<ApiResponse<any>> {
    const response = await axiosInstance.put(API_ENDPOINTS.SUPPLIER_PORTFOLIO.ORDER, orderData);
    return response.data;
  },

  /**
   * Toggle featured status
   */
  async toggleFeaturedStatus(itemId: number): Promise<ApiResponse<{ is_featured: boolean }>> {
    const response = await axiosInstance.put(API_ENDPOINTS.SUPPLIER_PORTFOLIO.FEATURED(itemId));
    return response.data;
  },

  /**
   * Get portfolio statistics
   */
  async getPortfolioStatistics(): Promise<ApiResponse<PortfolioStatistics>> {
    const response = await axiosInstance.get(API_ENDPOINTS.SUPPLIER_PORTFOLIO.STATS);
    return response.data;
  },

  /**
   * Get portfolio categories
   */
  async getPortfolioCategories(): Promise<ApiResponse<PortfolioCategory[]>> {
    const response = await axiosInstance.get(API_ENDPOINTS.SUPPLIER_PORTFOLIO.CATEGORIES);
    return response.data;
  },
};
