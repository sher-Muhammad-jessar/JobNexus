import React from 'react';
import { Settings as SettingsIcon, Bell, Shield, User, Moon, Sun } from 'lucide-react';

export const Settings: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center gap-3 mb-6">
            <SettingsIcon className="text-blue-600" size={32} />
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
              <p className="text-gray-600 text-lg">Manage your account preferences and settings</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Navigation */}
            <div className="lg:col-span-1">
              <nav className="space-y-1">
                <button className="w-full text-left px-4 py-3 bg-blue-50 text-blue-700 rounded-lg font-medium">
                  Account Settings
                </button>
                <button className="w-full text-left px-4 py-3 text-gray-600 hover:bg-gray-50 rounded-lg font-medium">
                  Notifications
                </button>
                <button className="w-full text-left px-4 py-3 text-gray-600 hover:bg-gray-50 rounded-lg font-medium">
                  Privacy & Security
                </button>
                <button className="w-full text-left px-4 py-3 text-gray-600 hover:bg-gray-50 rounded-lg font-medium">
                  Appearance
                </button>
              </nav>
            </div>

            {/* Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Account Settings */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-4">Account Settings</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between py-3 border-b border-gray-100">
                    <div>
                      <div className="font-medium text-gray-900">Email Address</div>
                      <div className="text-sm text-gray-600">user@example.com</div>
                    </div>
                    <button className="text-blue-600 hover:text-blue-700 font-medium text-sm">
                      Change
                    </button>
                  </div>
                  <div className="flex items-center justify-between py-3 border-b border-gray-100">
                    <div>
                      <div className="font-medium text-gray-900">Password</div>
                      <div className="text-sm text-gray-600">Last changed 2 months ago</div>
                    </div>
                    <button className="text-blue-600 hover:text-blue-700 font-medium text-sm">
                      Change
                    </button>
                  </div>
                  <div className="flex items-center justify-between py-3">
                    <div>
                      <div className="font-medium text-gray-900">Delete Account</div>
                      <div className="text-sm text-gray-600">Permanently delete your account</div>
                    </div>
                    <button className="text-red-600 hover:text-red-700 font-medium text-sm">
                      Delete
                    </button>
                  </div>
                </div>
              </div>

              {/* Notification Settings */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-4">Notification Preferences</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium text-gray-900">Job Recommendations</div>
                      <div className="text-sm text-gray-600">Get notified about new job matches</div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" className="sr-only peer" defaultChecked />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium text-gray-900">Application Updates</div>
                      <div className="text-sm text-gray-600">Get updates on your job applications</div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" className="sr-only peer" defaultChecked />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};