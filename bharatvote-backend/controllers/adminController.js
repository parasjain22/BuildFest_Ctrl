const crypto = require('crypto');
const Election = require('../models/Election');
const Candidate = require('../models/Candidate');
const User = require('../models/User');
const Vote = require('../models/Vote');
const Complaint = require('../models/Complaint');
const AuditLog = require('../models/AuditLog');
const CryptoKey = require('../models/CryptoKey');
const { generateElectionKeyPair, encrypt } = require('../utils/encryption');

// ===================== ELECTION MANAGEMENT =====================

/**
 * POST /api/admin/elections
 */
const createElection = async (req, res) => {
    console.log('🗳️ [createElection] ▶ Creating new election');
    try {
        const { name, description, timeline, constituencies, settings } = req.body;
        console.log(`🗳️ [createElection]   Name: ${name}`);
        console.log(`🗳️ [createElection]   Constituencies: ${JSON.stringify(constituencies || [])}`);
        console.log(`🗳️ [createElection]   Timeline: ${JSON.stringify(timeline || {})}`);

        const election = await Election.create({
            name,
            description,
            timeline: timeline || {},
            constituencies: constituencies || [],
            settings: settings || {},
            created_by: req.user._id,
        });

        console.log(`🗳️ [createElection]   Election ID: ${election._id}`);

        await AuditLog.create({
            action: 'CREATE_ELECTION',
            performed_by: req.user._id,
            target_type: 'election',
            target_id: election._id.toString(),
            details: { name, constituencies },
            ip_address: req.ip,
            user_agent: req.get('user-agent'),
        });
        console.log('🗳️ [createElection]   Audit log written');

        console.log('🗳️ [createElection] ✅ Election created successfully');
        res.status(201).json({ status: 'success', message: 'Election created', data: election });
    } catch (error) {
        console.error('🗳️ [createElection] ❌ Error:', error.message);
        res.status(500).json({ status: 'error', message: 'Failed to create election' });
    }
};

/**
 * GET /api/admin/elections
 */
const getElections = async (req, res) => {
    console.log('🗳️ [getElections] ▶ Fetching all elections');
    try {
        const elections = await Election.find().sort({ createdAt: -1 }).select('-merkle_leaves -blockchain_log');
        console.log(`🗳️ [getElections] ✅ Found ${elections.length} elections`);
        res.status(200).json({ status: 'success', data: { elections } });
    } catch (error) {
        console.error('🗳️ [getElections] ❌ Error:', error.message);
        res.status(500).json({ status: 'error', message: 'Failed to get elections' });
    }
};

/**
 * PUT /api/admin/elections/:id
 */
const updateElection = async (req, res) => {
    console.log(`🗳️ [updateElection] ▶ Updating election ${req.params.id}`);
    try {
        const { id } = req.params;
        const updates = req.body;
        console.log(`🗳️ [updateElection]   Fields: ${Object.keys(updates).join(', ')}`);

        const election = await Election.findById(id);
        if (!election) {
            console.log('🗳️ [updateElection] ❌ Election not found');
            return res.status(404).json({ status: 'error', message: 'Election not found' });
        }
        if (election.status === 'results_published') {
            console.log('🗳️ [updateElection] ❌ Cannot modify published election');
            return res.status(400).json({ status: 'error', message: 'Cannot modify published election' });
        }

        Object.assign(election, updates);
        await election.save();

        await AuditLog.create({
            action: 'UPDATE_ELECTION',
            performed_by: req.user._id,
            target_type: 'election',
            target_id: id,
            details: { updated_fields: Object.keys(updates) },
            ip_address: req.ip,
        });

        console.log('🗳️ [updateElection] ✅ Election updated');
        res.status(200).json({ status: 'success', message: 'Election updated', data: election });
    } catch (error) {
        console.error('🗳️ [updateElection] ❌ Error:', error.message);
        res.status(500).json({ status: 'error', message: 'Failed to update election' });
    }
};

/**
 * PATCH /api/admin/elections/:id/status
 */
const updateElectionStatus = async (req, res) => {
    console.log(`🗳️ [updateElectionStatus] ▶ Status update for election ${req.params.id}`);
    try {
        const { id } = req.params;
        const { status } = req.body;
        console.log(`🗳️ [updateElectionStatus]   New status: ${status}`);

        const validTransitions = {
            draft: ['scheduled', 'live'],
            scheduled: ['live', 'draft'],
            live: ['closed'],
            closed: ['results_published'],
        };

        const election = await Election.findById(id);
        if (!election) {
            console.log('🗳️ [updateElectionStatus] ❌ Election not found');
            return res.status(404).json({ status: 'error', message: 'Election not found' });
        }

        console.log(`🗳️ [updateElectionStatus]   Current status: ${election.status}`);

        if (!validTransitions[election.status]?.includes(status)) {
            console.log(`🗳️ [updateElectionStatus] ❌ Invalid transition: ${election.status} → ${status}`);
            return res.status(400).json({
                status: 'error',
                message: `Cannot transition from '${election.status}' to '${status}'`,
            });
        }

        if (status === 'live') {
            election.settings.is_active = true;
            election.settings.voting_started = true;
            if (!election.timeline.voting_start) election.timeline.voting_start = new Date();
            console.log('🗳️ [updateElectionStatus]   Election is now LIVE! 🟢');
        }

        if (status === 'closed') {
            election.settings.is_active = false;
            election.settings.voting_started = false;
            election.settings.allow_registration = false;
            if (!election.timeline.voting_end) election.timeline.voting_end = new Date();
            console.log('🗳️ [updateElectionStatus]   Election CLOSED 🔴');
        }

        election.status = status;
        await election.save();

        await AuditLog.create({
            action: 'UPDATE_ELECTION_STATUS',
            performed_by: req.user._id,
            target_type: 'election',
            target_id: id,
            details: { new_status: status },
            ip_address: req.ip,
        });

        console.log(`🗳️ [updateElectionStatus] ✅ Status → ${status}`);
        res.status(200).json({ status: 'success', message: `Election status updated to '${status}'`, data: election });
    } catch (error) {
        console.error('🗳️ [updateElectionStatus] ❌ Error:', error.message);
        res.status(500).json({ status: 'error', message: 'Failed to update status' });
    }
};

// ===================== CANDIDATE MANAGEMENT =====================

/**
 * POST /api/admin/candidates
 */
const addCandidate = async (req, res) => {
    console.log('👤 [addCandidate] ▶ Adding candidate');
    try {
        console.log(`👤 [addCandidate]   Name: ${req.body.name}, Party: ${req.body.party}, Constituency: ${req.body.constituency}`);

        const candidate = await Candidate.create(req.body);

        await AuditLog.create({
            action: 'ADD_CANDIDATE',
            performed_by: req.user._id,
            target_type: 'candidate',
            target_id: candidate._id.toString(),
            details: { name: candidate.name, party: candidate.party },
            ip_address: req.ip,
        });

        console.log(`👤 [addCandidate] ✅ Candidate added: ${candidate._id}`);
        res.status(201).json({ status: 'success', data: { candidate } });
    } catch (error) {
        console.error('👤 [addCandidate] ❌ Error:', error.message);
        res.status(500).json({ status: 'error', message: 'Failed to add candidate' });
    }
};

/**
 * GET /api/admin/candidates?election_id=xxx
 */
const getCandidates = async (req, res) => {
    console.log('👤 [getCandidates] ▶ Fetching candidates');
    try {
        const { election_id } = req.query;
        const filter = election_id ? { election_id } : {};
        console.log(`👤 [getCandidates]   Filter: ${JSON.stringify(filter)}`);

        const candidates = await Candidate.find(filter).sort({ constituency: 1, name: 1 });
        console.log(`👤 [getCandidates] ✅ Found ${candidates.length} candidates`);
        res.status(200).json({ status: 'success', data: { candidates } });
    } catch (error) {
        console.error('👤 [getCandidates] ❌ Error:', error.message);
        res.status(500).json({ status: 'error', message: 'Failed to get candidates' });
    }
};

/**
 * DELETE /api/admin/candidates/:id
 */
const deleteCandidate = async (req, res) => {
    console.log(`👤 [deleteCandidate] ▶ Deleting candidate ${req.params.id}`);
    try {
        const candidate = await Candidate.findByIdAndDelete(req.params.id);
        if (!candidate) {
            console.log('👤 [deleteCandidate] ❌ Candidate not found');
            return res.status(404).json({ status: 'error', message: 'Candidate not found' });
        }

        await AuditLog.create({
            action: 'DELETE_CANDIDATE',
            performed_by: req.user._id,
            target_type: 'candidate',
            target_id: req.params.id,
            ip_address: req.ip,
        });

        console.log(`👤 [deleteCandidate] ✅ Candidate removed: ${candidate.name}`);
        res.status(200).json({ status: 'success', message: 'Candidate removed' });
    } catch (error) {
        console.error('👤 [deleteCandidate] ❌ Error:', error.message);
        res.status(500).json({ status: 'error', message: 'Failed to delete candidate' });
    }
};

// ===================== REAL-TIME MONITORING =====================

/**
 * GET /api/admin/stats/realtime
 */
const getRealtimeStats = async (req, res) => {
    console.log('📊 [getRealtimeStats] ▶ Fetching real-time stats');
    try {
        const election = await Election.findOne({ status: 'live' });

        const totalRegistered = await User.countDocuments({ is_verified: true });
        const totalVoted = await User.countDocuments({ has_voted: true });
        const totalUsers = await User.countDocuments({});
        const totalBlocked = await User.countDocuments({ blocked: true });
        const totalViolations = await User.countDocuments({ violation_count: { $gte: 1 } });

        let totalVotesCast = 0;
        let recentVotes = 0;
        let electionName = 'No active election';
        let electionId = null;
        let electionStatus = 'none';

        if (election) {
            totalVotesCast = election.total_votes_cast || 0;
            recentVotes = await Vote.countDocuments({
                election_id: election._id,
                timestamp: { $gte: new Date(Date.now() - 10 * 60 * 1000) },
            });
            electionName = election.name;
            electionId = election._id;
            electionStatus = election.status;
        }

        const data = {
            election_name: electionName,
            election_id: electionId,
            election_status: electionStatus,
            registeredVoters: totalUsers,
            verifiedVoters: totalRegistered,
            totalVotes: totalVotesCast,
            totalVoted,
            totalBlocked,
            totalFlagged: totalViolations,
            turnout: totalUsers > 0 ? ((totalVoted / totalUsers) * 100).toFixed(1) : '0.0',
            verificationRate: totalVoted > 0 ? (((totalVotesCast > 0 ? totalVotesCast : totalVoted) / totalVoted) * 100).toFixed(1) : '0.0',
            votes_last_10_min: recentVotes,
            last_updated: new Date(),
        };

        console.log(`📊 [getRealtimeStats] ✅ Registered: ${totalUsers}, Voted: ${totalVoted}, Blocked: ${totalBlocked}, Flagged: ${totalViolations}`);
        res.status(200).json({ status: 'success', data });
    } catch (error) {
        console.error('📊 [getRealtimeStats] ❌ Error:', error.message);
        res.status(500).json({ status: 'error', message: 'Failed to get stats' });
    }
};

/**
 * GET /api/admin/monitoring/flags
 */
const getDuplicateFlags = async (req, res) => {
    console.log('🚩 [getDuplicateFlags] ▶ Fetching duplicate attempt flags');
    try {
        const flaggedUsers = await User.find({ violation_count: { $gte: 1 } })
            .select('name voter_id violation_count blocked updatedAt state constituency')
            .sort({ violation_count: -1 })
            .limit(50);

        console.log(`🚩 [getDuplicateFlags] ✅ Found ${flaggedUsers.length} flagged users`);
        res.status(200).json({ status: 'success', data: { flags: flaggedUsers } });
    } catch (error) {
        console.error('🚩 [getDuplicateFlags] ❌ Error:', error.message);
        res.status(500).json({ status: 'error', message: 'Failed to get flags' });
    }
};

/**
 * GET /api/admin/monitoring/warnings
 */
const getWarnings = async (req, res) => {
    console.log('⚠️ [getWarnings] ▶ Fetching system warnings');
    try {
        const election = await Election.findOne({ status: { $in: ['live', 'closed', 'scheduled'] } }).sort({ updatedAt: -1 });
        if (!election) {
            console.log('⚠️ [getWarnings]   No active election found');
            return res.status(200).json({ status: 'success', data: { warnings: [] } });
        }

        const warnings = (election.warnings || []).sort((a, b) => b.timestamp - a.timestamp);
        console.log(`⚠️ [getWarnings] ✅ Found ${warnings.length} warnings`);
        res.status(200).json({ status: 'success', data: { warnings, election_id: election._id } });
    } catch (error) {
        console.error('⚠️ [getWarnings] ❌ Error:', error.message);
        res.status(500).json({ status: 'error', message: 'Failed to get warnings' });
    }
};

/**
 * POST /api/admin/monitoring/warnings
 */
const addWarning = async (req, res) => {
    console.log('⚠️ [addWarning] ▶ Adding system warning');
    try {
        const { election_id, type, message } = req.body;
        console.log(`⚠️ [addWarning]   Type: ${type}, Message: ${message}`);

        const election = await Election.findById(election_id);
        if (!election) {
            console.log('⚠️ [addWarning] ❌ Election not found');
            return res.status(404).json({ status: 'error', message: 'Election not found' });
        }

        election.warnings.push({ type, message, timestamp: new Date(), resolved: false });
        await election.save();

        await AuditLog.create({
            action: 'ADD_WARNING',
            performed_by: req.user._id,
            target_type: 'election',
            target_id: election_id,
            details: { type, message },
            ip_address: req.ip,
        });

        console.log('⚠️ [addWarning] ✅ Warning added');
        res.status(201).json({ status: 'success', message: 'Warning added', data: { warnings: election.warnings } });
    } catch (error) {
        console.error('⚠️ [addWarning] ❌ Error:', error.message);
        res.status(500).json({ status: 'error', message: 'Failed to add warning' });
    }
};

/**
 * PATCH /api/admin/monitoring/warnings/:warningIndex/resolve
 */
const resolveWarning = async (req, res) => {
    console.log(`⚠️ [resolveWarning] ▶ Resolving warning index ${req.params.warningIndex}`);
    try {
        const { election_id } = req.body;
        const warningIndex = parseInt(req.params.warningIndex, 10);

        const election = await Election.findById(election_id);
        if (!election) {
            console.log('⚠️ [resolveWarning] ❌ Election not found');
            return res.status(404).json({ status: 'error', message: 'Election not found' });
        }

        if (!election.warnings[warningIndex]) {
            console.log('⚠️ [resolveWarning] ❌ Warning not found at index');
            return res.status(404).json({ status: 'error', message: 'Warning not found' });
        }

        election.warnings[warningIndex].resolved = true;
        election.markModified('warnings');
        await election.save();

        console.log('⚠️ [resolveWarning] ✅ Warning resolved');
        res.status(200).json({ status: 'success', message: 'Warning resolved' });
    } catch (error) {
        console.error('⚠️ [resolveWarning] ❌ Error:', error.message);
        res.status(500).json({ status: 'error', message: 'Failed to resolve warning' });
    }
};

// ===================== COMPLAINTS =====================

/**
 * GET /api/admin/complaints
 */
const getComplaints = async (req, res) => {
    console.log('📨 [getComplaints] ▶ Fetching all complaints');
    try {
        const complaints = await Complaint.find().sort({ createdAt: -1 });
        console.log(`📨 [getComplaints] ✅ Found ${complaints.length} complaints`);
        res.status(200).json({ status: 'success', data: { complaints } });
    } catch (error) {
        console.error('📨 [getComplaints] ❌ Error:', error.message);
        res.status(500).json({ status: 'error', message: 'Failed to get complaints' });
    }
};

/**
 * PATCH /api/admin/complaints/:id/status
 */
const updateComplaintStatus = async (req, res) => {
    console.log(`📨 [updateComplaintStatus] ▶ Updating complaint ${req.params.id}`);
    try {
        const { id } = req.params;
        const { status, admin_notes } = req.body;
        console.log(`📨 [updateComplaintStatus]   New status: ${status}`);

        const complaint = await Complaint.findById(id);
        if (!complaint) {
            console.log('📨 [updateComplaintStatus] ❌ Complaint not found');
            return res.status(404).json({ status: 'error', message: 'Complaint not found' });
        }

        complaint.status = status;
        if (admin_notes) complaint.admin_notes = admin_notes;
        if (status === 'resolved') complaint.resolved_at = new Date();
        await complaint.save();

        await AuditLog.create({
            action: 'UPDATE_COMPLAINT_STATUS',
            performed_by: req.user._id,
            target_type: 'complaint',
            target_id: id,
            details: { new_status: status },
            ip_address: req.ip,
        });

        console.log(`📨 [updateComplaintStatus] ✅ Complaint status → ${status}`);
        res.status(200).json({ status: 'success', message: 'Complaint status updated', data: complaint });
    } catch (error) {
        console.error('📨 [updateComplaintStatus] ❌ Error:', error.message);
        res.status(500).json({ status: 'error', message: 'Failed to update complaint status' });
    }
};

// ===================== AUDIT LOGS =====================

/**
 * GET /api/admin/audit-logs
 */
const getAuditLogs = async (req, res) => {
    console.log('📜 [getAuditLogs] ▶ Fetching audit logs');
    try {
        const { limit = 50 } = req.query;
        const logs = await AuditLog.find().sort({ createdAt: -1 }).limit(parseInt(limit, 10));
        console.log(`📜 [getAuditLogs] ✅ Found ${logs.length} logs`);
        res.status(200).json({ status: 'success', data: { logs } });
    } catch (error) {
        console.error('📜 [getAuditLogs] ❌ Error:', error.message);
        res.status(500).json({ status: 'error', message: 'Failed to get audit logs' });
    }
};

// ===================== CRYPTOGRAPHIC CONTROLS =====================

/**
 * POST /api/admin/crypto/generate-keys
 */
const generateKeys = async (req, res) => {
    console.log('🔑 [generateKeys] ▶ Generating election key pair');
    try {
        const { election_id } = req.body;
        console.log(`🔑 [generateKeys]   Election: ${election_id}`);

        const election = await Election.findById(election_id);
        if (!election) {
            console.log('🔑 [generateKeys] ❌ Election not found');
            return res.status(404).json({ status: 'error', message: 'Election not found' });
        }

        const { privateKey, publicKeyHash } = generateElectionKeyPair();
        console.log('🔑 [generateKeys]   Key pair generated');

        const masterKey = process.env.VOTE_ENCRYPTION_KEY;
        const encryptedPrivate = encrypt({ key: privateKey }, masterKey);

        await CryptoKey.findOneAndUpdate(
            { election_id },
            {
                election_id,
                public_key_hash: publicKeyHash,
                encrypted_private_key: { iv: encryptedPrivate.iv, data: encryptedPrivate.encryptedData },
                generated_by: req.user._id,
                status: 'active',
            },
            { upsert: true, new: true }
        );

        election.public_key_hash = publicKeyHash;
        await election.save();

        await AuditLog.create({
            action: 'GENERATE_ELECTION_KEYS',
            performed_by: req.user._id,
            target_type: 'election',
            target_id: election_id,
            ip_address: req.ip,
        });

        console.log('🔑 [generateKeys] ✅ Keys generated and stored');
        res.status(200).json({
            status: 'success',
            message: 'Election keys generated',
            data: { public_key_hash: publicKeyHash },
        });
    } catch (error) {
        console.error('🔑 [generateKeys] ❌ Error:', error.message);
        res.status(500).json({ status: 'error', message: 'Failed to generate keys' });
    }
};

/**
 * POST /api/admin/crypto/close-election
 */
const closeAndEnableDecryption = async (req, res) => {
    console.log('🔐 [closeAndEnableDecryption] ▶ Closing and enabling decryption');
    try {
        const { election_id } = req.body;

        const election = await Election.findById(election_id);
        if (!election) {
            console.log('🔐 [closeAndEnableDecryption] ❌ Election not found');
            return res.status(404).json({ status: 'error', message: 'Election not found' });
        }
        if (election.status !== 'closed') {
            console.log('🔐 [closeAndEnableDecryption] ❌ Election status is not closed');
            return res.status(400).json({ status: 'error', message: 'Election must be closed first' });
        }

        const cryptoKey = await CryptoKey.findOne({ election_id });
        if (!cryptoKey) {
            console.log('🔐 [closeAndEnableDecryption] ❌ No keys found');
            return res.status(404).json({ status: 'error', message: 'No keys found for this election' });
        }

        cryptoKey.status = 'used_for_decryption';
        cryptoKey.decryption_enabled_at = new Date();
        cryptoKey.decryption_enabled_by = req.user._id;
        await cryptoKey.save();

        await AuditLog.create({
            action: 'ENABLE_DECRYPTION',
            performed_by: req.user._id,
            target_type: 'election',
            target_id: election_id,
            ip_address: req.ip,
        });

        console.log('🔐 [closeAndEnableDecryption] ✅ Decryption enabled');
        res.status(200).json({
            status: 'success',
            message: 'Decryption enabled. Results can now be computed.',
        });
    } catch (error) {
        console.error('🔐 [closeAndEnableDecryption] ❌ Error:', error.message);
        res.status(500).json({ status: 'error', message: 'Failed to enable decryption' });
    }
};

/**
 * DELETE /api/admin/elections/:id
 * Only allowed for draft/scheduled/closed elections (not live or results_published).
 */
const deleteElection = async (req, res) => {
    console.log(`🗑️ [deleteElection] ▶ Deleting election ${req.params.id}`);
    try {
        const election = await Election.findById(req.params.id);
        if (!election) {
            console.log('🗑️ [deleteElection] ❌ Election not found');
            return res.status(404).json({ status: 'error', message: 'Election not found' });
        }

        if (election.status === 'live') {
            console.log('🗑️ [deleteElection] ❌ Cannot delete a live election');
            return res.status(400).json({ status: 'error', message: 'Cannot delete a live election. Close it first.' });
        }
        if (election.status === 'results_published') {
            console.log('🗑️ [deleteElection] ❌ Cannot delete after results published');
            return res.status(400).json({ status: 'error', message: 'Cannot delete an election after results are published.' });
        }

        // Delete associated candidates
        const deletedCandidates = await Candidate.deleteMany({ election_id: election._id });
        console.log(`🗑️ [deleteElection]   Removed ${deletedCandidates.deletedCount} candidates`);

        await Election.findByIdAndDelete(req.params.id);
        console.log('🗑️ [deleteElection]   Election deleted from DB');

        await AuditLog.create({
            action: 'DELETE_ELECTION',
            performed_by: req.user._id,
            target_type: 'election',
            target_id: req.params.id,
            details: { name: election.name, status: election.status },
            ip_address: req.ip,
            user_agent: req.get('user-agent'),
        });
        console.log('🗑️ [deleteElection] ✅ Election deleted successfully');

        res.status(200).json({ status: 'success', message: 'Election deleted' });
    } catch (error) {
        console.error('🗑️ [deleteElection] ❌ Error:', error.message);
        res.status(500).json({ status: 'error', message: 'Failed to delete election' });
    }
};

module.exports = {
    createElection, getElections, updateElection, updateElectionStatus, deleteElection,
    addCandidate, getCandidates, deleteCandidate,
    getRealtimeStats, getDuplicateFlags, getWarnings, addWarning, resolveWarning,
    getComplaints, updateComplaintStatus, getAuditLogs,
    generateKeys, closeAndEnableDecryption,
};
