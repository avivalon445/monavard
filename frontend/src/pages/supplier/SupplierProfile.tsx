import React, { useState, useEffect } from 'react';
import { supplierProfileService, CompleteSupplierProfile, UpdateSupplierProfileData, UpdateUserInfoData, NotificationPreferencesData, PrivacySettingsData, SupplierCategoryData } from '@/services/supplierProfileService';
import { categoryService } from '@/services/categoryService';
import { getUserFriendlyError } from '@/utils/errorMessages';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import Alert from '@/components/common/Alert';
import SupplierPageWrapper from '@/components/layout/SupplierPageWrapper';
import SupplierCardLayout from '@/components/layout/SupplierCardLayout';
import SupplierGridLayout from '@/components/layout/SupplierGridLayout';

type ProfileTab = 'overview' | 'company' | 'categories' | 'notifications' | 'privacy' | 'files';

const SupplierProfile: React.FC = () => {
  const [activeTab, setActiveTab] = useState<ProfileTab>('overview');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [profile, setProfile] = useState<CompleteSupplierProfile | null>(null);
  const [categories, setCategories] = useState<any[]>([]);
  const [saving, setSaving] = useState(false);

  // Form states
  const [companyForm, setCompanyForm] = useState<UpdateSupplierProfileData>({});
  const [userForm, setUserForm] = useState<UpdateUserInfoData>({});
  const [notificationForm, setNotificationForm] = useState<NotificationPreferencesData>({});
  const [privacyForm, setPrivacyForm] = useState<PrivacySettingsData>({});
  const [categoryForm, setCategoryForm] = useState<SupplierCategoryData>({
    category_id: 0,
    expertise_level: 'beginner',
    experience_years: 0,
    portfolio_items: '',
    certifications: ''
  });

  useEffect(() => {
    fetchProfileData();
    fetchCategories();
  }, []);

  const fetchProfileData = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await supplierProfileService.getProfile();
      if (response.success) {
        setProfile(response.data);
        setCompanyForm({
          company_name: response.data.profile?.company_name || '',
          description: response.data.profile?.description || '',
          address: response.data.profile?.address || '',
          city: response.data.profile?.city || '',
          country: response.data.profile?.country || '',
          website: response.data.profile?.website || '',
          business_license: response.data.profile?.business_license || '',
          tax_id: response.data.profile?.tax_id || '',
          company_size: response.data.profile?.company_size || '',
          year_established: response.data.profile?.year_established || '',
          portfolio_description: response.data.profile?.portfolio_description || '',
          insurance_coverage: response.data.profile?.insurance_coverage || '',
          timezone: response.data.profile?.timezone || '',
          business_hours: response.data.profile?.business_hours || ''
        });
        setUserForm({
          first_name: response.data.user?.first_name || '',
          last_name: response.data.user?.last_name || '',
          phone: response.data.user?.phone || ''
        });
        setNotificationForm({
          email_new_requests: response.data.notification_settings?.email_new_requests || false,
          email_bid_updates: response.data.notification_settings?.email_bid_updates || false,
          email_order_updates: response.data.notification_settings?.email_order_updates || false,
          sms_notifications: response.data.notification_settings?.sms_notifications || false,
          push_notifications: response.data.notification_settings?.push_notifications || false,
          notification_frequency: response.data.notification_settings?.notification_frequency || 'immediate'
        });
        setPrivacyForm({
          profile_visibility: response.data.privacy_settings?.profile_visibility || 'public',
          show_contact_info: response.data.privacy_settings?.show_contact_info || false,
          show_portfolio: response.data.privacy_settings?.show_portfolio || true,
          show_reviews: response.data.privacy_settings?.show_reviews || true,
          allow_messages: response.data.privacy_settings?.allow_messages || true
        });
      } else {
        setError(response.message || 'Failed to load profile data');
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
        setCategories(response.data);
      }
    } catch (err) {
      console.error('Error fetching categories:', err);
    }
  };

  const handleSaveCompany = async () => {
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      const response = await supplierProfileService.updateProfile(companyForm);
      if (response.success) {
        setSuccess('Company information updated successfully');
        fetchProfileData();
      } else {
        setError(response.message || 'Failed to update company information');
      }
    } catch (err) {
      setError(getUserFriendlyError(err));
    } finally {
      setSaving(false);
    }
  };

  const handleSaveUserInfo = async () => {
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      const response = await supplierProfileService.updateUserInfo(userForm);
      if (response.success) {
        setSuccess('Personal information updated successfully');
        fetchProfileData();
      } else {
        setError(response.message || 'Failed to update personal information');
      }
    } catch (err) {
      setError(getUserFriendlyError(err));
    } finally {
      setSaving(false);
    }
  };

  const handleSaveNotifications = async () => {
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      const response = await supplierProfileService.updateNotificationPreferences(notificationForm);
      if (response.success) {
        setSuccess('Notification preferences updated successfully');
        fetchProfileData();
      } else {
        setError(response.message || 'Failed to update notification preferences');
      }
    } catch (err) {
      setError(getUserFriendlyError(err));
    } finally {
      setSaving(false);
    }
  };

  const handleSavePrivacy = async () => {
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      const response = await supplierProfileService.updatePrivacySettings(privacyForm);
      if (response.success) {
        setSuccess('Privacy settings updated successfully');
        fetchProfileData();
      } else {
        setError(response.message || 'Failed to update privacy settings');
      }
    } catch (err) {
      setError(getUserFriendlyError(err));
    } finally {
      setSaving(false);
    }
  };

  const handleAddCategory = async () => {
    if (!categoryForm.category_id) {
      setError('Please select a category');
      return;
    }
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      const response = await supplierProfileService.addCategory(categoryForm);
      if (response.success) {
        setSuccess('Category added successfully');
        setCategoryForm({
          category_id: 0,
          expertise_level: 'beginner',
          experience_years: 0,
          portfolio_items: '',
          certifications: ''
        });
        fetchProfileData();
      } else {
        setError(response.message || 'Failed to add category');
      }
    } catch (err) {
      setError(getUserFriendlyError(err));
    } finally {
      setSaving(false);
    }
  };

  const handleRemoveCategory = async (categoryId: number) => {
    if (!confirm('Are you sure you want to remove this category?')) return;
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      const response = await supplierProfileService.removeCategory(categoryId);
      if (response.success) {
        setSuccess('Category removed successfully');
        fetchProfileData();
      } else {
        setError(response.message || 'Failed to remove category');
      }
    } catch (err) {
      setError(getUserFriendlyError(err));
    } finally {
      setSaving(false);
    }
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

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-96">
        <LoadingSpinner />
      </div>
    );
  }

  if (!profile || !profile.profile) {
    return (
      <Alert type="error" message="Failed to load profile data" className="max-w-4xl mx-auto" />
    );
  }

  return (
    <SupplierPageWrapper
      title="Company Profile"
      subtitle="Manage your company information, settings, and preferences"
      headerActions={
        <div className="flex items-center space-x-3">
          <div className="text-sm text-gray-500">
            Profile Completion: <span className="font-medium text-blue-600">{profile.profile.profile_completion}%</span>
          </div>
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
              { id: 'company', name: 'Company Info' },
              { id: 'categories', name: 'Categories' },
              { id: 'notifications', name: 'Notifications' },
              { id: 'privacy', name: 'Privacy' },
              { id: 'files', name: 'Files' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as ProfileTab)}
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
          <SupplierGridLayout columns={3} gap={6}>
            <SupplierCardLayout>
              <h4 className="text-sm font-medium text-gray-500">Company Name</h4>
              <p className="mt-1 text-lg font-semibold text-gray-900">{profile.profile.company_name}</p>
            </SupplierCardLayout>
            <SupplierCardLayout>
              <h4 className="text-sm font-medium text-gray-500">Rating</h4>
              <p className="mt-1 text-lg font-semibold text-gray-900">
                {profile.profile.rating && typeof profile.profile.rating === 'number' 
                  ? profile.profile.rating.toFixed(1) 
                  : '0.0'}/5.0
              </p>
            </SupplierCardLayout>
            <SupplierCardLayout>
              <h4 className="text-sm font-medium text-gray-500">Reviews</h4>
              <p className="mt-1 text-lg font-semibold text-gray-900">{profile.profile.review_count || 0}</p>
            </SupplierCardLayout>
          </SupplierGridLayout>

          <SupplierGridLayout columns={2} gap={6}>
            <SupplierCardLayout>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Company Information</h3>
              <dl className="space-y-3">
                <div>
                  <dt className="text-sm font-medium text-gray-500">Business License</dt>
                  <dd className="text-sm text-gray-900">{profile.profile.business_license || 'Not provided'}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Tax ID</dt>
                  <dd className="text-sm text-gray-900">{profile.profile.tax_id || 'Not provided'}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Company Size</dt>
                  <dd className="text-sm text-gray-900">{profile.profile.company_size || 'Not specified'}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Established</dt>
                  <dd className="text-sm text-gray-900">{profile.profile.year_established || 'Not specified'}</dd>
                </div>
              </dl>
            </SupplierCardLayout>

            <SupplierCardLayout>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Contact Information</h3>
              <dl className="space-y-3">
                <div>
                  <dt className="text-sm font-medium text-gray-500">Email</dt>
                  <dd className="text-sm text-gray-900">{profile.user.email}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Phone</dt>
                  <dd className="text-sm text-gray-900">{profile.user.phone || 'Not provided'}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Website</dt>
                  <dd className="text-sm text-gray-900">
                    {profile.profile.website ? (
                      <a href={profile.profile.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800">
                        {profile.profile.website}
                      </a>
                    ) : 'Not provided'}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Address</dt>
                  <dd className="text-sm text-gray-900">
                    {profile.profile.address ? (
                      <div>
                        <div>{profile.profile.address}</div>
                        <div>{profile.profile.city}, {profile.profile.country}</div>
                      </div>
                    ) : 'Not provided'}
                  </dd>
                </div>
              </dl>
            </SupplierCardLayout>
          </SupplierGridLayout>

          <SupplierCardLayout>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Company Description</h3>
            <p className="text-sm text-gray-700 whitespace-pre-wrap">
              {profile.profile.description || 'No description provided'}
            </p>
          </SupplierCardLayout>
        </div>
      )}

      {activeTab === 'company' && (
        <div className="space-y-6">
          <SupplierCardLayout>
            <h3 className="text-lg font-medium text-gray-900 mb-6">Company Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Company Name</label>
                <input
                  type="text"
                  value={companyForm.company_name || ''}
                  onChange={(e) => setCompanyForm({ ...companyForm, company_name: e.target.value })}
                  className="input"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Business License</label>
                <input
                  type="text"
                  value={companyForm.business_license || ''}
                  onChange={(e) => setCompanyForm({ ...companyForm, business_license: e.target.value })}
                  className="input"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Tax ID</label>
                <input
                  type="text"
                  value={companyForm.tax_id || ''}
                  onChange={(e) => setCompanyForm({ ...companyForm, tax_id: e.target.value })}
                  className="input"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Website</label>
                <input
                  type="url"
                  value={companyForm.website || ''}
                  onChange={(e) => setCompanyForm({ ...companyForm, website: e.target.value })}
                  className="input"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Company Size</label>
                <select
                  value={companyForm.company_size || ''}
                  onChange={(e) => setCompanyForm({ ...companyForm, company_size: e.target.value })}
                  className="input"
                >
                  <option value="">Select size</option>
                  <option value="1-10">1-10 employees</option>
                  <option value="11-50">11-50 employees</option>
                  <option value="51-200">51-200 employees</option>
                  <option value="201-1000">201-1000 employees</option>
                  <option value="1000+">1000+ employees</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Year Established</label>
                <input
                  type="number"
                  value={companyForm.year_established || ''}
                  onChange={(e) => setCompanyForm({ ...companyForm, year_established: parseInt(e.target.value) || undefined })}
                  className="input"
                  min="1800"
                  max={new Date().getFullYear()}
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">Address</label>
                <textarea
                  value={companyForm.address || ''}
                  onChange={(e) => setCompanyForm({ ...companyForm, address: e.target.value })}
                  className="input"
                  rows={3}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">City</label>
                <input
                  type="text"
                  value={companyForm.city || ''}
                  onChange={(e) => setCompanyForm({ ...companyForm, city: e.target.value })}
                  className="input"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Country</label>
                <input
                  type="text"
                  value={companyForm.country || ''}
                  onChange={(e) => setCompanyForm({ ...companyForm, country: e.target.value })}
                  className="input"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                <textarea
                  value={companyForm.description || ''}
                  onChange={(e) => setCompanyForm({ ...companyForm, description: e.target.value })}
                  className="input"
                  rows={4}
                  placeholder="Describe your company, services, and expertise..."
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">Portfolio Description</label>
                <textarea
                  value={companyForm.portfolio_description || ''}
                  onChange={(e) => setCompanyForm({ ...companyForm, portfolio_description: e.target.value })}
                  className="input"
                  rows={3}
                  placeholder="Brief description of your portfolio and capabilities..."
                />
              </div>
            </div>
            <div className="mt-6 flex justify-end">
              <button
                onClick={handleSaveCompany}
                disabled={saving}
                className="btn btn-primary"
              >
                {saving ? 'Saving...' : 'Save Company Information'}
              </button>
            </div>
          </SupplierCardLayout>

          <SupplierCardLayout>
            <h3 className="text-lg font-medium text-gray-900 mb-6">Personal Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">First Name</label>
                <input
                  type="text"
                  value={userForm.first_name || ''}
                  onChange={(e) => setUserForm({ ...userForm, first_name: e.target.value })}
                  className="input"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Last Name</label>
                <input
                  type="text"
                  value={userForm.last_name || ''}
                  onChange={(e) => setUserForm({ ...userForm, last_name: e.target.value })}
                  className="input"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
                <input
                  type="tel"
                  value={userForm.phone || ''}
                  onChange={(e) => setUserForm({ ...userForm, phone: e.target.value })}
                  className="input"
                />
              </div>
            </div>
            <div className="mt-6 flex justify-end">
              <button
                onClick={handleSaveUserInfo}
                disabled={saving}
                className="btn btn-primary"
              >
                {saving ? 'Saving...' : 'Save Personal Information'}
              </button>
            </div>
          </SupplierCardLayout>
        </div>
      )}

      {activeTab === 'categories' && (
        <div className="space-y-6">
          <SupplierCardLayout>
            <h3 className="text-lg font-medium text-gray-900 mb-6">Add Category</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                <select
                  value={categoryForm.category_id}
                  onChange={(e) => setCategoryForm({ ...categoryForm, category_id: parseInt(e.target.value) })}
                  className="input"
                  required
                >
                  <option value={0}>Select category</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Expertise Level</label>
                <select
                  value={categoryForm.expertise_level}
                  onChange={(e) => setCategoryForm({ ...categoryForm, expertise_level: e.target.value })}
                  className="input"
                >
                  <option value="beginner">Beginner</option>
                  <option value="intermediate">Intermediate</option>
                  <option value="advanced">Advanced</option>
                  <option value="expert">Expert</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Experience Years</label>
                <input
                  type="number"
                  value={categoryForm.experience_years}
                  onChange={(e) => setCategoryForm({ ...categoryForm, experience_years: parseInt(e.target.value) })}
                  className="input"
                  min="0"
                  max="50"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">Portfolio Items</label>
                <textarea
                  value={categoryForm.portfolio_items || ''}
                  onChange={(e) => setCategoryForm({ ...categoryForm, portfolio_items: e.target.value })}
                  className="input"
                  rows={3}
                  placeholder="Describe your portfolio items in this category..."
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">Certifications</label>
                <textarea
                  value={categoryForm.certifications || ''}
                  onChange={(e) => setCategoryForm({ ...categoryForm, certifications: e.target.value })}
                  className="input"
                  rows={3}
                  placeholder="List any relevant certifications..."
                />
              </div>
            </div>
            <div className="mt-6 flex justify-end">
              <button
                onClick={handleAddCategory}
                disabled={saving}
                className="btn btn-primary"
              >
                {saving ? 'Adding...' : 'Add Category'}
              </button>
            </div>
          </SupplierCardLayout>

          <SupplierCardLayout>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Current Categories</h3>
            {profile.categories.length === 0 ? (
              <p className="text-gray-500">No categories added yet.</p>
            ) : (
              <div className="space-y-4">
                {profile.categories.map((category) => (
                  <div key={category.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-medium text-gray-900">{category.category_name}</h4>
                        <p className="text-sm text-gray-500">
                          {category.expertise_level} • {category.experience_years} years experience
                        </p>
                        {category.portfolio_items && (
                          <p className="text-sm text-gray-600 mt-2">{category.portfolio_items}</p>
                        )}
                        {category.certifications && (
                          <p className="text-sm text-gray-600 mt-1">Certifications: {category.certifications}</p>
                        )}
                      </div>
                      <button
                        onClick={() => handleRemoveCategory(category.id)}
                        disabled={saving}
                        className="text-red-600 hover:text-red-800 text-sm font-medium"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </SupplierCardLayout>
        </div>
      )}

      {activeTab === 'notifications' && (
        <SupplierCardLayout>
          <h3 className="text-lg font-medium text-gray-900 mb-6">Notification Preferences</h3>
          <div className="space-y-6">
            <div>
              <h4 className="text-sm font-medium text-gray-900 mb-4">Email Notifications</h4>
              <div className="space-y-3">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={notificationForm.email_new_requests || false}
                    onChange={(e) => setNotificationForm({ ...notificationForm, email_new_requests: e.target.checked })}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">New requests matching my categories</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={notificationForm.email_bid_updates || false}
                    onChange={(e) => setNotificationForm({ ...notificationForm, email_bid_updates: e.target.checked })}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">Bid updates and responses</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={notificationForm.email_order_updates || false}
                    onChange={(e) => setNotificationForm({ ...notificationForm, email_order_updates: e.target.checked })}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">Order updates and status changes</span>
                </label>
              </div>
            </div>

            <div>
              <h4 className="text-sm font-medium text-gray-900 mb-4">Other Notifications</h4>
              <div className="space-y-3">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={notificationForm.sms_notifications || false}
                    onChange={(e) => setNotificationForm({ ...notificationForm, sms_notifications: e.target.checked })}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">SMS notifications</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={notificationForm.push_notifications || false}
                    onChange={(e) => setNotificationForm({ ...notificationForm, push_notifications: e.target.checked })}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">Push notifications</span>
                </label>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Notification Frequency</label>
              <select
                value={notificationForm.notification_frequency || 'immediate'}
                onChange={(e) => setNotificationForm({ ...notificationForm, notification_frequency: e.target.value })}
                className="input"
              >
                <option value="immediate">Immediate</option>
                <option value="daily">Daily digest</option>
                <option value="weekly">Weekly digest</option>
                <option value="never">Never</option>
              </select>
            </div>

            <div className="flex justify-end">
              <button
                onClick={handleSaveNotifications}
                disabled={saving}
                className="btn btn-primary"
              >
                {saving ? 'Saving...' : 'Save Notification Preferences'}
              </button>
            </div>
          </div>
        </SupplierCardLayout>
      )}

      {activeTab === 'privacy' && (
        <SupplierCardLayout>
          <h3 className="text-lg font-medium text-gray-900 mb-6">Privacy Settings</h3>
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Profile Visibility</label>
              <select
                value={privacyForm.profile_visibility || 'public'}
                onChange={(e) => setPrivacyForm({ ...privacyForm, profile_visibility: e.target.value })}
                className="input"
              >
                <option value="public">Public</option>
                <option value="private">Private</option>
                <option value="verified_only">Verified users only</option>
              </select>
            </div>

            <div>
              <h4 className="text-sm font-medium text-gray-900 mb-4">Information Display</h4>
              <div className="space-y-3">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={privacyForm.show_contact_info || false}
                    onChange={(e) => setPrivacyForm({ ...privacyForm, show_contact_info: e.target.checked })}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">Show contact information</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={privacyForm.show_portfolio || false}
                    onChange={(e) => setPrivacyForm({ ...privacyForm, show_portfolio: e.target.checked })}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">Show portfolio</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={privacyForm.show_reviews || false}
                    onChange={(e) => setPrivacyForm({ ...privacyForm, show_reviews: e.target.checked })}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">Show reviews and ratings</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={privacyForm.allow_messages || false}
                    onChange={(e) => setPrivacyForm({ ...privacyForm, allow_messages: e.target.checked })}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">Allow direct messages</span>
                </label>
              </div>
            </div>

            <div className="flex justify-end">
              <button
                onClick={handleSavePrivacy}
                disabled={saving}
                className="btn btn-primary"
              >
                {saving ? 'Saving...' : 'Save Privacy Settings'}
              </button>
            </div>
          </div>
        </SupplierCardLayout>
      )}

      {activeTab === 'files' && (
        <SupplierCardLayout>
          <h3 className="text-lg font-medium text-gray-900 mb-6">Company Files</h3>
          {profile.files.length === 0 ? (
            <div className="text-center py-12">
              <div className="mx-auto h-12 w-12 text-gray-400">
                <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="mt-2 text-sm font-medium text-gray-900">No files uploaded</h3>
              <p className="mt-1 text-sm text-gray-500">Get started by uploading your first company document.</p>
              <div className="mt-6">
                <button className="btn btn-primary">
                  Upload File
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {profile.files.map((file) => (
                <div key={file.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="flex-shrink-0">
                        <div className="h-8 w-8 bg-gray-100 rounded flex items-center justify-center">
                          <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                        </div>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{file.original_name}</p>
                        <p className="text-sm text-gray-500">
                          {file.file_category} • {file.file_size && typeof file.file_size === 'number' ? (file.file_size / 1024).toFixed(1) : '0.0'} KB • {formatDate(file.created_at)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        file.is_public ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                      }`}>
                        {file.is_public ? 'Public' : 'Private'}
                      </span>
                      <button className="text-red-600 hover:text-red-800 text-sm font-medium">
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </SupplierCardLayout>
      )}
    </SupplierPageWrapper>
  );
};

export default SupplierProfile;
