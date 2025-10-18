import axiosInstance from '@/utils/axios';
import { API_ENDPOINTS } from '@/config/api';
import { ApiResponse, Order, OrderDetails, OrderStatistics } from '@/types';

export interface OrderFilters {
  status?: string;
  page?: number;
  limit?: number;
  sort?: string;
  order?: 'ASC' | 'DESC';
}

/**
 * Get all customer orders
 */
export const getCustomerOrders = async (filters?: OrderFilters): Promise<ApiResponse<Order[]>> => {
  const params = new URLSearchParams();
  
  if (filters?.status) params.append('status', filters.status);
  if (filters?.page) params.append('page', filters.page.toString());
  if (filters?.limit) params.append('limit', filters.limit.toString());
  if (filters?.sort) params.append('sort', filters.sort);
  if (filters?.order) params.append('order', filters.order);
  
  const response = await axiosInstance.get<ApiResponse<Order[]>>(
    `${API_ENDPOINTS.ORDERS.BASE}?${params.toString()}`
  );
  
  return response.data;
};

/**
 * Get order by ID
 */
export const getOrderById = async (id: number): Promise<ApiResponse<OrderDetails>> => {
  const response = await axiosInstance.get<ApiResponse<OrderDetails>>(
    API_ENDPOINTS.ORDERS.DETAILS(id)
  );
  
  return response.data;
};

/**
 * Get order statistics
 */
export const getOrderStatistics = async (): Promise<ApiResponse<OrderStatistics>> => {
  const response = await axiosInstance.get<ApiResponse<OrderStatistics>>(
    API_ENDPOINTS.ORDERS.STATS
  );
  
  return response.data;
};

/**
 * Cancel an order
 */
export const cancelOrder = async (id: number, reason?: string): Promise<ApiResponse> => {
  const response = await axiosInstance.post<ApiResponse>(
    API_ENDPOINTS.ORDERS.CANCEL(id),
    { reason }
  );
  
  return response.data;
};

/**
 * Confirm delivery of an order
 */
export const confirmDelivery = async (id: number): Promise<ApiResponse> => {
  const response = await axiosInstance.post<ApiResponse>(
    API_ENDPOINTS.ORDERS.CONFIRM_DELIVERY(id)
  );
  
  return response.data;
};

/**
 * Complete an order
 */
export const completeOrder = async (id: number): Promise<ApiResponse> => {
  const response = await axiosInstance.post<ApiResponse>(
    API_ENDPOINTS.ORDERS.COMPLETE(id)
  );
  
  return response.data;
};
