import React, { useState, useMemo } from 'react';
import { Plus, CheckSquare, Circle } from 'lucide-react';
import { useNavigate } from "react-router-dom";


const playbookSolutions = {
  phishing: [
    'Do not click any links or download attachments',
    'Report the email to IT security immediately',
    'Change your password from a secure device',
    'Enable multi-factor authentication',
    'Monitor your accounts for suspicious activity',
  ],
  malware: [
    'Disconnect the device from the network immediately',
    'Scan all devices with updated antivirus software',
    'Change all passwords from a secure device',
    'Monitor bank and financial accounts',
    'Contact IT support for device recovery',
  ],
  honeytrap: [
    'Do not share any personal or sensitive information',
    'Report the contact to your commanding officer',
    'Document all communications with the contact',
    'Block the contact on all platforms',
    'Increase vigilance on information sharing',
  ],
  espionage: [
    'Immediately inform your security officer',
    'Secure all classified materials',
    'Review recent access logs and communications',
    'Conduct a security audit of your work area',
    'Cooperate fully with investigation team',
  ],
  opsec: [
    'Review operational security procedures',
    'Brief your team on proper OPSEC practices',
    'Secure all sensitive information immediately',
    'Restrict access to sensitive data',
    'Schedule OPSEC refresher training',
  ],
  breach: [
    'Identify the scope of the breach',
    'Change all affected passwords',
    'Enable credit monitoring and fraud alerts',
    'Document all evidence and timeline',
    'Engage with incident response team',
  ],
  social: [
    'Stop communicating with the individual',
    'Document all interactions as evidence',
    'Report to security and HR departments',
    'Review your social media privacy settings',
    'Educate yourself on social engineering tactics',
  ],
  ransomware: [
    'Immediately disconnect from all networks',
    'Preserve all evidence and logs',
    'Do not pay any ransom demands',
    'Contact law enforcement',
    'Engage professional incident response team',
  ],
  ddos: [
    'Contact your IT/network administrator',
    'Document service outage details and timeline',
    'Preserve all logs and network traffic data',
    'Notify affected users of the incident',
    'Assist with investigation and mitigation',
  ],
  unknown: [
    'Document all details about the incident',
    'Preserve evidence and take screenshots',
    'Report to IT security department',
    'Provide detailed incident description',
    'Cooperate with investigation team',
  ],
  other: [
    'Document the incident thoroughly',
    'Gather all relevant evidence',
    'Report to appropriate authority',
    'Follow organizational response procedures',
    'Maintain incident documentation',
  ],
};

export function Dashboard() {
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

  const recentComplaint = complaints.length > 0 ? complaints[complaints.length - 1] : null;

  const defaultPlaybook = useMemo(() => {
    const solutions = recentComplaint
      ? (playbookSolutions[recentComplaint.complaintType] || playbookSolutions.unknown)
      : playbookSolutions.unknown;

    return solutions.map((task, idx) => ({
      id: idx + 1,
      task,
      completed: false,
    }));
  }, [recentComplaint]);

  const [playBookChecklistState, setPlayBookChecklistState] = useState(defaultPlaybook);

  const currentComplaint = {
    id: complaints.length > 0 ? complaints[complaints.length - 1].id : '#COM-001234',
    status:
      complaints.length > 0
        ? complaints[complaints.length - 1].status === 'active'
          ? 'In Progress'
          : 'Closed'
        : 'In Progress',
    statusColor:
      complaints.length > 0 && complaints[complaints.length - 1].status === 'active'
        ? 'bg-blue-100 text-blue-700'
        : 'bg-green-100 text-green-700',
    submittedDate: complaints.length > 0 ? complaints[complaints.length - 1].createdDate : '2024-11-28',
    lastUpdated: new Date().toISOString().split('T')[0],
  };

  const complaintStats = {
    openComplaints: complaints.filter(c => c.status === 'active').length,
    closedComplaints: complaints.filter(c => c.status === 'closed').length,
  };

  const toggleChecklistItem = (id) => {
    setPlayBookChecklistState(prev =>
      prev.map(item =>
        item.id === id ? { ...item, completed: !item.completed } : item
      )
    );
  };

 const handleFileComplaint = () => {
  navigate("/new-complaint");
};

  

  return (
    <div className="p-4 lg:p-8">
      <div className="mb-8">
        <h1 className="text-blue-600 mb-2">Dashboard</h1>
        <p className="text-gray-600">Welcome back! Here's your overview.</p>
      </div>

      {/* 2-SIDE LAYOUT */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-[calc(100vh-160px)]">

        {/* LEFT SIDE */}
        <div className="space-y-4 pr-2">


          {/* FILE A COMPLAINT */}
          <div
            onClick={handleFileComplaint}
            className="bg-white border-2 border-blue-600 rounded-2xl p-6 cursor-pointer hover:bg-blue-50 transition-colors group h-[150px] flex flex-col justify-center"
          >
            <div className="w-12 h-12 bg-blue-100 group-hover:bg-blue-200 rounded-xl mb-4 flex items-center justify-center transition-colors">
              <Plus className="w-6 h-6 text-blue-600" />
            </div>
            <h3 className="text-blue-600 mb-1 font-semibold">File a Complaint</h3>
            <p className="text-gray-600 text-sm">Submit new complaint</p>
          </div>

          {/* CURRENT STATUS */}
          <div className="bg-gradient-to-br from-green-50 to-green-100 border-2 border-green-200 rounded-2xl p-6 h-[200px] flex flex-col justify-between">
            <div>
              <h3 className="text-green-700 font-semibold mb-4">Your Complaint Status</h3>
              <div className="space-y-3">
                <div>
                  <p className="text-gray-600 text-xs mb-1">Complaint ID</p>
                  <p className="text-green-700 font-bold text-lg">{currentComplaint.id}</p>
                </div>
                <div>
                  <p className="text-gray-600 text-xs mb-1">Current Status</p>
                  <span className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${currentComplaint.statusColor}`}>
                    {currentComplaint.status}
                  </span>
                </div>
              </div>
            </div>
            <div className="text-xs text-gray-600">
              <p>Updated: {currentComplaint.lastUpdated}</p>
            </div>
          </div>

          {/* COMPLAINT STATS */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white border-2 border-orange-200 rounded-2xl p-6 h-[140px] flex flex-col justify-between">
              <div>
                <h3 className="text-orange-600 font-semibold mb-3 text-sm">Open Complaints</h3>
                <p className="text-3xl font-bold text-orange-600">{complaintStats.openComplaints}</p>
              </div>
              <p className="text-gray-600 text-xs">Active complaints</p>
            </div>

            <div className="bg-white border-2 border-green-200 rounded-2xl p-6 h-[140px] flex flex-col justify-between">
              <div>
                <h3 className="text-green-600 font-semibold mb-3 text-sm">Closed Complaints</h3>
                <p className="text-3xl font-bold text-green-600">{complaintStats.closedComplaints}</p>
              </div>
              <p className="text-gray-600 text-xs">Resolved complaints</p>
            </div>
          </div>
        </div>

        {/* RIGHT SIDE — AI PLAYBOOK */}
        <div className="h-full overflow-y-auto">
          <div className="bg-blue-600 rounded-2xl p-6 flex flex-col h-full">
            <div className="mb-6">
              <h3 className="text-white font-semibold text-lg mb-1">AI Playbook Solution</h3>
              <p className="text-blue-100 text-sm">Recommended actions for your recent complaint</p>
            </div>

            <div className="flex-1 overflow-y-auto">
              <div className="space-y-3">
                {playBookChecklistState.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => toggleChecklistItem(item.id)}
                    className="w-full flex items-center gap-3 p-3 bg-white/10 rounded-lg hover:bg-white/20 transition-colors cursor-pointer group"
                  >
                    <div
                      className={`w-5 h-5 rounded flex items-center justify-center flex-shrink-0 ${
                        item.completed ? 'bg-white' : 'border-2 border-white/50'
                      }`}
                    >
                      {item.completed ? (
                        <CheckSquare className="w-4 h-4 text-blue-600" />
                      ) : (
                        <Circle className="w-3 h-3 text-transparent" />
                      )}
                    </div>
                    <span
                      className={`text-white text-left text-sm sm:text-base ${
                        item.completed ? 'line-through opacity-75' : ''
                      }`}
                    >
                      {item.task}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}



