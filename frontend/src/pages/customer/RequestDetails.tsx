import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { requestService } from '@/services/requestService';
import { Request, Bid } from '@/types';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import Alert from '@/components/common/Alert';
import { getUserFriendlyError } from '@/utils/errorMessages';

interface PrioritySliders {
  quality: number;
  price: number;
  speed: number;
  features: number;
}

const RequestDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [request, setRequest] = useState<Request | null>(null);
  const [bids, setBids] = useState<Bid[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingBids, setLoadingBids] = useState(true);
  const [error, setError] = useState('');
  const [cancellingRequest, setCancellingRequest] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);

  useEffect(() => {
    if (id) {
      fetchRequestDetails();
      fetchBids();
    }
  }, [id]);

  const fetchRequestDetails = async () => {
    try {
      setLoading(true);
      const response = await requestService.getRequestById(Number(id));
      
      if (response.success && response.data) {
        setRequest(response.data);
      }
    } catch (err: any) {
      setError(getUserFriendlyError(err));
    } finally {
      setLoading(false);
    }
  };

  const fetchBids = async () => {
    try {
      setLoadingBids(true);
      const response = await requestService.getRequestBids(Number(id));
      
      if (response.success && response.data) {
        setBids(response.data);
      }
    } catch (err: any) {
      console.error('Error fetching bids:', err);
    } finally {
      setLoadingBids(false);
    }
  };

  const handleCancelRequest = async () => {
    if (!id) return;
    
    try {
      setCancellingRequest(true);
      const response = await requestService.cancelRequest(Number(id));
      
      if (response.success) {
        navigate('/customer/requests', {
          state: { message: 'Request cancelled successfully' }
        });
      }
    } catch (err: any) {
      setError(getUserFriendlyError(err));
    } finally {
      setCancellingRequest(false);
      setShowCancelConfirm(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusStyles: { [key: string]: string } = {
      pending_categorization: 'bg-gradient-to-r from-amber-100 to-yellow-100 text-amber-800 border border-amber-200',
      open_for_bids: 'bg-blue-100 text-blue-800',
      bids_received: 'bg-green-100 text-green-800',
      in_progress: 'bg-purple-100 text-purple-800',
      completed: 'bg-gray-100 text-gray-800',
      cancelled: 'bg-red-100 text-red-800',
      expired: 'bg-gray-100 text-gray-600',
    };

    const statusLabels: { [key: string]: string } = {
      pending_categorization: 'AI Categorizing',
      open_for_bids: 'Open for Bids',
      bids_received: 'Bids Received',
      in_progress: 'In Progress',
      completed: 'Completed',
      cancelled: 'Cancelled',
      expired: 'Expired',
    };

    // Add processing indicator for pending categorization
    if (status === 'pending_categorization') {
      return (
        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-semibold ${statusStyles[status]}`}>
          <svg className="animate-spin h-3.5 w-3.5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          {statusLabels[status]}
        </span>
      );
    }

    return (
      <span className={`px-3 py-1 rounded-full text-sm font-semibold ${statusStyles[status] || 'bg-gray-100 text-gray-800'}`}>
        {statusLabels[status] || status}
      </span>
    );
  };

  const getBidStatusBadge = (status: string) => {
    const statusStyles: { [key: string]: string } = {
      pending: 'bg-yellow-100 text-yellow-800',
      accepted: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800',
      cancelled: 'bg-gray-100 text-gray-800',
    };

    return (
      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${statusStyles[status] || 'bg-gray-100 text-gray-800'}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatCurrency = (amount: number, currency: string = 'EUR') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!request) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto p-6 lg:p-8">
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Request not found</h3>
            <p className="text-gray-600 mb-6">The request you're looking for doesn't exist or has been removed.</p>
            <Link to="/customer/requests" className="btn btn-primary">
              Back to Requests
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
        <Link to="/customer/requests" className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-4">
          <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Requests
        </Link>

        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center space-x-3 mb-2">
              <h1 className="text-3xl font-bold text-gray-900">{request.title}</h1>
              {getStatusBadge(request.status)}
            </div>
            <p className="text-gray-600">Created on {formatDate(request.created_at)}</p>
          </div>

          <div className="flex items-center space-x-2">
            {['pending_categorization', 'open_for_bids'].includes(request.status) && (
              <>
                <Link
                  to={`/customer/requests/${request.id}/edit`}
                  className="btn btn-outline"
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  Edit
                </Link>
                <button
                  onClick={() => setShowCancelConfirm(true)}
                  className="btn bg-red-600 hover:bg-red-700 text-white"
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  Cancel Request
                </button>
              </>
            )}
          </div>
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

      {/* Request Details */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Main Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Description */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Description</h2>
            <p className="text-gray-700 whitespace-pre-wrap">{request.description}</p>
          </div>

          {/* Project Priorities */}
          {request.priorities && (() => {
            let priorities: PrioritySliders | null = null;
            try {
              priorities = JSON.parse(request.priorities);
            } catch (e) {
              return null;
            }
            
            if (!priorities) return null;

            const priorityItems = [
              {
                key: 'quality',
                label: 'Quality',
                value: priorities.quality,
                color: 'purple',
                bgColor: 'bg-purple-100',
                barColor: 'bg-purple-600',
                textColor: 'text-purple-600',
                icon: (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                ),
                description: 'Premium materials & craftsmanship'
              },
              {
                key: 'price',
                label: 'Best Price',
                value: priorities.price,
                color: 'green',
                bgColor: 'bg-green-100',
                barColor: 'bg-green-600',
                textColor: 'text-green-600',
                icon: (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                ),
                description: 'Cost-effectiveness'
              },
              {
                key: 'speed',
                label: 'Fast Delivery',
                value: priorities.speed,
                color: 'blue',
                bgColor: 'bg-blue-100',
                barColor: 'bg-blue-600',
                textColor: 'text-blue-600',
                icon: (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                ),
                description: 'Quick turnaround time'
              },
              {
                key: 'features',
                label: 'Custom Features',
                value: priorities.features,
                color: 'orange',
                bgColor: 'bg-orange-100',
                barColor: 'bg-orange-600',
                textColor: 'text-orange-600',
                icon: (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 4a2 2 0 114 0v1a1 1 0 001 1h3a1 1 0 011 1v3a1 1 0 01-1 1h-1a2 2 0 100 4h1a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-1a2 2 0 10-4 0v1a1 1 0 01-1 1H7a1 1 0 01-1-1v-3a1 1 0 00-1-1H4a2 2 0 110-4h1a1 1 0 001-1V7a1 1 0 011-1h3a1 1 0 001-1V4z" />
                  </svg>
                ),
                description: 'Customization options'
              }
            ];

            return (
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Project Priorities</h2>
                <p className="text-sm text-gray-600 mb-6">
                  Customer's preferences for this project
                </p>
                
                <div className="space-y-5">
                  {priorityItems.map((item) => (
                    <div key={item.key}>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center">
                          <span className={`${item.textColor} mr-2`}>
                            {item.icon}
                          </span>
                          <span className="text-sm font-medium text-gray-900">{item.label}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="text-xs text-gray-500">{item.description}</span>
                          <span className={`text-sm font-semibold ${item.textColor} min-w-[3rem] text-right`}>
                            {item.value}%
                          </span>
                        </div>
                      </div>
                      <div className={`w-full h-2.5 ${item.bgColor} rounded-full overflow-hidden`}>
                        <div 
                          className={`h-full ${item.barColor} rounded-full transition-all duration-300`}
                          style={{ width: `${item.value}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })()}
          
          {/* File Notes */}
          {request.file_notes && (
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">File Notes</h2>
              <p className="text-gray-700 whitespace-pre-wrap">{request.file_notes}</p>
            </div>
          )}

          {/* Bids Section */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">
                Bids ({bids.length})
              </h2>
            </div>

            {loadingBids ? (
              <div className="flex items-center justify-center py-8">
                <LoadingSpinner size="md" />
              </div>
            ) : bids.length === 0 ? (
              <div className="text-center py-8">
                <svg className="w-12 h-12 text-gray-400 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                </svg>
                <p className="text-gray-600">No bids received yet</p>
                <p className="text-sm text-gray-500 mt-1">Suppliers will start submitting bids soon</p>
              </div>
            ) : (
              <div className="space-y-4">
                {bids.map((bid) => (
                  <div key={bid.id} className="border border-gray-200 rounded-lg p-4 hover:border-primary-300 transition-colors">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <h3 className="font-semibold text-gray-900">
                            {bid.company_name || `${bid.supplier_first_name} ${bid.supplier_last_name}`}
                          </h3>
                          {getBidStatusBadge(bid.status)}
                        </div>
                        {bid.supplier_rating && (
                          <div className="flex items-center text-sm text-gray-600">
                            <svg className="w-4 h-4 text-yellow-400 mr-1" fill="currentColor" viewBox="0 0 20 20">
                              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                            </svg>
                            {bid.supplier_rating} • {bid.total_completed_orders || 0} completed orders
                          </div>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-primary-600">
                          {formatCurrency(bid.price, request.currency)}
                        </p>
                        <p className="text-sm text-gray-500">
                          Delivery: {bid.delivery_days} days
                        </p>
                      </div>
                    </div>

                    {bid.message && (
                      <div className="bg-gray-50 rounded p-3 mb-3">
                        <p className="text-sm text-gray-700">{bid.message}</p>
                      </div>
                    )}

                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500">
                        Submitted {formatDate(bid.created_at)}
                      </span>
                      
                      {bid.status === 'pending' && (
                        <div className="flex items-center space-x-2">
                          <button className="text-primary-600 hover:text-primary-700 font-medium">
                            Accept Bid
                          </button>
                          <button className="text-red-600 hover:text-red-700 font-medium">
                            Reject
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Request Info */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Request Info</h2>
            
            <dl className="space-y-4">
              {request.category_name && (
                <div>
                  <dt className="text-sm text-gray-500">Category</dt>
                  <dd className="mt-1 font-medium text-gray-900">{request.category_name}</dd>
                </div>
              )}

              <div>
                <dt className="text-sm text-gray-500">Budget Range</dt>
                <dd className="mt-1 font-medium text-gray-900">
                  {request.budget_min && request.budget_max
                    ? `${formatCurrency(request.budget_min, request.currency)} - ${formatCurrency(request.budget_max, request.currency)}`
                    : 'Not specified'}
                </dd>
              </div>

              <div>
                <dt className="text-sm text-gray-500">Delivery Date</dt>
                <dd className="mt-1 font-medium text-gray-900">
                  {request.delivery_date ? formatDate(request.delivery_date) : 'Flexible'}
                </dd>
              </div>

              <div>
                <dt className="text-sm text-gray-500">Time Flexibility</dt>
                <dd className="mt-1 font-medium text-gray-900">
                  {request.time_flexibility === 'critical'
                    ? 'Critical'
                    : request.time_flexibility === 'week'
                    ? '1 Week'
                    : '1 Month'}
                </dd>
              </div>

              {request.expires_at && (
                <div>
                  <dt className="text-sm text-gray-500">Expires On</dt>
                  <dd className="mt-1 font-medium text-gray-900">
                    {formatDate(request.expires_at)}
                  </dd>
                </div>
              )}

              <div>
                <dt className="text-sm text-gray-500">Last Updated</dt>
                <dd className="mt-1 font-medium text-gray-900">
                  {formatDate(request.updated_at)}
                </dd>
              </div>
            </dl>
          </div>

          {/* Bid Statistics */}
          {bids.length > 0 && (
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Bid Statistics</h2>
              
              <dl className="space-y-4">
                <div>
                  <dt className="text-sm text-gray-500">Total Bids</dt>
                  <dd className="mt-1 text-2xl font-bold text-gray-900">{bids.length}</dd>
                </div>

                {request.min_bid_price && (
                  <div>
                    <dt className="text-sm text-gray-500">Lowest Bid</dt>
                    <dd className="mt-1 text-xl font-semibold text-green-600">
                      {formatCurrency(request.min_bid_price, request.currency)}
                    </dd>
                  </div>
                )}

                {request.max_bid_price && (
                  <div>
                    <dt className="text-sm text-gray-500">Highest Bid</dt>
                    <dd className="mt-1 text-xl font-semibold text-red-600">
                      {formatCurrency(request.max_bid_price, request.currency)}
                    </dd>
                  </div>
                )}

                {request.pending_bids !== undefined && (
                  <div>
                    <dt className="text-sm text-gray-500">Pending Bids</dt>
                    <dd className="mt-1 text-xl font-semibold text-yellow-600">
                      {request.pending_bids}
                    </dd>
                  </div>
                )}
              </dl>
            </div>
          )}
        </div>
      </div>

      {/* Cancel Confirmation Modal */}
      {showCancelConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6 animate-fade-in">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Cancel Request?</h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to cancel this request? This action cannot be undone and all pending bids will be cancelled.
            </p>
            <div className="flex items-center justify-end space-x-3">
              <button
                onClick={() => setShowCancelConfirm(false)}
                className="btn btn-outline"
                disabled={cancellingRequest}
              >
                No, Keep It
              </button>
              <button
                onClick={handleCancelRequest}
                disabled={cancellingRequest}
                className="btn bg-red-600 hover:bg-red-700 text-white"
              >
                {cancellingRequest ? (
                  <>
                    <LoadingSpinner size="sm" />
                    <span className="ml-2">Cancelling...</span>
                  </>
                ) : (
                  'Yes, Cancel Request'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  );
};

export default RequestDetails;

