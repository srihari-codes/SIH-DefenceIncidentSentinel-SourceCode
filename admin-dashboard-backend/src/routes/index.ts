import { Router } from 'express';
import healthRouter from './health';
import complaintsRouter from './complaints';

const router = Router();

router.use('/health', healthRouter);
router.use('/complaints', complaintsRouter);

export default router;
