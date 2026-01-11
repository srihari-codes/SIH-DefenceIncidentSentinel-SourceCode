import { NextFunction, Request, Response } from 'express';
import {
  getAttackTypeCounts,
  getCaseSummaries,
  getComplaintStats,
  getComplaintCaseDetails,
  getRecentCaseActivities
} from '../services/complaintService';

export const getComplaintStatsController = async (
  _req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const stats = await getComplaintStats();

    res.json({
      totalCases: stats.totalCases,
      pending: stats.pending,
      solved: stats.solved,
      active: stats.active
    });
  } catch (error) {
    next(error);
  }
};

export const getAttackTypeCountsController = async (
  _req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const counts = await getAttackTypeCounts();
    res.json(counts);
  } catch (error) {
    next(error);
  }
};

export const getRecentCaseActivitiesController = async (
  _req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const activities = await getRecentCaseActivities();
    res.json(activities);
  } catch (error) {
    next(error);
  }
};

export const getCaseSummariesController = async (
  _req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const cases = await getCaseSummaries();
    res.json(cases);
  } catch (error) {
    next(error);
  }
};

export const getComplaintDetailsController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { complaint_id, complaiint_id } = req.body ?? {};
    const complaintId = typeof complaint_id === 'string' ? complaint_id : complaiint_id;

    if (typeof complaintId !== 'string' || !complaintId) {
      const error = new Error('complaint_id is required') as Error & { status?: number };
      error.status = 400;
      throw error;
    }

    const details = await getComplaintCaseDetails(complaintId);
    res.json(details);
  } catch (error) {
    next(error);
  }
};
