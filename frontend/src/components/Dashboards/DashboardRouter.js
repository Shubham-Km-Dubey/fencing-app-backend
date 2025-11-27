import React from 'react';
import FencerDashboard from './FencerDashboard';
import CoachDashboard from './CoachDashboard';
import RefereeDashboard from './RefereeDashboard';
import SchoolDashboard from './SchoolDashboard';
import ClubDashboard from './ClubDashboard';

const DashboardRouter = ({ user, onLogout }) => {
  const renderDashboard = () => {
    switch (user.role) {
      case 'fencer':
        return <FencerDashboard user={user} onLogout={onLogout} />;
      case 'coach':
        return <CoachDashboard user={user} onLogout={onLogout} />;
      case 'referee':
        return <RefereeDashboard user={user} onLogout={onLogout} />;
      case 'school':
        return <SchoolDashboard user={user} onLogout={onLogout} />;
      case 'club':
        return <ClubDashboard user={user} onLogout={onLogout} />;
      default:
        return <FencerDashboard user={user} onLogout={onLogout} />;
    }
  };

  return renderDashboard();
};

export default DashboardRouter;