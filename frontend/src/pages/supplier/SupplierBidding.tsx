import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { requestService } from '@/services/requestService';
import { bidService } from '@/services/bidService';
import { Request, CreateBidData } from '@/types';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import Alert from '@/components/common/Alert';
import { getUserFriendlyError } from '@/utils/errorMessages';
import SupplierPageLayout from '@/components/layout/SupplierPageLayout';
import SupplierCardLayout from '@/components/layout/SupplierCardLayout';

interface FormData {
  price: number;
  delivery_time_days: number;
  description: string;
  proposal_details: string;
  materials_cost: number;
  labor_cost: number;
  other_costs: number;
}

interface FormErrors {
  [key: string]: string;
}

const SupplierBidding: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const [request, setRequest] = useState<Request | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [formData, setFormData] = useState<FormData>({
    price: 0,
    delivery_time_days: 1,
    description: '',
    proposal_details: '',
    materials_cost: 0,
    labor_cost: 0,
    other_costs: 0,
  });
  const [errors, setErrors] = useState<FormErrors>({});

  useEffect(() => {
    if (id) {
      fetchRequest();
    }
  }, [id]);

  const fetchRequest = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await requestService.getSupplierRequestById(parseInt(id!));
      if (response.success && response.data) {
        const requestData = response.data;
        
        // Check if bid has already been submitted
        if (requestData.has_bid) {
          // Redirect to request details page with a message
          navigate(`/supplier/requests/${id}`, {
            state: { 
              message: 'You have already submitted a bid for this request.',
              type: 'info'
            }
          });
          return;
        }
        
        setRequest(requestData);
        // Price will be auto-calculated from cost breakdown, no need to pre-fill
      } else {
        setError('Failed to load request details');
      }
    } catch (error) {
      console.error('Error fetching request:', error);
      setError(getUserFriendlyError(error));
    } finally {
      setLoading(false);
    }
  };

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    // Check if at least one cost field has a value
    if (formData.materials_cost === 0 && formData.labor_cost === 0 && formData.other_costs === 0) {
      newErrors.materials_cost = 'At least one cost field must have a value';
    }

    if (!formData.delivery_time_days || formData.delivery_time_days < 1) {
      newErrors.delivery_time_days = 'Delivery time must be at least 1 day';
    }

    if (formData.delivery_time_days > 365) {
      newErrors.delivery_time_days = 'Delivery time cannot exceed 365 days';
    }

    if (formData.description && formData.description.length < 10) {
      newErrors.description = 'Description must be at least 10 characters long';
    }

    if (formData.proposal_details && formData.proposal_details.length < 20) {
      newErrors.proposal_details = 'Proposal details must be at least 20 characters long';
    }

    if (formData.materials_cost < 0) {
      newErrors.materials_cost = 'Materials cost cannot be negative';
    }

    if (formData.labor_cost < 0) {
      newErrors.labor_cost = 'Labor cost cannot be negative';
    }

    if (formData.other_costs < 0) {
      newErrors.other_costs = 'Other costs cannot be negative';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    if (name === 'materials_cost' || name === 'labor_cost' || name === 'other_costs') {
      const newValue = parseFloat(value) || 0;
      setFormData(prev => {
        const updated = { ...prev, [name]: newValue };
        // Auto-calculate total price
        updated.price = updated.materials_cost + updated.labor_cost + updated.other_costs;
        return updated;
      });
    } else if (name === 'delivery_time_days') {
      setFormData(prev => ({ ...prev, [name]: parseInt(value) || 1 }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      setSubmitting(true);
      setError('');
      setSuccess('');

      const bidData: CreateBidData = {
        request_id: parseInt(id!),
        price: formData.price,
        delivery_time_days: formData.delivery_time_days,
        description: formData.description || undefined,
        proposal_details: formData.proposal_details || undefined,
        materials_cost: formData.materials_cost || undefined,
        labor_cost: formData.labor_cost || undefined,
        other_costs: formData.other_costs || undefined,
      };

      const response = await bidService.createSupplierBid(bidData);
      
      if (response.success) {
        setSuccess('Bid submitted successfully!');
        setTimeout(() => {
          navigate('/supplier/requests');
        }, 2000);
      } else {
        setError(response.message || 'Failed to submit bid');
      }
    } catch (error) {
      console.error('Error submitting bid:', error);
      setError(getUserFriendlyError(error));
    } finally {
      setSubmitting(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: request?.currency || 'EUR',
      minimumFractionDigits: 2,
    }).format(amount);
  };


  const headerActions = (
    <div className="flex items-center space-x-4">
      <Link 
        to={`/supplier/requests/${id}`} 
        className="text-gray-500 hover:text-gray-700"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
      </Link>
    </div>
  );

  if (loading) {
    return (
      <SupplierPageLayout
        title="Submit Bid"
        subtitle="Loading request details..."
        headerActions={headerActions}
      >
        <div className="flex justify-center py-12">
          <LoadingSpinner />
        </div>
      </SupplierPageLayout>
    );
  }

  if (!request) {
    return (
      <SupplierPageLayout
        title="Request Not Found"
        subtitle="The requested request could not be found"
        headerActions={headerActions}
      >
        <div className="text-center py-12">
          <Alert
            type="error"
            message="Request not found or you don't have permission to view it"
            className="mb-6"
          />
          <Link to="/supplier/requests" className="btn-primary">
            Back to Requests
          </Link>
        </div>
      </SupplierPageLayout>
    );
  }

  return (
    <SupplierPageLayout
      title="Submit Bid"
      subtitle={`Request #${request.id} • ${request.category_name || 'Uncategorized'}`}
      headerActions={headerActions}
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
          className="mb-6"
        />
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Request Summary */}
        <div className="lg:col-span-1">
          <SupplierCardLayout>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Request Summary</h3>
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium text-gray-500">Title</label>
                <p className="text-gray-900">{request.title}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Category</label>
                <p className="text-gray-900">{request.category_name || 'Uncategorized'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Budget Range</label>
                <p className="text-gray-900">
                  {request.budget_min && request.budget_max
                    ? `${formatCurrency(request.budget_min)} - ${formatCurrency(request.budget_max)}`
                    : request.budget_min
                    ? `From ${formatCurrency(request.budget_min)}`
                    : request.budget_max
                    ? `Up to ${formatCurrency(request.budget_max)}`
                    : 'Not specified'}
                </p>
              </div>
              {request.delivery_date && (
                <div>
                  <label className="text-sm font-medium text-gray-500">Preferred Delivery</label>
                  <p className="text-gray-900">
                    {new Date(request.delivery_date).toLocaleDateString()}
                  </p>
                </div>
              )}
              <div>
                <label className="text-sm font-medium text-gray-500">Status</label>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  request.status === 'open_for_bids' 
                    ? 'bg-green-100 text-green-800'
                    : 'bg-blue-100 text-blue-800'
                }`}>
                  {request.status === 'open_for_bids' ? 'Open for Bids' : 'Bids Received'}
                </span>
              </div>
            </div>
          </SupplierCardLayout>

          {/* Bidding Guidelines */}
          <div className="mt-6 bg-blue-50 rounded-lg p-6">
            <h4 className="text-lg font-semibold text-blue-900 mb-3">Bidding Guidelines</h4>
            <ul className="text-sm text-blue-800 space-y-2">
              <li>• Provide a competitive but realistic price</li>
              <li>• Include detailed proposal information</li>
              <li>• Set achievable delivery timelines</li>
              <li>• Break down costs for transparency</li>
              <li>• You can only submit one bid per request</li>
            </ul>
          </div>
        </div>

        {/* Bid Form */}
        <div className="lg:col-span-2">
          <SupplierCardLayout>
            <h3 className="text-lg font-semibold text-gray-900 mb-6">Submit Your Bid</h3>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Auto-calculated Total Price */}
              <div>
                <label htmlFor="price" className="block text-sm font-medium text-gray-700 mb-2">
                  Total Price (Auto-calculated)
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="text-gray-500 sm:text-sm font-medium">{request.currency || 'EUR'}</span>
                  </div>
                  <input
                    type="text"
                    id="price"
                    name="price"
                    value={formatCurrency(formData.price)}
                    readOnly
                    className="input w-full pl-12 bg-gray-50 text-gray-700 cursor-not-allowed"
                  />
                </div>
                <p className="mt-1 text-sm text-gray-500">
                  Total is automatically calculated from your cost breakdown below
                </p>
              </div>

              {/* Delivery Time */}
              <div>
                <label htmlFor="delivery_time_days" className="block text-sm font-medium text-gray-700 mb-2">
                  Delivery Time (Days) *
                </label>
                <input
                  type="number"
                  id="delivery_time_days"
                  name="delivery_time_days"
                  value={formData.delivery_time_days}
                  onChange={handleInputChange}
                  min="1"
                  max="365"
                  className={`input w-full ${errors.delivery_time_days ? 'border-red-300' : ''}`}
                  required
                />
                {errors.delivery_time_days && <p className="mt-1 text-sm text-red-600">{errors.delivery_time_days}</p>}
              </div>

              {/* Cost Breakdown */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label htmlFor="materials_cost" className="block text-sm font-medium text-gray-700 mb-2">
                    Materials Cost
                  </label>
                  <input
                    type="number"
                    id="materials_cost"
                    name="materials_cost"
                    value={formData.materials_cost}
                    onChange={handleInputChange}
                    step="0.01"
                    min="0"
                    className={`input w-full ${errors.materials_cost ? 'border-red-300' : ''}`}
                    placeholder="0.00"
                  />
                  {errors.materials_cost && <p className="mt-1 text-sm text-red-600">{errors.materials_cost}</p>}
                </div>

                <div>
                  <label htmlFor="labor_cost" className="block text-sm font-medium text-gray-700 mb-2">
                    Labor Cost
                  </label>
                  <input
                    type="number"
                    id="labor_cost"
                    name="labor_cost"
                    value={formData.labor_cost}
                    onChange={handleInputChange}
                    step="0.01"
                    min="0"
                    className={`input w-full ${errors.labor_cost ? 'border-red-300' : ''}`}
                    placeholder="0.00"
                  />
                  {errors.labor_cost && <p className="mt-1 text-sm text-red-600">{errors.labor_cost}</p>}
                </div>

                <div>
                  <label htmlFor="other_costs" className="block text-sm font-medium text-gray-700 mb-2">
                    Other Costs
                  </label>
                  <input
                    type="number"
                    id="other_costs"
                    name="other_costs"
                    value={formData.other_costs}
                    onChange={handleInputChange}
                    step="0.01"
                    min="0"
                    className={`input w-full ${errors.other_costs ? 'border-red-300' : ''}`}
                    placeholder="0.00"
                  />
                  {errors.other_costs && <p className="mt-1 text-sm text-red-600">{errors.other_costs}</p>}
                </div>
              </div>


              {/* Description */}
              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                  Brief Description
                </label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows={3}
                  className={`input w-full ${errors.description ? 'border-red-300' : ''}`}
                  placeholder="Brief overview of your approach and what you'll deliver..."
                />
                {errors.description && <p className="mt-1 text-sm text-red-600">{errors.description}</p>}
              </div>

              {/* Proposal Details */}
              <div>
                <label htmlFor="proposal_details" className="block text-sm font-medium text-gray-700 mb-2">
                  Detailed Proposal
                </label>
                <textarea
                  id="proposal_details"
                  name="proposal_details"
                  value={formData.proposal_details}
                  onChange={handleInputChange}
                  rows={6}
                  className={`input w-full ${errors.proposal_details ? 'border-red-300' : ''}`}
                  placeholder="Provide detailed information about your approach, methodology, timeline, and deliverables..."
                />
                {errors.proposal_details && <p className="mt-1 text-sm text-red-600">{errors.proposal_details}</p>}
              </div>

              {/* Submit Button */}
              <div className="flex justify-end space-x-4 pt-6 border-t">
                <Link
                  to={`/supplier/requests/${id}`}
                  className="btn btn-outline"
                >
                  Cancel
                </Link>
                <button
                  type="submit"
                  disabled={submitting}
                  className="btn-primary"
                >
                  {submitting ? (
                    <>
                      <LoadingSpinner size="sm" />
                      Submitting...
                    </>
                  ) : (
                    'Submit Bid'
                  )}
                </button>
              </div>
            </form>
          </SupplierCardLayout>
        </div>
      </div>
    </SupplierPageLayout>
  );
};

export default SupplierBidding;
