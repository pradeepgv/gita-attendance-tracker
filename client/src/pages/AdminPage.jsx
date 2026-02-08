import { useState } from 'react';
import LoginForm from '../components/LoginForm';
import WeeklyReport from '../components/WeeklyReport';
import FamilyHistory from '../components/FamilyHistory';
import AbsenceAlerts from '../components/AbsenceAlerts';

function AdminPage() {
  const [password, setPassword] = useState('');
  const [authenticated, setAuthenticated] = useState(false);
  const [activeTab, setActiveTab] = useState('weekly');

  if (!authenticated) {
    return <LoginForm onLogin={(pwd) => { setPassword(pwd); setAuthenticated(true); }} />;
  }

  const tabs = [
    { id: 'weekly', label: 'Weekly Report' },
    { id: 'family', label: 'Family History' },
    { id: 'alerts', label: 'Follow-up Alerts' },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Admin Dashboard</h2>
        <button
          onClick={() => { setAuthenticated(false); setPassword(''); }}
          className="text-sm text-gray-500 hover:text-gray-700"
        >
          Logout
        </button>
      </div>

      <div className="flex gap-1 mb-6 bg-white rounded-lg p-1 shadow-sm">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 py-2.5 px-4 rounded-md text-sm font-medium transition ${
              activeTab === tab.id
                ? 'bg-saffron-600 text-white shadow-sm'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'weekly' && <WeeklyReport password={password} />}
      {activeTab === 'family' && <FamilyHistory password={password} />}
      {activeTab === 'alerts' && <AbsenceAlerts password={password} />}
    </div>
  );
}

export default AdminPage;
