const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema({
    action: {
        type: String,
        required: true,
    },
    performed_by: {
        type: mongoose.Schema.Types.Mixed,
    },
    target_type: {
        type: String,
        enum: ['election', 'candidate', 'user', 'vote', 'result', 'system'],
    },
    target_id: String,
    details: mongoose.Schema.Types.Mixed,
    ip_address: String,
    user_agent: String,
    timestamp: {
        type: Date,
        default: Date.now,
    },
}, {
    timestamps: true,
});

// Append-only: no updates or deletes
auditLogSchema.pre('findOneAndUpdate', function () {
    throw new Error('Audit logs cannot be modified');
});
auditLogSchema.pre('findOneAndDelete', function () {
    throw new Error('Audit logs cannot be deleted');
});

auditLogSchema.index({ timestamp: -1 });
auditLogSchema.index({ performed_by: 1 });

module.exports = mongoose.model('AuditLog', auditLogSchema);
