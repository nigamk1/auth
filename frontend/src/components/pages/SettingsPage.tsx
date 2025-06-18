import React, { useState } from 'react';
import { Layout } from '../ui/Layout';
import { UserProfilePage } from './UserProfilePage';
import { ChangePasswordPage } from './ChangePasswordPage';

type SettingsTab = 'profile' | 'security';

export const SettingsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<SettingsTab>('profile');

  const tabs = [
    { id: 'profile' as SettingsTab, name: 'Profile', icon: '👤' },
    { id: 'security' as SettingsTab, name: 'Security', icon: '🔒' },
  ];

  return (
    <Layout title="Settings">
      <div className="px-4 py-6 sm:px-0">
        <div className="border-b border-gray-200 mb-6">
          <nav className="-mb-px flex space-x-8">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`${
                  activeTab === tab.id
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm flex items-center gap-2`}
              >
                <span>{tab.icon}</span>
                {tab.name}
              </button>
            ))}
          </nav>
        </div>

        <div>
          {activeTab === 'profile' && <UserProfilePage />}
          {activeTab === 'security' && <ChangePasswordPage />}
        </div>
      </div>
    </Layout>
  );
};
