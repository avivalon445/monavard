import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { CustomerDashboardData } from '@/types';
import axiosInstance from '@/utils/axios';
import { API_ENDPOINTS } from '@/config/api';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import Alert from '@/components/common/Alert';
import { getUserFriendlyError } from '@/utils/errorMessages';

const CustomerDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [dashboardData, setDashboardData] = useState<CustomerDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await axiosInstance.get(API_ENDPOINTS.DASHBOARD.CUSTOMER);
      
      if (response.data.success && response.data.data) {
        setDashboardData(response.data.data);
      }
    } catch (err: any) {
      setError(getUserFriendlyError(err));
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number, currency: string = 'EUR') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
    }).format(amount);
  };

  const getStatusBadge = (status: string) => {
    const statusStyles: { [key: string]: string } = {
      pending_categorization: 'badge-warning',
      open_for_bids: 'badge-primary',
      bids_received: 'badge-success',
      in_progress: 'badge-info',
      completed: 'badge-secondary',
      cancelled: 'badge-error',
      expired: 'badge-secondary',
    };

    const statusLabels: { [key: string]: string } = {
      pending_categorization: 'Pending',
      open_for_bids: 'Open',
      bids_received: 'Has Bids',
      in_progress: 'Active',
      completed: 'Done',
      cancelled: 'Cancelled',
      expired: 'Expired',
    };

    return (
      <span className={`${statusStyles[status] || 'badge-secondary'} px-3 py-1 text-xs`}>
        {statusLabels[status] || status}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  const metrics = dashboardData?.metrics;
  const recentRequests = dashboardData?.recent_requests || [];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto p-6 lg:p-8">
        {/* Error Alert */}
        {error && (
          <Alert
            type="error"
            message={error}
            onClose={() => setError('')}
            className="mb-6"
          />
        )}

        {/* Welcome Banner */}
        <div className="mb-6 bg-gradient-to-r from-primary-600 to-primary-800 rounded-2xl p-8 text-white shadow-lg">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between">
            <div className="mb-4 md:mb-0">
              <h1 className="text-3xl font-bold mb-2">Welcome back! 👋</h1>
              <p className="text-primary-100">Ready to bring your custom product ideas to life?</p>
            </div>
            <Link
              to="/customer/requests/new"
              className="btn bg-white text-primary-600 hover:bg-gray-100 btn-lg shadow-lg"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Create New Request
            </Link>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {/* Active Requests */}
          <div className="card p-6 hover:shadow-xl transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
                <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              {metrics && metrics.requests_last_7d > 0 && (
                <span className="badge-primary text-xs">{metrics.requests_last_7d} this week</span>
              )}
            </div>
            <div className="text-3xl font-bold text-gray-900 mb-1">
              {metrics?.active_requests || 0}
            </div>
            <div className="text-sm text-gray-600 mb-3">Active Requests</div>
            {metrics && metrics.total_requests > 0 && (
              <div className="flex items-center text-xs text-gray-500">
                <span>{metrics.total_requests} total</span>
              </div>
            )}
          </div>

          {/* Pending Offers */}
          <div className="card p-6 hover:shadow-xl transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className="w-14 h-14 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center shadow-lg">
                <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              {metrics && metrics.bids_last_7d > 0 && (
                <span className="badge-success text-xs">{metrics.bids_last_7d} new</span>
              )}
            </div>
            <div className="text-3xl font-bold text-gray-900 mb-1">
              {metrics?.pending_bids || 0}
            </div>
            <div className="text-sm text-gray-600 mb-3">Pending Offers</div>
            <Link to="/customer/bids?status=pending" className="text-xs text-primary-600 hover:text-primary-700 font-medium">
              Review offers →
            </Link>
          </div>

          {/* Active Orders */}
          <div className="card p-6 hover:shadow-xl transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
              </div>
              {metrics && metrics.orders_last_7d > 0 && (
                <span className="badge-info text-xs">{metrics.orders_last_7d} recent</span>
              )}
            </div>
            <div className="text-3xl font-bold text-gray-900 mb-1">
              {metrics?.active_orders || 0}
            </div>
            <div className="text-sm text-gray-600 mb-3">Active Orders</div>
            <Link to="/customer/orders" className="text-xs text-primary-600 hover:text-primary-700 font-medium">
              Track orders →
            </Link>
          </div>

          {/* Total Investment */}
          <div className="card p-6 bg-gradient-to-br from-gray-900 to-gray-800 text-white hover:shadow-xl transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className="w-14 h-14 bg-white/10 rounded-xl flex items-center justify-center backdrop-blur-sm">
                <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
            <div className="text-3xl font-bold mb-1">
              {metrics ? formatCurrency(metrics.total_spent) : '€0'}
            </div>
            <div className="text-sm text-gray-300 mb-3">Total Investment</div>
            <div className="text-xs text-green-400">
              {metrics && metrics.avg_order_amount > 0 && (
                <>Avg {formatCurrency(metrics.avg_order_amount)} per order</>
              )}
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          {/* Recent Requests */}
          <div className="lg:col-span-2">
            <div className="card p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900">Recent Requests</h2>
                <Link to="/customer/requests" className="text-sm text-primary-600 hover:text-primary-700 font-medium flex items-center">
                  View All
                  <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              </div>

              {recentRequests.length === 0 ? (
                <div className="text-center py-12">
                  <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                  </svg>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No requests yet</h3>
                  <p className="text-gray-600 mb-4">Start by creating your first product request</p>
                  <Link to="/customer/requests/new" className="btn btn-primary btn-sm">
                    Create Request
                  </Link>
                </div>
              ) : (
                <div className="space-y-3">
                  {recentRequests.map((request) => (
                    <div
                      key={request.id}
                      onClick={() => navigate(`/customer/requests/${request.id}`)}
                      className="flex items-center p-4 border border-gray-200 rounded-xl hover:border-primary-300 hover:bg-primary-50/30 transition-all cursor-pointer group"
                    >
                      <div className="w-12 h-12 bg-gradient-to-br from-primary-100 to-primary-200 rounded-lg flex items-center justify-center mr-4 group-hover:from-primary-200 group-hover:to-primary-300 transition-all">
                        <svg className="w-6 h-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-gray-900 mb-1 truncate">{request.title}</h3>
                        <div className="flex items-center space-x-3 text-sm text-gray-600">
                          <span className="flex items-center">
                            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                            </svg>
                            {request.bid_count} {request.bid_count === 1 ? 'offer' : 'offers'}
                          </span>
                          {request.min_bid_price && (
                            <span className="font-semibold text-gray-900">
                              from {formatCurrency(request.min_bid_price, request.currency)}
                            </span>
                          )}
                        </div>
                      </div>
                      {getStatusBadge(request.status)}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Quick Actions & Support */}
          <div className="space-y-6">
            {/* Action Card */}
            <div className="card p-6">
              <h3 className="font-bold text-gray-900 mb-4">Quick Actions</h3>
              <div className="space-y-2">
                <Link to="/customer/requests/new" className="flex items-center justify-between p-3 bg-primary-50 rounded-lg hover:bg-primary-100 transition-colors">
                  <span className="font-medium text-primary-700">Create Request</span>
                  <svg className="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                </Link>
                <Link to="/customer/requests" className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                  <span className="font-medium text-gray-700">My Requests</span>
                  <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
                <Link to="/customer/bids?status=pending" className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                  <span className="font-medium text-gray-700">Review Offers</span>
                  {metrics && metrics.pending_bids > 0 && (
                    <span className="badge-success">{metrics.pending_bids} New</span>
                  )}
                </Link>
              </div>
            </div>

            {/* Support Card */}
            <div className="card p-6 bg-gradient-to-br from-blue-500 to-blue-600 text-white">
              <div className="flex items-center mb-3">
                <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center mr-3">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                </div>
                <div>
                  <h4 className="font-bold">Need Help?</h4>
                  <p className="text-sm text-blue-100">24/7 Support Available</p>
                </div>
              </div>
              <Link to="/contact" className="w-full btn btn-sm bg-white text-blue-600 hover:bg-blue-50 mt-2 block text-center">
                Contact Support
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomerDashboard;
