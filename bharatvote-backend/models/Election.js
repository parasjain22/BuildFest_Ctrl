const mongoose = require('mongoose');

const electionSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true,
    },
    description: {
        type: String,
        trim: true,
    },
    status: {
        type: String,
        enum: ['draft', 'scheduled', 'live', 'closed', 'results_published'],
        default: 'draft',
    },
    timeline: {
        registration_start: Date,
        registration_end: Date,
        voting_start: Date,
        voting_end: Date,
        result_date: Date,
    },
    settings: {
        allow_registration: { type: Boolean, default: true },
        voting_started: { type: Boolean, default: false },
        is_active: { type: Boolean, default: false },
        vote_duration_seconds: { type: Number, default: 60 },
    },
    // Merkle tree root for tamper evidence
    merkle_root: {
        type: String,
        default: null,
    },
    // All leaf hashes for rebuilding tree
    merkle_leaves: [{
        type: String,
    }],
    // Blockchain-style append-only log
    blockchain_log: [{
        block_id: Number,
        previous_hash: String,
        current_hash: String,
        merkle_root: String,
        timestamp: { type: Date, default: Date.now },
        vote_count: Number,
    }],
    // Stats
    total_registered: { type: Number, default: 0 },
    total_votes_cast: { type: Number, default: 0 },
    total_verified: { type: Number, default: 0 },
    // Crypto keys
    public_key_hash: String,
    // Warnings and flags
    warnings: [{
        type: { type: String },
        message: String,
        timestamp: { type: Date, default: Date.now },
        resolved: { type: Boolean, default: false },
    }],
    // Constituencies
    constituencies: [String],
    created_by: {
        type: mongoose.Schema.Types.Mixed,
    },
}, {
    timestamps: true,
});

module.exports = mongoose.model('Election', electionSchema);
