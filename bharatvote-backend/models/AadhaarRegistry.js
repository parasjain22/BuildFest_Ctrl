const mongoose = require('mongoose');

/**
 * AadhaarRegistry — Mock government Aadhaar database.
 * Stores SHA-256 hashed Aadhaar numbers (never raw).
 * Only Aadhaar numbers present in this collection are considered valid for registration.
 */
const aadhaarRegistrySchema = new mongoose.Schema({
    aadhaar_hash: {
        type: String,
        required: true,
        unique: true,
    },
    region: {
        type: String,
        default: 'India',
    },
    is_active: {
        type: Boolean,
        default: true,
    },
}, {
    timestamps: true,
});

module.exports = mongoose.model('AadhaarRegistry', aadhaarRegistrySchema);
