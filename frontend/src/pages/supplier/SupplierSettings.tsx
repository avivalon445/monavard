import React, { useState, useEffect } from 'react';
import { supplierSettingsService, SupplierSettings, UpdateUserInfoData, ChangePasswordData, UpdateEmailData, ToggleTwoFactorData, NotificationPreferencesData, PrivacySettingsData, AccountActivity, DeleteAccountData } from '@/services/supplierSettingsService';
import { getUserFriendlyError } from '@/utils/errorMessages';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import Alert from '@/components/common/Alert';
import SupplierPageWrapper from '@/components/layout/SupplierPageWrapper';
import SupplierCardLayout from '@/components/layout/SupplierCardLayout';

type SettingsTab = 'profile' | 'security' | 'notifications' | 'privacy' | 'activity' | 'danger';

const SupplierSettingsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<SettingsTab>('profile');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [settings, setSettings] = useState<SupplierSettings | null>(null);
  const [activities, setActivities] = useState<AccountActivity[]>([]);
  const [saving, setSaving] = useState(false);

  // Form states
  const [userForm, setUserForm] = useState<UpdateUserInfoData>({});
  const [passwordForm, setPasswordForm] = useState<ChangePasswordData>({
    current_password: '',
    new_password: '',
    confirm_password: ''
  });
  const [emailForm, setEmailForm] = useState<UpdateEmailData>({
    new_email: '',
    current_password: ''
  });
  const [twoFactorForm, setTwoFactorForm] = useState<ToggleTwoFactorData>({
    enable: false,
    current_password: ''
  });
  const [notificationForm, setNotificationForm] = useState<NotificationPreferencesData>({});
  const [privacyForm, setPrivacyForm] = useState<PrivacySettingsData>({});
  const [deleteForm, setDeleteForm] = useState<DeleteAccountData>({
    password: '',
    reason: ''
  });

  // Modal states
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [showTwoFactorModal, setShowTwoFactorModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  useEffect(() => {
    fetchSettings();
    fetchActivities();
  }, []);

  const fetchSettings = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await supplierSettingsService.getSettings();
      if (response.success) {
        setSettings(response.data || null);
        setUserForm({
          first_name: response.data?.user?.first_name || '',
          last_name: response.data?.user?.last_name || '',
          phone: response.data?.user?.phone || ''
        });
        setNotificationForm({
          email_new_requests: response.data?.notification_settings?.email_new_requests || false,
          email_bid_updates: response.data?.notification_settings?.email_bid_updates || false,
          email_order_updates: response.data?.notification_settings?.email_order_updates || false,
          sms_notifications: response.data?.notification_settings?.sms_notifications || false,
          push_notifications: response.data?.notification_settings?.push_notifications || false,
          notification_frequency: response.data?.notification_settings?.notification_frequency || 'immediate'
        });
        setPrivacyForm({
          profile_visibility: response.data?.privacy_settings?.profile_visibility || 'public',
          show_contact_info: response.data?.privacy_settings?.show_contact_info || false,
          show_portfolio: response.data?.privacy_settings?.show_portfolio || true,
          show_reviews: response.data?.privacy_settings?.show_reviews || true,
          allow_messages: response.data?.privacy_settings?.allow_messages || true
        });
      } else {
        setError(response.message || 'Failed to load settings');
      }
    } catch (err) {
      setError(getUserFriendlyError(err));
    } finally {
      setLoading(false);
    }
  };

  const fetchActivities = async () => {
    try {
      const response = await supplierSettingsService.getAccountActivity(50);
      if (response.success) {
        setActivities(response.data || []);
      }
    } catch (err) {
      console.error('Error fetching activities:', err);
    }
  };

  const handleSaveUserInfo = async () => {
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      const response = await supplierSettingsService.updateUserInfo(userForm);
      if (response.success) {
        setSuccess('Personal information updated successfully');
        fetchSettings();
      } else {
        setError(response.message || 'Failed to update personal information');
      }
    } catch (err) {
      setError(getUserFriendlyError(err));
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async () => {
    if (passwordForm.new_password !== passwordForm.confirm_password) {
      setError('New password and confirmation do not match');
      return;
    }
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      const response = await supplierSettingsService.changePassword(passwordForm);
      if (response.success) {
        setSuccess('Password changed successfully');
        setShowPasswordModal(false);
        setPasswordForm({
          current_password: '',
          new_password: '',
          confirm_password: ''
        });
      } else {
        setError(response.message || 'Failed to change password');
      }
    } catch (err) {
      setError(getUserFriendlyError(err));
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateEmail = async () => {
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      const response = await supplierSettingsService.updateEmail(emailForm);
      if (response.success) {
        setSuccess('Email address updated successfully. Please verify your new email.');
        setShowEmailModal(false);
        setEmailForm({
          new_email: '',
          current_password: ''
        });
        fetchSettings();
      } else {
        setError(response.message || 'Failed to update email');
      }
    } catch (err) {
      setError(getUserFriendlyError(err));
    } finally {
      setSaving(false);
    }
  };

  const handleToggleTwoFactor = async () => {
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      const response = await supplierSettingsService.toggleTwoFactor(twoFactorForm);
      if (response.success) {
        setSuccess(response.data.message);
        setShowTwoFactorModal(false);
        setTwoFactorForm({
          enable: false,
          current_password: ''
        });
        fetchSettings();
      } else {
        setError(response.message || 'Failed to update two-factor authentication');
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
      const response = await supplierSettingsService.updateNotificationPreferences(notificationForm);
      if (response.success) {
        setSuccess('Notification preferences updated successfully');
        fetchSettings();
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
      const response = await supplierSettingsService.updatePrivacySettings(privacyForm);
      if (response.success) {
        setSuccess('Privacy settings updated successfully');
        fetchSettings();
      } else {
        setError(response.message || 'Failed to update privacy settings');
      }
    } catch (err) {
      setError(getUserFriendlyError(err));
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!deleteForm.password) {
      setError('Password is required to delete account');
      return;
    }
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      const response = await supplierSettingsService.deleteAccount(deleteForm);
      if (response.success) {
        setSuccess('Account has been deactivated successfully');
        setShowDeleteModal(false);
        setDeleteForm({
          password: '',
          reason: ''
        });
        // Redirect to login or show logout message
        setTimeout(() => {
          window.location.href = '/login';
        }, 2000);
      } else {
        setError(response.message || 'Failed to delete account');
      }
    } catch (err) {
      setError(getUserFriendlyError(err));
    } finally {
      setSaving(false);
    }
  };

  const handleExportData = async () => {
    try {
      const response = await supplierSettingsService.exportAccountData();
      if (response.success) {
        // Create and download file
        const dataStr = JSON.stringify(response.data, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `account_data_${Date.now()}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        setSuccess('Account data exported successfully');
      } else {
        setError(response.message || 'Failed to export account data');
      }
    } catch (err) {
      setError(getUserFriendlyError(err));
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-96">
        <LoadingSpinner />
      </div>
    );
  }

  if (!settings) {
    return (
      <Alert type="error" message="Failed to load settings" className="max-w-4xl mx-auto" />
    );
  }

  return (
    <SupplierPageWrapper
      title="Account Settings"
      subtitle="Manage your account preferences, security, and privacy settings"
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
              { id: 'profile', name: 'Profile' },
              { id: 'security', name: 'Security' },
              { id: 'notifications', name: 'Notifications' },
              { id: 'privacy', name: 'Privacy' },
              { id: 'activity', name: 'Activity' },
              { id: 'danger', name: 'Danger Zone' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as SettingsTab)}
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
      {activeTab === 'profile' && (
        <div className="space-y-6">
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
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                <div className="flex items-center space-x-2">
                  <input
                    type="email"
                    value={settings.user.email}
                    className="input bg-gray-50"
                    disabled
                  />
                  <button
                    onClick={() => setShowEmailModal(true)}
                    className="btn btn-secondary"
                  >
                    Change
                  </button>
                </div>
              </div>
            </div>
            <div className="mt-6 flex justify-end">
              <button
                onClick={handleSaveUserInfo}
                disabled={saving}
                className="btn btn-primary"
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </SupplierCardLayout>

          <SupplierCardLayout>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Account Information</h3>
            <dl className="space-y-3">
              <div className="flex justify-between">
                <dt className="text-sm font-medium text-gray-500">Account Type</dt>
                <dd className="text-sm text-gray-900 capitalize">{settings.user.user_type}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-sm font-medium text-gray-500">Email Verified</dt>
                <dd className="text-sm text-gray-900">
                  {settings.security_settings.email_verified ? (
                    <span className="text-green-600">✓ Verified</span>
                  ) : (
                    <span className="text-red-600">✗ Not verified</span>
                  )}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-sm font-medium text-gray-500">Account Created</dt>
                <dd className="text-sm text-gray-900">{formatDate(settings.security_settings.account_created)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-sm font-medium text-gray-500">Subscription Plan</dt>
                <dd className="text-sm text-gray-900 capitalize">{settings.subscription_info.subscription_plan}</dd>
              </div>
            </dl>
          </SupplierCardLayout>
        </div>
      )}

      {activeTab === 'security' && (
        <div className="space-y-6">
          <SupplierCardLayout>
            <h3 className="text-lg font-medium text-gray-900 mb-6">Password & Security</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                <div>
                  <h4 className="font-medium text-gray-900">Password</h4>
                  <p className="text-sm text-gray-500">Last changed: {settings.security_settings.last_password_change || 'Unknown'}</p>
                </div>
                <button
                  onClick={() => setShowPasswordModal(true)}
                  className="btn btn-secondary"
                >
                  Change Password
                </button>
              </div>
              
              <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                <div>
                  <h4 className="font-medium text-gray-900">Two-Factor Authentication</h4>
                  <p className="text-sm text-gray-500">
                    {settings.security_settings.two_factor_enabled ? 'Enabled' : 'Disabled'}
                  </p>
                </div>
                <button
                  onClick={() => {
                    setTwoFactorForm({ ...twoFactorForm, enable: !settings.security_settings.two_factor_enabled });
                    setShowTwoFactorModal(true);
                  }}
                  className={`btn ${settings.security_settings.two_factor_enabled ? 'btn-secondary' : 'btn-primary'}`}
                >
                  {settings.security_settings.two_factor_enabled ? 'Disable' : 'Enable'} 2FA
                </button>
              </div>
            </div>
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
                  <span className="ml-2 text-gray-700">Allow direct messages</span>
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

      {activeTab === 'activity' && (
        <div className="space-y-6">
          <SupplierCardLayout>
            <h3 className="text-lg font-medium text-gray-900 mb-6">Account Activity</h3>
            {activities.length === 0 ? (
              <p className="text-gray-500">No activity recorded.</p>
            ) : (
              <div className="space-y-3">
                {activities.map((activity, index) => (
                  <div key={index} className="flex justify-between items-center py-3 border-b border-gray-200">
                    <div>
                      <p className="text-sm font-medium text-gray-900 capitalize">
                        {activity.action_type.replace('_', ' ')}
                      </p>
                      {activity.reason && (
                        <p className="text-sm text-gray-500">{activity.reason}</p>
                      )}
                    </div>
                    <span className="text-sm text-gray-500">{formatDate(activity.created_at)}</span>
                  </div>
                ))}
              </div>
            )}
          </SupplierCardLayout>

          <SupplierCardLayout>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Data Export</h3>
            <p className="text-sm text-gray-600 mb-4">
              Download a copy of your account data including profile information, orders, bids, and activity history.
            </p>
            <button
              onClick={handleExportData}
              className="btn btn-secondary"
            >
              Export Account Data
            </button>
          </SupplierCardLayout>
        </div>
      )}

      {activeTab === 'danger' && (
        <SupplierCardLayout>
          <h3 className="text-lg font-medium text-red-600 mb-6">Danger Zone</h3>
          <div className="space-y-6">
            <div className="border border-red-200 rounded-lg p-4 bg-red-50">
              <h4 className="font-medium text-red-900 mb-2">Delete Account</h4>
              <p className="text-sm text-red-700 mb-4">
                Once you delete your account, there is no going back. This action will permanently remove your account and all associated data.
              </p>
              <button
                onClick={() => setShowDeleteModal(true)}
                className="btn btn-danger"
              >
                Delete Account
              </button>
            </div>
          </div>
        </SupplierCardLayout>
      )}

      {/* Password Change Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-1/2 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-6">Change Password</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Current Password</label>
                  <input
                    type="password"
                    value={passwordForm.current_password}
                    onChange={(e) => setPasswordForm({ ...passwordForm, current_password: e.target.value })}
                    className="input"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">New Password</label>
                  <input
                    type="password"
                    value={passwordForm.new_password}
                    onChange={(e) => setPasswordForm({ ...passwordForm, new_password: e.target.value })}
                    className="input"
                    required
                    minLength={8}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Confirm New Password</label>
                  <input
                    type="password"
                    value={passwordForm.confirm_password}
                    onChange={(e) => setPasswordForm({ ...passwordForm, confirm_password: e.target.value })}
                    className="input"
                    required
                    minLength={8}
                  />
                </div>
              </div>
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => setShowPasswordModal(false)}
                  className="btn btn-secondary"
                >
                  Cancel
                </button>
                <button
                  onClick={handleChangePassword}
                  disabled={saving}
                  className="btn btn-primary"
                >
                  {saving ? 'Changing...' : 'Change Password'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Email Change Modal */}
      {showEmailModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-1/2 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-6">Change Email Address</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">New Email Address</label>
                  <input
                    type="email"
                    value={emailForm.new_email}
                    onChange={(e) => setEmailForm({ ...emailForm, new_email: e.target.value })}
                    className="input"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Current Password</label>
                  <input
                    type="password"
                    value={emailForm.current_password}
                    onChange={(e) => setEmailForm({ ...emailForm, current_password: e.target.value })}
                    className="input"
                    required
                  />
                </div>
              </div>
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => setShowEmailModal(false)}
                  className="btn btn-secondary"
                >
                  Cancel
                </button>
                <button
                  onClick={handleUpdateEmail}
                  disabled={saving}
                  className="btn btn-primary"
                >
                  {saving ? 'Updating...' : 'Update Email'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Two-Factor Modal */}
      {showTwoFactorModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-1/2 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-6">
                {twoFactorForm.enable ? 'Enable' : 'Disable'} Two-Factor Authentication
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Current Password</label>
                  <input
                    type="password"
                    value={twoFactorForm.current_password}
                    onChange={(e) => setTwoFactorForm({ ...twoFactorForm, current_password: e.target.value })}
                    className="input"
                    required
                  />
                </div>
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <p className="text-sm text-yellow-800">
                    {twoFactorForm.enable 
                      ? 'Enabling two-factor authentication will add an extra layer of security to your account.'
                      : 'Disabling two-factor authentication will reduce the security of your account.'
                    }
                  </p>
                </div>
              </div>
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => setShowTwoFactorModal(false)}
                  className="btn btn-secondary"
                >
                  Cancel
                </button>
                <button
                  onClick={handleToggleTwoFactor}
                  disabled={saving}
                  className={`btn ${twoFactorForm.enable ? 'btn-primary' : 'btn-danger'}`}
                >
                  {saving ? 'Processing...' : `${twoFactorForm.enable ? 'Enable' : 'Disable'} 2FA`}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Account Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-1/2 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-red-600 mb-6">Delete Account</h3>
              <div className="space-y-4">
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <p className="text-sm text-red-800">
                    <strong>Warning:</strong> This action cannot be undone. This will permanently delete your account and remove all data from our servers.
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Current Password</label>
                  <input
                    type="password"
                    value={deleteForm.password}
                    onChange={(e) => setDeleteForm({ ...deleteForm, password: e.target.value })}
                    className="input"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Reason (Optional)</label>
                  <textarea
                    value={deleteForm.reason}
                    onChange={(e) => setDeleteForm({ ...deleteForm, reason: e.target.value })}
                    className="input"
                    rows={3}
                    placeholder="Tell us why you're deleting your account..."
                  />
                </div>
              </div>
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="btn btn-secondary"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteAccount}
                  disabled={saving}
                  className="btn btn-danger"
                >
                  {saving ? 'Deleting...' : 'Delete Account'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </SupplierPageWrapper>
  );
};

export default SupplierSettingsPage;
