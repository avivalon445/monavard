import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supplierOrderService, SupplierOrder, OrderFilters } from '@/services/supplierOrderService';
import { getUserFriendlyError } from '@/utils/errorMessages';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import Alert from '@/components/common/Alert';
import SupplierPageWrapper from '@/components/layout/SupplierPageWrapper';
import SupplierCardLayout from '@/components/layout/SupplierCardLayout';
import SupplierGridLayout from '@/components/layout/SupplierGridLayout';

const SupplierOrders: React.FC = () => {
  const [orders, setOrders] = useState<SupplierOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filters, setFilters] = useState<OrderFilters>({
    status: '',
    page: 1,
    limit: 10,
    sort: 'created_at',
    order: 'DESC'
  });

  useEffect(() => {
    fetchOrders();
  }, [filters]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await supplierOrderService.getSupplierOrders(filters);
      
      if (response.success && response.data) {
        setOrders(response.data);
        setTotalPages(response.meta?.pagination?.pages || 1);
      } else {
        setError('Failed to load orders');
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
      setError(getUserFriendlyError(error));
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (newFilters: Partial<OrderFilters>) => {
    setFilters(prev => ({
      ...prev,
      ...newFilters,
      page: 1 // Reset to first page when filters change
    }));
    setCurrentPage(1);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    setFilters(prev => ({ ...prev, page }));
  };

  const formatCurrency = (amount: number, currency?: string) => {
    if (!amount) return 'N/A';
    const symbol = currency === 'USD' ? '$' : '€';
    return `${symbol}${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getStatusBadge = (status: string) => {
    const statusStyles: { [key: string]: string } = {
      confirmed: 'bg-blue-100 text-blue-800',
      in_progress: 'bg-yellow-100 text-yellow-800',
      production: 'bg-purple-100 text-purple-800',
      quality_check: 'bg-indigo-100 text-indigo-800',
      shipped: 'bg-orange-100 text-orange-800',
      delivered: 'bg-green-100 text-green-800',
      completed: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800',
    };

    const statusLabels: { [key: string]: string } = {
      confirmed: 'Confirmed',
      in_progress: 'In Progress',
      production: 'Production',
      quality_check: 'Quality Check',
      shipped: 'Shipped',
      delivered: 'Delivered',
      completed: 'Completed',
      cancelled: 'Cancelled',
    };

    return (
      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${statusStyles[status] || 'bg-gray-100 text-gray-800'}`}>
        {statusLabels[status] || status}
      </span>
    );
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'confirmed':
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      case 'in_progress':
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      case 'production':
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
          </svg>
        );
      case 'shipped':
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
          </svg>
        );
      case 'delivered':
      case 'completed':
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        );
      default:
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
    }
  };

  const headerActions = null;

  const filtersComponent = (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      {/* Status Filter */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Status
        </label>
        <select
          value={filters.status || ''}
          onChange={(e) => handleFilterChange({ status: e.target.value || undefined })}
          className="input"
        >
          <option value="">All Orders</option>
          <option value="confirmed">Confirmed</option>
          <option value="in_progress">In Progress</option>
          <option value="production">Production</option>
          <option value="quality_check">Quality Check</option>
          <option value="shipped">Shipped</option>
          <option value="delivered">Delivered</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>

      {/* Sort By */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Sort By
        </label>
        <select
          value={filters.sort}
          onChange={(e) => handleFilterChange({ sort: e.target.value })}
          className="input"
        >
          <option value="created_at">Date Created</option>
          <option value="updated_at">Last Updated</option>
          <option value="total_amount">Order Value</option>
          <option value="delivery_date">Delivery Date</option>
          <option value="status">Status</option>
        </select>
      </div>

      {/* Order */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Order
        </label>
        <select
          value={filters.order}
          onChange={(e) => handleFilterChange({ order: e.target.value as 'ASC' | 'DESC' })}
          className="input"
        >
          <option value="DESC">Newest First</option>
          <option value="ASC">Oldest First</option>
        </select>
      </div>

      {/* Items Per Page */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Show
        </label>
        <select
          value={filters.limit}
          onChange={(e) => handleFilterChange({ limit: parseInt(e.target.value) })}
          className="input"
        >
          <option value={10}>10 per page</option>
          <option value={20}>20 per page</option>
          <option value={50}>50 per page</option>
        </select>
      </div>
    </div>
  );

  return (
    <SupplierPageWrapper
      title="Order Management"
      subtitle="Track and manage your production orders"
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

      {loading && orders.length === 0 ? (
        <div className="flex justify-center py-12">
          <LoadingSpinner />
        </div>
      ) : orders.length === 0 ? (
        <SupplierCardLayout>
          <div className="text-center py-12">
            <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Orders Found</h3>
            <p className="text-gray-500 mb-4">
              {filters.status 
                ? `No orders found with status "${filters.status}"`
                : "You haven't received any orders yet."
              }
            </p>
            <Link 
              to="/supplier/requests" 
              className="btn btn-primary"
            >
              Browse Available Requests
            </Link>
          </div>
        </SupplierCardLayout>
      ) : (
        <>
          <SupplierGridLayout columns={1} gap={4}>
            {orders.map((order) => (
              <SupplierCardLayout key={order.id} hover>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-3">
                      <div className="flex items-center space-x-2">
                        {getStatusIcon(order.status)}
                        <h3 className="text-lg font-semibold text-gray-900">
                          {order.request_title}
                        </h3>
                      </div>
                      {getStatusBadge(order.status)}
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                      <div>
                        <p className="text-sm text-gray-600">Order ID</p>
                        <p className="font-medium text-gray-900">#{order.id}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Order Value</p>
                        <p className="font-medium text-gray-900">
                          {formatCurrency(order.total_amount, order.currency)}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Customer</p>
                        <p className="font-medium text-gray-900">
                          {order.customer_company_name || `${order.customer_first_name} ${order.customer_last_name}`}
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                      <div>
                        <p className="text-sm text-gray-600">Delivery Date</p>
                        <p className="font-medium text-gray-900">
                          {formatDate(order.delivery_date)}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Created</p>
                        <p className="font-medium text-gray-900">
                          {formatDate(order.created_at)}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Updates</p>
                        <p className="font-medium text-gray-900">
                          {order.updates_count} update{order.updates_count !== 1 ? 's' : ''}
                        </p>
                      </div>
                    </div>

                    {order.category_name && (
                      <div className="mb-4">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {order.category_name}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col items-end space-y-2 ml-4">
                    <Link
                      to={`/supplier/orders/${order.id}`}
                      className="btn btn-primary btn-sm"
                    >
                      View Details
                    </Link>
                    {order.unread_messages > 0 && (
                      <span className="badge-warning text-xs">
                        {order.unread_messages} unread
                      </span>
                    )}
                  </div>
                </div>
              </SupplierCardLayout>
            ))}
          </SupplierGridLayout>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center items-center space-x-2 mt-8">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="btn btn-outline btn-sm"
              >
                Previous
              </button>
              
              <div className="flex items-center space-x-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  const page = i + 1;
                  return (
                    <button
                      key={page}
                      onClick={() => handlePageChange(page)}
                      className={`btn btn-sm ${
                        currentPage === page ? 'btn-primary' : 'btn-outline'
                      }`}
                    >
                      {page}
                    </button>
                  );
                })}
              </div>

              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="btn btn-outline btn-sm"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </SupplierPageWrapper>
  );
};

export default SupplierOrders;
