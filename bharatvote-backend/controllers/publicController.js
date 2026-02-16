const Election = require('../models/Election');

/**
 * GET /api/public/welcome
 * Welcome page data.
 */
const getWelcomeData = async (req, res) => {
    console.log('🏠 [getWelcomeData] ▶ Welcome page data requested');
    try {
        const liveElection = await Election.findOne({ status: 'live' });

        res.status(200).json({
            status: 'success',
            data: {
                title: 'BharatVote — Secure Digital Voting System',
                title_hi: 'भारत वोट — सुरक्षित डिजिटल मतदान प्रणाली',
                slogan: 'Every Vote Counts. Every Vote is Secured.',
                slogan_hi: 'हर मत की गिनती। हर मत सुरक्षित।',
                description: 'A next-generation digital voting platform ensuring end-to-end encryption, identity separation, and tamper-evident vote storage through Merkle Tree and blockchain-style architecture.',
                process_steps: [
                    { step: 1, title: 'Register', title_hi: 'पंजीकरण', description: 'Verify your identity with Aadhaar and register as a voter' },
                    { step: 2, title: 'Login', title_hi: 'लॉगिन', description: 'Authenticate with Aadhaar + OTP + Face Verification' },
                    { step: 3, title: 'Vote', title_hi: 'मतदान', description: 'Cast your encrypted vote in a secured 60-second session' },
                    { step: 4, title: 'Receipt', title_hi: 'रसीद', description: 'Receive a cryptographic proof of your vote' },
                    { step: 5, title: 'Verify', title_hi: 'सत्यापन', description: 'Verify your vote on the public audit dashboard' },
                ],
                eci_info: {
                    name: 'Election Commission of India',
                    name_hi: 'भारत निर्वाचन आयोग',
                    address: 'Nirvachan Sadan, Ashoka Road, New Delhi - 110001',
                    phone: '1950',
                    email: 'helpdesk@eci.gov.in',
                    website: 'https://eci.gov.in',
                },
                eci_members: [
                    { name: 'Shri Rajiv Kumar', designation: 'Chief Election Commissioner', photo_url: null },
                    { name: 'Shri Anup Chandra Pandey', designation: 'Election Commissioner', photo_url: null },
                    { name: 'Shri Arun Goel', designation: 'Election Commissioner', photo_url: null },
                ],
                has_live_election: !!liveElection,
                live_election: liveElection ? {
                    id: liveElection._id,
                    name: liveElection.name,
                    status: liveElection.status,
                    total_votes: liveElection.total_votes_cast,
                    total_registered: liveElection.total_registered,
                } : null,
            },
        });
    } catch (error) {
        console.error('Welcome data error:', error);
        res.status(500).json({ status: 'error', message: 'Failed to load welcome data' });
    }
};

/**
 * GET /api/public/election/live
 * Live election status.
 */
const getLiveElection = async (req, res) => {
    console.log('📡 [getLiveElection] ▶ Checking for live elections');
    try {
        const elections = await Election.find({ status: 'live' });

        if (!elections || elections.length === 0) {
            return res.status(200).json({
                status: 'success',
                data: { has_live_election: false, message: 'No election is currently live' },
            });
        }

        const formattedElections = elections.map(election => ({
            id: election._id,
            name: election.name,
            description: election.description,
            status: election.status,
            timeline: election.timeline,
            total_registered: election.total_registered,
            total_votes_cast: election.total_votes_cast,
            constituencies: election.constituencies,
            settings: {
                allow_registration: election.settings.allow_registration,
                voting_started: election.settings.voting_started,
            },
        }));

        res.status(200).json({
            status: 'success',
            data: {
                has_live_election: true,
                // Return list of all live elections
                elections: formattedElections,
                // Keep 'election' field for backward compatibility (returns the first one)
                election: formattedElections[0],
            },
        });
    } catch (error) {
        console.error('Live election error:', error);
        res.status(500).json({ status: 'error', message: 'Failed to get live election' });
    }
};

/**
 * GET /api/public/eci-members
 * List of ECI members.
 */
const getECIMembers = async (req, res) => {
    console.log('👥 [getECIMembers] ▶ ECI members requested');
    res.status(200).json({
        status: 'success',
        data: [
            { name: 'Shri Rajiv Kumar', designation: 'Chief Election Commissioner' },
            { name: 'Shri Anup Chandra Pandey', designation: 'Election Commissioner' },
            { name: 'Shri Arun Goel', designation: 'Election Commissioner' },
        ],
    });
};

/**
 * GET /api/public/officers/:location
 * Election officers by region.
 */
const getOfficersByLocation = async (req, res) => {
    console.log(`👥 [getOfficersByLocation] ▶ Location: ${req.params.location}`);
    const { location } = req.params;

    // Demo data — in production, this would query a real database
    const officers = {
        'delhi': [
            { name: 'Shri Ram Sharma', designation: 'Chief Electoral Officer', region: 'Delhi' },
            { name: 'Smt. Priya Gupta', designation: 'District Election Officer', region: 'New Delhi' },
        ],
        'maharashtra': [
            { name: 'Shri Vijay Patil', designation: 'Chief Electoral Officer', region: 'Maharashtra' },
        ],
    };

    const regionOfficers = officers[location.toLowerCase()] || [];

    res.status(200).json({
        status: 'success',
        data: regionOfficers,
        message: regionOfficers.length ? undefined : 'No officers found for this location',
    });
};

/**
 * GET /api/public/election/scheduled
 * Scheduled (upcoming) elections.
 */
const getScheduledElections = async (req, res) => {
    console.log('📅 [getScheduledElections] ▶ Checking for scheduled elections');
    try {
        const elections = await Election.find({ status: 'scheduled' })
            .select('name description status timeline constituencies total_registered')
            .sort({ 'timeline.voting_start': 1 });

        res.status(200).json({
            status: 'success',
            data: {
                elections: elections.map(e => ({
                    id: e._id,
                    name: e.name,
                    description: e.description,
                    status: e.status,
                    timeline: e.timeline,
                    constituencies: e.constituencies,
                    total_registered: e.total_registered,
                })),
                count: elections.length,
            },
        });
    } catch (error) {
        console.error('Scheduled elections error:', error);
        res.status(500).json({ status: 'error', message: 'Failed to get scheduled elections' });
    }
};

/**
 * GET /api/public/candidates?election_id=xxx
 * Public candidates for a specific election (no auth required).
 */
const getPublicCandidates = async (req, res) => {
    console.log('👤 [getPublicCandidates] ▶ Fetching public candidates');
    try {
        const { election_id } = req.query;
        if (!election_id) {
            return res.status(400).json({ status: 'error', message: 'election_id is required' });
        }

        // Verify election exists and is live
        const election = await Election.findById(election_id);
        if (!election) {
            return res.status(404).json({ status: 'error', message: 'Election not found' });
        }
        if (election.status !== 'live') {
            return res.status(403).json({ status: 'error', message: 'Election is not currently live' });
        }

        const Candidate = require('../models/Candidate');
        const candidates = await Candidate.find({ election_id })
            .select('name party symbol constituency');

        console.log(`👤 [getPublicCandidates] ✅ Found ${candidates.length} candidates for election ${election_id}`);
        res.status(200).json({
            status: 'success',
            data: { candidates },
        });
    } catch (error) {
        console.error('Public candidates error:', error);
        res.status(500).json({ status: 'error', message: 'Failed to get candidates' });
    }
};

module.exports = { getWelcomeData, getLiveElection, getScheduledElections, getPublicCandidates, getECIMembers, getOfficersByLocation };
