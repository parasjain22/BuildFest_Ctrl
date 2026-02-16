const express = require('express');
const router = express.Router();
const { getStats, verifyReceipt, getMerkleRootData, getTimeline } = require('../controllers/auditController');

const authMiddleware = require('../middleware/authMiddleware');
// All audit routes require authentication
router.use(authMiddleware);

router.get('/stats', getStats);
router.get('/verify/:receiptId', verifyReceipt);
router.get('/merkle-root', getMerkleRootData);
router.get('/timeline', getTimeline);

module.exports = router;
