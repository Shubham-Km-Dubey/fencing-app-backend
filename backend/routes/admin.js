const express = require('express');
const auth = require('../middleware/auth');
const User = require('../models/User');
const Fencer = require('../models/Fencer');
const Coach = require('../models/Coach');
const Referee = require('../models/Referee');
const School = require('../models/School');
const Club = require('../models/Club');
const router = express.Router();

// Get pending applications for district admin
router.get('/applications', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        
        if (user.role !== 'district_admin') {
            return res.status(403).json({ message: 'Access denied' });
        }

        const district = user.district;

        // Get all pending applications for the admin's district
        const pendingApplications = [];

        // Fencers
        const fencers = await Fencer.find({ selectedDistrict: district, status: 'pending' })
            .populate('userId', 'email registrationDate');
        fencers.forEach(fencer => {
            pendingApplications.push({
                id: fencer._id,
                type: 'fencer',
                name: `${fencer.firstName} ${fencer.lastName}`,
                email: fencer.userId.email,
                registrationDate: fencer.userId.registrationDate,
                submittedAt: fencer.createdAt
            });
        });

        // Coaches
        const coaches = await Coach.find({ selectedDistrict: district, status: 'pending' })
            .populate('userId', 'email registrationDate');
        coaches.forEach(coach => {
            pendingApplications.push({
                id: coach._id,
                type: 'coach',
                name: `${coach.firstName} ${coach.lastName}`,
                email: coach.userId.email,
                registrationDate: coach.userId.registrationDate,
                submittedAt: coach.createdAt
            });
        });

        // Referees
        const referees = await Referee.find({ selectedDistrict: district, status: 'pending' })
            .populate('userId', 'email registrationDate');
        referees.forEach(referee => {
            pendingApplications.push({
                id: referee._id,
                type: 'referee',
                name: `${referee.firstName} ${referee.lastName}`,
                email: referee.userId.email,
                registrationDate: referee.userId.registrationDate,
                submittedAt: referee.createdAt
            });
        });

        // Schools
        const schools = await School.find({ selectedDistrict: district, status: 'pending' })
            .populate('userId', 'email registrationDate');
        schools.forEach(school => {
            pendingApplications.push({
                id: school._id,
                type: 'school',
                name: school.schoolName,
                email: school.userId.email,
                registrationDate: school.userId.registrationDate,
                submittedAt: school.createdAt
            });
        });

        // Clubs
        const clubs = await Club.find({ selectedDistrict: district, status: 'pending' })
            .populate('userId', 'email registrationDate');
        clubs.forEach(club => {
            pendingApplications.push({
                id: club._id,
                type: 'club',
                name: club.clubName,
                email: club.userId.email,
                registrationDate: club.userId.registrationDate,
                submittedAt: club.createdAt
            });
        });

        res.json(pendingApplications);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// Get application details
router.get('/application/:type/:id', auth, async (req, res) => {
    try {
        const { type, id } = req.params;
        let application;

        switch (type) {
            case 'fencer':
                application = await Fencer.findById(id).populate('userId', 'email');
                break;
            case 'coach':
                application = await Coach.findById(id).populate('userId', 'email');
                break;
            case 'referee':
                application = await Referee.findById(id).populate('userId', 'email');
                break;
            case 'school':
                application = await School.findById(id).populate('userId', 'email');
                break;
            case 'club':
                application = await Club.findById(id).populate('userId', 'email');
                break;
        }

        if (!application) {
            return res.status(404).json({ message: 'Application not found' });
        }

        res.json(application);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// Approve application
router.post('/approve/:type/:id', auth, async (req, res) => {
    try {
        const { type, id } = req.params;
        let application;
        let user;

        switch (type) {
            case 'fencer':
                application = await Fencer.findById(id);
                break;
            case 'coach':
                application = await Coach.findById(id);
                break;
            case 'referee':
                application = await Referee.findById(id);
                break;
            case 'school':
                application = await School.findById(id);
                break;
            case 'club':
                application = await Club.findById(id);
                break;
        }

        if (!application) {
            return res.status(404).json({ message: 'Application not found' });
        }

        // Generate DAF ID
        const dafId = generateDAFId(type);

        // Update application status
        application.status = 'approved';
        await application.save();

        // Update user
        user = await User.findById(application.userId);
        user.isApproved = true;
        user.dafId = dafId;
        user.rejectionReason = undefined;
        await user.save();

        res.json({ message: 'Application approved successfully', dafId });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// Reject application
router.post('/reject/:type/:id', auth, async (req, res) => {
    try {
        const { type, id } = req.params;
        const { reason } = req.body;
        let application;

        switch (type) {
            case 'fencer':
                application = await Fencer.findById(id);
                break;
            case 'coach':
                application = await Coach.findById(id);
                break;
            case 'referee':
                application = await Referee.findById(id);
                break;
            case 'school':
                application = await School.findById(id);
                break;
            case 'club':
                application = await Club.findById(id);
                break;
        }

        if (!application) {
            return res.status(404).json({ message: 'Application not found' });
        }

        // Update application status
        application.status = 'rejected';
        await application.save();

        // Update user
        await User.findByIdAndUpdate(application.userId, {
            isApproved: false,
            rejectionReason: reason
        });

        res.json({ message: 'Application rejected successfully' });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// Generate DAF ID (you can customize this logic)
const generateDAFId = (type) => {
    const prefix = {
        'fencer': 'DAF-F',
        'coach': 'DAF-C',
        'referee': 'DAF-R',
        'school': 'DAF-S',
        'club': 'DAF-CL'
    }[type];
    
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    return `${prefix}${randomNum}${Date.now().toString().slice(-4)}`;
};

module.exports = router;