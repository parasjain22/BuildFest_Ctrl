const Election = require('../models/Election');
const Vote = require('../models/Vote');
const { verifyLeaf } = require('../utils/merkleTree');

/**
 * GET /api/audit/stats
 * Public election statistics.
 */
const getStats = async (req, res) => {
    console.log('📊 [getStats] ▶ Fetching audit statistics');
    try {
        const election = await Election.findOne({ status: { $in: ['live', 'closed', 'results_published'] } })
            .sort({ updatedAt: -1 });

        if (!election) {
            return res.status(200).json({
                status: 'success',
                data: { total_votes: 0, total_verified: 0, processing: 0, constituencies: 0 },
            });
        }

        console.log(`📊 [getStats] ✅ Election: ${election.name}, Votes: ${election.total_votes_cast}`);
        res.status(200).json({
            status: 'success',
            data: {
                election_name: election.name,
                total_votes: election.total_votes_cast,
                total_registered: election.total_registered,
                total_verified: election.total_verified || election.total_votes_cast,
                processing: Math.max(0, election.total_votes_cast - (election.total_verified || election.total_votes_cast)),
                constituencies: election.constituencies ? election.constituencies.length : 0,
                status: election.status,
            },
        });
    } catch (error) {
        console.error('Get stats error:', error);
        res.status(500).json({ status: 'error', message: 'Failed to get statistics' });
    }
};

/**
 * GET /api/audit/verify/:receiptId
 * Verify a vote receipt in the Merkle tree.
 */
const verifyReceipt = async (req, res) => {
    console.log(`🔍 [verifyReceipt] ▶ Verifying receipt: ${req.params.receiptId}`);
    try {
        const { receiptId } = req.params;

        const vote = await Vote.findOne({ receipt_id: receiptId });
        if (!vote) {
            return res.status(404).json({
                status: 'failed',
                message: 'Receipt not found. It may be invalid or a fake receipt.',
                verified: false,
            });
        }

        const election = await Election.findById(vote.election_id);
        if (!election) {
            return res.status(404).json({ status: 'failed', message: 'Election not found', verified: false });
        }

        // Verify leaf in Merkle tree
        const isValid = verifyLeaf(vote.leaf_hash, election.merkle_leaves);

        console.log(`🔍 [verifyReceipt] ${isValid ? '✅' : '❌'} Verification result: ${isValid}`);
        res.status(200).json({
            status: isValid ? 'success' : 'failed',
            message: isValid ? 'Vote found in Merkle tree' : 'Vote could not be verified',
            verified: isValid,
            data: isValid ? {
                receipt_id: vote.receipt_id,
                voter_number: vote.voter_number,
                timestamp: vote.timestamp,
                merkle_root: election.merkle_root,
            } : null,
        });
    } catch (error) {
        console.error('Verify receipt error:', error);
        res.status(500).json({ status: 'error', message: 'Verification failed' });
    }
};

/**
 * GET /api/audit/merkle-root
 * Get current Merkle root.
 */
const getMerkleRootData = async (req, res) => {
    console.log('🌳 [getMerkleRoot] ▶ Fetching Merkle root');
    try {
        const election = await Election.findOne({ status: { $in: ['live', 'closed', 'results_published'] } })
            .sort({ updatedAt: -1 });

        res.status(200).json({
            status: 'success',
            data: {
                merkle_root: election ? election.merkle_root : null,
                total_leaves: election ? election.merkle_leaves.length : 0,
                election_name: election ? election.name : null,
                last_updated: election ? election.updatedAt : null,
            },
        });
    } catch (error) {
        console.error('Get Merkle root error:', error);
        res.status(500).json({ status: 'error', message: 'Failed to get Merkle root' });
    }
};

/**
 * GET /api/audit/timeline
 * Get election timeline events.
 */
const getTimeline = async (req, res) => {
    console.log('📅 [getTimeline] ▶ Fetching election timeline');
    try {
        const election = await Election.findOne({ status: { $in: ['live', 'closed', 'results_published'] } })
            .sort({ updatedAt: -1 });

        if (!election) {
            return res.status(200).json({ status: 'success', data: [] });
        }

        const timeline = [];
        const t = election.timeline || {};

        if (t.registration_start) timeline.push({ event: 'Registration Started', date: t.registration_start, status: 'completed' });
        if (t.registration_end) timeline.push({ event: 'Registration Ended', date: t.registration_end, status: t.registration_end < new Date() ? 'completed' : 'upcoming' });
        if (t.voting_start) timeline.push({ event: 'Polling Started', date: t.voting_start, status: t.voting_start < new Date() ? 'completed' : 'upcoming' });
        if (t.voting_end) timeline.push({ event: 'Polling Ended', date: t.voting_end, status: t.voting_end < new Date() ? 'completed' : 'active' });
        if (election.merkle_root) timeline.push({ event: 'Merkle Root Published', date: election.updatedAt, status: 'completed' });
        if (election.status === 'results_published') timeline.push({ event: 'Results Announced', date: t.result_date || election.updatedAt, status: 'completed' });

        res.status(200).json({ status: 'success', data: timeline });
    } catch (error) {
        console.error('Get timeline error:', error);
        res.status(500).json({ status: 'error', message: 'Failed to get timeline' });
    }
};

module.exports = { getStats, verifyReceipt, getMerkleRootData, getTimeline };
