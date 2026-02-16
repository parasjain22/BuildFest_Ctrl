const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const adminMiddleware = require('../middleware/adminMiddleware');
const { electionValidation, candidateValidation } = require('../middleware/validate');
const {
    createElection, getElections, updateElection, updateElectionStatus, deleteElection,
    addCandidate, getCandidates, deleteCandidate,
    getRealtimeStats, getDuplicateFlags, getWarnings, addWarning, resolveWarning,
    getComplaints, updateComplaintStatus, getAuditLogs,
    generateKeys, closeAndEnableDecryption,
} = require('../controllers/adminController');

// All admin routes require auth + admin role
router.use(authMiddleware);
router.use(adminMiddleware);

// Election management
router.post('/elections', electionValidation, createElection);
router.get('/elections', getElections);
router.put('/elections/:id', updateElection);
router.patch('/elections/:id/status', updateElectionStatus);
router.delete('/elections/:id', deleteElection);

// Candidate management
router.post('/candidates', candidateValidation, addCandidate);
router.get('/candidates', getCandidates);
router.delete('/candidates/:id', deleteCandidate);

// Real-time monitoring
router.get('/stats/realtime', getRealtimeStats);
router.get('/monitoring/flags', getDuplicateFlags);
router.get('/monitoring/warnings', getWarnings);
router.post('/monitoring/warnings', addWarning);
router.patch('/monitoring/warnings/:warningIndex/resolve', resolveWarning);

// Complaints
router.get('/complaints', getComplaints);
router.patch('/complaints/:id/status', updateComplaintStatus);

// Audit logs
router.get('/audit-logs', getAuditLogs);

// Cryptographic controls
router.post('/crypto/generate-keys', generateKeys);
router.post('/crypto/close-election', closeAndEnableDecryption);

module.exports = router;
