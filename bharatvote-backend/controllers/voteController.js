const { v4: uuidv4 } = require('uuid');
const crypto = require('crypto');
const Session = require('../models/Session');
const Vote = require('../models/Vote');
const Election = require('../models/Election');
const User = require('../models/User');
const { encrypt } = require('../utils/encryption');
const { generateLeafHash, getMerkleRoot } = require('../utils/merkleTree');
const { hashWithSalt, generateNullifier } = require('../utils/hash');
const { generateReceiptPDF, generateShareData } = require('../utils/receiptGenerator');
const { sendReceiptEmail } = require('../utils/emailService');

/**
 * POST /api/vote/session
 * Create a 1-minute voting session.
 */
const createSession = async (req, res) => {
    console.log('🗳️ [createSession] ▶ Creating voting session');
    try {
        const { election_id } = req.body;
        console.log(`🗳️ [createSession]   Election: ${election_id}, User: ${req.user._id}`);
        const user = req.user;

        // Check election exists and is live
        const election = await Election.findById(election_id);
        if (!election || election.status !== 'live') {
            return res.status(400).json({ status: 'error', message: 'No active election found' });
        }

        // Check if user already voted in this election
        if (user.has_voted) {
            return res.status(409).json({ status: 'error', message: 'You have already voted in this election' });
        }

        // Check if user is blocked
        if (user.blocked) {
            return res.status(401).json({ status: 'error', message: 'Your account is blocked for this election' });
        }

        // Check for existing active session
        const existingSession = await Session.findOne({
            user_id: user._id,
            election_id,
            status: 'active',
        });
        if (existingSession) {
            return res.status(409).json({
                status: 'error',
                message: 'You already have an active voting session',
                session_id: existingSession.session_id,
                expires_at: existingSession.expires_at,
            });
        }

        // Create session
        const session_id = uuidv4();
        const duration = election.settings.vote_duration_seconds || 60;
        const expires_at = new Date(Date.now() + duration * 1000);

        const session = await Session.create({
            session_id,
            user_id: user._id,
            election_id,
            voter_commitment: user.commitment,
            expires_at,
        });

        console.log(`🗳️ [createSession] ✅ Session created: ${session_id}, expires: ${expires_at}`);
        res.status(201).json({
            status: 'success',
            message: 'Voting session created',
            data: {
                session_id: session.session_id,
                election_id,
                duration_seconds: duration,
                expires_at: session.expires_at,
            },
        });
    } catch (error) {
        console.error('🗳️ [createSession] ❌ Error:', error.message);
        res.status(500).json({ status: 'error', message: 'Failed to create session: ' + error.message });
    }
};

/**
 * POST /api/vote/cast
 * Cast an encrypted vote.
 */
const castVote = async (req, res) => {
    console.log('🗳️ [castVote] ▶ Vote casting attempt');
    try {
        const { candidate_id, session_id, election_id, location_tag } = req.body;
        console.log(`🗳️ [castVote]   Candidate: ${candidate_id}, Session: ${session_id}`);
        const user = req.user;

        // Validate session
        const session = await Session.findOne({ session_id, user_id: user._id });
        if (!session) {
            return res.status(404).json({ status: 'error', message: 'Session not found' });
        }
        if (session.status !== 'active') {
            return res.status(403).json({ status: 'error', message: 'Session is no longer active' });
        }
        if (session.expires_at < new Date()) {
            session.status = 'expired';
            await session.save();
            return res.status(403).json({ status: 'error', message: 'Session expired' });
        }
        if (session.violation_count >= 2) {
            return res.status(400).json({ status: 'error', message: 'Session invalidated due to violations' });
        }

        // Validate election exists and is live
        if (!election_id) {
            return res.status(400).json({ status: 'error', message: 'election_id is required' });
        }
        const electionCheck = await Election.findById(election_id);
        if (!electionCheck) {
            return res.status(404).json({ status: 'error', message: 'Election not found' });
        }
        if (electionCheck.status !== 'live') {
            return res.status(403).json({ status: 'error', message: 'Election is not currently live. Voting is not allowed.' });
        }

        // Generate nullifier for duplicate prevention
        const nullifier = generateNullifier(user.commitment, election_id);
        const existingVote = await Vote.findOne({ nullifier });
        if (existingVote) {
            return res.status(409).json({ status: 'error', message: 'Duplicate vote detected' });
        }

        // Encrypt vote
        const voteData = {
            voter_id: user._id,
            candidate_id,
            election_id,
            session_id,
            timestamp: new Date().toISOString(),
        };
        const encryptedVote = encrypt(voteData);

        // Generate leaf hash for Merkle tree
        const leaf_hash = generateLeafHash(encryptedVote.encryptedData, session_id);

        // Generate vote hash and receipt
        const vote_hash = crypto.createHash('sha256').update(JSON.stringify(voteData) + Date.now()).digest('hex');
        const receipt_id = `BV-${Date.now().toString(36).toUpperCase()}`;

        // Get voter number
        const election = await Election.findById(election_id);
        const voter_number = (election.total_votes_cast || 0) + 1;

        // Store vote (append-only)
        const vote = await Vote.create({
            election_id,
            nullifier,
            encrypted_vote: { iv: encryptedVote.iv, data: encryptedVote.encryptedData },
            leaf_hash,
            receipt_id,
            vote_hash,
            voter_number,
            constituency: user.constituency,
            location_tag,
        });

        // Update Merkle tree
        election.merkle_leaves.push(leaf_hash);
        election.merkle_root = getMerkleRoot(election.merkle_leaves);
        election.total_votes_cast = voter_number;

        // Blockchain-style log entry
        const prev = election.blockchain_log.length > 0
            ? election.blockchain_log[election.blockchain_log.length - 1]
            : null;
        const previous_hash = prev ? prev.current_hash : '0'.repeat(64);
        const current_hash = crypto.createHash('sha256')
            .update(previous_hash + election.merkle_root + Date.now().toString())
            .digest('hex');

        election.blockchain_log.push({
            block_id: (prev ? prev.block_id + 1 : 1),
            previous_hash,
            current_hash,
            merkle_root: election.merkle_root,
            vote_count: voter_number,
        });

        await election.save();

        // Mark session as completed
        session.status = 'completed';
        session.has_voted = true;
        await session.save();

        // Mark user as voted
        user.has_voted = true;
        await user.save();

        console.log(`🗳️ [castVote] ✅ Vote cast! Receipt: ${receipt_id}, Voter #${voter_number}`);
        res.status(201).json({
            status: 'success',
            message: 'Vote cast successfully',
            data: {
                receipt_id,
                vote_hash,
                merkle_root: election.merkle_root,
                voter_number,
                timestamp: vote.timestamp,
                election_name: election.name,
            },
        });
    } catch (error) {
        console.error('🗳️ [castVote] ❌ Error:', error.message);
        res.status(500).json({ status: 'error', message: 'Failed to cast vote: ' + error.message });
    }
};

/**
 * POST /api/vote/violation
 * Report a behavior violation.
 */
const reportViolation = async (req, res) => {
    console.log('🚨 [reportViolation] ▶ Behavior violation reported');
    try {
        const { session_id, violation_type } = req.body;
        console.log(`🚨 [reportViolation]   Session: ${session_id}, Type: ${violation_type}`);

        const session = await Session.findOne({ session_id, user_id: req.user._id });
        if (!session) {
            return res.status(404).json({ status: 'error', message: 'Session not found' });
        }

        session.violation_count += 1;
        session.behavior_flag = true;
        session.violations.push({ type: violation_type });

        if (violation_type === 'camera_disabled') session.camera_active = false;
        if (violation_type === 'microphone_disabled') session.microphone_active = false;
        if (violation_type === 'location_disabled') session.location_active = false;

        // First violation: terminate session
        if (session.violation_count === 1) {
            session.status = 'terminated';
            await session.save();
            return res.status(400).json({
                status: 'warning',
                message: 'Session terminated due to violation. You can restart.',
                violation_count: session.violation_count,
            });
        }

        // Second violation: block voter for this election
        if (session.violation_count >= 2) {
            session.status = 'terminated';
            await session.save();

            const user = await User.findById(req.user._id);
            user.blocked = true;
            user.violation_count += 1;
            await user.save();

            // Log to election warnings
            const election = await Election.findById(session.election_id);
            if (election) {
                election.warnings.push({
                    type: 'voter_blocked',
                    message: `Voter ${user.voter_id} blocked after multiple violations`,
                });
                await election.save();
            }

            return res.status(401).json({
                status: 'blocked',
                message: 'You have been blocked from this election due to suspicious activity.',
            });
        }

        await session.save();
        res.status(200).json({ status: 'warning', message: 'Violation recorded', violation_count: session.violation_count });
    } catch (error) {
        console.error('Violation error:', error);
        res.status(500).json({ status: 'error', message: 'Failed to report violation' });
    }
};

/**
 * GET /api/vote/receipt/:id
 * Get receipt data.
 */
const getReceipt = async (req, res) => {
    console.log(`🧾 [getReceipt] ▶ Receipt lookup: ${req.params.id}`);
    try {
        const vote = await Vote.findOne({ receipt_id: req.params.id });
        if (!vote) {
            return res.status(404).json({ status: 'error', message: 'Receipt not found' });
        }

        const election = await Election.findById(vote.election_id);

        res.status(200).json({
            status: 'success',
            data: {
                receipt_id: vote.receipt_id,
                vote_hash: vote.vote_hash,
                voter_number: vote.voter_number,
                merkle_root: election ? election.merkle_root : null,
                timestamp: vote.timestamp,
                election_name: election ? election.name : 'Unknown',
            },
        });
    } catch (error) {
        console.error('Get receipt error:', error);
        res.status(500).json({ status: 'error', message: 'Failed to get receipt' });
    }
};

/**
 * GET /api/vote/receipt/:id/download
 * Download receipt as PDF.
 */
const downloadReceipt = async (req, res) => {
    console.log(`📥 [downloadReceipt] ▶ PDF download: ${req.params.id}`);
    try {
        const vote = await Vote.findOne({ receipt_id: req.params.id });
        if (!vote) {
            return res.status(404).json({ status: 'error', message: 'Receipt not found' });
        }

        const election = await Election.findById(vote.election_id);

        const receiptData = {
            receiptId: vote.receipt_id,
            voteHash: vote.vote_hash,
            voterNumber: vote.voter_number,
            merkleRoot: election ? election.merkle_root : '',
            timestamp: vote.timestamp,
            electionName: election ? election.name : 'Election',
        };

        const pdfBuffer = await generateReceiptPDF(receiptData);

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=BharatVote-Receipt-${vote.receipt_id}.pdf`);
        res.send(pdfBuffer);
    } catch (error) {
        console.error('Download receipt error:', error);
        res.status(500).json({ status: 'error', message: 'Failed to generate receipt PDF' });
    }
};

/**
 * POST /api/vote/receipt/:id/email
 * Email receipt to voter.
 */
const emailReceipt = async (req, res) => {
    console.log(`📧 [emailReceipt] ▶ Email receipt: ${req.params.id}`);
    try {
        const { email } = req.body;
        const vote = await Vote.findOne({ receipt_id: req.params.id });
        if (!vote) {
            return res.status(404).json({ status: 'error', message: 'Receipt not found' });
        }

        const election = await Election.findById(vote.election_id);
        const receiptData = {
            receiptId: vote.receipt_id,
            voteHash: vote.vote_hash,
            voterNumber: vote.voter_number,
            merkleRoot: election ? election.merkle_root : '',
            timestamp: vote.timestamp,
            electionName: election ? election.name : 'Election',
        };

        const pdfBuffer = await generateReceiptPDF(receiptData);
        await sendReceiptEmail(email, receiptData, pdfBuffer);

        res.status(200).json({ status: 'success', message: 'Receipt sent to email' });
    } catch (error) {
        console.error('Email receipt error:', error);
        res.status(500).json({ status: 'error', message: 'Failed to send receipt email' });
    }
};

/**
 * GET /api/vote/receipt/:id/share
 * Get social media share data.
 */
const getShareData = async (req, res) => {
    console.log(`🔗 [getShareData] ▶ Share data: ${req.params.id}`);
    try {
        const vote = await Vote.findOne({ receipt_id: req.params.id });
        if (!vote) {
            return res.status(404).json({ status: 'error', message: 'Receipt not found' });
        }

        const election = await Election.findById(vote.election_id);
        const shareData = generateShareData({
            receiptId: vote.receipt_id,
            voterNumber: vote.voter_number,
            electionName: election ? election.name : 'the election',
        });

        res.status(200).json({ status: 'success', data: shareData });
    } catch (error) {
        console.error('Share data error:', error);
        res.status(500).json({ status: 'error', message: 'Failed to generate share data' });
    }
};

module.exports = { createSession, castVote, reportViolation, getReceipt, downloadReceipt, emailReceipt, getShareData };
