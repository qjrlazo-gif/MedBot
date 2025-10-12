import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import UserManagement from '../components/UserManagement';
import SuppliesManagement from '../components/SuppliesManagement';
import RoomsManagement from '../components/RoomsManagement';
import './Admin.css';

type AdminTab = 'users' | 'supplies' | 'rooms';

const Admin: React.FC = () => {
  const { isAdmin } = useAuth();
  const [activeTab, setActiveTab] = useState<AdminTab>('users');

  if (!isAdmin) {
    return (
      <div className="access-denied">
        <h2>Access Denied</h2>
        <p>You need admin privileges to access the admin panel.</p>
      </div>
    );
  }

  const tabs = [
    { id: 'users' as AdminTab, label: 'Users', icon: '👥' },
    { id: 'supplies' as AdminTab, label: 'Supplies', icon: '📦' },
    { id: 'rooms' as AdminTab, label: 'Rooms', icon: '🏢' }
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'users':
        return <UserManagement />;
      case 'supplies':
        return <SuppliesManagement />;
      case 'rooms':
        return <RoomsManagement />;
      default:
        return <UserManagement />;
    }
  };

  return (
    <div className="admin-page">
      <div className="admin-header">
        <h1>Admin Panel</h1>
        <p>Manage users, supplies, and rooms</p>
      </div>

      <div className="admin-tabs">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            className={`tab-button ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            <span className="tab-icon">{tab.icon}</span>
            <span className="tab-label">{tab.label}</span>
          </button>
        ))}
      </div>

      <div className="admin-content">
        {renderTabContent()}
      </div>
    </div>
  );
};

export default Admin;
