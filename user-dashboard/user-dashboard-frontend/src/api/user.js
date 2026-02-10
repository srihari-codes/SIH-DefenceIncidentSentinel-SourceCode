/**
 * User Profile & Settings API Module
 * Handles user profile and notification settings
 */

import { axiosInstance } from './axios';
import { API_ENDPOINTS } from '../utils/constants';

/**
 * Get current user profile
 * @returns {Promise<Object>} User profile data
 */
export const getUserProfile = async () => {
  const response = await axiosInstance.get(API_ENDPOINTS.USER_PROFILE);
  return response.data;
};

/**
 * Update user profile
 * @param {Object} profileData - Profile data to update
 * @param {string} profileData.full_name - Full name
 * @param {string} profileData.mobile - Mobile number
 * @returns {Promise<Object>} Updated profile
 */
export const updateUserProfile = async (profileData) => {
  const response = await axiosInstance.put(API_ENDPOINTS.USER_PROFILE, profileData);
  return response.data;
};

/**
 * Get user notification settings
 * @returns {Promise<Object>} Notification settings
 */
export const getNotificationSettings = async () => {
  const response = await axiosInstance.get(API_ENDPOINTS.USER_NOTIFICATION_SETTINGS);
  return response.data;
};

/**
 * Update notification settings
 * @param {Object} settings - Notification settings
 * @param {boolean} settings.email_enabled - Enable email notifications
 * @param {boolean} settings.sms_enabled - Enable SMS notifications
 * @param {boolean} settings.complaint_updates - Enable complaint update notifications
 * @param {boolean} settings.system_alerts - Enable system alert notifications
 * @returns {Promise<Object>} Updated settings
 */
export const updateNotificationSettings = async (settings) => {
  const response = await axiosInstance.put(API_ENDPOINTS.USER_NOTIFICATION_SETTINGS, settings);
  return response.data;
};

export default {
  getUserProfile,
  updateUserProfile,
  getNotificationSettings,
  updateNotificationSettings,
};
