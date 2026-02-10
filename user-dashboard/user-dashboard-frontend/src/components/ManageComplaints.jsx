import { useState, useEffect } from 'react';
import { ArrowLeft, Clock, CheckCircle, Search, Filter } from 'lucide-react';
import { useNavigate } from "react-router-dom";
import { getComplaints, getComplaintById } from '../api/complaint';
import { COMPLAINT_TYPE_LABELS, COMPLAINT_STATUS, PAGINATION } from '../utils/constants';
import { LoadingSpinner } from './LoadingSpinner';
import { EmptyState } from './EmptyState';

export function ManageComplaints() {
  const navigate = useNavigate();
  
  // State
  const [activeTab, setActiveTab] = useState('active');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({
    current_page: 1,
    total_pages: 1,
    total_items: 0,
    items_per_page: PAGINATION.DEFAULT_LIMIT
  });

  // Fetch complaints
  useEffect(() => {
    fetchComplaints();
  }, [activeTab, searchQuery]);

  const fetchComplaints = async (page = PAGINATION.DEFAULT_PAGE) => {
    try {
      setLoading(true);
      setError(null);

      const params = {
        status: activeTab === 'active' ? 'submitted,analysing,investigating' : 'closed',
        page,
        limit: PAGINATION.DEFAULT_LIMIT,
        search: searchQuery || undefined
      };

      const response = await getComplaints(params);

      if (response.success) {
        setComplaints(response.data.complaints || []);
        setPagination(response.data.pagination || pagination);
      }
    } catch (err) {
      console.error('Failed to fetch complaints:', err);
      setError('Failed to load complaints');
    } finally {
      setLoading(false);
    }
  };

  // Fetch complaint details
  const handleViewComplaint = async (complaint) => {
    try {
      setLoading(true);
      const response = await getComplaintById(complaint.complaint_id);
      
      if (response.success) {
        setSelectedComplaint(response.data);
      }
    } catch (err) {
      console.error('Failed to fetch complaint details:', err);
      alert('Failed to load complaint details');
    } finally {
      setLoading(false);
    }
  };

  const handleBackToList = () => {
    setSelectedComplaint(null);
  };

  // Filter complaints
  const activeComplaints = complaints.filter(c => 
    c.status !== COMPLAINT_STATUS.CLOSED
  );
  const historyComplaints = complaints.filter(c => 
    c.status === COMPLAINT_STATUS.CLOSED
  );

  // Detail view
  if (selectedComplaint) {
    return (
      <div className="p-4 lg:p-8 max-w-4xl mx-auto">
        <button
          onClick={handleBackToList}
          className="flex items-center gap-2 text-blue-600 hover:text-blue-700 mb-6 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Back to Complaints</span>
        </button>

        <div className="bg-white rounded-xl border border-gray-200 p-6 lg:p-8">
          <div className="mb-8">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h1 className="text-blue-600 mb-2">
                  {COMPLAINT_TYPE_LABELS[selectedComplaint.category] || selectedComplaint.category}
                </h1>
                <p className="text-gray-600">Tracking ID: {selectedComplaint.tracking_id}</p>
              </div>
              <span className={`px-4 py-2 rounded-full font-semibold ${
                selectedComplaint.status === COMPLAINT_STATUS.CLOSED
                  ? 'bg-green-100 text-green-700'
                  : 'bg-blue-100 text-blue-700'
              }`}>
                {selectedComplaint.status.charAt(0).toUpperCase() + selectedComplaint.status.slice(1)}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div>
              <h2 className="text-lg font-semibold text-blue-600 mb-4">Incident Details</h2>
              <div className="space-y-4">
                <div>
                  <p className="text-gray-600 text-sm">Incident Date</p>
                  <p className="font-semibold text-gray-900">
                    {new Date(selectedComplaint.incident_timestamp).toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <p className="text-gray-600 text-sm">Incident Time</p>
                  <p className="font-semibold text-gray-900">
                    {new Date(selectedComplaint.incident_timestamp).toLocaleTimeString()}
                  </p>
                </div>
                {selectedComplaint.risk_level && (
                  <div>
                    <p className="text-gray-600 text-sm">Risk Level</p>
                    <p className="font-semibold text-gray-900 capitalize">{selectedComplaint.risk_level}</p>
                  </div>
                )}
              </div>
            </div>

            <div>
              <h2 className="text-lg font-semibold text-blue-600 mb-4">Complaint Description</h2>
              <p className="text-gray-700 bg-gray-50 p-4 rounded-lg mb-8 min-h-32">
                {selectedComplaint.description}
              </p>

              {selectedComplaint.evidences && selectedComplaint.evidences.length > 0 && (
                <>
                  <h2 className="text-lg font-semibold text-blue-600 mb-4">
                    Evidence Files ({selectedComplaint.evidences.length})
                  </h2>
                  <ul className="space-y-2">
                    {selectedComplaint.evidences.map((file, idx) => (
                      <li key={idx} className="text-gray-700 flex items-center gap-2">
                        <span className="text-blue-600">📄</span> {file.originalFileName}
                        <span className="text-gray-500 text-sm">({(file.fileSizeBytes / 1024).toFixed(2)} KB)</span>
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </div>
          </div>

          <div className="flex gap-4 pt-6 border-t border-gray-200">
            <button
              onClick={handleBackToList}
              className="bg-gray-200 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-300 transition-colors"
            >
              Back to List
            </button>
          </div>
        </div>
      </div>
    );
  }

  // List view
  return (
    <div className="p-4 lg:p-8">
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-blue-600 mb-2">Manage Complaints</h1>
            <p className="text-gray-600">Track and manage cyber complaints</p>
          </div>

          <button
            onClick={() => navigate("/dashboard/new-complaint")}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg shadow hover:bg-blue-700 transition-all"
          >
            + File a Complaint
          </button>
        </div>

        <div className="flex gap-2 border-b border-gray-200 mt-6">
          <button
            onClick={() => setActiveTab('active')}
            className={`px-4 py-2 border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === 'active'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-blue-600'
            }`}
          >
            <Clock className="w-4 h-4" />
            Active Complaints ({activeComplaints.length})
          </button>

          <button
            onClick={() => setActiveTab('history')}
            className={`px-4 py-2 border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === 'history'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-blue-600'
            }`}
          >
            <CheckCircle className="w-4 h-4" />
            History ({historyComplaints.length})
          </button>
        </div>
      </div>

      <div className="mb-6 flex gap-4">
        <div className="flex-1 flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-lg px-4 py-2">
          <Search className="w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search by ID, description..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-transparent border-none outline-none flex-1 text-gray-900 placeholder:text-gray-400"
          />
        </div>

        <button className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-2 hover:bg-gray-100 transition-colors flex items-center gap-2 text-gray-700">
          <Filter className="w-5 h-5" />
          <span className="hidden sm:inline">Filter</span>
        </button>
      </div>

      {loading ? (
        <LoadingSpinner size="lg" text="Loading complaints..." />
      ) : error ? (
        <EmptyState
          title="Failed to load complaints"
          description={error}
          action={
            <button
              onClick={() => fetchComplaints()}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Retry
            </button>
          }
        />
      ) : (
        <div className="space-y-4">
          {complaints.length > 0 ? (
            complaints.map((complaint) => (
              <button
                key={complaint.complaint_id}
                onClick={() => handleViewComplaint(complaint)}
                className="w-full bg-white border border-gray-200 rounded-xl p-6 hover:border-blue-600 hover:shadow-md transition-all text-left"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-blue-600 font-semibold">
                        {COMPLAINT_TYPE_LABELS[complaint.category] || complaint.category}
                      </h3>

                      <span
                        className={`px-3 py-1 rounded-full border text-sm font-semibold ${
                          complaint.status === COMPLAINT_STATUS.CLOSED
                            ? 'bg-green-100 text-green-700 border-green-300'
                            : 'bg-blue-100 text-blue-700 border-blue-300'
                        }`}
                      >
                        {complaint.status.charAt(0).toUpperCase() + complaint.status.slice(1)}
                      </span>
                    </div>

                    <p className="text-gray-600 mb-2 line-clamp-2">{complaint.description}</p>

                    <div className="flex items-center gap-4 text-gray-500 text-sm">
                      <span>{complaint.tracking_id}</span>
                      <span>•</span>
                      <span>{new Date(complaint.created_at).toLocaleDateString()}</span>
                      {complaint.evidence_count > 0 && (
                        <>
                          <span>•</span>
                          <span>{complaint.evidence_count} evidence file(s)</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </button>
            ))
          ) : (
            <EmptyState
              title="No complaints found"
              description={activeTab === 'active' ? "You don't have any active complaints" : "No complaint history yet"}
              action={
                <button
                  onClick={() => navigate("/new-complaint")}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  File a Complaint
                </button>
              }
            />
          )}
        </div>
      )}
    </div>
  );
}
