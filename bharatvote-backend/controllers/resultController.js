const crypto = require('crypto');
const Election = require('../models/Election');
const Candidate = require('../models/Candidate');
const Vote = require('../models/Vote');
const Result = require('../models/Result');
const CryptoKey = require('../models/CryptoKey');
const AuditLog = require('../models/AuditLog');
const { decrypt } = require('../utils/encryption');
const { hashWithSalt } = require('../utils/hash');

/**
 * POST /api/results/publish
 * Admin publishes election results (requires identity re-verification).
 */
const publishResults = async (req, res) => {
    console.log('📊 [publishResults] ▶ Publishing election results');
    try {
        const { election_id, official_statement, admin_aadhaar } = req.body;

        // Re-verify admin identity
        if (!admin_aadhaar) {
            return res.status(400).json({ status: 'error', message: 'Admin identity verification required to publish results' });
        }

        const adminAadhaarHash = hashWithSalt(admin_aadhaar);
        if (req.user.aadhaar_hash && req.user.aadhaar_hash !== adminAadhaarHash) {
            return res.status(401).json({ status: 'error', message: 'Admin identity verification failed' });
        }

        // Get election
        const election = await Election.findById(election_id);
        if (!election) return res.status(404).json({ status: 'error', message: 'Election not found' });
        if (election.status !== 'closed') {
            return res.status(400).json({ status: 'error', message: 'Election must be closed before publishing results' });
        }

        // Check decryption is enabled
        const cryptoKey = await CryptoKey.findOne({ election_id });
        if (!cryptoKey || cryptoKey.status !== 'used_for_decryption') {
            return res.status(400).json({ status: 'error', message: 'Decryption must be enabled first' });
        }

        // Decrypt private key
        const masterKey = process.env.VOTE_ENCRYPTION_KEY;
        const decryptedKeyData = decrypt(cryptoKey.encrypted_private_key.data, cryptoKey.encrypted_private_key.iv, masterKey);
        const privateKey = decryptedKeyData.key;

        // Decrypt and tally all votes
        const votes = await Vote.find({ election_id });
        const tally = {};

        for (const vote of votes) {
            try {
                const decryptedVote = decrypt(vote.encrypted_vote.data, vote.encrypted_vote.iv, privateKey);
                const candidateId = decryptedVote.candidate_id;
                tally[candidateId] = (tally[candidateId] || 0) + 1;
            } catch {
                // Skip votes that can't be decrypted (shouldn't happen)
                console.warn(`Could not decrypt vote ${vote._id}`);
            }
        }

        // Build per-constituency results
        const candidates = await Candidate.find({ election_id });
        const constituencyMap = {};

        for (const candidate of candidates) {
            if (!constituencyMap[candidate.constituency]) {
                constituencyMap[candidate.constituency] = { constituency: candidate.constituency, total_votes: 0, candidates: [] };
            }

            const voteCount = tally[candidate._id.toString()] || 0;
            constituencyMap[candidate.constituency].total_votes += voteCount;
            constituencyMap[candidate.constituency].candidates.push({
                candidate_id: candidate._id,
                name: candidate.name,
                party: candidate.party,
                symbol: candidate.symbol,
                votes: voteCount,
                vote_percentage: 0,
                is_winner: false,
            });
        }

        // Calculate percentages and determine winners
        const constituency_results = [];
        const partySeats = {};

        for (const key of Object.keys(constituencyMap)) {
            const cr = constituencyMap[key];

            // Calculate percentages
            cr.candidates.forEach((c) => {
                c.vote_percentage = cr.total_votes > 0 ? parseFloat(((c.votes / cr.total_votes) * 100).toFixed(1)) : 0;
            });

            // Sort by votes and determine winner
            cr.candidates.sort((a, b) => b.votes - a.votes);
            if (cr.candidates.length > 0 && cr.candidates[0].votes > 0) {
                cr.candidates[0].is_winner = true;
                cr.winner = { name: cr.candidates[0].name, party: cr.candidates[0].party, votes: cr.candidates[0].votes };
                partySeats[cr.candidates[0].party] = (partySeats[cr.candidates[0].party] || 0) + 1;
            }

            constituency_results.push(cr);
        }

        // Determine overall winning party
        let winningParty = '';
        let maxSeats = 0;
        for (const [party, seats] of Object.entries(partySeats)) {
            if (seats > maxSeats) {
                maxSeats = seats;
                winningParty = party;
            }
        }

        // Digital signature (simulated)
        const signaturePayload = JSON.stringify({ election_id, total_votes: votes.length, merkle_root: election.merkle_root, timestamp: new Date() });
        const signature_hash = crypto.createHmac('sha256', process.env.JWT_SECRET).update(signaturePayload).digest('hex');

        // Create result
        const result = await Result.create({
            election_id,
            published_by: req.user._id,
            digital_signature: {
                signer_id: req.user._id.toString(),
                signature_hash,
                signed_at: new Date(),
            },
            total_voters_registered: election.total_registered,
            total_votes_cast: votes.length,
            turnout_percentage: election.total_registered > 0 ? parseFloat(((votes.length / election.total_registered) * 100).toFixed(1)) : 0,
            constituency_results,
            winning_party: winningParty,
            winning_seats: maxSeats,
            official_statement: official_statement || `Official election results for ${election.name}, digitally signed by Election Commission of India.`,
            final_merkle_root: election.merkle_root,
            status: 'published',
        });

        // Update election status
        election.status = 'results_published';
        election.timeline.result_date = new Date();
        await election.save();

        // Update candidate vote counts
        for (const candidate of candidates) {
            candidate.vote_count = tally[candidate._id.toString()] || 0;
            await candidate.save();
        }

        await AuditLog.create({
            action: 'PUBLISH_RESULTS',
            performed_by: req.user._id,
            target_type: 'result',
            target_id: result._id.toString(),
            details: { election_name: election.name, total_votes: votes.length },
            ip_address: req.ip,
        });

        console.log('📊 [publishResults] ✅ Results published successfully');
        res.status(201).json({ status: 'success', message: 'Results published successfully', data: result });
    } catch (error) {
        console.error('Publish results error:', error);
        res.status(500).json({ status: 'error', message: 'Failed to publish results: ' + error.message });
    }
};

/**
 * GET /api/results/:electionId
 * Public: Get published results.
 */
const getResults = async (req, res) => {
    console.log(`📊 [getResults] ▶ Fetching results for election: ${req.params.electionId}`);
    try {
        const result = await Result.findOne({ election_id: req.params.electionId, status: 'published' });
        if (!result) {
            return res.status(404).json({ status: 'error', message: 'Results not published yet' });
        }

        res.status(200).json({ status: 'success', data: result });
    } catch (error) {
        res.status(500).json({ status: 'error', message: 'Failed to get results' });
    }
};

/**
 * GET /api/results/:electionId/constituency
 * Public: Per-constituency results.
 */
const getConstituencyResults = async (req, res) => {
    console.log(`📊 [getConstituencyResults] ▶ Fetching constituency results: ${req.params.electionId}`);
    try {
        const result = await Result.findOne({ election_id: req.params.electionId, status: 'published' });
        if (!result) {
            return res.status(404).json({ status: 'error', message: 'Results not published yet' });
        }

        res.status(200).json({
            status: 'success',
            data: {
                constituency_results: result.constituency_results,
                winning_party: result.winning_party,
                winning_seats: result.winning_seats,
                total_votes_cast: result.total_votes_cast,
            },
        });
    } catch (error) {
        res.status(500).json({ status: 'error', message: 'Failed to get constituency results' });
    }
};

module.exports = { publishResults, getResults, getConstituencyResults };
