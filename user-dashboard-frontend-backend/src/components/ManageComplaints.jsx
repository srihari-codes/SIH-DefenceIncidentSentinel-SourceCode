import { useState } from 'react';
import { ArrowLeft, Clock, CheckCircle, Search, Filter } from 'lucide-react';
import { useNavigate } from "react-router-dom";


const complaintTypeLabels = {
  unknown: 'Unknown',
  phishing: 'Phishing Attack',
  malware: 'Malware/Virus Detection',
  honeytrap: 'Honeytrap Scheme',
  espionage: 'Cyber Espionage',
  opsec: 'OPSEC Violation',
  breach: 'Data Breach',
  social: 'Social Engineering',
  ransomware: 'Ransomware',
  ddos: 'DDoS Attack',
  other: 'Other'
};

export function ManageComplaints() {
  const navigate = useNavigate();
  const complaints = [
    {
      id: '#COM-001234',
      fullName: 'John Doe',
      rank: 'Captain',
      department: 'Cyber Operations',
      location: 'New Delhi',
      complaintType: 'phishing',
      incidentDate: '2024-11-28',
      incidentTime: '14:30',
      description: 'Received suspicious phishing email with malicious links',
      suspectedSource: 'External email domain',
      evidenceFiles: [],
      confidentiality: 'internal',
      notifyCommandingOfficer: true,
      familyMemberComplaint: false,
      status: 'active',
      createdDate: '2024-11-28',
    }
  ];

  const [activeTab, setActiveTab] = useState('active');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedComplaint, setSelectedComplaint] = useState(null);

  const activeComplaints = complaints.filter(c => c.status === 'active');
  const historyComplaints = complaints.filter(c => c.status === 'closed');
  const displayComplaints = activeTab === 'active' ? activeComplaints : historyComplaints;

  const filteredComplaints = displayComplaints.filter(complaint =>
    complaint.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
    complaint.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    complaint.complaintType.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleBackToList = () => {
    setSelectedComplaint(null);
  };

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
                  {complaintTypeLabels[selectedComplaint.complaintType]}
                </h1>
                <p className="text-gray-600">Complaint ID: {selectedComplaint.id}</p>
              </div>
              <span className={`px-4 py-2 rounded-full font-semibold ${
                selectedComplaint.status === 'active'
                  ? 'bg-blue-100 text-blue-700'
                  : 'bg-green-100 text-green-700'
              }`}>
                {selectedComplaint.status === 'active' ? 'Active' : 'Closed'}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div>
              <h2 className="text-lg font-semibold text-blue-600 mb-4">Personal Information</h2>
              <div className="space-y-4">
                <div>
                  <p className="text-gray-600 text-sm">Full Name</p>
                  <p className="font-semibold text-gray-900">{selectedComplaint.fullName}</p>
                </div>
                <div>
                  <p className="text-gray-600 text-sm">Rank</p>
                  <p className="font-semibold text-gray-900">{selectedComplaint.rank}</p>
                </div>
                <div>
                  <p className="text-gray-600 text-sm">Department</p>
                  <p className="font-semibold text-gray-900">{selectedComplaint.department}</p>
                </div>
                <div>
                  <p className="text-gray-600 text-sm">Location</p>
                  <p className="font-semibold text-gray-900">{selectedComplaint.location}</p>
                </div>
              </div>

              <h2 className="text-lg font-semibold text-blue-600 mt-8 mb-4">Incident Details</h2>
              <div className="space-y-4">
                <div>
                  <p className="text-gray-600 text-sm">Incident Date</p>
                  <p className="font-semibold text-gray-900">{selectedComplaint.incidentDate}</p>
                </div>
                <div>
                  <p className="text-gray-600 text-sm">Incident Time</p>
                  <p className="font-semibold text-gray-900">{selectedComplaint.incidentTime}</p>
                </div>
                <div>
                  <p className="text-gray-600 text-sm">Suspected Source</p>
                  <p className="font-semibold text-gray-900">{selectedComplaint.suspectedSource}</p>
                </div>
              </div>
            </div>

            <div>
              <h2 className="text-lg font-semibold text-blue-600 mb-4">Complaint Description</h2>
              <p className="text-gray-700 bg-gray-50 p-4 rounded-lg mb-8 min-h-32">
                {selectedComplaint.description}
              </p>

              <h2 className="text-lg font-semibold text-blue-600 mb-4">Settings</h2>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <input type="checkbox"
                    checked={selectedComplaint.confidentiality === 'confidential'}
                    disabled
                    className="w-4 h-4"
                  />
                  <span className="text-gray-700">Confidential</span>
                </div>

                <div className="flex items-center gap-3">
                  <input type="checkbox"
                    checked={selectedComplaint.notifyCommandingOfficer}
                    disabled
                    className="w-4 h-4"
                  />
                  <span className="text-gray-700">Notify Commanding Officer</span>
                </div>

                <div className="flex items-center gap-3">
                  <input type="checkbox"
                    checked={selectedComplaint.familyMemberComplaint}
                    disabled
                    className="w-4 h-4"
                  />
                  <span className="text-gray-700">Family Member Complaint</span>
                </div>
              </div>

              {selectedComplaint.evidenceFiles.length > 0 && (
                <>
                  <h2 className="text-lg font-semibold text-blue-600 mt-8 mb-4">
                    Evidence Files
                  </h2>
                  <ul className="space-y-2">
                    {selectedComplaint.evidenceFiles.map((file, idx) => (
                      <li key={idx} className="text-gray-700 flex items-center gap-2">
                        <span className="text-blue-600">📄</span> {file}
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

  return (
    <div className="p-4 lg:p-8">
      <div className="mb-8">
      <div className="flex items-center justify-between mb-4">
  <div>
    <h1 className="text-blue-600 mb-2">Manage Complaints</h1>
    <p className="text-gray-600">Track and manage cyber complaints</p>
  </div>

  <button
    onClick={() => navigate("/new-complaint")}
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
            placeholder="Search by ID, name, or type..."
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

      <div className="space-y-4">
        {filteredComplaints.length > 0 ? (
          filteredComplaints.map((complaint) => (
            <button
              key={complaint.id}
              onClick={() => setSelectedComplaint(complaint)}
              className="w-full bg-white border border-gray-200 rounded-xl p-6 hover:border-blue-600 hover:shadow-md transition-all text-left"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-blue-600 font-semibold">
                      {complaintTypeLabels[complaint.complaintType]}
                    </h3>

                    <span
                      className={`px-3 py-1 rounded-full border text-sm font-semibold ${
                        complaint.status === 'active'
                          ? 'bg-blue-100 text-blue-700 border-blue-300'
                          : 'bg-green-100 text-green-700 border-green-300'
                      }`}
                    >
                      {complaint.status === 'active' ? 'Active' : 'Closed'}
                    </span>
                  </div>

                  <p className="text-gray-600 mb-2 line-clamp-2">{complaint.description}</p>

                  <div className="flex items-center gap-4 text-gray-500 text-sm">
                    <span>{complaint.id}</span>
                    <span>•</span>
                    <span>{complaint.fullName}</span>
                    <span>•</span>
                    <span>{complaint.incidentDate}</span>
                  </div>
                </div>
              </div>
            </button>
          ))
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-500">No complaints found</p>
          </div>
        )}
      </div>
    </div>
  );
}
