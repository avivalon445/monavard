import axiosInstance from '@/utils/axios';
import { API_ENDPOINTS } from '@/config/api';
import { ApiResponse } from '@/types';

export interface SupplierOrder {
  id: number;
  status: string;
  total_amount: number;
  commission_amount: number;
  delivery_date: string;
  actual_delivery_date?: string;
  created_at: string;
  updated_at: string;
  request_title: string;
  request_description: string;
  category_name: string;
  bid_price: number;
  delivery_time_days: number;
  bid_description: string;
  customer_first_name: string;
  customer_last_name: string;
  customer_email: string;
  customer_phone?: string;
  customer_company_name?: string;
  updates_count: number;
  unread_messages: number;
  currency?: string;
}

export interface SupplierOrderDetails extends SupplierOrder {
  request_id: number;
  budget_min?: number;
  budget_max?: number;
  request_delivery_date?: string;
  bid_id: number;
  materials_cost?: number;
  labor_cost?: number;
  other_costs?: number;
  customer_id: number;
  customer_address?: string;
  updates: OrderUpdate[];
  status_history: OrderStatusHistory[];
}

export interface OrderUpdate {
  id: number;
  order_id: number;
  title: string;
  description: string;
  image_url?: string;
  created_by: number;
  created_at: string;
  created_by_first_name?: string;
  created_by_last_name?: string;
}

export interface OrderStatusHistory {
  id: number;
  order_id: number;
  status: string;
  notes?: string;
  changed_by: number;
  created_at: string;
  changed_by_first_name?: string;
  changed_by_last_name?: string;
}

export interface SupplierOrderStatistics {
  total_orders: number;
  active_orders: number;
  shipped_orders: number;
  delivered_orders: number;
  completed_orders: number;
  cancelled_orders: number;
  total_revenue: number;
  avg_order_value: number;
  avg_delivery_days: number;
  orders_last_7d: number;
  orders_last_30d: number;
}

export interface OrderFilters {
  status?: string;
  page?: number;
  limit?: number;
  sort?: string;
  order?: 'ASC' | 'DESC';
}

export interface UpdateOrderStatusData {
  status: 'in_progress' | 'production' | 'quality_check' | 'shipped' | 'delivered' | 'cancelled';
  notes?: string;
}

export interface AddOrderUpdateData {
  title: string;
  description: string;
  image_url?: string;
}

class SupplierOrderService {
  /**
   * Get supplier orders with filtering and pagination
   */
  async getSupplierOrders(filters: OrderFilters = {}): Promise<ApiResponse<SupplierOrder[]>> {
    const params = new URLSearchParams();
    
    if (filters.status) params.append('status', filters.status);
    if (filters.page) params.append('page', filters.page.toString());
    if (filters.limit) params.append('limit', filters.limit.toString());
    if (filters.sort) params.append('sort', filters.sort);
    if (filters.order) params.append('order', filters.order);

    const response = await axiosInstance.get(`${API_ENDPOINTS.SUPPLIER_ORDERS.BASE}?${params.toString()}`);
    return response.data;
  }

  /**
   * Get supplier order by ID
   */
  async getSupplierOrderById(orderId: number): Promise<ApiResponse<SupplierOrderDetails>> {
    const response = await axiosInstance.get(API_ENDPOINTS.SUPPLIER_ORDERS.BY_ID(orderId));
    return response.data;
  }

  /**
   * Get supplier order statistics
   */
  async getSupplierOrderStatistics(): Promise<ApiResponse<SupplierOrderStatistics>> {
    const response = await axiosInstance.get(API_ENDPOINTS.SUPPLIER_ORDERS.STATS);
    return response.data;
  }

  /**
   * Update order status
   */
  async updateOrderStatus(orderId: number, data: UpdateOrderStatusData): Promise<ApiResponse<any>> {
    const response = await axiosInstance.put(API_ENDPOINTS.SUPPLIER_ORDERS.UPDATE_STATUS(orderId), data);
    return response.data;
  }

  /**
   * Add order update
   */
  async addOrderUpdate(orderId: number, data: AddOrderUpdateData): Promise<ApiResponse<any>> {
    const response = await axiosInstance.post(API_ENDPOINTS.SUPPLIER_ORDERS.ADD_UPDATE(orderId), data);
    return response.data;
  }
}

export const supplierOrderService = new SupplierOrderService();
