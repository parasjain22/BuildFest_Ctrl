const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Full name is required'],
        trim: true,
    },
    mobile_hash: {
        type: String,
        required: [true, 'Mobile number is required'],
        unique: true,
    },
    aadhaar_hash: {
        type: String,
        required: [true, 'Aadhaar number is required'],
        unique: true,
    },
    voter_id: {
        type: String,
        required: [true, 'Voter ID is required'],
        unique: true,
        trim: true,
    },
    aadhaar_image_path: {
        type: String,
        required: [true, 'Aadhaar card image is required'],
    },
    aadhaar_image_hash: {
        type: String,
        required: true,
    },
    user_image_path: {
        type: String,
        required: [true, 'User photo is required'],
    },
    user_image_hash: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        trim: true,
        lowercase: true,
        match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email'],
    },
    state: {
        type: String,
        required: true,
    },
    constituency: {
        type: String,
        required: true,
    },
    declaration_accepted: {
        type: Boolean,
        required: true,
        validate: {
            validator: (v) => v === true,
            message: 'Declaration must be accepted',
        },
    },
    is_verified: {
        type: Boolean,
        default: false,
    },
    has_voted: {
        type: Boolean,
        default: false,
    },
    blocked: {
        type: Boolean,
        default: false,
    },
    violation_count: {
        type: Number,
        default: 0,
    },
    role: {
        type: String,
        enum: ['voter', 'admin'],
        default: 'voter',
    },
    commitment: {
        type: String,
    },
}, {
    timestamps: true,
});

// Index for faster lookups (non-unique indexes only — unique indexes are already created by unique:true above)

// Never expose hashes in JSON responses
userSchema.methods.toJSON = function () {
    const obj = this.toObject();
    delete obj.aadhaar_hash;
    delete obj.mobile_hash;
    delete obj.aadhaar_image_hash;
    delete obj.user_image_hash;
    delete obj.commitment;
    return obj;
};

module.exports = mongoose.model('User', userSchema);
