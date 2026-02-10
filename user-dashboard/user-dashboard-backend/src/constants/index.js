// ──────────────────────────────────────────────
//  Constants for User Dashboard Backend
// ──────────────────────────────────────────────

const COMPLAINT_CATEGORIES = [
  'phishing',
  'malware',
  'honeytrap',
  'espionage',
  'opsec',
  'breach',
  'social',
  'ransomware',
  'ddos',
  'other'
];

const COMPLAINT_STATUSES = ['submitted', 'analysing', 'investigating', 'closed'];

const RISK_LEVELS = ['low', 'medium', 'high', 'critical'];

const USER_ROLES = ['personnel', 'family', 'veteran', 'cert', 'admin'];

const MFA_METHODS = ['totp', 'email'];

const ERROR_CODES = {
  VALIDATION_ERROR: { code: 'VALIDATION_ERROR', status: 400 },
  UNAUTHORIZED: { code: 'UNAUTHORIZED', status: 401 },
  FORBIDDEN: { code: 'FORBIDDEN', status: 403 },
  NOT_FOUND: { code: 'NOT_FOUND', status: 404 },
  RATE_LIMIT_EXCEEDED: { code: 'RATE_LIMIT_EXCEEDED', status: 429 },
  SERVER_ERROR: { code: 'SERVER_ERROR', status: 500 }
};

const RATE_LIMITS = {
  COMPLAINT_SUBMIT: { windowMs: 60 * 60 * 1000, max: 10 },   // 10 per hour
  CHAT: { windowMs: 60 * 60 * 1000, max: 50 }                 // 50 per hour
};

const EVIDENCE_LIMITS = {
  MAX_FILES: 10,
  MAX_TOTAL_SIZE_BYTES: 50 * 1024 * 1024  // 50 MB
};

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax',
  maxAge: 7 * 24 * 60 * 60 * 1000  // 7 days
};

module.exports = {
  COMPLAINT_CATEGORIES,
  COMPLAINT_STATUSES,
  RISK_LEVELS,
  USER_ROLES,
  MFA_METHODS,
  ERROR_CODES,
  RATE_LIMITS,
  EVIDENCE_LIMITS,
  COOKIE_OPTIONS
};
