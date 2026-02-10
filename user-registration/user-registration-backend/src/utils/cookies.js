const jwt = require('jsonwebtoken');
const config = require('../config/env');

/**
 * Cookie options based on environment
 */
const getCookieOptions = (maxAge) => ({
  httpOnly: true,
  secure: config.cookie.secure,
  sameSite: config.cookie.sameSite,
  maxAge
});

/**
 * Set login challenge cookie
 */
function setLoginChallenge(res, payload) {
  // Strip existing JWT fields if present to avoid conflicts with expiresIn
  const { iat, exp, ...cleanPayload } = payload;
  const token = jwt.sign(cleanPayload, config.jwtSecret, {
    expiresIn: config.tokens.challengeExpiry
  });
  
  res.cookie('login_challenge', token, getCookieOptions(5 * 60 * 1000)); // 5 minutes
  return token;
}

/**
 * Verify and get login challenge from cookie
 */
function getLoginChallenge(req) {
  const token = req.cookies?.login_challenge;
  if (!token) return null;
  
  try {
    return jwt.verify(token, config.jwtSecret);
  } catch (error) {
    return null;
  }
}

/**
 * Clear login challenge cookie
 */
function clearLoginChallenge(res) {
  res.clearCookie('login_challenge', {
    httpOnly: true,
    secure: config.cookie.secure,
    sameSite: config.cookie.sameSite
  });
}

/**
 * Set registration challenge cookie
 */
function setRegistrationChallenge(res, payload) {
  // Strip existing JWT fields if present to avoid conflicts with expiresIn
  const { iat, exp, ...cleanPayload } = payload;
  const token = jwt.sign(cleanPayload, config.jwtSecret, {
    expiresIn: config.tokens.registrationExpiry
  });
  
  res.cookie('registration_challenge', token, getCookieOptions(30 * 60 * 1000)); // 30 minutes
  return token;
}

/**
 * Verify and get registration challenge from cookie
 */
function getRegistrationChallenge(req) {
  const token = req.cookies?.registration_challenge;
  if (!token) return null;
  
  try {
    return jwt.verify(token, config.jwtSecret);
  } catch (error) {
    return null;
  }
}

/**
 * Clear registration challenge cookie
 */
function clearRegistrationChallenge(res) {
  res.clearCookie('registration_challenge', {
    httpOnly: true,
    secure: config.cookie.secure,
    sameSite: config.cookie.sameSite
  });
}

/**
 * Set access token cookie
 */
function setAccessToken(res, payload) {
  // Strip existing JWT fields if present to avoid conflicts with expiresIn
  const { iat, exp, ...cleanPayload } = payload;
  const token = jwt.sign(cleanPayload, config.jwtSecret, {
    expiresIn: config.tokens.accessExpiry
  });
  
  res.cookie('access_token', token, getCookieOptions(7 * 24 * 60 * 60 * 1000)); // 7 days
  return token;
}

/**
 * Set refresh token cookie
 */
function setRefreshToken(res, payload) {
  // Strip existing JWT fields if present to avoid conflicts with expiresIn
  const { iat, exp, ...cleanPayload } = payload;
  const token = jwt.sign(cleanPayload, config.jwtRefreshSecret, {
    expiresIn: config.tokens.refreshExpiry
  });
  
  res.cookie('refresh_token', token, getRefreshTokenOptions());
  return token;
}

/**
 * Helper for refresh token cookie options
 */
function getRefreshTokenOptions() {
  return {
    ...getCookieOptions(7 * 24 * 60 * 60 * 1000),
    path: '/api/auth/refresh' // Restrict refresh token to refresh endpoint
  };
}

/**
 * Verify access token from cookie
 */
function getAccessToken(req) {
  const token = req.cookies?.access_token;
  if (!token) return null;
  
  try {
    return jwt.verify(token, config.jwtSecret);
  } catch (error) {
    return null;
  }
}

/**
 * Verify refresh token from cookie
 */
function getRefreshToken(req) {
  const token = req.cookies?.refresh_token;
  if (!token) return null;
  
  try {
    return jwt.verify(token, config.jwtRefreshSecret);
  } catch (error) {
    return null;
  }
}

/**
 * Clear all auth cookies
 */
function clearAuthCookies(res) {
  const options = {
    httpOnly: true,
    secure: config.cookie.secure,
    sameSite: config.cookie.sameSite
  };
  
  res.clearCookie('access_token', options);
  res.clearCookie('refresh_token', options);
  res.clearCookie('login_challenge', options);
  res.clearCookie('registration_challenge', options);
}

module.exports = {
  getCookieOptions,
  setLoginChallenge,
  getLoginChallenge,
  clearLoginChallenge,
  setRegistrationChallenge,
  getRegistrationChallenge,
  clearRegistrationChallenge,
  setAccessToken,
  setRefreshToken,
  getAccessToken,
  getRefreshToken,
  clearAuthCookies
};
