import React, { useState, useEffect } from 'react';
import { analyticsService, AnalyticsData, AnalyticsFilters } from '@/services/analyticsService';
import { getUserFriendlyError } from '@/utils/errorMessages';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import Alert from '@/components/common/Alert';
import SupplierPageWrapper from '@/components/layout/SupplierPageWrapper';
import SupplierCardLayout from '@/components/layout/SupplierCardLayout';
import SupplierGridLayout from '@/components/layout/SupplierGridLayout';

const SupplierAnalytics: React.FC = () => {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'overview' | 'performance' | 'financial' | 'categories' | 'competitive'>('overview');
  const [filters, setFilters] = useState<AnalyticsFilters>({
    date_range: '30d'
  });

  useEffect(() => {
    fetchAnalytics();
  }, [filters]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await analyticsService.getAnalytics(filters);
      
      if (response.success && response.data) {
        setAnalytics(response.data);
      } else {
        setError('Failed to load analytics data');
      }
    } catch (err: any) {
      console.error('Error fetching analytics:', err);
      setError(getUserFriendlyError(err));
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    const symbol = '€';
    return `${symbol}${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const formatPercentage = (value: string | number) => {
    const num = typeof value === 'string' ? parseFloat(value) : value;
    return `${num.toFixed(1)}%`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getStatusBadge = (status: string) => {
    const statusStyles: { [key: string]: string } = {
      pending: 'bg-yellow-100 text-yellow-800',
      accepted: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800',
      cancelled: 'bg-gray-100 text-gray-800',
      confirmed: 'bg-blue-100 text-blue-800',
      in_progress: 'bg-purple-100 text-purple-800',
      production: 'bg-indigo-100 text-indigo-800',
      shipped: 'bg-orange-100 text-orange-800',
      delivered: 'bg-green-100 text-green-800',
      completed: 'bg-green-100 text-green-800',
    };

    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusStyles[status] || 'bg-gray-100 text-gray-800'}`}>
        {status.charAt(0).toUpperCase() + status.slice(1).replace('_', ' ')}
      </span>
    );
  };

  const handleFilterChange = (newFilters: Partial<AnalyticsFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  };

  const renderOverviewTab = () => {
    if (!analytics) return null;

    const { overview, performance, time_series } = analytics;

    return (
      <div className="space-y-6">
        {/* Key Metrics Cards */}
        <SupplierGridLayout columns={4} gap={4}>
          <SupplierCardLayout className="border-l-4 border-blue-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                <p className="text-2xl font-bold text-gray-900">{formatCurrency(overview.total_revenue)}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                </svg>
              </div>
            </div>
          </SupplierCardLayout>

          <SupplierCardLayout className="border-l-4 border-green-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Win Rate</p>
                <p className="text-2xl font-bold text-gray-900">{formatPercentage(overview.win_rate)}</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </SupplierCardLayout>

          <SupplierCardLayout className="border-l-4 border-purple-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Bids</p>
                <p className="text-2xl font-bold text-gray-900">{overview.total_bids}</p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
            </div>
          </SupplierCardLayout>

          <SupplierCardLayout className="border-l-4 border-orange-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Avg Order Value</p>
                <p className="text-2xl font-bold text-gray-900">{formatCurrency(overview.avg_order_value)}</p>
              </div>
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
              </div>
            </div>
          </SupplierCardLayout>
        </SupplierGridLayout>

        {/* Performance Overview */}
        <SupplierGridLayout columns={2} gap={4}>
          <SupplierCardLayout>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Bid Performance</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Acceptance Rate</span>
                <span className="font-medium">{formatPercentage(performance.acceptance_rate)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Rejection Rate</span>
                <span className="font-medium">{formatPercentage(performance.rejection_rate)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Cancellation Rate</span>
                <span className="font-medium">{formatPercentage(performance.cancellation_rate)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Avg Delivery Time</span>
                <span className="font-medium">{performance.avg_delivery_time} days</span>
              </div>
            </div>
          </SupplierCardLayout>

          <SupplierCardLayout>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Financial Summary</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Total Orders</span>
                <span className="font-medium">{overview.total_orders}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Completed Revenue</span>
                <span className="font-medium">{formatCurrency(analytics.financial.completed_revenue)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Cancelled Revenue</span>
                <span className="font-medium">{formatCurrency(analytics.financial.cancelled_revenue)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Completion Rate</span>
                <span className="font-medium">{formatPercentage(analytics.financial.completion_rate)}</span>
              </div>
            </div>
          </SupplierCardLayout>
        </SupplierGridLayout>

        {/* Simple Time Series Visualization */}
        <SupplierCardLayout>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Performance Over Time</h3>
          <div className="space-y-3">
            {time_series.slice(-7).map((data, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="text-sm font-medium text-gray-900">{formatDate(data.date)}</span>
                <div className="flex items-center space-x-4">
                  <span className="text-sm text-gray-600">{data.bids_count} bids</span>
                  <span className="text-sm text-gray-600">{data.orders_count} orders</span>
                  <span className="text-sm font-medium text-green-600">{formatCurrency(data.revenue)}</span>
                </div>
              </div>
            ))}
          </div>
        </SupplierCardLayout>
      </div>
    );
  };

  const renderPerformanceTab = () => {
    if (!analytics) return null;

    const { performance, bids, orders } = analytics;

    return (
      <div className="space-y-6">
        {/* Performance Metrics */}
        <SupplierGridLayout columns={3} gap={4}>
          <SupplierCardLayout>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Bid Statistics</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Total Bids</span>
                <span className="font-medium">{bids.total_bids}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Accepted</span>
                <span className="font-medium text-green-600">{bids.accepted_bids}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Pending</span>
                <span className="font-medium text-yellow-600">{bids.pending_bids}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Rejected</span>
                <span className="font-medium text-red-600">{bids.rejected_bids}</span>
              </div>
            </div>
          </SupplierCardLayout>

          <SupplierCardLayout>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Pricing Analysis</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Average Bid Price</span>
                <span className="font-medium">{formatCurrency(performance.avg_bid_price)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Min Bid Price</span>
                <span className="font-medium">{formatCurrency(performance.min_bid_price)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Max Bid Price</span>
                <span className="font-medium">{formatCurrency(performance.max_bid_price)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Price Volatility</span>
                <span className="font-medium">{formatCurrency(performance.price_volatility)}</span>
              </div>
            </div>
          </SupplierCardLayout>

          <SupplierCardLayout>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Order Status</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Total Orders</span>
                <span className="font-medium">{orders.total_orders}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">In Progress</span>
                <span className="font-medium text-blue-600">{orders.in_progress_orders}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Completed</span>
                <span className="font-medium text-green-600">{orders.completed_orders}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Cancelled</span>
                <span className="font-medium text-red-600">{orders.cancelled_orders}</span>
              </div>
            </div>
          </SupplierCardLayout>
        </SupplierGridLayout>

        {/* Delivery Performance */}
        <SupplierCardLayout>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Delivery Performance</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <p className="text-2xl font-bold text-gray-900">{performance.avg_delivery_time}</p>
              <p className="text-sm text-gray-600">Avg Delivery Time (days)</p>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <p className="text-2xl font-bold text-gray-900">{orders.avg_delivery_days}</p>
              <p className="text-sm text-gray-600">Avg Order Duration (days)</p>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <p className="text-2xl font-bold text-gray-900">{performance.categories_bid_on}</p>
              <p className="text-sm text-gray-600">Categories Active</p>
            </div>
          </div>
        </SupplierCardLayout>
      </div>
    );
  };

  const renderFinancialTab = () => {
    if (!analytics) return null;

    const { financial, time_series } = analytics;

    return (
      <div className="space-y-6">
        {/* Financial Overview */}
        <SupplierGridLayout columns={3} gap={4}>
          <SupplierCardLayout className="border-l-4 border-green-500">
            <div className="text-center">
              <p className="text-3xl font-bold text-green-600">{formatCurrency(financial.total_revenue)}</p>
              <p className="text-sm text-gray-600">Total Revenue</p>
            </div>
          </SupplierCardLayout>

          <SupplierCardLayout className="border-l-4 border-blue-500">
            <div className="text-center">
              <p className="text-3xl font-bold text-blue-600">{formatCurrency(financial.avg_order_value)}</p>
              <p className="text-sm text-gray-600">Average Order Value</p>
            </div>
          </SupplierCardLayout>

          <SupplierCardLayout className="border-l-4 border-purple-500">
            <div className="text-center">
              <p className="text-3xl font-bold text-purple-600">{financial.total_orders}</p>
              <p className="text-sm text-gray-600">Total Orders</p>
            </div>
          </SupplierCardLayout>
        </SupplierGridLayout>

        {/* Revenue Breakdown */}
        <SupplierGridLayout columns={2} gap={4}>
          <SupplierCardLayout>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Revenue Breakdown</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                <span className="text-sm text-gray-600">Completed Revenue</span>
                <span className="font-medium text-green-600">{formatCurrency(financial.completed_revenue)}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-red-50 rounded-lg">
                <span className="text-sm text-gray-600">Cancelled Revenue</span>
                <span className="font-medium text-red-600">{formatCurrency(financial.cancelled_revenue)}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <span className="text-sm text-gray-600">Net Revenue</span>
                <span className="font-medium text-gray-900">{formatCurrency(financial.completed_revenue - financial.cancelled_revenue)}</span>
              </div>
            </div>
          </SupplierCardLayout>

          <SupplierCardLayout>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Order Value Range</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Minimum Order Value</span>
                <span className="font-medium">{formatCurrency(financial.min_order_value)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Maximum Order Value</span>
                <span className="font-medium">{formatCurrency(financial.max_order_value)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Average Order Duration</span>
                <span className="font-medium">{financial.avg_order_duration_days} days</span>
              </div>
            </div>
          </SupplierCardLayout>
        </SupplierGridLayout>

        {/* Revenue Over Time */}
        <SupplierCardLayout>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Revenue Over Time</h3>
          <div className="space-y-3">
            {time_series.slice(-10).map((data, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="text-sm font-medium text-gray-900">{formatDate(data.date)}</span>
                <div className="flex items-center space-x-4">
                  <span className="text-sm text-gray-600">{data.orders_count} orders</span>
                  <span className="text-sm font-medium text-green-600">{formatCurrency(data.revenue)}</span>
                </div>
              </div>
            ))}
          </div>
        </SupplierCardLayout>
      </div>
    );
  };

  const renderCategoriesTab = () => {
    if (!analytics) return null;

    const { categories, top_categories } = analytics;

    return (
      <div className="space-y-6">
        {/* Top Categories */}
        <SupplierCardLayout>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Performing Categories</h3>
          <div className="space-y-4">
            {top_categories.map((category, index) => (
              <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-sm font-bold text-blue-600">#{index + 1}</span>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{category.category_name}</p>
                    <p className="text-sm text-gray-600">{category.bids_count} bids • {category.orders_count} orders</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-medium text-green-600">{formatCurrency(category.revenue)}</p>
                  <p className="text-sm text-gray-600">{formatPercentage(category.win_rate)} win rate</p>
                </div>
              </div>
            ))}
          </div>
        </SupplierCardLayout>

        {/* All Categories */}
        <SupplierCardLayout>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Category Performance</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Bids</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Orders</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Revenue</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Win Rate</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {categories.map((category, index) => (
                  <tr key={index}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {category.category_name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {category.bids_count}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {category.orders_count}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatCurrency(category.revenue)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatPercentage(category.acceptance_rate)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </SupplierCardLayout>
      </div>
    );
  };

  const renderCompetitiveTab = () => {
    if (!analytics) return null;

    const { competitive, recent_activity } = analytics;

    return (
      <div className="space-y-6">
        {/* Competitive Analysis */}
        <SupplierGridLayout columns={2} gap={4}>
          <SupplierCardLayout>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Market Participation</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Total Requests Available</span>
                <span className="font-medium">{competitive.total_requests_available}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Bids Submitted</span>
                <span className="font-medium">{competitive.total_bids_submitted}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Participation Rate</span>
                <span className="font-medium">{formatPercentage(competitive.bid_participation_rate)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Win Rate</span>
                <span className="font-medium text-green-600">{formatPercentage(competitive.win_rate)}</span>
              </div>
            </div>
          </SupplierCardLayout>

          <SupplierCardLayout>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Market Position</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Categories Active</span>
                <span className="font-medium">{competitive.categories_active}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Customers Served</span>
                <span className="font-medium">{competitive.customers_served}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Avg Bid Price</span>
                <span className="font-medium">{formatCurrency(competitive.avg_bid_price)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Avg Delivery Time</span>
                <span className="font-medium">{competitive.avg_delivery_time} days</span>
              </div>
            </div>
          </SupplierCardLayout>
        </SupplierGridLayout>

        {/* Recent Activity */}
        <SupplierCardLayout>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
          <div className="space-y-3">
            {recent_activity.slice(0, 10).map((activity, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    activity.activity_type === 'bid' ? 'bg-blue-100' : 'bg-green-100'
                  }`}>
                    <svg className={`w-4 h-4 ${
                      activity.activity_type === 'bid' ? 'text-blue-600' : 'text-green-600'
                    }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      {activity.activity_type === 'bid' ? (
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                      ) : (
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                      )}
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{activity.title}</p>
                    <p className="text-xs text-gray-600">{formatDate(activity.activity_date)}</p>
                  </div>
                </div>
                <div className="text-right">
                  {getStatusBadge(activity.status)}
                  <p className="text-sm font-medium text-gray-900 mt-1">{formatCurrency(activity.amount)}</p>
                </div>
              </div>
            ))}
          </div>
        </SupplierCardLayout>
      </div>
    );
  };

  const filtersComponent = (
    <div className="flex flex-wrap items-center gap-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Date Range</label>
        <select
          value={filters.date_range || '30d'}
          onChange={(e) => handleFilterChange({ date_range: e.target.value as any })}
          className="input"
        >
          <option value="7d">Last 7 days</option>
          <option value="30d">Last 30 days</option>
          <option value="90d">Last 90 days</option>
          <option value="1y">Last year</option>
          <option value="all">All time</option>
        </select>
      </div>
    </div>
  );

  const headerActions = (
    <div className="flex items-center space-x-2">
      {(['overview', 'performance', 'financial', 'categories', 'competitive'] as const).map((tab) => (
        <button
          key={tab}
          onClick={() => setActiveTab(tab)}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            activeTab === tab
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          {tab.charAt(0).toUpperCase() + tab.slice(1)}
        </button>
      ))}
    </div>
  );

  if (loading && !analytics) {
    return (
      <SupplierPageWrapper
        title="Analytics"
        subtitle="Loading your performance insights..."
        headerActions={headerActions}
        filters={filtersComponent}
      >
        <div className="flex justify-center py-12">
          <LoadingSpinner />
        </div>
      </SupplierPageWrapper>
    );
  }

  if (error) {
    return (
      <SupplierPageWrapper
        title="Analytics"
        subtitle="Performance insights and analytics"
        headerActions={headerActions}
        filters={filtersComponent}
      >
        <Alert
          type="error"
          message={error}
          onClose={() => setError('')}
          className="mb-6"
        />
      </SupplierPageWrapper>
    );
  }

  if (!analytics) {
    return (
      <SupplierPageWrapper
        title="Analytics"
        subtitle="Performance insights and analytics"
        headerActions={headerActions}
        filters={filtersComponent}
      >
        <SupplierCardLayout>
          <div className="text-center py-12">
            <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Analytics Data</h3>
            <p className="text-gray-500">Start bidding on requests to see your analytics and performance insights.</p>
          </div>
        </SupplierCardLayout>
      </SupplierPageWrapper>
    );
  }

  return (
    <SupplierPageWrapper
      title="Analytics"
      subtitle={`Performance insights for the last ${filters.date_range === '7d' ? '7 days' : 
        filters.date_range === '30d' ? '30 days' : 
        filters.date_range === '90d' ? '90 days' : 
        filters.date_range === '1y' ? 'year' : 'all time'}`}
      headerActions={headerActions}
      filters={filtersComponent}
    >
      {error && (
        <Alert
          type="error"
          message={error}
          onClose={() => setError('')}
          className="mb-6"
        />
      )}

      {activeTab === 'overview' && renderOverviewTab()}
      {activeTab === 'performance' && renderPerformanceTab()}
      {activeTab === 'financial' && renderFinancialTab()}
      {activeTab === 'categories' && renderCategoriesTab()}
      {activeTab === 'competitive' && renderCompetitiveTab()}
    </SupplierPageWrapper>
  );
};

export default SupplierAnalytics;
