import { logComplaintSubmission, logSecurityEvent } from '../utils/auditLog';
import { info, error as logError } from '../utils/logger';

const COMPLAINT_ENDPOINT = 'http://localhost:3000/api/complaint/';

/**
 * Submit complaint payload to backend API
 * @param {object} payload - complaint details collected from chat flow
 * @returns Promise<{success: boolean, message: string}>
 */
export const submitComplaint = async (payload) => {
  if (!payload || typeof payload !== 'object') {
    return { success: false, message: 'Invalid complaint data provided.' };
  }

  // Remove Blob URLs before sending to server; keep metadata only
  const { evidences = [], evidence: _legacyEvidence, ...restPayload } = payload;

  const sanitizedPayload = {
    ...restPayload,
    evidences: Array.isArray(evidences)
      ? evidences.map(({ id, name, size, mimeType }) => ({ id, name, size, mimeType }))
      : [],
  };

  try {
    info('Submitting complaint to backend', { endpoint: COMPLAINT_ENDPOINT });

    const response = await fetch(COMPLAINT_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(sanitizedPayload)
    });

    const contentType = response.headers.get('content-type') || '';
    const isJson = contentType.includes('application/json');
    const responseBody = isJson ? await response.json() : await response.text();

    if (!response.ok) {
      const message = typeof responseBody === 'object' && responseBody?.message
        ? responseBody.message
        : `Request failed with status ${response.status}`;

      logSecurityEvent('COMPLAINT_SUBMISSION_FAILED', 'HIGH', {
        status: response.status,
        message
      });

      return { success: false, message };
    }

    const successMessage =
      (typeof responseBody === 'object' && responseBody?.message) ||
      'Complaint submitted successfully.';

    logComplaintSubmission(
      responseBody?.complaintId || `COM-${Date.now()}`,
      responseBody?.userId || 'CHATBOT_USER',
      sanitizedPayload.complaintType || 'unknown'
    );

    return { success: true, message: successMessage, data: responseBody };
  } catch (err) {
    const errorMessage = err?.message || 'Failed to submit complaint.';

    logError('COMPLAINT_SUBMISSION_ERROR', err);
    logSecurityEvent('COMPLAINT_SUBMISSION_EXCEPTION', 'HIGH', {
      message: errorMessage
    });

    return { success: false, message: errorMessage };
  }
};

/**
 * Fetch complaint status by tracking ID
 * @param {string} trackingId - unique complaint tracking identifier
 * @returns Promise<{success: boolean, status?: string, message: string}>
 */
export const fetchComplaintStatus = async (trackingId) => {
  if (!trackingId || typeof trackingId !== 'string') {
    return { success: false, message: 'Invalid tracking ID provided.' };
  }

  const endpoint = `${COMPLAINT_ENDPOINT}${encodeURIComponent(trackingId.trim())}`;

  try {
    info('Fetching complaint status', { endpoint });

    const response = await fetch(endpoint, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    const contentType = response.headers.get('content-type') || '';
    const isJson = contentType.includes('application/json');
    const responseBody = isJson ? await response.json() : await response.text();

    if (!response.ok) {
      const message = typeof responseBody === 'object' && responseBody?.error
        ? responseBody.error
        : `Request failed with status ${response.status}`;

      logSecurityEvent('COMPLAINT_STATUS_FAILED', 'MEDIUM', {
        status: response.status,
        message,
        trackingId
      });

      return { success: false, message };
    }

    const status = typeof responseBody === 'object' && responseBody?.status
      ? responseBody.status
      : 'Unknown';

    return { success: true, status, message: 'Status fetched successfully.' };
  } catch (err) {
    const errorMessage = err?.message || 'Failed to fetch complaint status.';

    logError('COMPLAINT_STATUS_ERROR', err);
    logSecurityEvent('COMPLAINT_STATUS_EXCEPTION', 'HIGH', {
      message: errorMessage,
      trackingId
    });

    return { success: false, message: errorMessage };
  }
};
