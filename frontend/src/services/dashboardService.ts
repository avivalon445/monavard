import axiosInstance from '@/utils/axios';
import { API_ENDPOINTS } from '@/config/api';
import { ApiResponse } from '@/types';

export interface DashboardMetrics {
  // Bids metrics
  total_bids: number;
  pending_bids: number;
  accepted_bids: number;
  rejected_bids: number;
  cancelled_bids: number;
  bids_last_7d: number;
  bids_last_30d: number;
  avg_bid_price: number;
  min_bid_price: number;
  max_bid_price: number;
  avg_delivery_time: number;
  win_rate: number;
  
  // Requests metrics
  requests_bid_on: number;
  active_requests_bid_on: number;
  completed_requests_bid_on: number;
  requests_bid_last_7d: number;
  requests_bid_last_30d: number;
  
  // Orders metrics
  total_orders: number;
  active_orders: number;
  completed_orders: number;
  cancelled_orders: number;
  orders_last_7d: number;
  orders_last_30d: number;
  
  // Financial metrics
  total_revenue: number;
  avg_order_amount: number;
  total_commissions_paid: number;
  completed_orders_count: number;
}

export interface RecentBid {
  id: number;
  price: number;
  delivery_time_days: number;
  status: string;
  created_at: string;
  request_id: number;
  request_title: string;
  budget_min: number;
  budget_max: number;
  currency: string;
  category_name: string;
}

export interface AvailableRequest {
  id: number;
  title: string;
  description: string;
  budget_min: number;
  budget_max: number;
  currency: string;
  delivery_date: string;
  created_at: string;
  category_name: string;
  bid_count: number;
}

export interface RecentActivity {
  activity_type: string;
  action: string;
  project_name: string;
  created_at: string;
  status: string;
  request_id?: number;
  order_id?: number;
}

export interface DashboardData {
  metrics: DashboardMetrics;
  recent_bids: RecentBid[];
  available_requests: AvailableRequest[];
  recent_activity: RecentActivity[];
}

class DashboardService {
  /**
   * Get supplier dashboard data
   */
  async getSupplierDashboard(): Promise<ApiResponse<DashboardData>> {
    const response = await axiosInstance.get(API_ENDPOINTS.DASHBOARD.SUPPLIER);
    return response.data;
  }
}

export const dashboardService = new DashboardService();
