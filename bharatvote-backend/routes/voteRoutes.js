const express = require('express');
const router = express.Router();
const { createSession, castVote, reportViolation, getReceipt, downloadReceipt, emailReceipt, getShareData } = require('../controllers/voteController');
const authMiddleware = require('../middleware/authMiddleware');
const { castVoteValidation } = require('../middleware/validate');
const { voteLimiter } = require('../middleware/rateLimiter');

// All vote routes require authentication
router.use(authMiddleware);

// Create voting session
router.post('/session', createSession);

// Cast vote
router.post('/cast', voteLimiter, castVoteValidation, castVote);

// Report violation
router.post('/violation', reportViolation);

// Receipt endpoints
router.get('/receipt/:id/download', downloadReceipt);
router.get('/receipt/:id', getReceipt);
router.post('/receipt/:id/email', emailReceipt);
router.get('/receipt/:id/share', getShareData);

module.exports = router;
