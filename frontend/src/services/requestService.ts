import axiosInstance from '@/utils/axios';
import { API_ENDPOINTS } from '@/config/api';
import { Request, ApiResponse, Bid } from '@/types';

interface RequestsResponse {
  requests: Request[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

interface RequestFilters {
  status?: string;
  category_id?: number;
  page?: number;
  limit?: number;
  sort?: string;
  order?: 'ASC' | 'DESC';
}

interface RequestStatistics {
  total_requests: number;
  pending_categorization: number;
  open_for_bids: number;
  bids_received: number;
  in_progress: number;
  completed: number;
  cancelled: number;
  total_pending_bids: number;
}

interface SupplierRequestStatistics {
  total_available_requests: number;
  open_for_bids: number;
  bids_received: number;
  requests_bid_on: number;
  pending_bids: number;
  accepted_bids: number;
  avg_min_budget: number;
  avg_max_budget: number;
  expiring_soon: number;
}

interface SupplierRequestFilters {
  category_id?: number;
  budget_min?: number;
  budget_max?: number;
  delivery_date_from?: string;
  delivery_date_to?: string;
  page?: number;
  limit?: number;
  sort?: string;
  order?: 'ASC' | 'DESC';
  search?: string;
}

export const requestService = {
  /**
   * Create a new request
   */
  async createRequest(data: Partial<Request>): Promise<ApiResponse<Request>> {
    const response = await axiosInstance.post(API_ENDPOINTS.REQUESTS.CREATE, data);
    return response.data;
  },

  /**
   * Get all requests for the logged-in customer
   */
  async getMyRequests(filters?: RequestFilters): Promise<ApiResponse<RequestsResponse>> {
    const response = await axiosInstance.get(API_ENDPOINTS.REQUESTS.CUSTOMER, { 
      params: filters 
    });
    return response.data;
  },

  /**
   * Get a specific request by ID
   */
  async getRequestById(id: number): Promise<ApiResponse<Request>> {
    const response = await axiosInstance.get(`${API_ENDPOINTS.REQUESTS.CUSTOMER}/${id}`);
    return response.data;
  },

  /**
   * Update a request
   */
  async updateRequest(id: number, data: Partial<Request>): Promise<ApiResponse<Request>> {
    const response = await axiosInstance.put(`${API_ENDPOINTS.REQUESTS.CUSTOMER}/${id}`, data);
    return response.data;
  },

  /**
   * Cancel/Delete a request
   */
  async cancelRequest(id: number): Promise<ApiResponse<{ message: string }>> {
    const response = await axiosInstance.delete(`${API_ENDPOINTS.REQUESTS.CUSTOMER}/${id}`);
    return response.data;
  },

  /**
   * Get request statistics
   */
  async getStatistics(): Promise<ApiResponse<RequestStatistics>> {
    const response = await axiosInstance.get(`${API_ENDPOINTS.REQUESTS.CUSTOMER}/stats/summary`);
    return response.data;
  },

  /**
   * Get all bids for a specific request
   */
  async getRequestBids(id: number): Promise<ApiResponse<Bid[]>> {
    const response = await axiosInstance.get(`${API_ENDPOINTS.REQUESTS.CUSTOMER}/${id}/bids`);
    return response.data;
  },

  /**
   * Upload files for a request
   */
  async uploadFiles(id: number, files: File[]): Promise<ApiResponse> {
    const formData = new FormData();
    files.forEach((file) => {
      formData.append('files', file);
    });

    const response = await axiosInstance.post(
      `${API_ENDPOINTS.REQUESTS.CUSTOMER}/${id}/files`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    return response.data;
  },

  // ===== SUPPLIER REQUEST SERVICES =====

  /**
   * Get available requests for suppliers
   */
  async getAvailableRequests(filters?: SupplierRequestFilters): Promise<ApiResponse<RequestsResponse>> {
    const response = await axiosInstance.get(API_ENDPOINTS.SUPPLIER_REQUESTS.BASE, { 
      params: filters 
    });
    return response.data;
  },

  /**
   * Get supplier request by ID
   */
  async getSupplierRequestById(id: number): Promise<ApiResponse<Request>> {
    const response = await axiosInstance.get(API_ENDPOINTS.SUPPLIER_REQUESTS.BY_ID(id));
    return response.data;
  },

  /**
   * Get supplier request statistics
   */
  async getSupplierRequestStatistics(): Promise<ApiResponse<SupplierRequestStatistics>> {
    const response = await axiosInstance.get(API_ENDPOINTS.SUPPLIER_REQUESTS.STATS);
    return response.data;
  },
};

