const mongoose = require('mongoose');

const voteSchema = new mongoose.Schema({
    election_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Election',
        required: true,
    },
    // Nullifier for duplicate prevention: hash(secret + election_id)
    nullifier: {
        type: String,
        required: true,
        unique: true,
    },
    // Encrypted vote blob (AES-256)
    encrypted_vote: {
        iv: { type: String, required: true },
        data: { type: String, required: true },
    },
    // Merkle tree leaf hash
    leaf_hash: {
        type: String,
        required: true,
    },
    // Receipt
    receipt_id: {
        type: String,
        required: true,
        unique: true,
    },
    vote_hash: {
        type: String,
        required: true,
    },
    voter_number: {
        type: Number,
        required: true,
    },
    // Metadata (no identity info!)
    constituency: String,
    location_tag: String,
    timestamp: {
        type: Date,
        default: Date.now,
    },
}, {
    timestamps: true,
});

// Append-only: prevent updates and deletes
voteSchema.pre('findOneAndUpdate', function () {
    throw new Error('Vote records cannot be updated');
});
voteSchema.pre('findOneAndDelete', function () {
    throw new Error('Vote records cannot be deleted');
});
voteSchema.pre('deleteOne', function () {
    throw new Error('Vote records cannot be deleted');
});

// Non-unique indexes only (unique indexes created by unique:true on schema fields)
voteSchema.index({ election_id: 1 });

module.exports = mongoose.model('Vote', voteSchema);
