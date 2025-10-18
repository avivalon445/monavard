import axiosInstance from '@/utils/axios';
import { API_ENDPOINTS } from '@/config/api';
import { ApiResponse, PaginatedResponse, Bid, CreateBidData } from '@/types';

export interface BidFilters {
  status?: string;
  request_id?: number;
  page?: number;
  limit?: number;
  sort?: string;
  order?: 'ASC' | 'DESC';
}

export interface BidStatistics {
  total_bids: number;
  pending_bids: number;
  accepted_bids: number;
  rejected_bids: number;
  requests_with_bids: number;
  average_bid_price: number;
  lowest_bid_price: number;
  highest_bid_price: number;
}

export interface SupplierBidStatistics {
  total_bids: number;
  pending_bids: number;
  accepted_bids: number;
  rejected_bids: number;
  cancelled_bids: number;
  requests_bid_on: number;
  average_bid_price: number;
  lowest_bid_price: number;
  highest_bid_price: number;
  average_delivery_time: number;
  win_rate: number;
}

export interface BidsResponse {
  bids: Bid[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export const bidService = {
  /**
   * Get all bids for customer's requests
   */
  async getCustomerBids(filters: BidFilters = {}): Promise<ApiResponse<Bid[]>> {
    const params = new URLSearchParams();
    
    if (filters.status) params.append('status', filters.status);
    if (filters.request_id) params.append('request_id', filters.request_id.toString());
    if (filters.page) params.append('page', filters.page.toString());
    if (filters.limit) params.append('limit', filters.limit.toString());
    if (filters.sort) params.append('sort', filters.sort);
    if (filters.order) params.append('order', filters.order);
    
    const response = await axiosInstance.get(
      `${API_ENDPOINTS.BIDS.BASE}?${params.toString()}`
    );
    return response.data;
  },

  /**
   * Get bid by ID
   */
  async getBidById(id: number): Promise<ApiResponse<Bid>> {
    const response = await axiosInstance.get(API_ENDPOINTS.BIDS.BY_ID(id));
    return response.data;
  },

  /**
   * Accept a bid
   */
  async acceptBid(id: number): Promise<ApiResponse<any>> {
    const response = await axiosInstance.post(API_ENDPOINTS.BIDS.ACCEPT(id));
    return response.data;
  },

  /**
   * Reject a bid
   */
  async rejectBid(id: number, reason?: string): Promise<ApiResponse<any>> {
    const response = await axiosInstance.post(API_ENDPOINTS.BIDS.REJECT(id), {
      rejection_reason: reason,
    });
    return response.data;
  },

  /**
   * Get bid statistics
   */
  async getStatistics(): Promise<ApiResponse<BidStatistics>> {
    const response = await axiosInstance.get(API_ENDPOINTS.BIDS.STATS);
    return response.data;
  },

  // ===== SUPPLIER BID SERVICES =====

  /**
   * Get all bids submitted by supplier
   */
  async getSupplierBids(filters: BidFilters = {}): Promise<ApiResponse<Bid[]>> {
    const params = new URLSearchParams();
    
    if (filters.status) params.append('status', filters.status);
    if (filters.request_id) params.append('request_id', filters.request_id.toString());
    if (filters.page) params.append('page', filters.page.toString());
    if (filters.limit) params.append('limit', filters.limit.toString());
    if (filters.sort) params.append('sort', filters.sort);
    if (filters.order) params.append('order', filters.order);
    
    const response = await axiosInstance.get(
      `${API_ENDPOINTS.SUPPLIER_BIDS.BASE}?${params.toString()}`
    );
    return response.data;
  },

  /**
   * Get supplier bid by ID
   */
  async getSupplierBidById(id: number): Promise<ApiResponse<Bid>> {
    const response = await axiosInstance.get(API_ENDPOINTS.SUPPLIER_BIDS.BY_ID(id));
    return response.data;
  },

  /**
   * Update supplier bid
   */
  async updateSupplierBid(id: number, updateData: Partial<Bid>): Promise<ApiResponse<any>> {
    const response = await axiosInstance.put(API_ENDPOINTS.SUPPLIER_BIDS.UPDATE(id), updateData);
    return response.data;
  },

  /**
   * Cancel supplier bid
   */
  async cancelSupplierBid(id: number, reason?: string): Promise<ApiResponse<any>> {
    const response = await axiosInstance.post(API_ENDPOINTS.SUPPLIER_BIDS.CANCEL(id), {
      cancellation_reason: reason,
    });
    return response.data;
  },

  /**
   * Get supplier bid statistics
   */
  async getSupplierStatistics(): Promise<ApiResponse<SupplierBidStatistics>> {
    const response = await axiosInstance.get(API_ENDPOINTS.SUPPLIER_BIDS.STATS);
    return response.data;
  },

  /**
   * Create a new bid (supplier)
   */
  async createSupplierBid(bidData: CreateBidData): Promise<ApiResponse<any>> {
    const response = await axiosInstance.post(API_ENDPOINTS.SUPPLIER_BIDS.CREATE, bidData);
    return response.data;
  },
};
