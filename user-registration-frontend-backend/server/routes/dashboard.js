import express from 'express';
import { verifyToken, requireRole, requireAdmin } from '../middleware/auth.js';
import { auditLog } from '../middleware/logger.js';

const router = express.Router();

/**
 * Get user dashboard data
 * Protected route - requires authentication
 */
router.get('/user', verifyToken, async (req, res) => {
  try {
    auditLog('dashboard_access', req.user.userId, {
      role: req.user.role,
    });

    res.json({
      success: true,
      user: {
        fullName: req.user.fullName,
        email: req.user.email,
        role: req.user.role,
      },
      message: 'Dashboard data retrieved successfully',
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve dashboard data',
    });
  }
});

/**
 * Get officer-specific resources
 * Only accessible to officers and admins
 */
router.get('/officer', verifyToken, requireRole('officer', 'admin'), async (req, res) => {
  try {
    res.json({
      success: true,
      data: {
        operations: [],
        personnel: [],
        missions: [],
      },
      message: 'Officer dashboard data',
    });
  } catch (error) {
    console.error('Officer dashboard error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve officer data',
    });
  }
});

/**
 * Get staff-specific resources
 * Only accessible to staff and admins
 */
router.get('/staff', verifyToken, requireRole('staff', 'admin'), async (req, res) => {
  try {
    res.json({
      success: true,
      data: {
        familyServices: [],
        benefits: [],
        announcements: [],
      },
      message: 'Staff dashboard data',
    });
  } catch (error) {
    console.error('Staff dashboard error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve staff data',
    });
  }
});

/**
 * Get analyst-specific resources
 * Only accessible to analysts and admins
 */
router.get('/analyst', verifyToken, requireRole('analyst', 'admin'), async (req, res) => {
  try {
    res.json({
      success: true,
      data: {
        reports: [],
        analytics: [],
        threats: [],
      },
      message: 'Analyst dashboard data',
    });
  } catch (error) {
    console.error('Analyst dashboard error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve analyst data',
    });
  }
});

/**
 * Get guest-specific resources
 * Only accessible to guests and admins
 */
router.get('/guest', verifyToken, requireRole('guest', 'admin'), async (req, res) => {
  try {
    res.json({
      success: true,
      data: {
        publicResources: [],
        readOnlyData: [],
      },
      message: 'Guest dashboard data',
    });
  } catch (error) {
    console.error('Guest dashboard error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve guest data',
    });
  }
});

/**
 * Admin dashboard - view all users
 * Only accessible to admins
 */
router.get('/admin/users', verifyToken, requireAdmin, async (req, res) => {
  try {
    // In production, fetch from database
    res.json({
      success: true,
      users: [],
      message: 'Admin: All users',
    });
  } catch (error) {
    console.error('Admin dashboard error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve admin data',
    });
  }
});

export default router;
