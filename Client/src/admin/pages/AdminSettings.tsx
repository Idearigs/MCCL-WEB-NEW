import React, { useState, useEffect } from 'react';
import AdminLayout from '../components/AdminLayout';
import { Settings, Save, Check } from 'lucide-react';

const SETTINGS_KEY = 'admin_nav_settings';

interface NavSettings {
  showJewelryCategories: boolean;
}

const defaultSettings: NavSettings = {
  showJewelryCategories: false,
};

export function loadNavSettings(): NavSettings {
  try {
    const stored = localStorage.getItem(SETTINGS_KEY);
    return stored ? { ...defaultSettings, ...JSON.parse(stored) } : defaultSettings;
  } catch {
    return defaultSettings;
  }
}

const AdminSettings: React.FC = () => {
  const [settings, setSettings] = useState<NavSettings>(loadNavSettings);
  const [saved, setSaved] = useState(false);

  const handleToggle = (key: keyof NavSettings) => {
    setSettings(prev => ({ ...prev, [key]: !prev[key] }));
    setSaved(false);
  };

  const handleSave = () => {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    setSaved(true);
    // Trigger storage event so AdminLayout re-reads instantly
    window.dispatchEvent(new Event('admin-settings-changed'));
  };

  return (
    <AdminLayout>
      <div className="max-w-2xl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-gray-900 rounded-xl flex items-center justify-center">
              <Settings className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-semibold text-gray-900 font-satoshi">Settings</h1>
              <p className="text-sm text-gray-500 font-satoshi">Manage admin panel preferences</p>
            </div>
          </div>
        </div>

        {/* Navigation Settings */}
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wider font-satoshi">
              Navigation
            </h2>
            <p className="text-xs text-gray-500 mt-1 font-satoshi">
              Control which items appear in the sidebar
            </p>
          </div>

          <div className="divide-y divide-gray-100">
            <div className="flex items-center justify-between px-6 py-4">
              <div>
                <p className="text-sm font-medium text-gray-900 font-satoshi">Jewelry Categories</p>
                <p className="text-xs text-gray-500 font-satoshi mt-0.5">
                  Show the Jewelry Categories page in the sidebar navigation
                </p>
              </div>
              <button
                onClick={() => handleToggle('showJewelryCategories')}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 focus:outline-none ${
                  settings.showJewelryCategories ? 'bg-gray-900' : 'bg-gray-300'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform duration-200 ${
                    settings.showJewelryCategories ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="mt-6 flex items-center gap-3">
          <button
            onClick={handleSave}
            className="flex items-center gap-2 bg-gray-900 text-white px-6 py-2.5 rounded-xl text-sm font-medium font-satoshi hover:bg-gray-800 transition-colors"
          >
            {saved ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
            {saved ? 'Saved' : 'Save Changes'}
          </button>
          {saved && (
            <p className="text-sm text-green-600 font-satoshi">
              Settings saved — sidebar will update on next navigation.
            </p>
          )}
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminSettings;
