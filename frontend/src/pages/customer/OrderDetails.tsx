import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { OrderDetails as OrderDetailsType, OrderStatus } from '@/types';
import { getOrderById, cancelOrder, confirmDelivery, completeOrder } from '@/services/orderService';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import Alert from '@/components/common/Alert';
import { getUserFriendlyError } from '@/utils/errorMessages';

const OrderDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [order, setOrder] = useState<OrderDetailsType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState('');

  useEffect(() => {
    if (id) {
      fetchOrderDetails();
    }
  }, [id]);

  const fetchOrderDetails = async () => {
    try {
      setLoading(true);
      setError('');
      
      const response = await getOrderById(parseInt(id!));
      
      if (response.success && response.data) {
        setOrder(response.data);
      } else {
        setError(response.message || 'Failed to fetch order details.');
      }
    } catch (err: any) {
      setError(getUserFriendlyError(err));
    } finally {
      setLoading(false);
    }
  };

  const handleCancelOrder = async () => {
    if (!cancelReason.trim()) {
      setError('Please provide a reason for cancellation.');
      return;
    }

    try {
      setActionLoading(true);
      setError('');
      
      const response = await cancelOrder(parseInt(id!), cancelReason);
      
      if (response.success) {
        setSuccess('Order cancelled successfully.');
        setShowCancelModal(false);
        fetchOrderDetails();
      } else {
        setError(response.message || 'Failed to cancel order.');
      }
    } catch (err: any) {
      setError(getUserFriendlyError(err));
    } finally {
      setActionLoading(false);
    }
  };

  const handleConfirmDelivery = async () => {
    if (!confirm('Confirm that you have received the order?')) {
      return;
    }

    try {
      setActionLoading(true);
      setError('');
      
      const response = await confirmDelivery(parseInt(id!));
      
      if (response.success) {
        setSuccess('Delivery confirmed successfully.');
        fetchOrderDetails();
      } else {
        setError(response.message || 'Failed to confirm delivery.');
      }
    } catch (err: any) {
      setError(getUserFriendlyError(err));
    } finally {
      setActionLoading(false);
    }
  };

  const handleCompleteOrder = async () => {
    if (!confirm('Mark this order as complete? You can leave a review after completion.')) {
      return;
    }

    try {
      setActionLoading(true);
      setError('');
      
      const response = await completeOrder(parseInt(id!));
      
      if (response.success) {
        setSuccess('Order completed successfully. You can now leave a review.');
        fetchOrderDetails();
      } else {
        setError(response.message || 'Failed to complete order.');
      }
    } catch (err: any) {
      setError(getUserFriendlyError(err));
    } finally {
      setActionLoading(false);
    }
  };

  const formatCurrency = (amount: number, currency: string = 'EUR') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusBadge = (status: OrderStatus) => {
    const statusConfig: Record<OrderStatus, { label: string; className: string }> = {
      confirmed: { label: 'Confirmed', className: 'bg-blue-100 text-blue-800' },
      in_production: { label: 'In Production', className: 'bg-purple-100 text-purple-800' },
      shipped: { label: 'Shipped', className: 'bg-indigo-100 text-indigo-800' },
      delivered: { label: 'Delivered', className: 'bg-green-100 text-green-800' },
      completed: { label: 'Completed', className: 'bg-gray-100 text-gray-800' },
      cancelled: { label: 'Cancelled', className: 'bg-red-100 text-red-800' },
      disputed: { label: 'Disputed', className: 'bg-yellow-100 text-yellow-800' },
    };

    const config = statusConfig[status] || statusConfig.confirmed;

    return (
      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${config.className}`}>
        {config.label}
      </span>
    );
  };

  const getSupplierName = () => {
    if (!order) return 'Supplier';
    if (order.supplier_company_name) {
      return order.supplier_company_name;
    }
    if (order.supplier_first_name && order.supplier_last_name) {
      return `${order.supplier_first_name} ${order.supplier_last_name}`;
    }
    return 'Supplier';
  };

  const getProgressPercentage = (status: OrderStatus) => {
    const progress: Record<OrderStatus, number> = {
      confirmed: 20,
      in_production: 50,
      shipped: 75,
      delivered: 90,
      completed: 100,
      cancelled: 0,
      disputed: 0,
    };
    return progress[status] || 0;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto p-6 lg:p-8">
          <div className="card p-12 text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Order Not Found</h2>
            <p className="text-gray-600 mb-6">
              The order you're looking for doesn't exist or you don't have access to it.
            </p>
            <Link to="/customer/orders" className="btn btn-primary">
              Back to Orders
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto p-6 lg:p-8">
        {/* Header */}
        <div className="mb-8">
          <Link
            to="/customer/orders"
            className="inline-flex items-center text-primary-600 hover:text-primary-700 font-medium mb-4"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Orders
          </Link>
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Order #{order.order_number}</h1>
              <p className="text-gray-600">Placed on {formatDate(order.created_at)}</p>
            </div>
            {getStatusBadge(order.status)}
          </div>
        </div>

        {error && (
          <Alert
            type="error"
            message={error}
            onClose={() => setError('')}
            className="mb-6"
          />
        )}

        {success && (
          <Alert
            type="success"
            message={success}
            onClose={() => setSuccess('')}
            className="mb-6"
          />
        )}

        {/* Order Progress */}
        {!['cancelled', 'disputed', 'completed'].includes(order.status) && (
          <div className="card p-6 mb-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Order Progress</h2>
            <div className="relative">
              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-primary-500 to-primary-600 transition-all duration-500"
                  style={{ width: `${getProgressPercentage(order.status)}%` }}
                ></div>
              </div>
              <div className="flex justify-between mt-4 text-sm">
                <div className={`text-center ${['confirmed', 'in_production', 'shipped', 'delivered', 'completed'].includes(order.status) ? 'text-primary-600 font-semibold' : 'text-gray-500'}`}>
                  <div className={`w-8 h-8 mx-auto mb-1 rounded-full flex items-center justify-center ${['confirmed', 'in_production', 'shipped', 'delivered', 'completed'].includes(order.status) ? 'bg-primary-600 text-white' : 'bg-gray-200'}`}>
                    ✓
                  </div>
                  Confirmed
                </div>
                <div className={`text-center ${['in_production', 'shipped', 'delivered', 'completed'].includes(order.status) ? 'text-primary-600 font-semibold' : 'text-gray-500'}`}>
                  <div className={`w-8 h-8 mx-auto mb-1 rounded-full flex items-center justify-center ${['in_production', 'shipped', 'delivered', 'completed'].includes(order.status) ? 'bg-primary-600 text-white' : 'bg-gray-200'}`}>
                    {['in_production', 'shipped', 'delivered', 'completed'].includes(order.status) ? '✓' : '2'}
                  </div>
                  Production
                </div>
                <div className={`text-center ${['shipped', 'delivered', 'completed'].includes(order.status) ? 'text-primary-600 font-semibold' : 'text-gray-500'}`}>
                  <div className={`w-8 h-8 mx-auto mb-1 rounded-full flex items-center justify-center ${['shipped', 'delivered', 'completed'].includes(order.status) ? 'bg-primary-600 text-white' : 'bg-gray-200'}`}>
                    {['shipped', 'delivered', 'completed'].includes(order.status) ? '✓' : '3'}
                  </div>
                  Shipped
                </div>
                <div className={`text-center ${['delivered', 'completed'].includes(order.status) ? 'text-primary-600 font-semibold' : 'text-gray-500'}`}>
                  <div className={`w-8 h-8 mx-auto mb-1 rounded-full flex items-center justify-center ${['delivered', 'completed'].includes(order.status) ? 'bg-primary-600 text-white' : 'bg-gray-200'}`}>
                    {['delivered', 'completed'].includes(order.status) ? '✓' : '4'}
                  </div>
                  Delivered
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Request Details */}
            <div className="card p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4">Request Details</h2>
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium text-gray-600">Title</label>
                  <p className="text-gray-900 mt-1">{order.request_title}</p>
                </div>
                {order.request_description && (
                  <div>
                    <label className="text-sm font-medium text-gray-600">Description</label>
                    <p className="text-gray-900 mt-1">{order.request_description}</p>
                  </div>
                )}
                {order.category_name && (
                  <div>
                    <label className="text-sm font-medium text-gray-600">Category</label>
                    <p className="text-gray-900 mt-1">{order.category_name}</p>
                  </div>
                )}
                {order.budget_min && order.budget_max && (
                  <div>
                    <label className="text-sm font-medium text-gray-600">Budget Range</label>
                    <p className="text-gray-900 mt-1">
                      {formatCurrency(order.budget_min, order.currency || 'EUR')} - {formatCurrency(order.budget_max, order.currency || 'EUR')}
                    </p>
                  </div>
                )}
              </div>
              <Link
                to={`/customer/requests/${order.request_id}`}
                className="btn btn-outline mt-4 w-full"
              >
                View Full Request
              </Link>
            </div>

            {/* Order Updates */}
            <div className="card p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4">Order Updates</h2>
              {order.updates && order.updates.length > 0 ? (
                <div className="space-y-4">
                  {order.updates.map((update) => (
                    <div key={update.id} className="border-l-4 border-primary-500 pl-4 py-2">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-semibold text-gray-900">{update.status}</span>
                            <span className="text-sm text-gray-500">
                              {formatDateTime(update.created_at)}
                            </span>
                          </div>
                          {update.message && (
                            <p className="text-gray-700 mt-1">{update.message}</p>
                          )}
                          {update.created_by_first_name && (
                            <p className="text-sm text-gray-500 mt-1">
                              by {update.created_by_first_name} {update.created_by_last_name}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-600 text-center py-4">No updates yet</p>
              )}
            </div>

            {/* Status History */}
            <div className="card p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4">Status History</h2>
              {order.status_history && order.status_history.length > 0 ? (
                <div className="space-y-3">
                  {order.status_history.map((history) => (
                    <div key={history.id} className="flex items-start gap-4">
                      <div className="w-2 h-2 bg-primary-600 rounded-full mt-2"></div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          {getStatusBadge(history.status)}
                          <span className="text-sm text-gray-500">
                            {formatDateTime(history.created_at)}
                          </span>
                        </div>
                        {history.notes && (
                          <p className="text-gray-600 text-sm mt-1">{history.notes}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-600 text-center py-4">No history available</p>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Order Summary */}
            <div className="card p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4">Order Summary</h2>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Bid Amount</span>
                  <span className="font-semibold text-gray-900">
                    {formatCurrency(order.bid_price || order.total_amount, order.currency || 'EUR')}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Commission ({(order.commission_rate * 100).toFixed(0)}%)</span>
                  <span className="font-semibold text-gray-900">
                    {formatCurrency(order.commission_amount, order.currency || 'EUR')}
                  </span>
                </div>
                <div className="border-t border-gray-200 pt-3 flex justify-between">
                  <span className="text-lg font-bold text-gray-900">Total</span>
                  <span className="text-lg font-bold text-primary-600">
                    {formatCurrency(order.total_amount, order.currency || 'EUR')}
                  </span>
                </div>
              </div>
            </div>

            {/* Delivery Information */}
            <div className="card p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4">Delivery Information</h2>
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium text-gray-600">Estimated Delivery</label>
                  <p className="text-gray-900 mt-1">
                    {order.delivery_date ? formatDate(order.delivery_date) : 'TBD'}
                  </p>
                </div>
                {order.actual_delivery_date && (
                  <div>
                    <label className="text-sm font-medium text-gray-600">Actual Delivery</label>
                    <p className="text-gray-900 mt-1">{formatDate(order.actual_delivery_date)}</p>
                  </div>
                )}
                {order.tracking_number && (
                  <div>
                    <label className="text-sm font-medium text-gray-600">Tracking Number</label>
                    <p className="text-gray-900 mt-1 font-mono">{order.tracking_number}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Supplier Information */}
            <div className="card p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4">Supplier</h2>
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium text-gray-600">Name</label>
                  <p className="text-gray-900 mt-1">{getSupplierName()}</p>
                </div>
                {order.supplier_email && (
                  <div>
                    <label className="text-sm font-medium text-gray-600">Email</label>
                    <p className="text-gray-900 mt-1">{order.supplier_email}</p>
                  </div>
                )}
                {order.supplier_phone && (
                  <div>
                    <label className="text-sm font-medium text-gray-600">Phone</label>
                    <p className="text-gray-900 mt-1">
                      {order.supplier_phone}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="card p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4">Actions</h2>
              <div className="space-y-3">
                {order.status === 'shipped' && (
                  <button
                    onClick={handleConfirmDelivery}
                    disabled={actionLoading}
                    className="btn btn-primary w-full"
                  >
                    {actionLoading ? 'Processing...' : 'Confirm Delivery'}
                  </button>
                )}
                {order.status === 'delivered' && (
                  <button
                    onClick={handleCompleteOrder}
                    disabled={actionLoading}
                    className="btn btn-primary w-full"
                  >
                    {actionLoading ? 'Processing...' : 'Complete Order'}
                  </button>
                )}
                {['confirmed', 'in_production'].includes(order.status) && (
                  <button
                    onClick={() => setShowCancelModal(true)}
                    className="btn btn-outline-error w-full"
                  >
                    Cancel Order
                  </button>
                )}
                {order.status === 'completed' && (
                  <button className="btn btn-primary w-full">Leave a Review</button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Cancel Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 max-w-md w-full">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Cancel Order</h3>
            <p className="text-gray-600 mb-4">
              Please provide a reason for cancelling this order:
            </p>
            <textarea
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 mb-4"
              rows={4}
              placeholder="Enter cancellation reason..."
            />
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowCancelModal(false);
                  setCancelReason('');
                }}
                className="btn btn-outline flex-1"
                disabled={actionLoading}
              >
                Keep Order
              </button>
              <button
                onClick={handleCancelOrder}
                className="btn btn-error flex-1"
                disabled={actionLoading || !cancelReason.trim()}
              >
                {actionLoading ? 'Cancelling...' : 'Cancel Order'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrderDetails;

