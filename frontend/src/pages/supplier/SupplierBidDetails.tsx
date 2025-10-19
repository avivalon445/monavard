import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { bidService } from '@/services/bidService';
import { Bid } from '@/types';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import Alert from '@/components/common/Alert';
import { getUserFriendlyError } from '@/utils/errorMessages';

const SupplierBidDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [bid, setBid] = useState<Bid | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancellationReason, setCancellationReason] = useState('');
  const [updateForm, setUpdateForm] = useState({
    price: '',
    delivery_time_days: '',
    description: '',
    proposal_details: '',
    materials_cost: '',
    labor_cost: '',
    other_costs: '',
  });

  // Calculate total price from cost breakdown
  const calculateTotalPrice = () => {
    const materials = parseFloat(updateForm.materials_cost) || 0;
    const labor = parseFloat(updateForm.labor_cost) || 0;
    const other = parseFloat(updateForm.other_costs) || 0;
    return materials + labor + other;
  };

  // Handle form updates with auto-calculation
  const handleUpdateFormChange = (field: string, value: string) => {
    setUpdateForm({ ...updateForm, [field]: value });
  };

  useEffect(() => {
    if (id) {
      fetchBidDetails();
    }
  }, [id]);

  const fetchBidDetails = async () => {
    try {
      setLoading(true);
      const response = await bidService.getSupplierBidById(Number(id));

      if (response.success && response.data) {
        setBid(response.data);
        // Pre-populate form with current values
        setUpdateForm({
          price: response.data.price?.toString() || '',
          delivery_time_days: response.data.delivery_time_days?.toString() || '',
          description: response.data.description || '',
          proposal_details: response.data.proposal_details || '',
          materials_cost: response.data.materials_cost?.toString() || '',
          labor_cost: response.data.labor_cost?.toString() || '',
          other_costs: response.data.other_costs?.toString() || '',
        });
      }
    } catch (err: any) {
      setError(getUserFriendlyError(err));
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateBid = async () => {
    if (!id) return;

    try {
      setActionLoading(true);
      
      // Convert form data to proper types
      const updateData: Partial<Bid> = {};
      
      // Use calculated total price instead of manual input
      const calculatedPrice = calculateTotalPrice();
      if (calculatedPrice > 0) {
        updateData.price = calculatedPrice;
      }
      
      if (updateForm.delivery_time_days) updateData.delivery_time_days = parseInt(updateForm.delivery_time_days);
      if (updateForm.description) updateData.description = updateForm.description;
      if (updateForm.proposal_details) updateData.proposal_details = updateForm.proposal_details;
      if (updateForm.materials_cost) updateData.materials_cost = parseFloat(updateForm.materials_cost);
      if (updateForm.labor_cost) updateData.labor_cost = parseFloat(updateForm.labor_cost);
      if (updateForm.other_costs) updateData.other_costs = parseFloat(updateForm.other_costs);

      const response = await bidService.updateSupplierBid(Number(id), updateData);

      if (response.success) {
        setSuccess('Bid updated successfully!');
        fetchBidDetails();
        setShowUpdateModal(false);
      }
    } catch (err: any) {
      setError(getUserFriendlyError(err));
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancelBid = async () => {
    if (!id) return;

    try {
      setActionLoading(true);
      const response = await bidService.cancelSupplierBid(Number(id), cancellationReason);

      if (response.success) {
        setSuccess('Bid cancelled successfully');
        fetchBidDetails();
        setShowCancelModal(false);
        setCancellationReason('');
      }
    } catch (err: any) {
      setError(getUserFriendlyError(err));
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusStyles: { [key: string]: string } = {
      pending: 'bg-yellow-100 text-yellow-800',
      accepted: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800',
      cancelled: 'bg-gray-100 text-gray-800',
      expired: 'bg-gray-100 text-gray-600',
    };

    const statusLabels: { [key: string]: string } = {
      pending: 'Pending Review',
      accepted: 'Accepted',
      rejected: 'Rejected',
      cancelled: 'Cancelled',
      expired: 'Expired',
    };

    return (
      <span className={`px-4 py-2 rounded-full text-sm font-semibold ${statusStyles[status] || 'bg-gray-100 text-gray-800'}`}>
        {statusLabels[status] || status}
      </span>
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatCurrency = (amount: number) => {
    return `$${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!bid) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto p-6 lg:p-8">
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Bid not found</h3>
            <p className="text-gray-600 mb-6">The bid you're looking for doesn't exist or has been removed.</p>
            <Link to="/supplier/bids" className="btn btn-primary">
              Back to My Bids
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
          <Link to="/supplier/bids" className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-4">
            <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to My Bids
          </Link>
          
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Bid Details</h1>
              <p className="text-gray-600 mt-1">Bid #{bid.id}</p>
            </div>
            {getStatusBadge(bid.status)}
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

        {/* Request Info */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Request Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">{bid.request_title}</h3>
              <p className="text-sm text-gray-600 mb-4">Request ID: #{bid.request_id}</p>
              {bid.request_description && (
                <div className="mb-4">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Description:</h4>
                  <p className="text-sm text-gray-600 whitespace-pre-wrap">{bid.request_description}</p>
                </div>
              )}
            </div>
            <div>
              <div className="space-y-3">
                <div>
                  <span className="text-sm font-medium text-gray-700">Budget Range:</span>
                  <p className="text-sm text-gray-900">
                    {bid.budget_min && bid.budget_max 
                      ? `${formatCurrency(bid.budget_min)} - ${formatCurrency(bid.budget_max)}`
                      : 'Not specified'
                    }
                  </p>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-700">Requested Delivery:</span>
                  <p className="text-sm text-gray-900">
                    {bid.request_delivery_date 
                      ? formatDate(bid.request_delivery_date)
                      : 'Not specified'
                    }
                  </p>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-700">Request Status:</span>
                  <span className={`ml-2 px-2 py-1 rounded text-xs font-medium ${
                    bid.request_status === 'open_for_bids' ? 'bg-green-100 text-green-800' :
                    bid.request_status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {bid.request_status?.replace('_', ' ')}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Customer Info */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Customer Information</h2>
          <div className="bg-gray-50 rounded-lg p-4">
            <p className="text-gray-900 font-medium">{bid.customer_anonymous_name || 'Anonymous Customer'}</p>
            <p className="text-sm text-gray-600 mt-1">
              Customer identity is protected until bid acceptance
              {bid.customer_rating && (
                <span className="ml-2">
                  ⭐ {Number(bid.customer_rating).toFixed(1)}
                  {bid.customer_review_count && ` (${bid.customer_review_count} reviews)`}
                </span>
              )}
            </p>
          </div>
        </div>

        {/* Bid Summary */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Your Bid Summary</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
            <div className="bg-gradient-to-br from-primary-50 to-primary-100 rounded-lg p-4">
              <p className="text-sm text-primary-700 font-medium mb-1">Bid Price</p>
              <p className="text-3xl font-bold text-primary-900">{formatCurrency(bid.price)}</p>
            </div>
            
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4">
              <p className="text-sm text-blue-700 font-medium mb-1">Delivery Time</p>
              <p className="text-3xl font-bold text-blue-900">{bid.delivery_time_days} days</p>
            </div>
            
            <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-4">
              <p className="text-sm text-green-700 font-medium mb-1">Response Time</p>
              <p className="text-3xl font-bold text-green-900">
                {bid.response_time_hours ? `${bid.response_time_hours}h` : 'N/A'}
              </p>
            </div>
            
            <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-4">
              <p className="text-sm text-purple-700 font-medium mb-1">Status</p>
              <p className="text-2xl font-bold text-purple-900">{bid.status}</p>
            </div>
          </div>
        </div>

        {/* Bid Description */}
        {bid.description && (
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Bid Description</h2>
            <p className="text-gray-700 whitespace-pre-wrap">{bid.description}</p>
          </div>
        )}

        {/* Proposal Details */}
        {bid.proposal_details && (
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Proposal Details</h2>
            <p className="text-gray-700 whitespace-pre-wrap">{bid.proposal_details}</p>
          </div>
        )}

        {/* Cost Breakdown */}
        {(bid.materials_cost || bid.labor_cost || bid.other_costs) && (
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Cost Breakdown</h2>
            <div className="space-y-3">
              {bid.materials_cost && (
                <div className="flex items-center justify-between py-2 border-b border-gray-200">
                  <span className="text-gray-700">Materials Cost</span>
                  <span className="font-semibold text-gray-900">{formatCurrency(bid.materials_cost)}</span>
                </div>
              )}
              {bid.labor_cost && (
                <div className="flex items-center justify-between py-2 border-b border-gray-200">
                  <span className="text-gray-700">Labor Cost</span>
                  <span className="font-semibold text-gray-900">{formatCurrency(bid.labor_cost)}</span>
                </div>
              )}
              {bid.other_costs && (
                <div className="flex items-center justify-between py-2 border-b border-gray-200">
                  <span className="text-gray-700">Other Costs</span>
                  <span className="font-semibold text-gray-900">{formatCurrency(bid.other_costs)}</span>
                </div>
              )}
              <div className="flex items-center justify-between py-3 bg-primary-50 rounded-lg px-4 mt-4">
                <span className="text-lg font-semibold text-gray-900">Total Price</span>
                <span className="text-2xl font-bold text-primary-600">{formatCurrency(bid.price)}</span>
              </div>
            </div>
          </div>
        )}

        {/* Timeline */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Timeline</h2>
          <div className="space-y-3">
            <div className="flex items-center justify-between py-2">
              <span className="text-gray-700">Bid Submitted</span>
              <span className="text-gray-900">{formatDate(bid.created_at)}</span>
            </div>
            {bid.accepted_at && (
              <div className="flex items-center justify-between py-2 border-t">
                <span className="text-green-700 font-medium">Accepted</span>
                <span className="text-gray-900">{formatDate(bid.accepted_at)}</span>
              </div>
            )}
            {bid.rejected_at && (
              <div className="flex items-center justify-between py-2 border-t">
                <span className="text-red-700 font-medium">Rejected</span>
                <span className="text-gray-900">{formatDate(bid.rejected_at)}</span>
              </div>
            )}
            {bid.expires_at && (
              <div className="flex items-center justify-between py-2 border-t">
                <span className="text-gray-700">Expires</span>
                <span className="text-gray-900">{formatDate(bid.expires_at)}</span>
              </div>
            )}
          </div>
        </div>

        {/* Rejection Reason */}
        {bid.rejection_reason && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-6">
            <h2 className="text-lg font-semibold text-red-900 mb-2">Rejection/Cancellation Reason</h2>
            <p className="text-red-700">{bid.rejection_reason}</p>
          </div>
        )}

        {/* Actions */}
        {bid.status === 'pending' && (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Actions</h2>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setShowUpdateModal(true)}
                className="btn btn-primary flex-1"
                disabled={actionLoading}
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                Update Bid
              </button>
              <button
                onClick={() => setShowCancelModal(true)}
                className="btn bg-red-600 hover:bg-red-700 text-white flex-1"
                disabled={actionLoading}
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728L5.636 5.636m12.728 12.728L18.364 5.636M5.636 18.364l12.728-12.728" />
                </svg>
                Cancel Bid
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Update Bid Modal */}
      {showUpdateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Update Bid</h3>
            
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Total Price (Auto-calculated)</label>
                  <input
                    type="text"
                    value={formatCurrency(calculateTotalPrice())}
                    readOnly
                    className="input bg-gray-50 text-gray-700 cursor-not-allowed"
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Calculated from cost breakdown below
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Delivery Time (days)</label>
                  <input
                    type="number"
                    value={updateForm.delivery_time_days}
                    onChange={(e) => handleUpdateFormChange('delivery_time_days', e.target.value)}
                    className="input"
                    placeholder="Enter delivery time"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={updateForm.description}
                  onChange={(e) => handleUpdateFormChange('description', e.target.value)}
                  className="input"
                  rows={3}
                  placeholder="Brief description of your offer"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Proposal Details</label>
                <textarea
                  value={updateForm.proposal_details}
                  onChange={(e) => handleUpdateFormChange('proposal_details', e.target.value)}
                  className="input"
                  rows={4}
                  placeholder="Detailed proposal and approach"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Materials Cost ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={updateForm.materials_cost}
                    onChange={(e) => handleUpdateFormChange('materials_cost', e.target.value)}
                    className="input"
                    placeholder="Materials cost"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Labor Cost ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={updateForm.labor_cost}
                    onChange={(e) => handleUpdateFormChange('labor_cost', e.target.value)}
                    className="input"
                    placeholder="Labor cost"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Other Costs ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={updateForm.other_costs}
                    onChange={(e) => handleUpdateFormChange('other_costs', e.target.value)}
                    className="input"
                    placeholder="Other costs"
                  />
                </div>
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
                onClick={handleUpdateBid}
                className="btn btn-primary flex-1"
                disabled={actionLoading}
              >
                {actionLoading ? (
                  <>
                    <LoadingSpinner size="sm" className="mr-2" />
                    Updating...
                  </>
                ) : (
                  'Update Bid'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cancel Bid Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Cancel Bid</h3>
            <p className="text-gray-700 mb-4">
              Are you sure you want to cancel this bid? This action cannot be undone.
            </p>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Reason for cancellation (optional):
              </label>
              <textarea
                value={cancellationReason}
                onChange={(e) => setCancellationReason(e.target.value)}
                className="input"
                rows={3}
                placeholder="e.g., Unable to meet timeline, material costs increased..."
              />
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={() => {
                  setShowCancelModal(false);
                  setCancellationReason('');
                }}
                className="btn btn-outline flex-1"
                disabled={actionLoading}
              >
                Keep Bid
              </button>
              <button
                onClick={handleCancelBid}
                className="btn bg-red-600 hover:bg-red-700 text-white flex-1"
                disabled={actionLoading}
              >
                {actionLoading ? (
                  <>
                    <LoadingSpinner size="sm" className="mr-2" />
                    Cancelling...
                  </>
                ) : (
                  'Cancel Bid'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SupplierBidDetails;
