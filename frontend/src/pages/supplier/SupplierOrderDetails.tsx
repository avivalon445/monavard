import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supplierOrderService, SupplierOrderDetails } from '@/services/supplierOrderService';
import { getUserFriendlyError } from '@/utils/errorMessages';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import Alert from '@/components/common/Alert';
import SupplierPageLayout from '@/components/layout/SupplierPageLayout';
import SupplierCardLayout from '@/components/layout/SupplierCardLayout';

const SupplierOrderDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const [order, setOrder] = useState<SupplierOrderDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [newStatus, setNewStatus] = useState('');
  const [statusNotes, setStatusNotes] = useState('');
  const [updateTitle, setUpdateTitle] = useState('');
  const [updateDescription, setUpdateDescription] = useState('');

  useEffect(() => {
    if (id) {
      fetchOrderDetails();
    }
  }, [id]);

  const fetchOrderDetails = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await supplierOrderService.getSupplierOrderById(parseInt(id!));
      
      if (response.success && response.data) {
        setOrder(response.data);
      } else {
        setError('Failed to load order details');
      }
    } catch (error) {
      console.error('Error fetching order details:', error);
      setError(getUserFriendlyError(error));
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async () => {
    if (!order || !newStatus) return;

    try {
      setActionLoading(true);
      const response = await supplierOrderService.updateOrderStatus(order.id, {
        status: newStatus as any,
        notes: statusNotes || undefined
      });

      if (response.success) {
        setSuccess('Order status updated successfully!');
        setShowStatusModal(false);
        setNewStatus('');
        setStatusNotes('');
        fetchOrderDetails(); // Refresh order data
      }
    } catch (error) {
      setError(getUserFriendlyError(error));
    } finally {
      setActionLoading(false);
    }
  };

  const handleAddUpdate = async () => {
    if (!order || !updateTitle || !updateDescription) return;

    try {
      setActionLoading(true);
      const response = await supplierOrderService.addOrderUpdate(order.id, {
        title: updateTitle,
        description: updateDescription
      });

      if (response.success) {
        setSuccess('Order update added successfully!');
        setShowUpdateModal(false);
        setUpdateTitle('');
        setUpdateDescription('');
        fetchOrderDetails(); // Refresh order data
      }
    } catch (error) {
      setError(getUserFriendlyError(error));
    } finally {
      setActionLoading(false);
    }
  };

  const formatCurrency = (amount: number, currency?: string) => {
    if (!amount) return 'N/A';
    const symbol = currency === 'USD' ? '$' : '€';
    return `${symbol}${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
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

  const getNextStatusOptions = (currentStatus: string) => {
    const statusTransitions = {
      confirmed: ['in_progress', 'cancelled'],
      in_progress: ['production', 'quality_check', 'cancelled'],
      production: ['quality_check', 'shipped', 'cancelled'],
      quality_check: ['shipped', 'production', 'cancelled'],
      shipped: ['delivered'],
      delivered: [],
      completed: [],
      cancelled: []
    };
    
    return statusTransitions[currentStatus as keyof typeof statusTransitions] || [];
  };

  if (loading) {
    return (
      <SupplierPageLayout
        title="Loading Order Details..."
        subtitle="Please wait while we fetch the order information"
      >
        <div className="flex justify-center py-12">
          <LoadingSpinner />
        </div>
      </SupplierPageLayout>
    );
  }

  if (error || !order) {
    return (
      <SupplierPageLayout
        title="Order Not Found"
        subtitle="The requested order could not be found"
      >
        <Alert
          type="error"
          message={error || 'Order not found'}
          onClose={() => navigate('/supplier/orders')}
        />
      </SupplierPageLayout>
    );
  }

  const headerActions = (
    <div className="flex items-center space-x-3">
      <button
        onClick={() => setShowUpdateModal(true)}
        className="btn btn-outline btn-sm"
        disabled={actionLoading}
      >
        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
        </svg>
        Add Update
      </button>
      
      {getNextStatusOptions(order.status).length > 0 && (
        <button
          onClick={() => setShowStatusModal(true)}
          className="btn btn-primary btn-sm"
          disabled={actionLoading}
        >
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
          Update Status
        </button>
      )}
    </div>
  );

  return (
    <SupplierPageLayout
      title={order.request_title}
      subtitle={`Order #${order.id} • ${order.category_name || 'General'}`}
      headerActions={headerActions}
      maxWidth="7xl"
    >
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

      {/* Order Status */}
      <SupplierCardLayout>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Order Status</h2>
            <div className="flex items-center space-x-3">
              {getStatusBadge(order.status)}
              <span className="text-sm text-gray-600">
                Last updated: {formatDateTime(order.updated_at)}
              </span>
            </div>
          </div>
        </div>

        {/* Status Progress */}
        <div className="relative">
          <div className="flex items-center justify-between mb-4">
            {['confirmed', 'in_progress', 'production', 'quality_check', 'shipped', 'delivered', 'completed'].map((status, index) => (
              <div key={status} className="flex flex-col items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium ${
                  ['confirmed', 'in_progress', 'production', 'quality_check', 'shipped', 'delivered', 'completed'].indexOf(order.status) >= index
                    ? 'bg-green-500 text-white'
                    : 'bg-gray-200 text-gray-500'
                }`}>
                  {index + 1}
                </div>
                <span className="text-xs text-gray-600 mt-1 capitalize">
                  {status.replace('_', ' ')}
                </span>
              </div>
            ))}
          </div>
        </div>
      </SupplierCardLayout>

      {/* Order Information */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Order Details */}
        <SupplierCardLayout>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Order Details</h3>
          <div className="space-y-3">
            <div>
              <span className="text-sm text-gray-600">Order ID:</span>
              <p className="font-medium text-gray-900">#{order.id}</p>
            </div>
            <div>
              <span className="text-sm text-gray-600">Order Value:</span>
              <p className="font-medium text-gray-900">
                {formatCurrency(order.total_amount, order.currency)}
              </p>
            </div>
            <div>
              <span className="text-sm text-gray-600">Commission:</span>
              <p className="font-medium text-gray-900">
                {formatCurrency(order.commission_amount, order.currency)}
              </p>
            </div>
            <div>
              <span className="text-sm text-gray-600">Delivery Date:</span>
              <p className="font-medium text-gray-900">{formatDate(order.delivery_date)}</p>
            </div>
            <div>
              <span className="text-sm text-gray-600">Created:</span>
              <p className="font-medium text-gray-900">{formatDate(order.created_at)}</p>
            </div>
          </div>
        </SupplierCardLayout>

        {/* Customer Information */}
        <SupplierCardLayout>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Customer Information</h3>
          <div className="space-y-3">
            <div>
              <span className="text-sm text-gray-600">Name:</span>
              <p className="font-medium text-gray-900">
                {order.customer_company_name || `${order.customer_first_name} ${order.customer_last_name}`}
              </p>
            </div>
            <div>
              <span className="text-sm text-gray-600">Email:</span>
              <p className="font-medium text-gray-900">{order.customer_email}</p>
            </div>
            {order.customer_phone && (
              <div>
                <span className="text-sm text-gray-600">Phone:</span>
                <p className="font-medium text-gray-900">{order.customer_phone}</p>
              </div>
            )}
            {order.customer_address && (
              <div>
                <span className="text-sm text-gray-600">Address:</span>
                <p className="font-medium text-gray-900">{order.customer_address}</p>
              </div>
            )}
          </div>
        </SupplierCardLayout>

        {/* Bid Information */}
        <SupplierCardLayout>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Bid Information</h3>
          <div className="space-y-3">
            <div>
              <span className="text-sm text-gray-600">Bid Price:</span>
              <p className="font-medium text-gray-900">
                {formatCurrency(order.bid_price, order.currency)}
              </p>
            </div>
            <div>
              <span className="text-sm text-gray-600">Delivery Time:</span>
              <p className="font-medium text-gray-900">{order.delivery_time_days} days</p>
            </div>
            {order.materials_cost && (
              <div>
                <span className="text-sm text-gray-600">Materials Cost:</span>
                <p className="font-medium text-gray-900">
                  {formatCurrency(order.materials_cost, order.currency)}
                </p>
              </div>
            )}
            {order.labor_cost && (
              <div>
                <span className="text-sm text-gray-600">Labor Cost:</span>
                <p className="font-medium text-gray-900">
                  {formatCurrency(order.labor_cost, order.currency)}
                </p>
              </div>
            )}
          </div>
        </SupplierCardLayout>
      </div>

      {/* Request Details */}
      <SupplierCardLayout>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Request Details</h3>
        <div className="space-y-4">
          <div>
            <span className="text-sm text-gray-600">Description:</span>
            <p className="font-medium text-gray-900 mt-1">{order.request_description}</p>
          </div>
          {order.bid_description && (
            <div>
              <span className="text-sm text-gray-600">Your Proposal:</span>
              <p className="font-medium text-gray-900 mt-1">{order.bid_description}</p>
            </div>
          )}
        </div>
      </SupplierCardLayout>

      {/* Order Updates */}
      <SupplierCardLayout>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Order Updates</h3>
        {order.updates.length === 0 ? (
          <p className="text-gray-500 text-center py-8">No updates yet</p>
        ) : (
          <div className="space-y-4">
            {order.updates.map((update) => (
              <div key={update.id} className="border-l-4 border-blue-500 pl-4 py-2">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium text-gray-900">{update.title}</h4>
                  <span className="text-sm text-gray-500">
                    {formatDateTime(update.created_at)}
                  </span>
                </div>
                <p className="text-gray-700 mb-2">{update.description}</p>
                {update.created_by_first_name && (
                  <p className="text-xs text-gray-500">
                    By {update.created_by_first_name} {update.created_by_last_name}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </SupplierCardLayout>

      {/* Status History */}
      <SupplierCardLayout>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Status History</h3>
        <div className="space-y-3">
          {order.status_history.map((history, index) => (
            <div key={history.id} className="flex items-start space-x-3">
              <div className={`w-3 h-3 rounded-full mt-1.5 ${
                index === order.status_history.length - 1 ? 'bg-green-500' : 'bg-gray-300'
              }`}></div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-gray-900 capitalize">
                    {history.status.replace('_', ' ')}
                  </span>
                  <span className="text-sm text-gray-500">
                    {formatDateTime(history.created_at)}
                  </span>
                </div>
                {history.notes && (
                  <p className="text-sm text-gray-600 mt-1">{history.notes}</p>
                )}
                {history.changed_by_first_name && (
                  <p className="text-xs text-gray-500 mt-1">
                    By {history.changed_by_first_name} {history.changed_by_last_name}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      </SupplierCardLayout>

      {/* Status Update Modal */}
      {showStatusModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Update Order Status</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  New Status
                </label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                  className="input w-full"
                >
                  <option value="">Select status</option>
                  {getNextStatusOptions(order.status).map((status) => (
                    <option key={status} value={status}>
                      {status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Notes (Optional)
                </label>
                <textarea
                  value={statusNotes}
                  onChange={(e) => setStatusNotes(e.target.value)}
                  className="input w-full"
                  rows={3}
                  placeholder="Add any additional notes about this status change..."
                />
              </div>
            </div>

            <div className="flex items-center space-x-3 mt-6">
              <button
                onClick={() => setShowStatusModal(false)}
                className="btn btn-outline flex-1"
                disabled={actionLoading}
              >
                Cancel
              </button>
              <button
                onClick={handleStatusUpdate}
                className="btn btn-primary flex-1"
                disabled={actionLoading || !newStatus}
              >
                {actionLoading ? (
                  <>
                    <LoadingSpinner size="sm" className="mr-2" />
                    Updating...
                  </>
                ) : (
                  'Update Status'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Update Modal */}
      {showUpdateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Add Order Update</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Update Title
                </label>
                <input
                  type="text"
                  value={updateTitle}
                  onChange={(e) => setUpdateTitle(e.target.value)}
                  className="input w-full"
                  placeholder="e.g., Production started, Quality check completed"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  value={updateDescription}
                  onChange={(e) => setUpdateDescription(e.target.value)}
                  className="input w-full"
                  rows={4}
                  placeholder="Provide details about the progress or update..."
                />
              </div>
            </div>

            <div className="flex items-center space-x-3 mt-6">
              <button
                onClick={() => setShowUpdateModal(false)}
                className="btn btn-outline flex-1"
                disabled={actionLoading}
              >
                Cancel
              </button>
              <button
                onClick={handleAddUpdate}
                className="btn btn-primary flex-1"
                disabled={actionLoading || !updateTitle || !updateDescription}
              >
                {actionLoading ? (
                  <>
                    <LoadingSpinner size="sm" className="mr-2" />
                    Adding...
                  </>
                ) : (
                  'Add Update'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </SupplierPageLayout>
  );
};

export default SupplierOrderDetailsPage;
