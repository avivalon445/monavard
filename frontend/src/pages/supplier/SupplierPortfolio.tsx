import React, { useState, useEffect } from 'react';
import { supplierPortfolioService, PortfolioItem, PortfolioFilters, CreatePortfolioItemData, PortfolioStatistics } from '@/services/supplierPortfolioService';
import { categoryService } from '@/services/categoryService';
import { getUserFriendlyError } from '@/utils/errorMessages';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import Alert from '@/components/common/Alert';
import SupplierPageWrapper from '@/components/layout/SupplierPageWrapper';
import SupplierCardLayout from '@/components/layout/SupplierCardLayout';
import SupplierGridLayout from '@/components/layout/SupplierGridLayout';

type PortfolioTab = 'overview' | 'items' | 'statistics';

const SupplierPortfolio: React.FC = () => {
  const [activeTab, setActiveTab] = useState<PortfolioTab>('overview');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [portfolio, setPortfolio] = useState<PortfolioItem[]>([]);
  const [statistics, setStatistics] = useState<PortfolioStatistics | null>(null);
  const [categories, setCategories] = useState<any[]>([]);
  const [saving, setSaving] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingItem, setEditingItem] = useState<PortfolioItem | null>(null);

  // Filters
  const [filters, setFilters] = useState<PortfolioFilters>({
    limit: 20,
    offset: 0
  });

  // Form states
  const [itemForm, setItemForm] = useState<CreatePortfolioItemData>({
    title: '',
    description: '',
    category_id: undefined,
    image_url: '',
    project_url: '',
    completion_date: '',
    client_name: '',
    project_value: undefined,
    technologies: [],
    is_featured: false,
    display_order: 0
  });

  useEffect(() => {
    fetchPortfolioData();
    fetchCategories();
    fetchStatistics();
  }, [filters]);

  const fetchPortfolioData = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await supplierPortfolioService.getPortfolio(filters);
      if (response.success) {
        setPortfolio(response.data);
      } else {
        setError(response.message || 'Failed to load portfolio');
      }
    } catch (err) {
      setError(getUserFriendlyError(err));
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await categoryService.getAllCategories();
      if (response.success) {
        setCategories(response.data || []);
      }
    } catch (err) {
      console.error('Error fetching categories:', err);
    }
  };

  const fetchStatistics = async () => {
    try {
      const response = await supplierPortfolioService.getPortfolioStatistics();
      if (response.success) {
        setStatistics(response.data || null);
      }
    } catch (err) {
      console.error('Error fetching statistics:', err);
    }
  };

  const handleAddItem = async () => {
    if (!itemForm.title || !itemForm.description) {
      setError('Title and description are required');
      return;
    }
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      const response = await supplierPortfolioService.createPortfolioItem(itemForm);
      if (response.success) {
        setSuccess('Portfolio item added successfully');
        setShowAddModal(false);
        setItemForm({
          title: '',
          description: '',
          category_id: undefined,
          image_url: '',
          project_url: '',
          completion_date: '',
          client_name: '',
          project_value: undefined,
          technologies: [],
          is_featured: false,
          display_order: 0
        });
        fetchPortfolioData();
        fetchStatistics();
      } else {
        setError(response.message || 'Failed to add portfolio item');
      }
    } catch (err) {
      setError(getUserFriendlyError(err));
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateItem = async () => {
    if (!editingItem || !itemForm.title || !itemForm.description) {
      setError('Title and description are required');
      return;
    }
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      const response = await supplierPortfolioService.updatePortfolioItem(editingItem.id, itemForm);
      if (response.success) {
        setSuccess('Portfolio item updated successfully');
        setEditingItem(null);
        setItemForm({
          title: '',
          description: '',
          category_id: undefined,
          image_url: '',
          project_url: '',
          completion_date: '',
          client_name: '',
          project_value: undefined,
          technologies: [],
          is_featured: false,
          display_order: 0
        });
        fetchPortfolioData();
        fetchStatistics();
      } else {
        setError(response.message || 'Failed to update portfolio item');
      }
    } catch (err) {
      setError(getUserFriendlyError(err));
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteItem = async (itemId: number) => {
    if (!confirm('Are you sure you want to delete this portfolio item?')) return;
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      const response = await supplierPortfolioService.deletePortfolioItem(itemId);
      if (response.success) {
        setSuccess('Portfolio item deleted successfully');
        fetchPortfolioData();
        fetchStatistics();
      } else {
        setError(response.message || 'Failed to delete portfolio item');
      }
    } catch (err) {
      setError(getUserFriendlyError(err));
    } finally {
      setSaving(false);
    }
  };

  const handleToggleFeatured = async (itemId: number) => {
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      const response = await supplierPortfolioService.toggleFeaturedStatus(itemId);
      if (response.success) {
        setSuccess(`Portfolio item ${response.data?.is_featured ? 'featured' : 'unfeatured'} successfully`);
        fetchPortfolioData();
        fetchStatistics();
      } else {
        setError(response.message || 'Failed to update featured status');
      }
    } catch (err) {
      setError(getUserFriendlyError(err));
    } finally {
      setSaving(false);
    }
  };

  const openEditModal = (item: PortfolioItem) => {
    setEditingItem(item);
    setItemForm({
      title: item.title,
      description: item.description,
      category_id: item.category_id,
      image_url: item.image_url || '',
      project_url: item.project_url || '',
      completion_date: item.completion_date || '',
      client_name: item.client_name || '',
      project_value: item.project_value,
      technologies: Array.isArray(item.technologies) ? item.technologies : (item.technologies ? [item.technologies] : []),
      is_featured: item.is_featured,
      display_order: item.display_order
    });
    setShowAddModal(true);
  };

  const closeModal = () => {
    setShowAddModal(false);
    setEditingItem(null);
    setItemForm({
      title: '',
      description: '',
      category_id: undefined,
      image_url: '',
      project_url: '',
      completion_date: '',
      client_name: '',
      project_value: undefined,
      tags: '',
      is_featured: false,
      display_order: 0
    });
  };

  const formatCurrency = (amount: number | null | undefined) => {
    if (amount === null || amount === undefined) return 'N/A';
    return `€${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading && portfolio.length === 0) {
    return (
      <div className="flex justify-center items-center min-h-96">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <SupplierPageWrapper
      title="Portfolio Management"
      subtitle="Showcase your work and attract more customers"
      headerActions={
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setShowAddModal(true)}
            className="btn btn-primary"
          >
            Add Portfolio Item
          </button>
        </div>
      }
    >
      {error && (
        <Alert type="error" message={error} onClose={() => setError('')} className="mb-6" />
      )}
      
      {success && (
        <Alert type="success" message={success} onClose={() => setSuccess('')} className="mb-6" />
      )}

      {/* Tab Navigation */}
      <div className="mb-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8" aria-label="Tabs">
            {[
              { id: 'overview', name: 'Overview' },
              { id: 'items', name: 'Portfolio Items' },
              { id: 'statistics', name: 'Statistics' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as PortfolioTab)}
                className={`
                  ${activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }
                  whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm
                `}
              >
                {tab.name}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {statistics && (
            <SupplierGridLayout columns="4" gap={6}>
              <SupplierCardLayout>
                <h4 className="text-sm font-medium text-gray-500">Total Items</h4>
                <p className="mt-1 text-3xl font-semibold text-gray-900">{statistics.total_items}</p>
              </SupplierCardLayout>
              <SupplierCardLayout>
                <h4 className="text-sm font-medium text-gray-500">Featured Items</h4>
                <p className="mt-1 text-3xl font-semibold text-gray-900">{statistics.featured_items}</p>
              </SupplierCardLayout>
              <SupplierCardLayout>
                <h4 className="text-sm font-medium text-gray-500">Categories</h4>
                <p className="mt-1 text-3xl font-semibold text-gray-900">{statistics.categories_covered}</p>
              </SupplierCardLayout>
              <SupplierCardLayout>
                <h4 className="text-sm font-medium text-gray-500">Avg. Project Value</h4>
                <p className="mt-1 text-3xl font-semibold text-gray-900">{formatCurrency(statistics.avg_project_value)}</p>
              </SupplierCardLayout>
            </SupplierGridLayout>
          )}

          <SupplierGridLayout columns="2" gap={6}>
            <SupplierCardLayout>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Portfolio Items</h3>
              {portfolio.slice(0, 5).length === 0 ? (
                <p className="text-gray-500">No portfolio items yet.</p>
              ) : (
                <div className="space-y-3">
                  {portfolio.slice(0, 5).map((item) => (
                    <div key={item.id} className="border border-gray-200 rounded-lg p-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-medium text-gray-900">{item.title}</h4>
                          <p className="text-sm text-gray-500">{item.category_name}</p>
                          {item.project_value && (
                            <p className="text-sm text-gray-600">{formatCurrency(item.project_value)}</p>
                          )}
                        </div>
                        <div className="flex items-center space-x-2">
                          {item.is_featured && (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                              Featured
                            </span>
                          )}
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                            item.completion_date ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                          }`}>
                            {item.completion_date ? 'Completed' : 'Ongoing'}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </SupplierCardLayout>

            <SupplierCardLayout>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Category Breakdown</h3>
              {statistics?.category_breakdown.length === 0 ? (
                <p className="text-gray-500">No category data available.</p>
              ) : (
                <div className="space-y-3">
                  {statistics?.category_breakdown.slice(0, 5).map((category, index) => (
                    <div key={index} className="flex justify-between items-center">
                      <span className="text-sm font-medium text-gray-900">{category.category_name}</span>
                      <div className="flex items-center space-x-2">
                        <span className="text-sm text-gray-500">{category.item_count} items</span>
                        <span className="text-sm text-gray-600">{formatCurrency(category.avg_value)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </SupplierCardLayout>
          </SupplierGridLayout>
        </div>
      )}

      {activeTab === 'items' && (
        <div className="space-y-6">
          {/* Filters */}
          <SupplierCardLayout>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                <select
                  value={filters.category_id || ''}
                  onChange={(e) => setFilters({ ...filters, category_id: e.target.value ? parseInt(e.target.value) : undefined })}
                  className="input"
                >
                  <option value="">All Categories</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                <select
                  value={filters.is_featured === undefined ? '' : filters.is_featured.toString()}
                  onChange={(e) => setFilters({ 
                    ...filters, 
                    is_featured: e.target.value === '' ? undefined : e.target.value === 'true' 
                  })}
                  className="input"
                >
                  <option value="">All Items</option>
                  <option value="true">Featured Only</option>
                  <option value="false">Non-Featured</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Show</label>
                <select
                  value={filters.limit || 20}
                  onChange={(e) => setFilters({ ...filters, limit: parseInt(e.target.value) })}
                  className="input"
                >
                  <option value={10}>10 items</option>
                  <option value={20}>20 items</option>
                  <option value={50}>50 items</option>
                </select>
              </div>
              <div className="flex items-end">
                <button
                  onClick={() => setShowAddModal(true)}
                  className="btn btn-primary w-full"
                >
                  Add New Item
                </button>
              </div>
            </div>
          </SupplierCardLayout>

          {/* Portfolio Items Grid */}
          {portfolio.length === 0 ? (
            <SupplierCardLayout>
              <div className="text-center py-12">
                <div className="mx-auto h-12 w-12 text-gray-400">
                  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                </div>
                <h3 className="mt-2 text-sm font-medium text-gray-900">No portfolio items</h3>
                <p className="mt-1 text-sm text-gray-500">Get started by adding your first portfolio item.</p>
                <div className="mt-6">
                  <button
                    onClick={() => setShowAddModal(true)}
                    className="btn btn-primary"
                  >
                    Add Portfolio Item
                  </button>
                </div>
              </div>
            </SupplierCardLayout>
          ) : (
            <SupplierGridLayout columns="3" gap={6}>
              {portfolio.map((item) => (
                <SupplierCardLayout key={item.id} className="relative">
                  {item.is_featured && (
                    <div className="absolute top-2 right-2">
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                        Featured
                      </span>
                    </div>
                  )}
                  
                  {item.image_url && (
                    <div className="aspect-w-16 aspect-h-9 mb-4">
                      <img
                        src={item.image_url}
                        alt={item.title}
                        className="w-full h-48 object-cover rounded-lg"
                      />
                    </div>
                  )}
                  
                  <div className="space-y-3">
                    <div>
                      <h3 className="text-lg font-medium text-gray-900">{item.title}</h3>
                      <p className="text-sm text-gray-500">{item.category_name}</p>
                    </div>
                    
                    <p className="text-sm text-gray-700 line-clamp-3">{item.description}</p>
                    
                    <div className="flex justify-between items-center text-sm text-gray-500">
                      <span>{item.client_name || 'Private Client'}</span>
                      {item.project_value && (
                        <span className="font-medium">{formatCurrency(item.project_value)}</span>
                      )}
                    </div>
                    
                    {item.completion_date && (
                      <p className="text-sm text-gray-500">
                        Completed: {formatDate(item.completion_date)}
                      </p>
                    )}
                    
                    <div className="flex justify-between items-center pt-3 border-t border-gray-200">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => openEditModal(item)}
                          className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleToggleFeatured(item.id)}
                          disabled={saving}
                          className="text-yellow-600 hover:text-yellow-800 text-sm font-medium"
                        >
                          {item.is_featured ? 'Unfeature' : 'Feature'}
                        </button>
                      </div>
                      <button
                        onClick={() => handleDeleteItem(item.id)}
                        disabled={saving}
                        className="text-red-600 hover:text-red-800 text-sm font-medium"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </SupplierCardLayout>
              ))}
            </SupplierGridLayout>
          )}
        </div>
      )}

      {activeTab === 'statistics' && statistics && (
        <div className="space-y-6">
          <SupplierGridLayout columns="2" gap={6}>
            <SupplierCardLayout>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Portfolio Overview</h3>
              <dl className="space-y-3">
                <div className="flex justify-between">
                  <dt className="text-sm font-medium text-gray-500">Total Items</dt>
                  <dd className="text-sm text-gray-900">{statistics.total_items}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-sm font-medium text-gray-500">Featured Items</dt>
                  <dd className="text-sm text-gray-900">{statistics.featured_items}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-sm font-medium text-gray-500">Categories Covered</dt>
                  <dd className="text-sm text-gray-900">{statistics.categories_covered}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-sm font-medium text-gray-500">Average Project Value</dt>
                  <dd className="text-sm text-gray-900">{formatCurrency(statistics.avg_project_value)}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-sm font-medium text-gray-500">Total Project Value</dt>
                  <dd className="text-sm text-gray-900">{formatCurrency(statistics.total_project_value)}</dd>
                </div>
              </dl>
            </SupplierCardLayout>

            <SupplierCardLayout>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Timeline</h3>
              <dl className="space-y-3">
                <div className="flex justify-between">
                  <dt className="text-sm font-medium text-gray-500">First Item</dt>
                  <dd className="text-sm text-gray-900">
                    {statistics.first_item_date ? formatDate(statistics.first_item_date) : 'N/A'}
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-sm font-medium text-gray-500">Latest Item</dt>
                  <dd className="text-sm text-gray-900">
                    {statistics.last_item_date ? formatDate(statistics.last_item_date) : 'N/A'}
                  </dd>
                </div>
              </dl>
            </SupplierCardLayout>
          </SupplierGridLayout>

          <SupplierCardLayout>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Category Performance</h3>
            {statistics.category_breakdown.length === 0 ? (
              <p className="text-gray-500">No category data available.</p>
            ) : (
              <div className="space-y-4">
                {statistics.category_breakdown.map((category, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-medium text-gray-900">{category.category_name}</h4>
                        <p className="text-sm text-gray-500">{category.item_count} items</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-gray-900">{formatCurrency(category.avg_value)}</p>
                        <p className="text-sm text-gray-500">avg. value</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </SupplierCardLayout>
        </div>
      )}

      {/* Add/Edit Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-6">
                {editingItem ? 'Edit Portfolio Item' : 'Add Portfolio Item'}
              </h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Title *</label>
                  <input
                    type="text"
                    value={itemForm.title}
                    onChange={(e) => setItemForm({ ...itemForm, title: e.target.value })}
                    className="input"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Description *</label>
                  <textarea
                    value={itemForm.description}
                    onChange={(e) => setItemForm({ ...itemForm, description: e.target.value })}
                    className="input"
                    rows={4}
                    required
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                    <select
                      value={itemForm.category_id || ''}
                      onChange={(e) => setItemForm({ ...itemForm, category_id: e.target.value ? parseInt(e.target.value) : undefined })}
                      className="input"
                    >
                      <option value="">Select category</option>
                      {categories.map((category) => (
                        <option key={category.id} value={category.id}>
                          {category.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Client Name</label>
                    <input
                      type="text"
                      value={itemForm.client_name || ''}
                      onChange={(e) => setItemForm({ ...itemForm, client_name: e.target.value })}
                      className="input"
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Project Value</label>
                    <input
                      type="number"
                      value={itemForm.project_value || ''}
                      onChange={(e) => setItemForm({ ...itemForm, project_value: e.target.value ? parseFloat(e.target.value) : undefined })}
                      className="input"
                      min="0"
                      step="0.01"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Completion Date</label>
                    <input
                      type="date"
                      value={itemForm.completion_date || ''}
                      onChange={(e) => setItemForm({ ...itemForm, completion_date: e.target.value })}
                      className="input"
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Image URL</label>
                    <input
                      type="url"
                      value={itemForm.image_url || ''}
                      onChange={(e) => setItemForm({ ...itemForm, image_url: e.target.value })}
                      className="input"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Project URL</label>
                    <input
                      type="url"
                      value={itemForm.project_url || ''}
                      onChange={(e) => setItemForm({ ...itemForm, project_url: e.target.value })}
                      className="input"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Technologies</label>
                  <input
                    type="text"
                    value={Array.isArray(itemForm.technologies) ? itemForm.technologies.join(', ') : ''}
                    onChange={(e) => setItemForm({ ...itemForm, technologies: e.target.value.split(',').map(t => t.trim()).filter(t => t) })}
                    className="input"
                    placeholder="Separate technologies with commas"
                  />
                </div>
                
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    checked={itemForm.is_featured || false}
                    onChange={(e) => setItemForm({ ...itemForm, is_featured: e.target.checked })}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <label className="ml-2 text-sm text-gray-700">Feature this item</label>
                </div>
              </div>
              
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={closeModal}
                  className="btn btn-secondary"
                >
                  Cancel
                </button>
                <button
                  onClick={editingItem ? handleUpdateItem : handleAddItem}
                  disabled={saving}
                  className="btn btn-primary"
                >
                  {saving ? 'Saving...' : editingItem ? 'Update' : 'Add'} Item
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </SupplierPageWrapper>
  );
};

export default SupplierPortfolio;
