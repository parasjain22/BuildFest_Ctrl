const express = require('express');
const router = express.Router();
const { publishResults, getResults, getConstituencyResults } = require('../controllers/resultController');
const authMiddleware = require('../middleware/authMiddleware');
const adminMiddleware = require('../middleware/adminMiddleware');

// Public: view published results
router.get('/:electionId', getResults);
router.get('/:electionId/constituency', getConstituencyResults);

// Admin: publish results (requires auth + admin)
router.post('/publish', authMiddleware, adminMiddleware, publishResults);

module.exports = router;
