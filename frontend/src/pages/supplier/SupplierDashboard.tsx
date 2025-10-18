import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import SupplierPageLayout from '@/components/layout/SupplierPageLayout';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import Alert from '@/components/common/Alert';
import { dashboardService, DashboardData } from '@/services/dashboardService';
import { getUserFriendlyError } from '@/utils/errorMessages';

const SupplierDashboard: React.FC = () => {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await dashboardService.getSupplierDashboard();
      if (response.success && response.data) {
        setDashboardData(response.data);
      } else {
        setError('Failed to load dashboard data');
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setError(getUserFriendlyError(error));
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number, currency: string = 'EUR') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const getTimeAgo = (dateString: string) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}d ago`;
    return formatDate(dateString);
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { class: 'badge-warning', text: 'Pending' },
      accepted: { class: 'badge-success', text: 'Accepted' },
      rejected: { class: 'badge-error', text: 'Rejected' },
      cancelled: { class: 'badge-secondary', text: 'Cancelled' },
      confirmed: { class: 'badge-info', text: 'Confirmed' },
      in_progress: { class: 'badge-warning', text: 'In Progress' },
      completed: { class: 'badge-success', text: 'Completed' },
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || { class: 'badge-secondary', text: status };
    return <span className={`${config.class} text-xs`}>{config.text}</span>;
  };

  if (loading) {
    return (
      <SupplierPageLayout
        title="Business Overview"
        subtitle="Loading your dashboard data..."
      >
        <div className="flex justify-center py-12">
          <LoadingSpinner />
        </div>
      </SupplierPageLayout>
    );
  }

  if (error) {
    return (
      <SupplierPageLayout
        title="Business Overview"
        subtitle="Monitor your performance and manage operations efficiently"
      >
        <Alert
          type="error"
          message={error}
          onClose={() => setError('')}
          className="mb-6"
        />
      </SupplierPageLayout>
    );
  }

  const headerActions = (
    <div className="flex items-center space-x-3">
      <button className="btn btn-outline btn-sm">
        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        Export Report
      </button>
      <button className="btn-primary btn-sm bg-green-600 hover:bg-green-700 focus:ring-green-500">
        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
        Submit Bid
      </button>
    </div>
  );

  return (
    <SupplierPageLayout
      title="Business Overview"
      subtitle="Monitor your performance and manage operations efficiently"
      headerActions={headerActions}
    >

        {/* KPI Stats Grid - Professional Management Style */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {/* Available Requests */}
          <div className="card p-5 border-l-4 border-blue-500">
            <div className="flex items-center justify-between mb-3">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <span className="badge-info text-xs">+{dashboardData?.metrics.requests_bid_last_7d || 0} this week</span>
            </div>
            <div className="text-3xl font-bold text-gray-900 mb-1">{dashboardData?.available_requests.length || 0}</div>
            <div className="text-sm text-gray-600 mb-2">Available Requests</div>
            <Link to="/supplier/requests" className="text-xs text-blue-600 hover:text-blue-700 font-medium">
              Browse requests →
            </Link>
          </div>

          {/* Pending Bids */}
          <div className="card p-5 border-l-4 border-yellow-500">
            <div className="flex items-center justify-between mb-3">
              <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <span className="badge-warning text-xs">{dashboardData?.metrics.pending_bids || 0} pending</span>
            </div>
            <div className="text-3xl font-bold text-gray-900 mb-1">{dashboardData?.metrics.total_bids || 0}</div>
            <div className="text-sm text-gray-600 mb-2">Total Bids</div>
            <div className="text-xs text-gray-500">Win rate: {dashboardData?.metrics.win_rate || 0}%</div>
          </div>

          {/* Active Orders */}
          <div className="card p-5 border-l-4 border-green-500">
            <div className="flex items-center justify-between mb-3">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <span className="badge-success text-xs">{dashboardData?.metrics.active_orders || 0} active</span>
            </div>
            <div className="text-3xl font-bold text-gray-900 mb-1">{dashboardData?.metrics.total_orders || 0}</div>
            <div className="text-sm text-gray-600 mb-2">Total Orders</div>
            <div className="text-xs text-gray-500">{dashboardData?.metrics.completed_orders || 0} completed</div>
          </div>

          {/* Revenue */}
          <div className="card p-5 border-l-4 border-purple-500 bg-gradient-to-br from-purple-50 to-white">
            <div className="flex items-center justify-between mb-3">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
            <div className="text-3xl font-bold text-gray-900 mb-1">{formatCurrency(dashboardData?.metrics.total_revenue || 0)}</div>
            <div className="text-sm text-gray-600 mb-2">Total Revenue</div>
            <div className="flex items-center text-xs text-green-600 font-medium">
              <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M12 7a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0V8.414l-4.293 4.293a1 1 0 01-1.414 0L8 10.414l-4.293 4.293a1 1 0 01-1.414-1.414l5-5a1 1 0 011.414 0L11 10.586 14.586 7H12z" clipRule="evenodd" />
              </svg>
              {dashboardData?.metrics.completed_orders_count || 0} orders completed
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          {/* Recent Requests - Table Style */}
          <div className="lg:col-span-2">
            <div className="card p-6">
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-lg font-bold text-gray-900">New Request Opportunities</h2>
                <Link to="/supplier/requests" className="text-sm text-green-600 hover:text-green-700 font-medium flex items-center">
                  View All
                  <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              </div>
              
              {/* Table */}
              <div className="overflow-x-auto">
                {dashboardData?.available_requests.length === 0 ? (
                  <div className="text-center py-8">
                    <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <p className="text-gray-500 text-sm">No available requests at the moment</p>
                    <Link to="/supplier/requests" className="text-blue-600 hover:text-blue-700 text-sm font-medium mt-2 inline-block">
                      Browse all requests →
                    </Link>
                  </div>
                ) : (
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left text-xs font-semibold text-gray-600 pb-3">Request</th>
                        <th className="text-left text-xs font-semibold text-gray-600 pb-3">Budget</th>
                        <th className="text-left text-xs font-semibold text-gray-600 pb-3">Timeline</th>
                        <th className="text-right text-xs font-semibold text-gray-600 pb-3">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {dashboardData?.available_requests.slice(0, 3).map((request) => (
                        <tr key={request.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                          <td className="py-4">
                            <div className="font-medium text-gray-900 mb-1">{request.title}</div>
                            <div className="flex items-center space-x-2 text-xs text-gray-500">
                              <span className="flex items-center">
                                <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                                </svg>
                                {request.bid_count} bids
                              </span>
                              <span className="text-green-600 font-medium">• {request.category_name || 'General'}</span>
                            </div>
                          </td>
                          <td className="py-4 text-sm font-semibold text-gray-900">
                            {request.budget_min && request.budget_max 
                              ? `${formatCurrency(request.budget_min, request.currency)} - ${formatCurrency(request.budget_max, request.currency)}`
                              : request.budget_min
                              ? `From ${formatCurrency(request.budget_min, request.currency)}`
                              : request.budget_max
                              ? `Up to ${formatCurrency(request.budget_max, request.currency)}`
                              : 'Not specified'}
                          </td>
                          <td className="py-4 text-sm text-gray-600">
                            {request.delivery_date ? formatDate(request.delivery_date) : 'Flexible'}
                          </td>
                          <td className="py-4 text-right">
                            <Link 
                              to={`/supplier/requests/${request.id}/bid`}
                              className="btn btn-sm bg-green-600 text-white hover:bg-green-700"
                            >
                              Place Bid
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          </div>

          {/* Performance & Quick Stats */}
          <div className="space-y-6">
            {/* Performance Metrics */}
            <div className="card p-6">
              <h3 className="font-bold text-gray-900 mb-4">Performance Metrics</h3>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-gray-600">Win Rate</span>
                    <span className="text-sm font-bold text-gray-900">{dashboardData?.metrics.win_rate || 0}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-green-500 h-2 rounded-full" 
                      style={{ width: `${Math.min(dashboardData?.metrics.win_rate || 0, 100)}%` }}
                    ></div>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    {dashboardData?.metrics.win_rate && dashboardData.metrics.win_rate > 55 
                      ? 'Above industry average (55%)' 
                      : 'Build your reputation to improve'}
                  </p>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-gray-600">Avg Bid Price</span>
                    <span className="text-sm font-bold text-gray-900">{formatCurrency(dashboardData?.metrics.avg_bid_price || 0)}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-500 h-2 rounded-full" 
                      style={{ width: `${Math.min((dashboardData?.metrics.avg_bid_price || 0) / 1000 * 10, 100)}%` }}
                    ></div>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Range: {formatCurrency(dashboardData?.metrics.min_bid_price || 0)} - {formatCurrency(dashboardData?.metrics.max_bid_price || 0)}
                  </p>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-gray-600">Avg Delivery Time</span>
                    <span className="text-sm font-bold text-gray-900">{Math.round(dashboardData?.metrics.avg_delivery_time || 0)} days</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-purple-500 h-2 rounded-full" 
                      style={{ width: `${Math.min((dashboardData?.metrics.avg_delivery_time || 0) / 30 * 100, 100)}%` }}
                    ></div>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    {dashboardData?.metrics.total_bids || 0} bids submitted
                  </p>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="card p-6">
              <h3 className="font-bold text-gray-900 mb-4">Quick Actions</h3>
              <div className="space-y-2">
                <Link to="/supplier/requests" className="flex items-center justify-between p-3 bg-green-50 rounded-lg hover:bg-green-100 transition-colors">
                  <span className="text-sm font-medium text-green-700">Browse Requests</span>
                  <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </Link>
                <Link to="/supplier/bids" className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                  <span className="text-sm font-medium text-gray-700">Manage Bids</span>
                  <span className="badge-warning">{dashboardData?.metrics.pending_bids || 0} Pending</span>
                </Link>
                <Link to="/supplier/orders" className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                  <span className="text-sm font-medium text-gray-700">Track Orders</span>
                  <span className="badge-success">{dashboardData?.metrics.active_orders || 0} Active</span>
                </Link>
                <Link to="/supplier/analytics" className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                  <span className="text-sm font-medium text-gray-700">View Analytics</span>
                  <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Section - Activity & Analytics */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Activity Log */}
          <div className="card p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-gray-900">Recent Activity</h2>
              <Link to="/supplier/bids" className="text-sm text-gray-600 hover:text-gray-900">View All</Link>
            </div>
            <div className="space-y-4">
              {dashboardData?.recent_activity.length === 0 ? (
                <div className="text-center py-8">
                  <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="text-gray-500 text-sm">No recent activity</p>
                  <p className="text-gray-400 text-xs mt-1">Submit your first bid to see activity here</p>
                </div>
              ) : (
                dashboardData?.recent_activity.slice(0, 4).map((activity, i) => (
                  <div key={i} className="flex items-start space-x-3 pb-4 border-b border-gray-100 last:border-0">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                      activity.status === 'accepted' || activity.status === 'completed' ? 'bg-green-100' :
                      activity.status === 'pending' ? 'bg-yellow-100' : 'bg-blue-100'
                    }`}>
                      {activity.activity_type === 'bid_submitted' ? (
                        <svg className="w-4 h-4 text-yellow-600" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                        </svg>
                      ) : (
                        <svg className="w-4 h-4 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">{activity.action}</p>
                      <p className="text-sm text-gray-600">{activity.project_name}</p>
                      <p className="text-xs text-gray-500 mt-1">{getTimeAgo(activity.created_at)}</p>
                    </div>
                    {activity.status && (
                      <div className="flex-shrink-0">
                        {getStatusBadge(activity.status)}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Monthly Performance Chart Representation */}
          <div className="card p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-gray-900">Monthly Performance</h2>
              <select className="text-sm border border-gray-300 rounded-lg px-3 py-1.5">
                <option>Last 30 days</option>
                <option>Last 90 days</option>
                <option>This year</option>
              </select>
            </div>
            
            {/* Simple Chart Visualization */}
            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Bids Submitted</span>
                <span className="font-semibold text-gray-900">{dashboardData?.metrics.bids_last_30d || 0}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Bids Won</span>
                <span className="font-semibold text-green-600">{dashboardData?.metrics.accepted_bids || 0}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Orders Completed</span>
                <span className="font-semibold text-gray-900">{dashboardData?.metrics.completed_orders || 0}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Revenue</span>
                <span className="font-semibold text-gray-900">{formatCurrency(dashboardData?.metrics.total_revenue || 0)}</span>
              </div>
            </div>

            {/* Bar Chart Representation */}
            <div className="mt-6">
              <div className="flex items-end justify-between h-32 space-x-2">
                {[
                  dashboardData?.metrics.bids_last_7d || 0,
                  dashboardData?.metrics.pending_bids || 0,
                  dashboardData?.metrics.accepted_bids || 0,
                  dashboardData?.metrics.rejected_bids || 0,
                  dashboardData?.metrics.active_orders || 0,
                  dashboardData?.metrics.completed_orders || 0,
                  Math.round(dashboardData?.metrics.win_rate || 0)
                ].map((value, i) => (
                  <div key={i} className="flex-1 flex flex-col justify-end">
                    <div
                      className="bg-gradient-to-t from-green-500 to-green-400 rounded-t hover:from-green-600 hover:to-green-500 transition-all cursor-pointer"
                      style={{ height: `${Math.min(value * 5, 100)}%` }}
                    ></div>
                    <div className="text-xs text-gray-500 text-center mt-2">
                      {['7d', 'Pend', 'Won', 'Lost', 'Act', 'Comp', 'Win%'][i]}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
    </SupplierPageLayout>
  );
};

export default SupplierDashboard;
