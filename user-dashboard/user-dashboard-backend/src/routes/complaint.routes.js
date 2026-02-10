const express = require('express');
const crypto = require('crypto');
const { v4: uuidv4 } = require('uuid');
const { requireAuth } = require('../middleware/auth');
const { complaintLimiter } = require('../middleware/rateLimiter');
const { validateComplaint } = require('../middleware/validate');
const { ERROR_CODES } = require('../constants');
const { generateTrackingId } = require('../utils/trackingId');
const { logAudit } = require('../utils/auditLogger');
const Complaint = require('../models/Complaint');
const Evidence = require('../models/Evidence');
const supabase = require('../config/supabase');

const router = express.Router();

// ──────────────────────────────────────────────
// GET /api/complaints/statistics
// Must be registered BEFORE /:complaintId
// ──────────────────────────────────────────────
router.get('/statistics', requireAuth, async (req, res, next) => {
  try {
    const userId = req.user.uid;

    const [total, active, closed] = await Promise.all([
      Complaint.countDocuments({ submitted_by: userId }),
      Complaint.countDocuments({ submitted_by: userId, status: { $ne: 'closed' } }),
      Complaint.countDocuments({ submitted_by: userId, status: 'closed' })
    ]);

    res.json({
      success: true,
      data: {
        total_complaints: total,
        active_complaints: active,
        closed_complaints: closed
      }
    });
  } catch (err) {
    next(err);
  }
});

// ──────────────────────────────────────────────
// GET /api/complaints/list
// Paginated, filterable, searchable
// ──────────────────────────────────────────────
router.get('/list', requireAuth, async (req, res, next) => {
  try {
    const userId = req.user.uid;
    const { status = 'all', page = 1, limit = 20, search } = req.query;

    const pageNum = Math.max(1, parseInt(page) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit) || 20));

    const query = { submitted_by: userId };
    
    if (status !== 'all') {
      const statusList = status.split(',').map(s => s.trim());
      if (statusList.length > 1) {
        query.status = { $in: statusList };
      } else {
        query.status = statusList[0];
      }
    }

    if (search) {
      query.$or = [
        { description: { $regex: search, $options: 'i' } },
        { tracking_id: { $regex: search, $options: 'i' } },
        { category: { $regex: search, $options: 'i' } }
      ];
    }

    const [total, complaints] = await Promise.all([
      Complaint.countDocuments(query),
      Complaint.find(query)
        .sort({ created_at: -1 })
        .skip((pageNum - 1) * limitNum)
        .limit(limitNum)
        .lean()
    ]);

    res.json({
      success: true,
      data: {
        complaints: complaints.map(c => ({
          complaint_id: c.complaint_id,
          tracking_id: c.tracking_id,
          category: c.category,
          description: c.description,
          status: c.status,
          risk_level: c.risk_level || null,
          created_at: c.created_at
        })),
        pagination: {
          current_page: pageNum,
          total_pages: Math.ceil(total / limitNum),
          total_items: total,
          items_per_page: limitNum
        }
      }
    });
  } catch (err) {
    next(err);
  }
});

// ──────────────────────────────────────────────
// GET /api/complaints/track/:trackingId
// Public endpoint — no auth required
// ──────────────────────────────────────────────
router.get('/track/:trackingId', async (req, res, next) => {
  try {
    const { trackingId } = req.params;

    const complaint = await Complaint.findOne({ tracking_id: trackingId }).lean();

    if (!complaint) {
      return res.status(ERROR_CODES.NOT_FOUND.status).json({
        success: false,
        message: 'Tracking ID not found',
        error_code: ERROR_CODES.NOT_FOUND.code
      });
    }

    res.json({
      success: true,
      data: {
        tracking_id: complaint.tracking_id,
        status: complaint.status,
        submitted_at: complaint.created_at
      }
    });
  } catch (err) {
    next(err);
  }
});

// ──────────────────────────────────────────────
// POST /api/complaints/submit
// Submit a new complaint with optional evidence
// ──────────────────────────────────────────────
router.post('/submit', requireAuth, complaintLimiter, validateComplaint, async (req, res, next) => {
  try {
    const userId = req.user.uid;
    const { category, description, incident_timestamp, suspected_source, evidences } = req.body;

    const complaintId = uuidv4();
    const trackingId = generateTrackingId();

    // Create the complaint
    await Complaint.create({
      complaint_id: complaintId,
      submitted_by: userId,
      tracking_id: trackingId,
      category,
      description,
      incident_timestamp: new Date(incident_timestamp),
      suspected_source: suspected_source || null,
      status: 'submitted',
      risk_level: null,
      created_at: new Date(),
      updated_at: new Date()
    });

    // Upload evidences to Supabase
    const uploadResults = [];
    console.log(`[EVIDENCE] Processing ${evidences ? evidences.length : 0} files for complaint ${complaintId}`);

    if (evidences && evidences.length > 0) {
      for (const ev of evidences) {
        console.log(`[EVIDENCE] Starting upload for file: ${ev.file_name} (${ev.mime_type})`);
        const evidenceId = uuidv4();
        
        let base64Data = ev.file_data;
        if (base64Data.includes(';base64,')) {
          console.log('[EVIDENCE] Detected Data URL prefix, stripping it...');
          base64Data = base64Data.split(';base64,')[1];
        }
        
        console.log(`[EVIDENCE] Base64 snippet (first 50 chars): ${base64Data.substring(0, 50)}...`);
        const fileBuffer = Buffer.from(base64Data, 'base64');
        console.log(`[EVIDENCE] Buffer created, size: ${fileBuffer.length} bytes`);
        const sha256 = crypto.createHash('sha256').update(fileBuffer).digest('hex');
        const storagePath = `complaints/${complaintId}/evidences/${evidenceId}/${ev.file_name}`;
        
        console.log(`[EVIDENCE] Target storage path: ${storagePath}`);
        const bucket = process.env.SUPABASE_BUCKET || 'evidence';
        console.log(`[EVIDENCE] Target bucket: ${bucket}`);

        // Upload to Supabase Storage
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from(bucket)
          .upload(storagePath, fileBuffer, {
            contentType: ev.mime_type,
            upsert: false
          });

        if (uploadError) {
          console.error(`[EVIDENCE] Upload FAILED for ${ev.file_name}:`, uploadError);
        } else {
          console.log(`[EVIDENCE] Upload SUCCESS for ${ev.file_name}:`, uploadData);
        }

        const uploadStatus = uploadError ? 'failed' : 'uploaded';

        // Save evidence metadata
        await Evidence.create({
          evidence_id: evidenceId,
          complaint_id: complaintId,
          originalFileName: ev.file_name,
          mimeType: ev.mime_type,
          fileSizeBytes: fileBuffer.length,
          sha256,
          storageProvider: 'supabase',
          bucketName: process.env.SUPABASE_BUCKET || 'evidence',
          storagePath,
          uploadStatus,
          uploadedBy: userId,
          uploadedAt: new Date()
        });

        uploadResults.push({
          file_name: ev.file_name,
          status: uploadStatus,
          error: uploadError ? uploadError.message : null
        });
      }
    }

    // Audit log
    await logAudit(userId, 'complaint.submit', 'complaint', complaintId);

    const hasFailedUploads = uploadResults.some(r => r.status === 'failed');

    res.status(201).json({
      success: true,
      message: hasFailedUploads 
        ? 'Complaint submitted, but some evidence files failed to upload' 
        : 'Complaint submitted successfully',
      data: {
        complaint_id: complaintId,
        tracking_id: trackingId,
        status: 'submitted',
        created_at: new Date().toISOString(),
        upload_results: uploadResults
      }
    });
  } catch (err) {
    next(err);
  }
});

// ──────────────────────────────────────────────
// GET /api/complaints/:complaintId
// Get details (user-isolated)
// ──────────────────────────────────────────────
router.get('/:complaintId', requireAuth, async (req, res, next) => {
  try {
    const userId = req.user.uid;
    const { complaintId } = req.params;

    const complaint = await Complaint.findOne({
      complaint_id: complaintId,
      submitted_by: userId
    }).lean();

    if (!complaint) {
      return res.status(ERROR_CODES.NOT_FOUND.status).json({
        success: false,
        message: 'Complaint not found',
        error_code: ERROR_CODES.NOT_FOUND.code
      });
    }

    // Fetch associated evidences
    const evidences = await Evidence.find({ complaint_id: complaintId }).lean();

    res.json({
      success: true,
      data: {
        complaint_id: complaint.complaint_id,
        tracking_id: complaint.tracking_id,
        category: complaint.category,
        description: complaint.description,
        incident_timestamp: complaint.incident_timestamp,
        suspected_source: complaint.suspected_source || null,
        status: complaint.status,
        risk_level: complaint.risk_level || null,
        created_at: complaint.created_at,
        updated_at: complaint.updated_at,
        evidences: evidences.map(e => ({
          evidence_id: e.evidence_id,
          file_name: e.originalFileName,
          mime_type: e.mimeType,
          file_size_bytes: e.fileSizeBytes,
          upload_status: e.uploadStatus,
          uploaded_at: e.uploadedAt
        }))
      }
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
