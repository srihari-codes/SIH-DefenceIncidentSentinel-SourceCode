import { useState, useEffect } from 'react';
import { User, Shield, Bell, LogOut, Save } from 'lucide-react';
import { getUserProfile, updateUserProfile, getNotificationSettings, updateNotificationSettings } from '../api/user';
import { LoadingSpinner } from './LoadingSpinner';
import { API_CONFIG } from '../utils/constants';

export function Settings() {
  const [activeTab, setActiveTab] = useState('profile');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const [profileData, setProfileData] = useState({
    full_name: '',
    email: '',
    mobile: '',
    identifier: '',
    role: ''
  });

  const [notifications, setNotifications] = useState({
    email_enabled: true,
    sms_enabled: false,
    complaint_updates: true,
    system_alerts: true
  });

  // Fetch user data on mount
  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [profileRes, notifRes] = await Promise.all([
        getUserProfile(),
        getNotificationSettings().catch(() => ({ success: false }))
      ]);

      if (profileRes.success) {
        setProfileData(profileRes.data);
      }

      if (notifRes.success) {
        setNotifications(notifRes.data);
      }
    } catch (err) {
      console.error('Failed to fetch settings:', err);
      setError('Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  const handleProfileChange = (e) => {
    setProfileData({
      ...profileData,
      [e.target.name]: e.target.value,
    });
  };

  const handleNotificationChange = (key) => {
    setNotifications({
      ...notifications,
      [key]: !notifications[key],
    });
  };

  const handleSaveProfile = async () => {
    try {
      setSaving(true);
      
      const response = await updateUserProfile({
        full_name: profileData.full_name,
        mobile: profileData.mobile
      });

      if (response.success) {
        alert('Profile updated successfully!');
      }
    } catch (err) {
      console.error('Failed to update profile:', err);
      alert('Failed to update profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveNotifications = async () => {
    try {
      setSaving(true);
      
      const response = await updateNotificationSettings(notifications);

      if (response.success) {
        alert('Notification settings updated successfully!');
      }
    } catch (err) {
      console.error('Failed to update notifications:', err);
      alert('Failed to update notification settings. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    if (confirm('Are you sure you want to logout?')) {
      // Call logout endpoint to clear cookies on server
      try {
        await fetch(`${API_CONFIG.BASE_URL}/api/auth/logout`, {
          method: 'POST',
          credentials: 'include'
        });
      } catch (err) {
        console.error('Logout error:', err);
      }
      
      // Redirect to Auth Service login
      window.location.href = `${API_CONFIG.AUTH_SERVICE_URL}/login`;
    }
  };

  if (loading) {
    return <LoadingSpinner size="lg" text="Loading settings..." />;
  }

  return (
    <div className="p-4 lg:p-8">
      <div className="mb-8">
        <h1 className="text-blue-600 mb-2">Settings</h1>
        <p className="text-gray-600">Manage your account settings and preferences</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-200 mb-8 overflow-x-auto">
        <button
          onClick={() => setActiveTab('profile')}
          className={`px-4 py-2 border-b-2 transition-colors whitespace-nowrap ${
            activeTab === 'profile'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-600 hover:text-blue-600'
          }`}
        >
          <User className="w-4 h-4 inline mr-2" />
          Profile
        </button>

        <button
          onClick={() => setActiveTab('security')}
          className={`px-4 py-2 border-b-2 transition-colors whitespace-nowrap ${
            activeTab === 'security'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-600 hover:text-blue-600'
          }`}
        >
          <Shield className="w-4 h-4 inline mr-2" />
          Security
        </button>

        <button
          onClick={() => setActiveTab('notifications')}
          className={`px-4 py-2 border-b-2 transition-colors whitespace-nowrap ${
            activeTab === 'notifications'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-600 hover:text-blue-600'
          }`}
        >
          <Bell className="w-4 h-4 inline mr-2" />
          Notifications
        </button>
      </div>

      {/* Profile Tab */}
      {activeTab === 'profile' && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-blue-600 mb-6">Personal Information</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-gray-700 mb-2">Full Name</label>
              <input
                type="text"
                name="full_name"
                value={profileData.full_name}
                onChange={handleProfileChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-gray-900"
              />
            </div>

            <div>
              <label className="block text-gray-700 mb-2">Email</label>
              <input
                type="email"
                name="email"
                value={profileData.email}
                disabled
                className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-600 cursor-not-allowed"
                title="Email cannot be changed"
              />
            </div>

            <div>
              <label className="block text-gray-700 mb-2">Mobile</label>
              <input
                type="tel"
                name="mobile"
                value={profileData.mobile || ''}
                onChange={handleProfileChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-gray-900"
              />
            </div>

            <div>
              <label className="block text-gray-700 mb-2">Identifier</label>
              <input
                type="text"
                name="identifier"
                value={profileData.identifier || ''}
                disabled
                className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-600 cursor-not-allowed"
                title="Identifier cannot be changed"
              />
            </div>

            <div>
              <label className="block text-gray-700 mb-2">Role</label>
              <input
                type="text"
                name="role"
                value={profileData.role || ''}
                disabled
                className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-600 cursor-not-allowed capitalize"
                title="Role is managed by administrators"
              />
            </div>
          </div>

          <div className="mt-6 flex justify-end">
            <button
              onClick={handleSaveProfile}
              disabled={saving}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Save className="w-5 h-5" />
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      )}

      {/* Security Tab */}
      {activeTab === 'security' && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-blue-600 mb-6">Security Settings</h2>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
            <h3 className="text-blue-700 font-semibold mb-2">Authentication Managed by Auth Service</h3>
            <p className="text-gray-700 mb-4">
              Password changes and MFA settings are managed through the Defence Incident Sentinel Auth Service.
            </p>
            <a
              href={`${API_CONFIG.AUTH_SERVICE_URL}/security-settings`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Manage Security Settings
            </a>
          </div>
        </div>
      )}

      {/* Notifications Tab */}
      {activeTab === 'notifications' && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-blue-600 mb-6">Notification Preferences</h2>

          <div className="space-y-4">
            {[
              {
                key: 'email_enabled',
                title: 'Email Notifications',
                sub: 'Receive updates via email',
              },
              {
                key: 'sms_enabled',
                title: 'SMS Notifications',
                sub: 'Receive updates via SMS',
              },
              {
                key: 'complaint_updates',
                title: 'Complaint Updates',
                sub: 'Get notified about complaint status changes',
              },
              {
                key: 'system_alerts',
                title: 'System Alerts',
                sub: 'Receive important system notifications',
              },
            ].map((item) => (
              <div
                key={item.key}
                className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
              >
                <div>
                  <h3 className="text-gray-900">{item.title}</h3>
                  <p className="text-gray-600">{item.sub}</p>
                </div>

                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={notifications[item.key]}
                    onChange={() => handleNotificationChange(item.key)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>
            ))}
          </div>

          <div className="mt-6 flex justify-end">
            <button
              onClick={handleSaveNotifications}
              disabled={saving}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Save className="w-5 h-5" />
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      )}

      {/* Logout Section */}
      <div className="mt-8 bg-red-50 border border-red-200 rounded-xl p-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-red-600">Logout</h3>
            <p className="text-gray-600">Sign out from your account</p>
          </div>

          <button
            onClick={handleLogout}
            className="bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2"
          >
            <LogOut className="w-5 h-5" />
            Logout
          </button>
        </div>
      </div>
    </div>
  );
}
