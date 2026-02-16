const mongoose = require('mongoose');

const candidateSchema = new mongoose.Schema({
    election_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Election',
        required: true,
    },
    name: {
        type: String,
        required: true,
        trim: true,
    },
    party: {
        type: String,
        required: true,
        trim: true,
    },
    symbol: {
        type: String,
        required: true,
    },
    constituency: {
        type: String,
        required: true,
    },
    photo_url: String,
    manifesto_url: String,
    vote_count: {
        type: Number,
        default: 0,
    },
    is_active: {
        type: Boolean,
        default: true,
    },
}, {
    timestamps: true,
});

candidateSchema.index({ election_id: 1, constituency: 1 });

module.exports = mongoose.model('Candidate', candidateSchema);
