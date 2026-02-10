require('dotenv').config();

module.exports = {
  // Server
  nodeEnv: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT, 10) || 3000,
  
  // MongoDB
  mongodbUri: process.env.MONGODB_URI || 'mongodb://localhost:27017/defence_sentinel',
  
  // JWT
  jwtSecret: process.env.JWT_SECRET,
  jwtRefreshSecret: process.env.JWT_REFRESH_SECRET,
  
  // Encryption
  encryptionKey: process.env.ENCRYPTION_KEY,
  
  // Email
  smtp: {
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT, 10) || 587,
    user: process.env.SMTP_USER,
    password: process.env.SMTP_PASSWORD
  },
  
  // Frontend & CORS
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:8080',
  allowedOrigins: process.env.ALLOWED_ORIGINS
    ? process.env.ALLOWED_ORIGINS.split(',').map(origin => origin.trim())
    : ['http://localhost:8080'],
  
  // Cookie settings
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    httpOnly: true
  },
  
  // Token expiry
  tokens: {
    challengeExpiry: '5m',      // Login challenge
    registrationExpiry: '30m',  // Registration challenge
    accessExpiry: '7d',        // Access token
    refreshExpiry: '7d',        // Refresh token
    otpExpiry: 5 * 60 * 1000    // 5 minutes in ms
  },
  
  // Security
  security: {
    maxLoginAttempts: 3,
    lockoutDuration: 60 * 60 * 1000, // 60 minutes in ms
    argon2: {
      memoryCost: 65536,  // 64 MB
      timeCost: 3,
      parallelism: 4
    }
  },
  
  // IP Whitelisting
  ipWhitelist: {
    admin: process.env.ADMIN_ALLOWED_IPS 
      ? process.env.ADMIN_ALLOWED_IPS.split(',').map(ip => ip.trim()).filter(Boolean)
      : [],
    cert: process.env.CERT_ALLOWED_IPS
      ? process.env.CERT_ALLOWED_IPS.split(',').map(ip => ip.trim()).filter(Boolean)
      : []
  },
  
  // Dashboard Redirect URLs
  dashboards: {
    admin: process.env.ADMIN_DASHBOARD_URL || 'http://admin.localhost:3001',
    cert: process.env.CERT_DASHBOARD_URL || 'http://officer.localhost:3002',
    personnel: process.env.PERSONNEL_DASHBOARD_URL || 'http://app.localhost:3003',
    family: process.env.FAMILY_DASHBOARD_URL || 'http://app.localhost:3003',
    veteran: process.env.VETERAN_DASHBOARD_URL || 'http://app.localhost:3003'
  }
};
