/**
 * Complaints API Module
 * Handles all complaint-related API calls
 */

import { axiosInstance } from './axios';
import { API_ENDPOINTS } from '../utils/constants';

/**
 * Get list of complaints for the authenticated user
 * @param {Object} params - Query parameters
 * @param {string} params.status - Filter by status (submitted|analysing|investigating|closed|all)
 * @param {number} params.page - Page number
 * @param {number} params.limit - Items per page
 * @param {string} params.search - Search query
 * @returns {Promise<Object>} Complaints list with pagination
 */
export const getComplaints = async (params = {}) => {
  const response = await axiosInstance.get(API_ENDPOINTS.COMPLAINTS_LIST, { params });
  return response.data;
};

/**
 * Get detailed information about a specific complaint
 * @param {string} complaintId - Complaint ID
 * @returns {Promise<Object>} Complaint details
 */
export const getComplaintById = async (complaintId) => {
  const endpoint = API_ENDPOINTS.COMPLAINTS_DETAIL.replace(':id', complaintId);
  const response = await axiosInstance.get(endpoint);
  return response.data;
};

/**
 * Get complaint statistics for the authenticated user
 * @returns {Promise<Object>} Complaint statistics
 */
export const getComplaintStatistics = async () => {
  const response = await axiosInstance.get(API_ENDPOINTS.COMPLAINTS_STATISTICS);
  return response.data;
};

/**
 * Submit a new complaint
 * @param {Object} complaintData - Complaint data
 * @returns {Promise<Object>} Submission result
 */
export const submitComplaint = async (complaintData) => {
  const response = await axiosInstance.post(API_ENDPOINTS.COMPLAINTS_SUBMIT, complaintData);
  return response.data;
};

/**
 * Track complaint status by tracking ID (public endpoint)
 * @param {string} trackingId - Public tracking ID
 * @returns {Promise<Object>} Complaint status
 */
export const trackComplaintStatus = async (trackingId) => {
  const endpoint = API_ENDPOINTS.COMPLAINTS_TRACK.replace(':trackingId', trackingId);
  const response = await axiosInstance.get(endpoint);
  return response.data;
};

export default {
  getComplaints,
  getComplaintById,
  getComplaintStatistics,
  submitComplaint,
  trackComplaintStatus,
};
