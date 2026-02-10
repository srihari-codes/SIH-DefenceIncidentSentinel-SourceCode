import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/Layout';
import {Dashboard} from './pages/Dashboard';
import { ManageComplaints } from './components/ManageComplaints';
import { Chatbot } from './components/Chatbot';
import { Settings } from './components/Settings';
import { Help } from './components/Help';
import { NewComplaint } from './components/NewComplaint';
import Chat from './pages/Chat';
import { initializeSecurityFeatures } from './utils/environmentSecurity';

import { AuthCallback } from './components/AuthCallback';

function App() {
  // Initialize security features on app load
  useEffect(() => {
    initializeSecurityFeatures();
  }, []);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/callback" element={<AuthCallback />} />
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route
          path="/dashboard"
          element={<Layout currentPage="dashboard" />}
        >
          <Route index element={<Dashboard />} />
          <Route path="manage-complaints" element={<ManageComplaints />} />
          <Route path="chatbot" element={<Chat />} />
          <Route path="settings" element={<Settings />} />
          <Route path="help" element={<Help />} />
          <Route path="new-complaint" element={<NewComplaint />} />
        </Route>
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
