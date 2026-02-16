const mongoose = require('mongoose');

const sessionSchema = new mongoose.Schema({
    session_id: {
        type: String,
        required: true,
        unique: true,
    },
    user_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    election_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Election',
        required: true,
    },
    voter_commitment: String,
    start_time: {
        type: Date,
        default: Date.now,
    },
    expires_at: {
        type: Date,
        required: true,
    },
    // Behavior monitoring
    behavior_flag: {
        type: Boolean,
        default: false,
    },
    violation_count: {
        type: Number,
        default: 0,
    },
    violations: [{
        type: { type: String },
        timestamp: { type: Date, default: Date.now },
    }],
    // Media verification flags
    camera_active: { type: Boolean, default: true },
    microphone_active: { type: Boolean, default: true },
    location_active: { type: Boolean, default: true },
    // Status
    status: {
        type: String,
        enum: ['active', 'completed', 'expired', 'terminated'],
        default: 'active',
    },
    has_voted: {
        type: Boolean,
        default: false,
    },
}, {
    timestamps: true,
});

// Non-unique indexes only (unique indexes created by unique:true on schema fields)
sessionSchema.index({ user_id: 1, election_id: 1 });
sessionSchema.index({ expires_at: 1 }, { expireAfterSeconds: 600 }); // cleanup after 10 min

module.exports = mongoose.model('Session', sessionSchema);
