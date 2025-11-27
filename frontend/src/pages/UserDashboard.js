import React from 'react';
import DashboardRouter from '../components/Dashboards/DashboardRouter';

const UserDashboard = ({ user, onLogout }) => {
  return <DashboardRouter user={user} onLogout={onLogout} />;
};

export default UserDashboard;