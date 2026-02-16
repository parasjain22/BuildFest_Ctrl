const express = require('express');
const router = express.Router();
const { getWelcomeData, getLiveElection, getScheduledElections, getPublicCandidates, getECIMembers, getOfficersByLocation } = require('../controllers/publicController');

// All public routes — no authentication required
router.get('/welcome', getWelcomeData);
router.get('/election/live', getLiveElection);
router.get('/election/scheduled', getScheduledElections);
router.get('/candidates', getPublicCandidates);
router.get('/eci-members', getECIMembers);
router.get('/officers/:location', getOfficersByLocation);

module.exports = router;
