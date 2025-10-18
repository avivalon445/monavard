import axiosInstance from '@/utils/axios';
import { API_ENDPOINTS } from '@/config/api';
import { ApiResponse } from '@/types';

// Supplier Financial Interfaces
export interface FinancialSummary {
  current_period: {
    orders_count: number;
    total_revenue: number;
    total_commission: number;
    net_revenue: number;
    avg_order_value: number;
    completed_orders: number;
    completed_revenue: number;
    orders_today: number;
  };
  previous_period: {
    orders_count: number;
    total_revenue: number;
    total_commission: number;
    net_revenue: number;
  };
  growth: {
    revenue_growth: string;
    orders_growth: string;
    net_revenue_growth: string;
  };
  period: string;
  generated_at: string;
}

export interface FinancialReport {
  summary: {
    total_orders: number;
    total_revenue: number;
    total_commission: number;
    net_revenue: number;
    avg_order_value: number;
    min_order_value: number;
    max_order_value: number;
    completed_orders: number;
    completed_revenue: number;
    completed_commission: number;
    cancelled_orders: number;
    cancelled_revenue: number;
  };
  revenue_by_period: {
    period_type: string;
    data: Array<{
      period: string;
      order_count: number;
      revenue: number;
      commission: number;
      net_revenue: number;
      avg_order_value: number;
    }>;
  };
  revenue_by_category: Array<{
    category_name: string;
    order_count: number;
    revenue: number;
    avg_order_value: number;
  }>;
  payment_status_breakdown: Array<{
    status: string;
    order_count: number;
    total_amount: number;
    avg_amount: number;
  }>;
  top_customers: Array<{
    first_name: string;
    last_name: string;
    company_name?: string;
    order_count: number;
    total_revenue: number;
    avg_order_value: number;
    last_order_date: string;
  }>;
  detailed_orders?: Array<{
    id: number;
    order_number: string;
    total_amount: number;
    commission_amount: number;
    net_amount: number;
    status: string;
    created_at: string;
    delivery_date?: string;
    project_title: string;
    category_name?: string;
    customer_first_name: string;
    customer_last_name: string;
    customer_company?: string;
  }>;
  filters: {
    date_from?: string;
    date_to?: string;
    report_type: string;
    group_by: string;
  };
  generated_at: string;
}

export interface TaxReport {
  tax_year: number;
  monthly_breakdown: Array<{
    total_orders: number;
    gross_revenue: number;
    platform_commission: number;
    net_revenue: number;
    tax_year: number;
    tax_month: number;
    period: string;
  }>;
  quarterly_totals: Array<{
    quarter: number;
    orders: number;
    gross_revenue: number;
    platform_commission: number;
    net_revenue: number;
  }>;
  annual_total: {
    total_orders: number;
    annual_gross_revenue: number;
    annual_platform_commission: number;
    annual_net_revenue: number;
  };
  generated_at: string;
}

export interface CommissionBreakdown {
  monthly_breakdown: Array<{
    period: string;
    order_count: number;
    gross_revenue: number;
    commission_paid: number;
    avg_commission_rate: number;
    net_earnings: number;
  }>;
  total_summary: {
    total_gross_revenue: number;
    total_commission_paid: number;
    overall_commission_rate: number;
    total_net_earnings: number;
  };
  filters: {
    date_from?: string;
    date_to?: string;
  };
  generated_at: string;
}

export interface FinancialFilters {
  date_from?: string;
  date_to?: string;
  report_type?: string;
  group_by?: string;
  period?: string;
  year?: number;
  country?: string;
}

/**
 * Supplier Financial Service
 * Handles all supplier financial-related API calls
 */
export const supplierFinancialService = {
  /**
   * Get financial report
   */
  async getFinancialReport(filters: FinancialFilters = {}): Promise<ApiResponse<FinancialReport>> {
    const params = new URLSearchParams();
    if (filters.date_from) params.append('date_from', filters.date_from);
    if (filters.date_to) params.append('date_to', filters.date_to);
    if (filters.report_type) params.append('report_type', filters.report_type);
    if (filters.group_by) params.append('group_by', filters.group_by);

    const response = await axiosInstance.get(API_ENDPOINTS.SUPPLIER_FINANCIAL.REPORT, { params });
    return response.data;
  },

  /**
   * Get financial summary
   */
  async getFinancialSummary(period: string = '30d'): Promise<ApiResponse<FinancialSummary>> {
    const response = await axiosInstance.get(API_ENDPOINTS.SUPPLIER_FINANCIAL.SUMMARY, {
      params: { period }
    });
    return response.data;
  },

  /**
   * Get tax report
   */
  async getTaxReport(filters: FinancialFilters = {}): Promise<ApiResponse<TaxReport>> {
    const params = new URLSearchParams();
    if (filters.year) params.append('year', filters.year.toString());
    if (filters.country) params.append('country', filters.country);

    const response = await axiosInstance.get(API_ENDPOINTS.SUPPLIER_FINANCIAL.TAX, { params });
    return response.data;
  },

  /**
   * Get commission breakdown
   */
  async getCommissionBreakdown(filters: FinancialFilters = {}): Promise<ApiResponse<CommissionBreakdown>> {
    const params = new URLSearchParams();
    if (filters.date_from) params.append('date_from', filters.date_from);
    if (filters.date_to) params.append('date_to', filters.date_to);

    const response = await axiosInstance.get(API_ENDPOINTS.SUPPLIER_FINANCIAL.COMMISSION, { params });
    return response.data;
  },
};
