const mongoose = require('mongoose');

const resultSchema = new mongoose.Schema({
    election_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Election',
        required: true,
        unique: true,
    },
    // Published by admin (with identity re-verification)
    published_by: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    published_at: {
        type: Date,
        default: Date.now,
    },
    // Digital signature (simulated)
    digital_signature: {
        signer_id: String,
        signature_hash: String,
        signed_at: Date,
    },
    // Consolidated results
    total_voters_registered: Number,
    total_votes_cast: Number,
    turnout_percentage: Number,
    // Per-constituency results
    constituency_results: [{
        constituency: String,
        total_votes: Number,
        candidates: [{
            candidate_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Candidate' },
            name: String,
            party: String,
            symbol: String,
            votes: Number,
            vote_percentage: Number,
            is_winner: { type: Boolean, default: false },
        }],
        winner: {
            name: String,
            party: String,
            votes: Number,
        },
    }],
    // Overall winner
    winning_party: String,
    winning_seats: Number,
    // Official statement
    official_statement: String,
    // Merkle root at time of result
    final_merkle_root: String,
    // Status
    status: {
        type: String,
        enum: ['draft', 'published', 'certified'],
        default: 'draft',
    },
}, {
    timestamps: true,
});

module.exports = mongoose.model('Result', resultSchema);
