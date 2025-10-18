import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { bidService } from '@/services/bidService';
import { Bid } from '@/types';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import Alert from '@/components/common/Alert';
import { getUserFriendlyError } from '@/utils/errorMessages';

const BidDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [bid, setBid] = useState<Bid | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [showAcceptConfirm, setShowAcceptConfirm] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');

  useEffect(() => {
    if (id) {
      fetchBidDetails();
    }
  }, [id]);

  const fetchBidDetails = async () => {
    try {
      setLoading(true);
      const response = await bidService.getBidById(Number(id));

      if (response.success && response.data) {
        setBid(response.data);
      }
    } catch (err: any) {
      setError(getUserFriendlyError(err));
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptBid = async () => {
    if (!id) return;

    try {
      setActionLoading(true);
      const response = await bidService.acceptBid(Number(id));

      if (response.success) {
        setSuccess('Bid accepted successfully! Redirecting to orders...');
        setTimeout(() => {
          navigate('/customer/orders');
        }, 2000);
      }
    } catch (err: any) {
      setError(getUserFriendlyError(err));
    } finally {
      setActionLoading(false);
      setShowAcceptConfirm(false);
    }
  };

  const handleRejectBid = async () => {
    if (!id) return;

    try {
      setActionLoading(true);
      const response = await bidService.rejectBid(Number(id), rejectionReason);

      if (response.success) {
        setSuccess('Bid rejected successfully');
        fetchBidDetails();
      }
    } catch (err: any) {
      setError(getUserFriendlyError(err));
    } finally {
      setActionLoading(false);
      setShowRejectModal(false);
      setRejectionReason('');
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
            <Link to="/customer/bids" className="btn btn-primary">
              Back to Bids
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
          <Link to="/customer/bids" className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-4">
            <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Bids
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
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Related Request</h2>
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-medium text-gray-900">{bid.request_title}</h3>
              <p className="text-sm text-gray-600 mt-1">Request ID: #{bid.request_id}</p>
            </div>
            <Link
              to={`/customer/requests/${bid.request_id}`}
              className="btn btn-outline btn-sm"
            >
              View Request
            </Link>
          </div>
        </div>

        {/* Bid Summary */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Bid Summary</h2>
          
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
              <p className="text-sm text-purple-700 font-medium mb-1">Supplier Rating</p>
              <p className="text-3xl font-bold text-purple-900">
                {bid.anonymous_rating ? `${Number(bid.anonymous_rating).toFixed(1)} ⭐` : 'N/A'}
              </p>
              {bid.anonymous_review_count > 0 && (
                <p className="text-xs text-purple-700 mt-1">{bid.anonymous_review_count} reviews</p>
              )}
            </div>
          </div>

          {/* Supplier Info */}
          <div className="border-t pt-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Supplier Information</h3>
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-gray-900 font-medium">{bid.anonymous_name || 'Anonymous Supplier'}</p>
              <p className="text-sm text-gray-600 mt-1">Identity will be revealed upon bid acceptance</p>
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
            <h2 className="text-lg font-semibold text-red-900 mb-2">Rejection Reason</h2>
            <p className="text-red-700">{bid.rejection_reason}</p>
          </div>
        )}

        {/* Actions */}
        {bid.status === 'pending' && (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Actions</h2>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setShowAcceptConfirm(true)}
                className="btn btn-primary flex-1"
                disabled={actionLoading}
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Accept Bid
              </button>
              <button
                onClick={() => setShowRejectModal(true)}
                className="btn bg-red-600 hover:bg-red-700 text-white flex-1"
                disabled={actionLoading}
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                Reject Bid
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Accept Confirmation Modal */}
      {showAcceptConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Accept Bid?</h3>
            <p className="text-gray-700 mb-6">
              By accepting this bid, you'll create an order with this supplier. All other pending bids for this request will be automatically rejected. Are you sure you want to proceed?
            </p>
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setShowAcceptConfirm(false)}
                className="btn btn-outline flex-1"
                disabled={actionLoading}
              >
                Cancel
              </button>
              <button
                onClick={handleAcceptBid}
                className="btn btn-primary flex-1"
                disabled={actionLoading}
              >
                {actionLoading ? (
                  <>
                    <LoadingSpinner size="sm" className="mr-2" />
                    Processing...
                  </>
                ) : (
                  'Accept Bid'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Reject Bid</h3>
            <p className="text-gray-700 mb-4">
              Please provide a reason for rejecting this bid (optional):
            </p>
            <textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              className="input mb-4"
              rows={4}
              placeholder="e.g., Price too high, delivery time too long, found a better offer..."
            />
            <div className="flex items-center space-x-3">
              <button
                onClick={() => {
                  setShowRejectModal(false);
                  setRejectionReason('');
                }}
                className="btn btn-outline flex-1"
                disabled={actionLoading}
              >
                Cancel
              </button>
              <button
                onClick={handleRejectBid}
                className="btn bg-red-600 hover:bg-red-700 text-white flex-1"
                disabled={actionLoading}
              >
                {actionLoading ? (
                  <>
                    <LoadingSpinner size="sm" className="mr-2" />
                    Rejecting...
                  </>
                ) : (
                  'Reject Bid'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BidDetails;

