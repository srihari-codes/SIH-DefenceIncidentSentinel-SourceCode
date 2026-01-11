/**
 * Request logging middleware
 * Logs all incoming requests with timestamp and user info
 */
export const requestLogger = (req, res, next) => {
  const start = Date.now();
  const timestamp = new Date().toISOString();
  
  // Log request
  console.log(`[${timestamp}] ${req.method} ${req.path}`);
  
  // Log request body for POST/PUT/PATCH (excluding sensitive fields)
  if (['POST', 'PUT', 'PATCH'].includes(req.method)) {
    const sanitizedBody = { ...req.body };
    // Remove sensitive fields from logs
    delete sanitizedBody.password;
    delete sanitizedBody.totpSecret;
    delete sanitizedBody.passwordHash;
    delete sanitizedBody.backupCodes;
    
    if (Object.keys(sanitizedBody).length > 0) {
      console.log(`  Body:`, sanitizedBody);
    }
  }

  // Log user if authenticated
  if (req.user) {
    console.log(`  User: ${req.user.email} (${req.user.role})`);
  }

  // Log response when finished
  res.on('finish', () => {
    const duration = Date.now() - start;
    const statusColor = res.statusCode >= 400 ? '\x1b[31m' : '\x1b[32m';
    const resetColor = '\x1b[0m';
    
    console.log(
      `  ${statusColor}${res.statusCode}${resetColor} - ${duration}ms`
    );
  });

  next();
};

/**
 * Security event logger for critical actions
 */
export const securityLogger = (event, details = {}) => {
  const timestamp = new Date().toISOString();
  const logEntry = {
    timestamp,
    event,
    ...details,
  };
  
  console.log(`[SECURITY] ${timestamp} - ${event}:`, details);
  
  // In production, send to monitoring service (e.g., Datadog, CloudWatch)
  // securityMonitoringService.log(logEntry);
  
  return logEntry;
};

/**
 * Audit logger for compliance tracking
 */
export const auditLog = (action, userId, details = {}) => {
  const timestamp = new Date().toISOString();
  const logEntry = {
    timestamp,
    action,
    userId,
    ...details,
  };
  
  console.log(`[AUDIT] ${timestamp} - ${action} by ${userId}:`, details);
  
  // In production, store in audit database
  // AuditLog.create(logEntry);
  
  return logEntry;
};
