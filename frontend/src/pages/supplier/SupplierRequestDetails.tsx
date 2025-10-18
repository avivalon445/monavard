import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link, useLocation } from 'react-router-dom';
import { requestService } from '@/services/requestService';
import { Request } from '@/types';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import Alert from '@/components/common/Alert';
import { getUserFriendlyError } from '@/utils/errorMessages';
import SupplierPageLayout from '@/components/layout/SupplierPageLayout';
import SupplierCardLayout from '@/components/layout/SupplierCardLayout';

const SupplierRequestDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const [request, setRequest] = useState<Request | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [infoMessage, setInfoMessage] = useState('');

  useEffect(() => {
    if (id) {
      fetchRequestDetails();
    }
    
    // Check for navigation state message
    if (location.state?.message) {
      setInfoMessage(location.state.message);
      // Clear the state to prevent message from showing again on refresh
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [id, location.state, location.pathname, navigate]);

  const fetchRequestDetails = async () => {
    try {
      setLoading(true);
      const response = await requestService.getSupplierRequestById(Number(id));
      
      if (response.success) {
        setRequest(response.data);
      } else {
        setError('Failed to load request details');
      }
    } catch (err: any) {
      setError(getUserFriendlyError(err));
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatCurrency = (amount: number | null | undefined, currency: string = 'EUR') => {
    if (!amount) return 'N/A';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
    }).format(amount);
  };

  const getBudgetRange = (request: Request) => {
    const { budget_min, budget_max, currency } = request;
    if (!budget_min && !budget_max) return 'Budget not specified';
    if (budget_min && budget_max) {
      return `${formatCurrency(budget_min, currency)} - ${formatCurrency(budget_max, currency)}`;
    }
    if (budget_min) return `From ${formatCurrency(budget_min, currency)}`;
    if (budget_max) return `Up to ${formatCurrency(budget_max, currency)}`;
    return 'Budget not specified';
  };

  const getStatusBadge = (status: string) => {
    const statusStyles: { [key: string]: string } = {
      open_for_bids: 'bg-blue-100 text-blue-800',
      bids_received: 'bg-green-100 text-green-800',
    };

    const statusLabels: { [key: string]: string } = {
      open_for_bids: 'Open for Bids',
      bids_received: 'Bids Received',
    };

    return (
      <span className={`px-3 py-1 rounded-full text-sm font-semibold ${statusStyles[status] || 'bg-gray-100 text-gray-800'}`}>
        {statusLabels[status] || status}
      </span>
    );
  };

  const getTimeFlexibilityColor = (flexibility: string) => {
    const colors: { [key: string]: string } = {
      critical: 'text-red-600',
      important: 'text-orange-600',
      flexible: 'text-green-600',
    };
    return colors[flexibility] || 'text-gray-600';
  };

  const getTimeFlexibilityLabel = (flexibility: string) => {
    const labels: { [key: string]: string } = {
      critical: 'Critical',
      important: 'Important',
      flexible: 'Flexible',
    };
    return labels[flexibility] || flexibility;
  };

  const getPriorityColor = (priority: number) => {
    if (priority >= 80) return 'text-green-600';
    if (priority >= 60) return 'text-blue-600';
    if (priority >= 40) return 'text-yellow-600';
    return 'text-gray-600';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md mx-auto">
          <Alert
            type="error"
            message={error}
            onClose={() => setError('')}
          />
          <div className="mt-4 text-center">
            <Link
              to="/supplier/requests"
              className="btn btn-primary"
            >
              Back to Requests
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (!request) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Request Not Found</h2>
          <p className="text-gray-600 mb-6">The request you're looking for doesn't exist or is no longer available.</p>
          <Link
            to="/supplier/requests"
            className="btn btn-primary"
          >
            Back to Requests
          </Link>
        </div>
      </div>
    );
  }

  const headerActions = (
    <div className="flex items-center space-x-4">
      <Link
        to="/supplier/requests"
        className="text-gray-500 hover:text-gray-700"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
      </Link>
      {request.has_bid && (
        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
          <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
          You have submitted a bid
        </span>
      )}
    </div>
  );

  return (
    <SupplierPageLayout
      title={request.title}
      subtitle={`Request #${request.id} • ${request.category_name || 'Uncategorized'}`}
      headerActions={headerActions}
      maxWidth="7xl"
    >
      {infoMessage && (
        <Alert
          type="info"
          message={infoMessage}
          onClose={() => setInfoMessage('')}
          className="mb-6"
        />
      )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Request Description */}
            <SupplierCardLayout>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Request Details</h2>
              <div className="prose prose-gray max-w-none">
                <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                  {request.description}
                </p>
              </div>
            </SupplierCardLayout>

            {/* Budget and Timeline */}
            <SupplierCardLayout>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Budget & Timeline</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-2">Budget Range</h3>
                  <p className="text-lg font-semibold text-gray-900">{getBudgetRange(request)}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-2">Delivery Date</h3>
                  <p className="text-lg font-semibold text-gray-900">
                    {request.delivery_date ? formatDate(request.delivery_date) : 'Not specified'}
                  </p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-2">Time Flexibility</h3>
                  <p className={`text-lg font-semibold ${getTimeFlexibilityColor(request.time_flexibility)}`}>
                    {getTimeFlexibilityLabel(request.time_flexibility)}
                  </p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-2">Current Bids</h3>
                  <p className="text-lg font-semibold text-gray-900">{request.bid_count || 0} bids</p>
                </div>
              </div>
            </SupplierCardLayout>

            {/* Customer Priorities */}
            {request.priorities && (
              <SupplierCardLayout>
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Customer Priorities</h2>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium text-gray-700">Quality</span>
                      <span className={`text-sm font-semibold ${getPriorityColor(request.priorities.quality)}`}>
                        {request.priorities.quality}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full"
                        style={{ width: `${request.priorities.quality}%` }}
                      ></div>
                    </div>
                  </div>
                  
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium text-gray-700">Price</span>
                      <span className={`text-sm font-semibold ${getPriorityColor(request.priorities.price)}`}>
                        {request.priorities.price}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-green-600 h-2 rounded-full"
                        style={{ width: `${request.priorities.price}%` }}
                      ></div>
                    </div>
                  </div>
                  
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium text-gray-700">Speed</span>
                      <span className={`text-sm font-semibold ${getPriorityColor(request.priorities.speed)}`}>
                        {request.priorities.speed}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-yellow-600 h-2 rounded-full"
                        style={{ width: `${request.priorities.speed}%` }}
                      ></div>
                    </div>
                  </div>
                  
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium text-gray-700">Features</span>
                      <span className={`text-sm font-semibold ${getPriorityColor(request.priorities.features)}`}>
                        {request.priorities.features}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-purple-600 h-2 rounded-full"
                        style={{ width: `${request.priorities.features}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              </SupplierCardLayout>
            )}

            {/* Additional Notes */}
            {request.file_notes && (
              <SupplierCardLayout>
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Additional Notes</h2>
                <div className="prose prose-gray max-w-none">
                  <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                    {request.file_notes}
                  </p>
                </div>
              </SupplierCardLayout>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Request Info */}
            <SupplierCardLayout>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Request Information</h2>
              <div className="space-y-3">
                <div>
                  <span className="text-sm text-gray-500">Request ID</span>
                  <p className="font-medium text-gray-900">#{request.id}</p>
                </div>
                <div>
                  <span className="text-sm text-gray-500">Posted</span>
                  <p className="font-medium text-gray-900">{formatDate(request.created_at)}</p>
                </div>
                <div>
                  <span className="text-sm text-gray-500">Category</span>
                  <p className="font-medium text-gray-900">{request.category_name || 'Uncategorized'}</p>
                </div>
                <div>
                  <span className="text-sm text-gray-500">Customer</span>
                  <p className="font-medium text-gray-900">{request.customer_name}</p>
                </div>
                {request.expires_at && (
                  <div>
                    <span className="text-sm text-gray-500">Expires</span>
                    <p className="font-medium text-gray-900">{formatDate(request.expires_at)}</p>
                  </div>
                )}
              </div>
            </SupplierCardLayout>

            {/* Actions */}
            <SupplierCardLayout>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Actions</h2>
              <div className="space-y-3">
                {request.has_bid ? (
                  <Link
                    to={`/supplier/bids/${request.my_bid_id}`}
                    className="btn btn-primary w-full text-center"
                  >
                    View My Bid
                  </Link>
                ) : (
                  <Link
                    to={`/supplier/requests/${request.id}/bid`}
                    className="btn btn-primary w-full text-center"
                  >
                    Submit Bid
                  </Link>
                )}
                
                <Link
                  to="/supplier/requests"
                  className="btn btn-secondary w-full text-center"
                >
                  Back to Requests
                </Link>
              </div>
            </SupplierCardLayout>

            {/* Bidding Guidelines */}
            <div className="bg-blue-50 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-blue-900 mb-3">Bidding Guidelines</h3>
              <ul className="space-y-2 text-sm text-blue-800">
                <li className="flex items-start">
                  <svg className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  Be competitive but realistic with your pricing
                </li>
                <li className="flex items-start">
                  <svg className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  Provide detailed proposal information
                </li>
                <li className="flex items-start">
                  <svg className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  Consider customer priorities in your bid
                </li>
                <li className="flex items-start">
                  <svg className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  You can update your bid until the deadline
                </li>
              </ul>
            </div>
          </div>
        </div>
    </SupplierPageLayout>
  );
};

export default SupplierRequestDetails;
