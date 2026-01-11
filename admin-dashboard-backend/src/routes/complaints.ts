import { Router } from 'express';
import {
  getAttackTypeCountsController,
  getCaseSummariesController,
  getComplaintStatsController,
  getComplaintDetailsController,
  getRecentCaseActivitiesController
} from '../controllers/complaintController';

const router = Router();

router.get('/stats', getComplaintStatsController);
router.get('/attack-types', getAttackTypeCountsController);
router.get('/recent-activities', getRecentCaseActivitiesController);
router.get('/cases', getCaseSummariesController);
router.post('/details', getComplaintDetailsController);

export default router;
