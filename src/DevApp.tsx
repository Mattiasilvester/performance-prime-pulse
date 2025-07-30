import React, { useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

// Componenti
import Landing from './pages/Landing';
import Dashboard from './pages/Dashboard';
import Profile from './pages/Profile';
import Workouts from './pages/Workouts';
import Schedule from './pages/Schedule';
import AICoach from './pages/AICoach';
import Notes from './pages/Notes';
import Timer from './pages/Timer';
import Subscriptions from './pages/Subscriptions';
import { AppLayout } from './components/layout/AppLayout';

// Dev Tools
import DevToolbar from './components/DevToolbar.tsx';

// Mock user per sviluppo
const mockUser = {
  id: 'dev-user-123',
  email: 'dev@performanceprime.it',
  user_metadata: {
    first_name: 'Dev',
    last_name: 'User'
  }
};

function DevApp() {
  const [currentPage, setCurrentPage] = useState('landing');
  const [isMockAuth, setIsMockAuth] = useState(false);

  console.log('🛠️ DevApp caricato - Modalità sviluppo attiva');

  return (
    <div className="dev-app">
      {/* Dev Toolbar sempre visibile */}
      <DevToolbar 
        currentPage={currentPage}
        onPageChange={setCurrentPage}
        isMockAuth={isMockAuth}
        onToggleMockAuth={setIsMockAuth}
      />
      
      <div className="dev-content">
        <Routes>
          {/* Homepage Dev - sempre landing */}
          <Route path="/dev" element={<Navigate to="/dev/landing" replace />} />
          
          {/* Landing Page */}
          <Route 
            path="/dev/landing" 
            element={<Landing devMode={true} />} 
          />
          
          {/* Dashboard e componenti - accessibili direttamente */}
          <Route 
            path="/dev/dashboard" 
            element={
              <AppLayout>
                <Dashboard />
              </AppLayout>
            } 
          />
          <Route 
            path="/dev/profile" 
            element={
              <AppLayout>
                <Profile />
              </AppLayout>
            } 
          />
          <Route 
            path="/dev/workouts" 
            element={
              <AppLayout>
                <Workouts />
              </AppLayout>
            } 
          />
          <Route 
            path="/dev/schedule" 
            element={
              <AppLayout>
                <Schedule />
              </AppLayout>
            } 
          />
          <Route 
            path="/dev/ai-coach" 
            element={
              <AppLayout>
                <AICoach />
              </AppLayout>
            } 
          />
          <Route 
            path="/dev/timer" 
            element={
              <AppLayout>
                <Timer />
              </AppLayout>
            } 
          />
          <Route 
            path="/dev/notes" 
            element={
              <AppLayout>
                <Notes />
              </AppLayout>
            } 
          />
          <Route 
            path="/dev/subscriptions" 
            element={
              <AppLayout>
                <Subscriptions />
              </AppLayout>
            } 
          />
          
          {/* Fallback */}
          <Route path="/dev/*" element={<Navigate to="/dev/landing" replace />} />
        </Routes>
      </div>
    </div>
  );
}

export default DevApp; 