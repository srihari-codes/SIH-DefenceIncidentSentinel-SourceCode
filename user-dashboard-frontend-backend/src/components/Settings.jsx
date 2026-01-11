import { useState } from 'react';
import { User, Users, Shield, Bell, LogOut, Save } from 'lucide-react';

export function Settings() {
  const [activeTab, setActiveTab] = useState('profile');

  const [profileData, setProfileData] = useState({
    fullName: 'John Doe',
    email: 'john.doe@example.com',
    rank: 'Captain',
    department: 'Cyber Security Division',
    phone: '+1 234 567 8900',
  });

  const [familyMembers, setFamilyMembers] = useState([
    { id: 1, name: 'Jane Doe', relationship: 'Spouse', phone: '+1 234 567 8901' },
    { id: 2, name: 'Jack Doe', relationship: 'Child', phone: '+1 234 567 8902' },
  ]);

  const [notifications, setNotifications] = useState({
    emailNotifications: true,
    smsNotifications: false,
    complaintsUpdate: true,
    systemAlerts: true,
  });

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

  const handleLogout = () => {
    if (confirm('Are you sure you want to logout?')) {
      alert('Logged out successfully!');
      window.dispatchEvent(new CustomEvent('navigate', { detail: 'dashboard' }));
    }
  };

  const handleSaveProfile = () => {
    alert('Profile updated successfully!');
  };

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
          onClick={() => setActiveTab('family')}
          className={`px-4 py-2 border-b-2 transition-colors whitespace-nowrap ${
            activeTab === 'family'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-600 hover:text-blue-600'
          }`}
        >
          <Users className="w-4 h-4 inline mr-2" />
          Family Details
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
                name="fullName"
                value={profileData.fullName}
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
                onChange={handleProfileChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-gray-900"
              />
            </div>

            <div>
              <label className="block text-gray-700 mb-2">Rank</label>
              <input
                type="text"
                name="rank"
                value={profileData.rank}
                onChange={handleProfileChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-gray-900"
              />
            </div>

            <div>
              <label className="block text-gray-700 mb-2">Department</label>
              <input
                type="text"
                name="department"
                value={profileData.department}
                onChange={handleProfileChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-gray-900"
              />
            </div>

            <div>
              <label className="block text-gray-700 mb-2">Phone</label>
              <input
                type="tel"
                name="phone"
                value={profileData.phone}
                onChange={handleProfileChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-gray-900"
              />
            </div>
          </div>

          <div className="mt-6 flex justify-end">
            <button
              onClick={handleSaveProfile}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
            >
              <Save className="w-5 h-5" />
              Save Changes
            </button>
          </div>
        </div>
      )}

      {/* Family Tab */}
      {activeTab === 'family' && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-blue-600">Family Members</h2>
            <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
              Add Member
            </button>
          </div>

          <div className="space-y-4">
            {familyMembers.map((member) => (
              <div
                key={member.id}
                className="border border-gray-200 rounded-lg p-4 flex justify-between items-center"
              >
                <div>
                  <h3 className="text-gray-900">{member.name}</h3>
                  <p className="text-gray-600">{member.relationship}</p>
                  <p className="text-gray-500">{member.phone}</p>
                </div>

                <div className="flex gap-2">
                  <button className="text-blue-600 hover:text-blue-700 px-3 py-1 rounded-lg hover:bg-blue-50">
                    Edit
                  </button>
                  <button className="text-red-600 hover:text-red-700 px-3 py-1 rounded-lg hover:bg-red-50">
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Security Tab */}
      {activeTab === 'security' && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-blue-600 mb-6">Security Settings</h2>

          <div className="space-y-6">
            <div>
              <h3 className="text-gray-900 mb-4">Change Password</h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-gray-700 mb-2">Current Password</label>
                  <input
                    type="password"
                    placeholder="Enter current password"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-gray-900"
                  />
                </div>

                <div>
                  <label className="block text-gray-700 mb-2">New Password</label>
                  <input
                    type="password"
                    placeholder="Enter new password"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-gray-900"
                  />
                </div>

                <div>
                  <label className="block text-gray-700 mb-2">Confirm New Password</label>
                  <input
                    type="password"
                    placeholder="Confirm new password"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-gray-900"
                  />
                </div>
              </div>

              <button className="mt-4 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors">
                Update Password
              </button>
            </div>

            <div className="border-t border-gray-200 pt-6">
              <h3 className="text-gray-900 mb-4">Two-Factor Authentication</h3>
              <p className="text-gray-600 mb-4">Add an extra layer of security to your account</p>
              <button className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors">
                Enable 2FA
              </button>
            </div>
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
                key: 'emailNotifications',
                title: 'Email Notifications',
                sub: 'Receive updates via email',
              },
              {
                key: 'smsNotifications',
                title: 'SMS Notifications',
                sub: 'Receive updates via SMS',
              },
              {
                key: 'complaintsUpdate',
                title: 'Complaint Updates',
                sub: 'Get notified about complaint status changes',
              },
              {
                key: 'systemAlerts',
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
