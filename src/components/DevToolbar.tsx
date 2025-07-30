import React from 'react';
import { useNavigate } from 'react-router-dom';
import './DevToolbar.css';

interface DevToolbarProps {
  currentPage: string;
  onPageChange: (page: string) => void;
  isMockAuth: boolean;
  onToggleMockAuth: (value: boolean) => void;
}

const DevToolbar: React.FC<DevToolbarProps> = ({ 
  currentPage, 
  onPageChange, 
  isMockAuth, 
  onToggleMockAuth 
}) => {
  const navigate = useNavigate();

  const devPages = [
    { id: 'landing', name: '🏠 Landing', path: '/dev/landing' },
    { id: 'dashboard', name: '📊 Dashboard', path: '/dev/dashboard' },
    { id: 'profile', name: '👤 Profile', path: '/dev/profile' },
    { id: 'workouts', name: '🏋️ Workouts', path: '/dev/workouts' },
    { id: 'schedule', name: '📅 Schedule', path: '/dev/schedule' },
    { id: 'ai-coach', name: '🤖 AI Coach', path: '/dev/ai-coach' },
    { id: 'timer', name: '⏱️ Timer', path: '/dev/timer' },
    { id: 'notes', name: '📝 Notes', path: '/dev/notes' },
    { id: 'subscriptions', name: '💳 Subscriptions', path: '/dev/subscriptions' },
  ];

  const handlePageChange = (page: { id: string; path: string }) => {
    onPageChange(page.id);
    navigate(page.path);
  };

  const switchToPublic = () => {
    navigate('/');
  };

  return (
    <div className="dev-toolbar">
      <div className="dev-toolbar-brand">
        🛠️ <strong>DEV MODE</strong> - Performance Prime
      </div>
      
      <div className="dev-toolbar-pages">
        {devPages.map(page => (
          <button
            key={page.id}
            onClick={() => handlePageChange(page)}
            className={`dev-page-btn ${currentPage === page.id ? 'active' : ''}`}
          >
            {page.name}
          </button>
        ))}
      </div>
      
      <div className="dev-toolbar-controls">
        <label className="dev-toggle">
          <input
            type="checkbox"
            checked={isMockAuth}
            onChange={(e) => onToggleMockAuth(e.target.checked)}
          />
          Mock Auth
        </label>
        
        <button onClick={switchToPublic} className="switch-btn">
          🌐 Switch to Public
        </button>
      </div>
    </div>
  );
};

export default DevToolbar; 