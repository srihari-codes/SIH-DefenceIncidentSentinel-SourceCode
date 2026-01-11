import { Complaint, AnalystStats, AIPlaybook } from '@/types/complaint';

const ransomwarePlaybook: AIPlaybook = {
  id: 'pb-1',
  category: 'ransomware',
  title: 'Ransomware Incident Response Playbook',
  steps: [
    {
      phase: 'Initial Triage',
      actions: [
        'Identify ransomware variant from ransom note',
        'Determine encryption scope and affected file types',
        'Check for known decryption tools',
        'Assess business impact'
      ],
      tools: ['VirusTotal', 'ID Ransomware', 'NoMoreRansom'],
      expectedOutcome: 'Ransomware variant identified and scope determined'
    },
    {
      phase: 'Containment',
      actions: [
        'Isolate infected systems from network',
        'Disable file shares and mapped drives',
        'Block C2 communication channels',
        'Preserve encrypted file samples'
      ],
      tools: ['EDR Console', 'Firewall', 'Network Segmentation'],
      expectedOutcome: 'Spread contained, no new infections'
    },
    {
      phase: 'Forensic Analysis',
      actions: [
        'Capture memory dump before shutdown',
        'Identify initial infection vector',
        'Trace lateral movement paths',
        'Extract IOCs (hashes, IPs, domains)'
      ],
      tools: ['Volatility', 'Autopsy', 'YARA Rules'],
      expectedOutcome: 'Full attack chain documented'
    },
    {
      phase: 'Eradication',
      actions: [
        'Remove ransomware executables',
        'Clean registry persistence mechanisms',
        'Patch exploited vulnerabilities',
        'Reset compromised credentials'
      ],
      tools: ['Malwarebytes', 'GMER', 'Autoruns'],
      expectedOutcome: 'All malicious artifacts removed'
    },
    {
      phase: 'Recovery',
      actions: [
        'Restore systems from clean backups',
        'Verify data integrity post-restoration',
        'Implement enhanced monitoring',
        'Conduct user awareness training'
      ],
      tools: ['Backup Solution', 'File Integrity Monitor'],
      expectedOutcome: 'Systems operational with enhanced security'
    }
  ],
  recommendedTools: ['VirusTotal', 'Volatility', 'Autoruns', 'Process Monitor', 'YARA'],
  estimatedTime: '24-72 hours',
  references: [
    'NIST SP 800-61: Incident Response Guide',
    'CISA Ransomware Guide',
    'MITRE ATT&CK - Ransomware Techniques'
  ]
};

const phishingPlaybook: AIPlaybook = {
  id: 'pb-2',
  category: 'phishing',
  title: 'Phishing Campaign Response Playbook',
  steps: [
    {
      phase: 'Initial Triage',
      actions: [
        'Analyze email headers for origin',
        'Identify phishing URL/attachment',
        'Determine number of recipients',
        'Check for credential harvesting'
      ],
      tools: ['MXToolbox', 'URLScan.io', 'PhishTank'],
      expectedOutcome: 'Campaign scope and type identified'
    },
    {
      phase: 'Containment',
      actions: [
        'Block sender domain at gateway',
        'Remove emails from all mailboxes',
        'Block phishing URLs at proxy',
        'Reset passwords for affected users'
      ],
      tools: ['Email Gateway', 'Web Proxy', 'AD Console'],
      expectedOutcome: 'Campaign neutralized, no further exposure'
    },
    {
      phase: 'Forensic Analysis',
      actions: [
        'Analyze phishing kit if accessible',
        'Identify data exfiltration',
        'Check for secondary payloads',
        'Document user interactions'
      ],
      tools: ['Browser DevTools', 'Wireshark', 'OSINT Tools'],
      expectedOutcome: 'Full impact assessment complete'
    },
    {
      phase: 'Recovery',
      actions: [
        'Monitor for account misuse',
        'Implement additional email filtering',
        'Conduct targeted security training',
        'Update phishing detection rules'
      ],
      tools: ['SIEM', 'Email Security Gateway'],
      expectedOutcome: 'Enhanced defenses in place'
    }
  ],
  recommendedTools: ['URLScan.io', 'PhishTank', 'Email Header Analyzer', 'OSINT Framework'],
  estimatedTime: '4-12 hours',
  references: [
    'APWG Phishing Activity Trends Report',
    'NIST Phishing Guidance',
    'FBI IC3 Phishing Alerts'
  ]
};

export const mockComplaints: Complaint[] = [
  {
    id: '1',
    ticketNumber: 'CERT-2024-001',
    title: 'Ransomware Attack on Financial Server',
    description: 'Critical ransomware infection detected on primary financial database server. Multiple files encrypted with .locked extension. Ransom note demanding 5 BTC found on desktop.',
    reporterName: 'John Smith',
    reporterEmail: 'john.smith@acmecorp.com',
    reporterOrg: 'ACME Corporation',
    priority: 'critical',
    status: 'not_started',
    category: 'ransomware',
    assignedTo: 'Alex Chen',
    assignedBy: 'Sarah Admin',
    createdAt: '2024-01-15T08:30:00Z',
    deadline: '2024-01-15T12:30:00Z',
    lastUpdated: '2024-01-15T08:30:00Z',
    affectedSystems: ['FIN-DB-01', 'FIN-APP-02', 'BACKUP-SRV-01'],
    iocIndicators: ['SHA256:abc123...', '192.168.1.100', 'evil-domain.com'],
    playbook: ransomwarePlaybook,
    evidence: [
      {
        id: 'e1',
        fileName: 'ransom_note.txt',
        fileType: 'text/plain',
        uploadedAt: '2024-01-15T08:35:00Z',
        size: '2.4 KB',
        scanStatus: 'clean',
        metadata: {
          ocrText: 'YOUR FILES HAVE BEEN ENCRYPTED! Pay 5 BTC to wallet: bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh',
          aiTags: ['ransomware', 'bitcoin', 'extortion', 'lockbit'],
          extractedUrls: ['http://lockbit3753asdf.onion/decrypt'],
          hashes: {
            md5: 'a1b2c3d4e5f6g7h8i9j0',
            sha256: '9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08'
          }
        }
      },
      {
        id: 'e2',
        fileName: 'encrypted_sample.locked',
        fileType: 'application/octet-stream',
        uploadedAt: '2024-01-15T08:40:00Z',
        size: '156 KB',
        scanStatus: 'malicious',
        scanReport: 'Detected: Ransomware.LockBit.Gen',
        metadata: {
          aiTags: ['encrypted', 'ransomware', 'lockbit'],
          hashes: {
            md5: 'x9y8z7w6v5u4t3s2r1q0',
            sha1: 'abc123def456ghi789jkl012mno345pqr678stu9',
            sha256: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855'
          }
        }
      }
    ],
    timeline: [
      {
        id: 't1',
        timestamp: '2024-01-15T08:30:00Z',
        action: 'Complaint Created',
        user: 'System',
        details: 'Ticket auto-generated from email submission'
      },
      {
        id: 't2',
        timestamp: '2024-01-15T08:32:00Z',
        action: 'Auto-assigned',
        user: 'System',
        details: 'Assigned to Analyst based on severity routing'
      }
    ]
  },
  {
    id: '2',
    ticketNumber: 'CERT-2024-002',
    title: 'Phishing Campaign Targeting Employees',
    description: 'Multiple employees received sophisticated phishing emails mimicking IT department. 3 users reported clicking links. Credential harvesting suspected.',
    reporterName: 'Sarah Johnson',
    reporterEmail: 'sarah.j@techstart.io',
    reporterOrg: 'TechStart Inc',
    priority: 'high',
    status: 'forensics',
    category: 'phishing',
    assignedTo: 'Alex Chen',
    assignedBy: 'Sarah Admin',
    createdAt: '2024-01-15T07:15:00Z',
    deadline: '2024-01-15T19:15:00Z',
    lastUpdated: '2024-01-15T09:45:00Z',
    affectedSystems: ['EMAIL-GW-01', 'AD-DC-01'],
    playbook: phishingPlaybook,
    evidence: [
      {
        id: 'e3',
        fileName: 'phishing_email.eml',
        fileType: 'message/rfc822',
        uploadedAt: '2024-01-15T07:20:00Z',
        size: '45 KB',
        scanStatus: 'clean',
        metadata: {
          ocrText: 'Dear Employee, Your password will expire in 24 hours. Click here to reset: http://it-support-portal.fake.com/reset',
          aiTags: ['phishing', 'credential-harvesting', 'spoofed-sender'],
          extractedUrls: ['http://it-support-portal.fake.com/reset', 'http://tracking.malicious.net/pixel.gif'],
          extractedDomains: ['it-support-portal.fake.com', 'tracking.malicious.net'],
          emailHeaders: {
            'From': 'IT Support <support@it-techstart.com.fake.net>',
            'Reply-To': 'harvester@malicious.net',
            'X-Originating-IP': '185.234.xx.xx',
            'Received': 'from mail.malicious.net (185.234.xx.xx)'
          }
        }
      }
    ],
    timeline: [
      {
        id: 't3',
        timestamp: '2024-01-15T07:15:00Z',
        action: 'Complaint Created',
        user: 'System'
      },
      {
        id: 't4',
        timestamp: '2024-01-15T08:00:00Z',
        action: 'Status Changed',
        user: 'Analyst',
        details: 'Moved to Investigation phase'
      }
    ]
  },
  {
    id: '3',
    ticketNumber: 'CERT-2024-003',
    title: 'DDoS Attack on Web Infrastructure',
    description: 'Sustained DDoS attack causing intermittent outages on public-facing web services. Attack traffic originating from multiple geographic regions.',
    reporterName: 'Mike Chen',
    reporterEmail: 'mchen@globalretail.com',
    reporterOrg: 'Global Retail Ltd',
    priority: 'high',
    status: 'containment',
    category: 'ddos',
    assignedTo: 'Alex Chen',
    assignedBy: 'James Director',
    createdAt: '2024-01-14T22:00:00Z',
    deadline: '2024-01-15T10:00:00Z',
    lastUpdated: '2024-01-15T06:30:00Z',
    affectedSystems: ['WEB-LB-01', 'WEB-SRV-01', 'WEB-SRV-02', 'CDN-EDGE'],
    evidence: [
      {
        id: 'e4',
        fileName: 'traffic_analysis.pcap',
        fileType: 'application/vnd.tcpdump.pcap',
        uploadedAt: '2024-01-14T23:00:00Z',
        size: '2.3 MB',
        scanStatus: 'clean',
        metadata: {
          aiTags: ['network-capture', 'ddos', 'syn-flood', 'udp-amplification'],
          extractedDomains: ['botnet-c2.evil.net']
        }
      }
    ],
    timeline: []
  },
  {
    id: '4',
    ticketNumber: 'CERT-2024-004',
    title: 'Unauthorized Database Access Detected',
    description: 'Security monitoring detected unusual query patterns on customer database. Potential data exfiltration in progress.',
    reporterName: 'Lisa Wang',
    reporterEmail: 'lwang@securebank.com',
    reporterOrg: 'Secure Bank',
    priority: 'critical',
    status: 'triaging',
    category: 'data_breach',
    assignedTo: 'Alex Chen',
    assignedBy: 'Sarah Admin',
    createdAt: '2024-01-15T09:00:00Z',
    deadline: '2024-01-15T13:00:00Z',
    lastUpdated: '2024-01-15T09:15:00Z',
    affectedSystems: ['CUST-DB-PROD'],
    evidence: [],
    timeline: []
  },
  {
    id: '5',
    ticketNumber: 'CERT-2024-005',
    title: 'Suspicious Login Activity',
    description: 'Multiple failed login attempts followed by successful access from unusual geographic location. VPN bypass suspected.',
    reporterName: 'Tom Brown',
    reporterEmail: 'tbrown@meditech.org',
    reporterOrg: 'MediTech Health',
    priority: 'medium',
    status: 'not_started',
    category: 'unauthorized_access',
    assignedTo: 'Alex Chen',
    assignedBy: 'Sarah Admin',
    createdAt: '2024-01-15T06:45:00Z',
    deadline: '2024-01-16T06:45:00Z',
    lastUpdated: '2024-01-15T06:45:00Z',
    affectedSystems: ['VPN-GW-01', 'AD-DC-02'],
    evidence: [],
    timeline: []
  },
  {
    id: '6',
    ticketNumber: 'CERT-2024-006',
    title: 'Malware Detection on Workstation',
    description: 'Endpoint detection triggered on executive workstation. Trojan variant identified attempting C2 communication.',
    reporterName: 'Amy Foster',
    reporterEmail: 'afoster@lawfirm.legal',
    reporterOrg: 'Foster & Associates Legal',
    priority: 'medium',
    status: 'eradication',
    category: 'malware',
    assignedTo: 'Alex Chen',
    assignedBy: 'James Director',
    createdAt: '2024-01-14T14:30:00Z',
    deadline: '2024-01-15T14:30:00Z',
    lastUpdated: '2024-01-15T08:00:00Z',
    affectedSystems: ['EXEC-WS-05'],
    evidence: [
      {
        id: 'e5',
        fileName: 'malware_sample.zip',
        fileType: 'application/zip',
        uploadedAt: '2024-01-14T15:00:00Z',
        size: '890 KB',
        scanStatus: 'malicious',
        scanReport: 'Detected: Trojan.GenericKD.46542812',
        metadata: {
          aiTags: ['trojan', 'c2-communication', 'data-stealer'],
          extractedDomains: ['c2-server.evil.net', 'backup-c2.malware.org'],
          hashes: {
            md5: 'trojan123abc',
            sha1: 'trojan456def789ghi',
            sha256: 'trojan789jklmnopqrstuvwxyz123456789'
          }
        }
      },
      {
        id: 'e6',
        fileName: 'screenshot_infection.png',
        fileType: 'image/png',
        uploadedAt: '2024-01-14T15:05:00Z',
        size: '1.2 MB',
        scanStatus: 'clean',
        metadata: {
          aiTags: ['screenshot', 'malware-activity', 'process-injection'],
          exifData: {
            'Camera': 'Windows Snipping Tool',
            'Date': '2024-01-14 15:04:32',
            'Resolution': '1920x1080'
          }
        }
      }
    ],
    timeline: []
  }
];

export const mockAnalystStats: AnalystStats = {
  totalAssigned: 12,
  pendingTriage: 2,
  inProgress: 6,
  closedToday: 4,
  avgResolutionTime: '4.2 hrs',
  criticalCount: 2,
  highCount: 3
};

export const getComplaintById = (id: string): Complaint | undefined => {
  return mockComplaints.find(c => c.id === id);
};

export const getComplaintsByStatus = (status: Complaint['status']): Complaint[] => {
  return mockComplaints.filter(c => c.status === status);
};