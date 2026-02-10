/**
 * Application Constants
 * Centralized configuration for easy maintenance
 */

// API Configuration
export const API_CONFIG = {
  BASE_URL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:4001',
  AUTH_SERVICE_URL: import.meta.env.VITE_AUTH_SERVICE_URL || 'http://localhost:4000',
  DASHBOARD_URL: import.meta.env.VITE_DASHBOARD_URL || 'http://localhost:5174',
  TIMEOUT: 30000, // 30 seconds
};

// API Endpoints
export const API_ENDPOINTS = {
  // Auth (handled by Auth Service)
  AUTH_LOGIN: `${API_CONFIG.AUTH_SERVICE_URL}/login`,
  AUTH_EXCHANGE: `${API_CONFIG.BASE_URL}/api/auth/exchange`,
  
  // Complaints
  COMPLAINTS_SUBMIT: '/api/complaints/submit',
  COMPLAINTS_LIST: '/api/complaints/list',
  COMPLAINTS_DETAIL: '/api/complaints/:id',
  COMPLAINTS_STATISTICS: '/api/complaints/statistics',
  COMPLAINTS_TRACK: '/api/complaints/track/:trackingId',
  
  // User
  USER_PROFILE: '/api/user/profile',
  USER_NOTIFICATION_SETTINGS: '/api/user/notification-settings',
  
  // Chatbot
  CHAT: '/api/chat',
};

// Complaint Types
export const COMPLAINT_TYPES = {
  PHISHING: 'phishing',
  MALWARE: 'malware',
  HONEYTRAP: 'honeytrap',
  ESPIONAGE: 'espionage',
  OPSEC: 'opsec',
  BREACH: 'breach',
  SOCIAL: 'social',
  RANSOMWARE: 'ransomware',
  DDOS: 'ddos',
  UNKNOWN: 'unknown',
  OTHER: 'other',
};

// Complaint Type Labels
export const COMPLAINT_TYPE_LABELS = {
  [COMPLAINT_TYPES.UNKNOWN]: 'Unknown',
  [COMPLAINT_TYPES.PHISHING]: 'Phishing Attack',
  [COMPLAINT_TYPES.MALWARE]: 'Malware/Virus Detection',
  [COMPLAINT_TYPES.HONEYTRAP]: 'Honeytrap Scheme',
  [COMPLAINT_TYPES.ESPIONAGE]: 'Cyber Espionage',
  [COMPLAINT_TYPES.OPSEC]: 'OPSEC Violation',
  [COMPLAINT_TYPES.BREACH]: 'Data Breach',
  [COMPLAINT_TYPES.SOCIAL]: 'Social Engineering',
  [COMPLAINT_TYPES.RANSOMWARE]: 'Ransomware',
  [COMPLAINT_TYPES.DDOS]: 'DDoS Attack',
  [COMPLAINT_TYPES.OTHER]: 'Other',
};

// Complaint Status
export const COMPLAINT_STATUS = {
  SUBMITTED: 'submitted',
  ANALYSING: 'analysing',
  INVESTIGATING: 'investigating',
  CLOSED: 'closed',
};

// Complaint Status Labels
export const COMPLAINT_STATUS_LABELS = {
  [COMPLAINT_STATUS.SUBMITTED]: 'Submitted',
  [COMPLAINT_STATUS.ANALYSING]: 'Analysing',
  [COMPLAINT_STATUS.INVESTIGATING]: 'Investigating',
  [COMPLAINT_STATUS.CLOSED]: 'Closed',
};

// Risk Levels
export const RISK_LEVELS = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  CRITICAL: 'critical',
};

// Risk Level Colors
export const RISK_LEVEL_COLORS = {
  [RISK_LEVELS.LOW]: 'bg-green-100 text-green-700 border-green-300',
  [RISK_LEVELS.MEDIUM]: 'bg-yellow-100 text-yellow-700 border-yellow-300',
  [RISK_LEVELS.HIGH]: 'bg-orange-100 text-orange-700 border-orange-300',
  [RISK_LEVELS.CRITICAL]: 'bg-red-100 text-red-700 border-red-300',
};

// Pagination
export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 20,
  MAX_LIMIT: 100,
};

// User Roles
export const USER_ROLES = {
  PERSONNEL: 'personnel',
  FAMILY: 'family',
  VETERAN: 'veteran',
  CERT: 'cert',
  ADMIN: 'admin',
};

// HTTP Status Codes
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  RATE_LIMIT: 429,
  SERVER_ERROR: 500,
};

export default {
  API_CONFIG,
  API_ENDPOINTS,
  COMPLAINT_TYPES,
  COMPLAINT_TYPE_LABELS,
  COMPLAINT_STATUS,
  COMPLAINT_STATUS_LABELS,
  RISK_LEVELS,
  RISK_LEVEL_COLORS,
  PAGINATION,
  USER_ROLES,
  HTTP_STATUS,
};
