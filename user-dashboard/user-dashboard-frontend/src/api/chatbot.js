/**
 * Chatbot API Module
 * Handles AI assistant chat functionality
 */

import { axiosInstance } from './axios';
import { API_ENDPOINTS } from '../utils/constants';

/**
 * Send message to AI chatbot
 * @param {string} message - User message
 * @param {string} conversationId - Optional conversation ID for context
 * @returns {Promise<Object>} AI response
 */
export const sendChatMessage = async (message, conversationId = null) => {
  const response = await axiosInstance.post(API_ENDPOINTS.CHAT, {
    message,
    conversation_id: conversationId
  });
  return response.data;
};

export default {
  sendChatMessage
};
