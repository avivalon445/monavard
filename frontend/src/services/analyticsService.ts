import axiosInstance from '@/utils/axios';
import { API_ENDPOINTS } from '@/config/api';
import { ApiResponse } from '@/types';

// Analytics interfaces
export interface OverviewMetrics {
  total_bids: number;
  total_orders: number;
  total_revenue: number;
  avg_order_value: number;
  won_bids: number;
  pending_bids: number;
  rejected_bids: number;
  requests_bid_on: number;
  avg_delivery_time: number;
  win_rate: number;
  conversion_rate: string;
}

export interface PerformanceMetrics {
  total_bids: number;
  accepted_bids: number;
  rejected_bids: number;
  cancelled_bids: number;
  acceptance_rate: string;
  rejection_rate: string;
  cancellation_rate: string;
  avg_bid_price: number;
  min_bid_price: number;
  max_bid_price: number;
  avg_delivery_time: number;
  price_volatility: number;
  categories_bid_on: number;
}

export interface FinancialAnalytics {
  total_orders: number;
  total_revenue: number;
  completed_revenue: number;
  cancelled_revenue: number;
  avg_order_value: number;
  min_order_value: number;
  max_order_value: number;
  completed_orders: number;
  cancelled_orders: number;
  completion_rate: string;
  cancellation_rate: string;
  avg_order_duration_days: number;
}

export interface BidAnalytics {
  total_bids: number;
  accepted_bids: number;
  pending_bids: number;
  rejected_bids: number;
  cancelled_bids: number;
  acceptance_rate: string;
  avg_bid_price: number;
  avg_delivery_time: number;
  unique_requests_bid: number;
  unique_customers: number;
}

export interface OrderAnalytics {
  total_orders: number;
  confirmed_orders: number;
  in_progress_orders: number;
  production_orders: number;
  shipped_orders: number;
  delivered_orders: number;
  completed_orders: number;
  cancelled_orders: number;
  total_revenue: number;
  avg_order_value: number;
  avg_delivery_days: number;
}

export interface CategoryAnalytics {
  category_id: number;
  category_name: string;
  bids_count: number;
  accepted_bids: number;
  orders_count: number;
  revenue: number;
  avg_bid_price: number;
  avg_delivery_time: number;
  acceptance_rate: string;
}

export interface TimeSeriesData {
  date: string;
  bids_count: number;
  accepted_bids: number;
  orders_count: number;
  revenue: number;
  acceptance_rate: string;
}

export interface TopCategory {
  category_name: string;
  bids_count: number;
  orders_count: number;
  revenue: number;
  won_bids: number;
  avg_bid_price: number;
  win_rate: string;
}

export interface RecentActivity {
  activity_type: 'bid' | 'order';
  activity_id: number;
  activity_date: string;
  status: string;
  title: string;
  amount: number;
  order_id?: number;
}

export interface CompetitiveAnalysis {
  total_requests_available: number;
  total_bids_submitted: number;
  won_bids: number;
  bid_participation_rate: string;
  win_rate: string;
  avg_bid_price: number;
  avg_delivery_time: number;
  categories_active: number;
  customers_served: number;
}

export interface AnalyticsData {
  overview: OverviewMetrics;
  performance: PerformanceMetrics;
  financial: FinancialAnalytics;
  bids: BidAnalytics;
  orders: OrderAnalytics;
  categories: CategoryAnalytics[];
  time_series: TimeSeriesData[];
  top_categories: TopCategory[];
  recent_activity: RecentActivity[];
  competitive: CompetitiveAnalysis;
  date_range: string;
  generated_at: string;
}

export interface AnalyticsFilters {
  date_range?: '7d' | '30d' | '90d' | '1y' | 'all';
  category_id?: number;
}

export interface AnalyticsOverview {
  overview: OverviewMetrics;
  performance: PerformanceMetrics;
  date_range: string;
  generated_at: string;
}

export interface AnalyticsFinancial {
  financial: FinancialAnalytics;
  time_series: TimeSeriesData[];
  date_range: string;
  generated_at: string;
}

export interface AnalyticsPerformance {
  performance: PerformanceMetrics;
  bids: BidAnalytics;
  orders: OrderAnalytics;
  time_series: TimeSeriesData[];
  date_range: string;
  generated_at: string;
}

export interface AnalyticsCategories {
  categories: CategoryAnalytics[];
  top_categories: TopCategory[];
  date_range: string;
  generated_at: string;
}

export interface AnalyticsCompetitive {
  competitive: CompetitiveAnalysis;
  recent_activity: RecentActivity[];
  date_range: string;
  generated_at: string;
}

export const analyticsService = {
  /**
   * Get comprehensive analytics data
   */
  async getAnalytics(filters: AnalyticsFilters = {}): Promise<ApiResponse<AnalyticsData>> {
    const params = new URLSearchParams();
    if (filters.date_range) params.append('date_range', filters.date_range);
    if (filters.category_id) params.append('category_id', filters.category_id.toString());

    const response = await axiosInstance.get(API_ENDPOINTS.ANALYTICS.BASE, { params });
    return response.data;
  },

  /**
   * Get analytics overview (lightweight)
   */
  async getOverview(filters: AnalyticsFilters = {}): Promise<ApiResponse<AnalyticsOverview>> {
    const params = new URLSearchParams();
    if (filters.date_range) params.append('date_range', filters.date_range);

    const response = await axiosInstance.get(API_ENDPOINTS.ANALYTICS.OVERVIEW, { params });
    return response.data;
  },

  /**
   * Get financial analytics
   */
  async getFinancial(filters: AnalyticsFilters = {}): Promise<ApiResponse<AnalyticsFinancial>> {
    const params = new URLSearchParams();
    if (filters.date_range) params.append('date_range', filters.date_range);

    const response = await axiosInstance.get(API_ENDPOINTS.ANALYTICS.FINANCIAL, { params });
    return response.data;
  },

  /**
   * Get performance analytics
   */
  async getPerformance(filters: AnalyticsFilters = {}): Promise<ApiResponse<AnalyticsPerformance>> {
    const params = new URLSearchParams();
    if (filters.date_range) params.append('date_range', filters.date_range);

    const response = await axiosInstance.get(API_ENDPOINTS.ANALYTICS.PERFORMANCE, { params });
    return response.data;
  },

  /**
   * Get category analytics
   */
  async getCategories(filters: AnalyticsFilters = {}): Promise<ApiResponse<AnalyticsCategories>> {
    const params = new URLSearchParams();
    if (filters.date_range) params.append('date_range', filters.date_range);

    const response = await axiosInstance.get(API_ENDPOINTS.ANALYTICS.CATEGORIES, { params });
    return response.data;
  },

  /**
   * Get competitive analysis
   */
  async getCompetitive(filters: AnalyticsFilters = {}): Promise<ApiResponse<AnalyticsCompetitive>> {
    const params = new URLSearchParams();
    if (filters.date_range) params.append('date_range', filters.date_range);

    const response = await axiosInstance.get(API_ENDPOINTS.ANALYTICS.COMPETITIVE, { params });
    return response.data;
  },
};
