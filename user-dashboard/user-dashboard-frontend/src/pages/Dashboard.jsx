import React, { useState, useEffect } from 'react';
import { Plus } from 'lucide-react';
import { useNavigate } from "react-router-dom";
import { getComplaintStatistics } from '../api/complaint';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { EmptyState } from '../components/EmptyState';

export function Dashboard() {
  const navigate = useNavigate();
  
  // State
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({
    total_complaints: 0,
    active_complaints: 0,
    closed_complaints: 0
  });

  // Fetch dashboard statistics
  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const response = await getComplaintStatistics();
        
        if (response.success) {
          setStats(response.data);
        }
      } catch (err) {
        console.error('Failed to fetch statistics:', err);
        setError('Failed to load dashboard');
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  const handleFileComplaint = () => {
    navigate("/dashboard/new-complaint");
  };

  const handleViewComplaints = () => {
    navigate("/dashboard/manage-complaints");
  };

  const handleChat = () => {
    navigate("/dashboard/chatbot");
  };

  // Loading state
  if (loading) {
    return <LoadingSpinner size="lg" text="Loading dashboard..." />;
  }

  // Error state
  if (error) {
    return (
      <div className="p-4 lg:p-8">
        <EmptyState
          title="Failed to load dashboard"
          description={error}
          action={
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Retry
            </button>
          }
        />
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-8">
      <div className="mb-8">
        <h1 className="text-blue-600 mb-2">Dashboard</h1>
        <p className="text-gray-600">Welcome back! Here's your overview.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 max-w-5xl">
        
        {/* FILE A COMPLAINT */}
        <div
          onClick={handleFileComplaint}
          className="bg-white border-2 border-blue-600 rounded-2xl p-8 cursor-pointer hover:bg-blue-50 transition-colors group h-[200px] flex flex-col justify-center"
        >
          <div className="w-14 h-14 bg-blue-100 group-hover:bg-blue-200 rounded-xl mb-4 flex items-center justify-center transition-colors">
            <Plus className="w-7 h-7 text-blue-600" />
          </div>
          <h3 className="text-blue-600 mb-2 font-semibold text-xl">File a Complaint</h3>
          <p className="text-gray-600">Report a cybersecurity incident</p>
        </div>

        {/* VIEW COMPLAINTS */}
        <div
          onClick={handleViewComplaints}
          className="bg-gradient-to-br from-blue-50 to-blue-100 border-2 border-blue-200 rounded-2xl p-8 cursor-pointer hover:shadow-lg transition-all h-[200px] flex flex-col justify-center"
        >
          <h3 className="text-blue-700 font-semibold text-xl mb-4">Your Complaints</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-2xl font-bold text-blue-600">{stats.active_complaints}</p>
              <p className="text-sm text-gray-600">Active</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-green-600">{stats.closed_complaints}</p>
              <p className="text-sm text-gray-600">Resolved</p>
            </div>
          </div>
        </div>

        {/* CHAT WITH AI */}
        <div
          onClick={handleChat}
          className="bg-gradient-to-br from-purple-50 to-purple-100 border-2 border-purple-200 rounded-2xl p-8 cursor-pointer hover:shadow-lg transition-all h-[200px] flex flex-col justify-center"
        >
          <div className="w-14 h-14 bg-purple-100 rounded-xl mb-4 flex items-center justify-center">
            <span className="text-3xl">💬</span>
          </div>
          <h3 className="text-purple-700 font-semibold text-xl mb-2">AI Assistant</h3>
          <p className="text-gray-600">Get cybersecurity guidance</p>
        </div>

        {/* TOTAL COMPLAINTS */}
        <div className="bg-white border-2 border-gray-200 rounded-2xl p-8 h-[200px] flex flex-col justify-center">
          <h3 className="text-gray-600 font-semibold mb-4">Total Complaints</h3>
          <p className="text-5xl font-bold text-gray-900">{stats.total_complaints}</p>
          <p className="text-gray-500 mt-2">All time</p>
        </div>
      </div>
    </div>
  );
}
