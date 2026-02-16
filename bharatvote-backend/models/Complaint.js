const mongoose = require('mongoose');

const complaintSchema = new mongoose.Schema({
    complaint_id: {
        type: String,
        required: true,
        unique: true,
    },
    category: {
        type: String,
        enum: ['voting', 'aadhaar', 'technical', 'coercion', 'other'],
        required: true,
    },
    description: {
        type: String,
        required: true,
        trim: true,
    },
    email: {
        type: String,
        required: true,
        trim: true,
        lowercase: true,
    },
    attachment_path: String,
    status: {
        type: String,
        enum: ['pending', 'in_progress', 'resolved', 'dismissed'],
        default: 'pending',
    },
    admin_notes: String,
    is_priority: {
        type: Boolean,
        default: false,
    },
}, {
    timestamps: true,
});

// Auto-flag coercion complaints as priority
complaintSchema.pre('save', function (next) {
    if (this.category === 'coercion') {
        this.is_priority = true;
    }
    next();
});

module.exports = mongoose.model('Complaint', complaintSchema);
