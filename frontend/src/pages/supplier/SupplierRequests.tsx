import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { requestService } from '@/services/requestService';
import { Request } from '@/types';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import Alert from '@/components/common/Alert';
import { getUserFriendlyError } from '@/utils/errorMessages';
import SupplierPageWrapper from '@/components/layout/SupplierPageWrapper';
import SupplierCardLayout from '@/components/layout/SupplierCardLayout';
import SupplierGridLayout from '@/components/layout/SupplierGridLayout';

const SupplierRequests: React.FC = () => {
  const navigate = useNavigate();
  const [requests, setRequests] = useState<Request[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    category_id: '',
    budget_min: '',
    budget_max: '',
    delivery_date_from: '',
    delivery_date_to: '',
    sort: 'created_at',
    order: 'DESC' as 'ASC' | 'DESC',
  });

  useEffect(() => {
    fetchRequests();
  }, [currentPage, filters, searchTerm]);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const filterParams: any = {
        ...filters,
        page: currentPage,
        limit: 10,
      };

      // Clean up empty filters
      if (filters.category_id) filterParams.category_id = parseInt(filters.category_id);
      if (filters.budget_min) filterParams.budget_min = parseFloat(filters.budget_min);
      if (filters.budget_max) filterParams.budget_max = parseFloat(filters.budget_max);
      if (filters.delivery_date_from) filterParams.delivery_date_from = filters.delivery_date_from;
      if (filters.delivery_date_to) filterParams.delivery_date_to = filters.delivery_date_to;
      if (searchTerm.trim()) filterParams.search = searchTerm.trim();

      const response = await requestService.getAvailableRequests(filterParams);
      if (response.success) {
        setRequests(response.data || []);
        setTotalPages(response.meta?.pagination?.pages || 1);
      } else {
        setError('Failed to load requests');
      }
    } catch (err: any) {
      setError(getUserFriendlyError(err));
    } finally {
      setLoading(false);
    }
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
      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${statusStyles[status] || 'bg-gray-100 text-gray-800'}`}>
        {statusLabels[status] || status}
      </span>
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
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

  const hasBidIndicator = (request: Request) => {
    if (request.has_bid) {
      return (
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
            <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
            Bid Submitted
          </span>
        </div>
      );
    }
    return (
      <div className="flex items-center gap-2">
        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
          <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          No Bid Yet
        </span>
      </div>
    );
  };

  if (loading && (!requests || requests.length === 0)) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  // Filter component
  const filtersComponent = (
    <div className="space-y-4">
      {/* Search Bar */}
      <div>
        <div className="relative">
          <input
            type="text"
            placeholder="Search requests by title or description..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input pl-10"
          />
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Category Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Category
          </label>
          <select
            value={filters.category_id}
            onChange={(e) => setFilters({ ...filters, category_id: e.target.value })}
            className="input"
          >
            <option value="">All Categories</option>
            <option value="1">Electronics</option>
            <option value="2">Fashion</option>
            <option value="3">Home & Garden</option>
            <option value="4">Sports</option>
            <option value="5">Books</option>
          </select>
        </div>

        {/* Budget Range */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Min Budget (€)
          </label>
          <input
            type="number"
            placeholder="Min budget"
            value={filters.budget_min}
            onChange={(e) => setFilters({ ...filters, budget_min: e.target.value })}
            className="input"
            min="0"
            step="0.01"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Max Budget (€)
          </label>
          <input
            type="number"
            placeholder="Max budget"
            value={filters.budget_max}
            onChange={(e) => setFilters({ ...filters, budget_max: e.target.value })}
            className="input"
            min="0"
            step="0.01"
          />
        </div>

        {/* Delivery Date Range */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Delivery From
          </label>
          <input
            type="date"
            value={filters.delivery_date_from}
            onChange={(e) => setFilters({ ...filters, delivery_date_from: e.target.value })}
            className="input"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Delivery To
          </label>
          <input
            type="date"
            value={filters.delivery_date_to}
            onChange={(e) => setFilters({ ...filters, delivery_date_to: e.target.value })}
            className="input"
          />
        </div>
      </div>

      {/* Sort Options */}
      <div className="flex flex-wrap gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Sort By
          </label>
          <select
            value={filters.sort}
            onChange={(e) => setFilters({ ...filters, sort: e.target.value })}
            className="input"
          >
            <option value="created_at">Date Created</option>
            <option value="title">Title</option>
            <option value="budget_min">Budget (Low to High)</option>
            <option value="budget_max">Budget (High to Low)</option>
            <option value="delivery_date">Delivery Date</option>
            <option value="bid_count">Bid Count</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Order
          </label>
          <select
            value={filters.order}
            onChange={(e) => setFilters({ ...filters, order: e.target.value as 'ASC' | 'DESC' })}
            className="input"
          >
            <option value="DESC">Newest First</option>
            <option value="ASC">Oldest First</option>
          </select>
        </div>

        <div className="flex items-end">
          <button
            onClick={() => {
              setFilters({
                category_id: '',
                budget_min: '',
                budget_max: '',
                delivery_date_from: '',
                delivery_date_to: '',
                sort: 'created_at',
                order: 'DESC',
              });
              setSearchTerm('');
            }}
            className="btn btn-secondary"
          >
            Clear Filters
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <SupplierPageWrapper
      title="Available Requests"
      subtitle="Browse and bid on product requests from customers"
      filters={filtersComponent}
    >
      {/* Error Alert */}
      {error && (
        <Alert
          type="error"
          message={error}
          onClose={() => setError('')}
          className="mb-6"
        />
      )}

      {/* Requests Grid */}
      {loading ? (
        <div className="flex justify-center py-12">
          <LoadingSpinner />
        </div>
      ) : !requests || requests.length === 0 ? (
        <div className="text-center py-12">
          <div className="mx-auto h-24 w-24 text-gray-400 mb-4">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No requests found</h3>
          <p className="text-gray-500">Try adjusting your filters or check back later for new requests.</p>
        </div>
      ) : (
        <SupplierGridLayout columns={3} gap="lg">
          {requests && requests.map((request) => (
            <SupplierCardLayout key={request.id} hover={true}>
              {/* Header */}
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
                    {request.title}
                  </h3>
                  <div className="flex items-center gap-2 mb-2">
                    {getStatusBadge(request.status)}
                    {hasBidIndicator(request)}
                  </div>
                </div>
              </div>

              {/* Description */}
              <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                {request.description}
              </p>

              {/* Details */}
              <div className="space-y-2 mb-4">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Budget:</span>
                  <span className="font-medium text-gray-900">{getBudgetRange(request)}</span>
                </div>
                
                {request.delivery_date && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Delivery:</span>
                    <span className="font-medium text-gray-900">{formatDate(request.delivery_date)}</span>
                  </div>
                )}

                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Posted:</span>
                  <span className="font-medium text-gray-900">{formatDate(request.created_at)}</span>
                </div>

                {request.category_name && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Category:</span>
                    <span className="font-medium text-gray-900">{request.category_name}</span>
                  </div>
                )}

                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Bids:</span>
                  <span className="font-medium text-gray-900">{request.bid_count || 0}</span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <Link
                  to={`/supplier/requests/${request.id}`}
                  className="btn btn-primary flex-1 text-center"
                >
                  {request.has_bid ? 'View Bid' : 'View & Bid'}
                </Link>
              </div>
            </SupplierCardLayout>
          ))}
        </SupplierGridLayout>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-8 flex justify-center">
          <nav className="flex items-center space-x-2">
            <button
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="px-3 py-2 rounded-md text-sm font-medium text-gray-500 hover:text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                onClick={() => setCurrentPage(page)}
                className={`px-3 py-2 rounded-md text-sm font-medium ${
                  page === currentPage
                    ? 'bg-primary-600 text-white'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                }`}
              >
                {page}
              </button>
            ))}
            
            <button
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
              className="px-3 py-2 rounded-md text-sm font-medium text-gray-500 hover:text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </nav>
        </div>
      )}
    </SupplierPageWrapper>
  );
};

export default SupplierRequests;
