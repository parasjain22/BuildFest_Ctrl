const { v4: uuidv4 } = require('uuid');
const Complaint = require('../models/Complaint');

/**
 * POST /api/complaints
 * Submit a complaint.
 */
const submitComplaint = async (req, res) => {
    console.log('📨 [submitComplaint] ▶ New complaint submission');
    try {
        const { category, description, email } = req.body;
        console.log(`📨 [submitComplaint]   Category: ${category}, Email: ${email}`);

        const complaint = await Complaint.create({
            complaint_id: `CMP-${Date.now().toString(36).toUpperCase()}`,
            category,
            description,
            email,
            attachment_path: req.file ? req.file.path : undefined,
        });

        console.log(`📨 [submitComplaint] ✅ Complaint created: ${complaint.complaint_id}`);
        res.status(201).json({
            status: 'success',
            message: 'Complaint submitted successfully. We will respond within 24-48 hours.',
            data: {
                complaint_id: complaint.complaint_id,
                category: complaint.category,
                status: complaint.status,
            },
        });
    } catch (error) {
        console.error('📨 [submitComplaint] ❌ Error:', error.message);
        res.status(500).json({ status: 'error', message: 'Failed to submit complaint' });
    }
};

/**
 * GET /api/complaints/:id
 * Track complaint status.
 */
const trackComplaint = async (req, res) => {
    console.log(`📨 [trackComplaint] ▶ Tracking complaint: ${req.params.id}`);
    try {
        const complaint = await Complaint.findOne({ complaint_id: req.params.id });
        if (!complaint) {
            return res.status(404).json({ status: 'error', message: 'Complaint not found' });
        }

        res.status(200).json({
            status: 'success',
            data: {
                complaint_id: complaint.complaint_id,
                category: complaint.category,
                status: complaint.status,
                submitted_at: complaint.createdAt,
                is_priority: complaint.is_priority,
            },
        });
    } catch (error) {
        res.status(500).json({ status: 'error', message: 'Failed to track complaint' });
    }
};

module.exports = { submitComplaint, trackComplaint };
