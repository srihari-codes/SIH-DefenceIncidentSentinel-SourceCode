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

function App() {
  // Initialize security features on app load
  useEffect(() => {
    initializeSecurityFeatures();
  }, []);

  return (
    <BrowserRouter>
      <Routes>
       
        <Route
          path="/"
          element={<Layout currentPage="dashboard" />}
        >
          <Route path="" element={<Dashboard />} />
          <Route path="manage-complaints" element={<ManageComplaints />} />
          <Route path="chatbot" element={<Chat />} />
          <Route path="settings" element={<Settings />} />
          <Route path="help" element={<Help />} />
          <Route path="new-complaint" element={<NewComplaint />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
