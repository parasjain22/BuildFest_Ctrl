const mongoose = require('mongoose');

const otpSchema = new mongoose.Schema({
    aadhaar_hash: {
        type: String,
        required: true,
    },
    otp_hash: {
        type: String,
        required: true,
    },
    attempts: {
        type: Number,
        default: 0,
    },
    max_attempts: {
        type: Number,
        default: 3,
    },
    locked_until: {
        type: Date,
        default: null,
    },
    expires_at: {
        type: Date,
        required: true,
    },
}, {
    timestamps: true,
});

// Auto-delete expired OTPs after 10 minutes
otpSchema.index({ expires_at: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model('OTP', otpSchema);
