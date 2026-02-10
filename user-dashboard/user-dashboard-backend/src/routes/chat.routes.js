const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const { requireAuth } = require('../middleware/auth');
const { chatLimiter } = require('../middleware/rateLimiter');
const { ERROR_CODES } = require('../constants');

const router = express.Router();

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Conversation storage (in-memory for now)
// In production, use Redis or MongoDB for persistence
const conversations = new Map();

// System prompt for the chatbot
const SYSTEM_PROMPT = `You are a helpful AI assistant for the Defence Incident Sentinel system, a cybersecurity incident reporting platform for defence personnel. Your role is to:

1. Help users understand how to report security incidents
2. Explain different incident categories (phishing, malware, honeytrap, espionage, OPSEC violations, data breaches, social engineering, ransomware, DDoS)
3. Guide users on immediate actions when they suspect a security incident
4. Explain the complaint tracking system
5. Provide general cybersecurity awareness guidance

Key system features:
- Users can submit complaints with evidence attachments
- Each complaint gets a tracking ID (TRK-XXXXXX format)
- Complaints go through: submitted → analysing → investigating → closed
- CERT analysts review and investigate incidents
- Risk levels: low, medium, high, critical

Be concise, professional, and security-conscious. Do not make up information about specific incidents or investigations. If asked about something outside your scope, direct users to submit a formal complaint or contact the CERT team directly.`;

// ──────────────────────────────────────────────
// POST /api/chat
// Google Gemini-powered chatbot
// ──────────────────────────────────────────────
router.post('/', requireAuth, chatLimiter, async (req, res, next) => {
  try {
    const { message, conversation_id } = req.body;

    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return res.status(ERROR_CODES.VALIDATION_ERROR.status).json({
        success: false,
        message: 'message is required and must be a non-empty string',
        error_code: ERROR_CODES.VALIDATION_ERROR.code
      });
    }

    const convId = conversation_id || uuidv4();

    // Get or create conversation history
    let history = conversations.get(convId);
    if (!history) {
      history = [];
      conversations.set(convId, history);
    }

    // Initialize Gemini model
    const model = genAI.getGenerativeModel({ 
      model: 'gemini-1.5-flash',
      systemInstruction: SYSTEM_PROMPT
    });

    // Build conversation history for Gemini
    const chat = model.startChat({
      history: history.map(msg => ({
        role: msg.role,
        parts: [{ text: msg.content }]
      }))
    });

    // Send user message and get response
    const result = await chat.sendMessage(message);
    const responseText = await result.response.text();
    
    // Clean up response text (Gemini sometimes adds markdown or triplicates)
    const aiReply = responseText.replace(/```json|```/g, '').trim();

    // Update conversation history
    history.push({ role: 'user', content: message });
    history.push({ role: 'model', content: aiReply });

    // Limit history to last 20 exchanges (40 messages)
    if (history.length > 40) {
      history.splice(0, history.length - 40);
    }

    res.json({
      success: true,
      data: {
        reply: aiReply,
        conversation_id: convId,
        timestamp: new Date().toISOString()
      }
    });
  } catch (err) {
    // Handle Gemini API errors
    if (err.message?.includes('API key')) {
      return res.status(ERROR_CODES.SERVER_ERROR.status).json({
        success: false,
        message: 'AI service configuration error. Please contact support.',
        error_code: ERROR_CODES.SERVER_ERROR.code
      });
    }
    next(err);
  }
});

module.exports = router;
