const express = require('express');
const router = express.Router();
const { submitComplaint, trackComplaint } = require('../controllers/complaintController');
const { uploadComplaintAttachment } = require('../middleware/upload');
const { complaintValidation } = require('../middleware/validate');

const authMiddleware = require('../middleware/authMiddleware');

// All complaint routes require authentication
router.use(authMiddleware);

// Public: submit a complaint (with optional attachment)
router.post('/', uploadComplaintAttachment, complaintValidation, submitComplaint);

// Public: track complaint status
router.get('/:id', trackComplaint);

module.exports = router;
