import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import { getMonthlyReport, downloadMonthlyReport } from '../controllers/reportController.js';

const router = express.Router();

router.use(protect);
router.get('/monthly', getMonthlyReport);
router.get('/download', downloadMonthlyReport);

export default router;
