const mongoose = require('mongoose');

const cryptoKeySchema = new mongoose.Schema({
    election_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Election',
        required: true,
        unique: true,
    },
    // Public key hash (derived from private key)
    public_key_hash: {
        type: String,
        required: true,
    },
    // Private key (encrypted at rest — simulated HSM)
    encrypted_private_key: {
        iv: String,
        data: String,
    },
    // Key status
    status: {
        type: String,
        enum: ['active', 'used_for_decryption', 'revoked'],
        default: 'active',
    },
    generated_by: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
    },
    generated_at: {
        type: Date,
        default: Date.now,
    },
    decryption_enabled_at: Date,
    decryption_enabled_by: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
    },
}, {
    timestamps: true,
});

module.exports = mongoose.model('CryptoKey', cryptoKeySchema);
