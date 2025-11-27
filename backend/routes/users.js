const express = require('express');
const auth = require('../middleware/auth');
const User = require('../models/User');
const Fencer = require('../models/Fencer');
const Coach = require('../models/Coach');
const Referee = require('../models/Referee');
const School = require('../models/School');
const Club = require('../models/Club');
const router = express.Router();

// Get user profile
router.get('/profile', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        
        let profileData = null;
        switch (user.role) {
            case 'fencer':
                profileData = await Fencer.findOne({ userId: req.user.id });
                break;
            case 'coach':
                profileData = await Coach.findOne({ userId: req.user.id });
                break;
            case 'referee':
                profileData = await Referee.findOne({ userId: req.user.id });
                break;
            case 'school':
                profileData = await School.findOne({ userId: req.user.id });
                break;
            case 'club':
                profileData = await Club.findOne({ userId: req.user.id });
                break;
        }

        res.json({
            user: {
                email: user.email,
                role: user.role,
                district: user.district,
                isApproved: user.isApproved,
                dafId: user.dafId,
                rejectionReason: user.rejectionReason,
                profileCompleted: user.profileCompleted
            },
            profile: profileData
        });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// Submit fencer registration
router.post('/fencer', auth, async (req, res) => {
    try {
        const fencerData = { ...req.body, userId: req.user.id };
        const fencer = await Fencer.create(fencerData);
        
        // Update user profile completion status
        await User.findByIdAndUpdate(req.user.id, { profileCompleted: true });
        
        res.status(201).json(fencer);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// Submit coach registration
router.post('/coach', auth, async (req, res) => {
    try {
        const coachData = { ...req.body, userId: req.user.id };
        const coach = await Coach.create(coachData);
        
        await User.findByIdAndUpdate(req.user.id, { profileCompleted: true });
        
        res.status(201).json(coach);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// Submit referee registration
router.post('/referee', auth, async (req, res) => {
    try {
        const refereeData = { ...req.body, userId: req.user.id };
        const referee = await Referee.create(refereeData);
        
        await User.findByIdAndUpdate(req.user.id, { profileCompleted: true });
        
        res.status(201).json(referee);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// Submit school registration
router.post('/school', auth, async (req, res) => {
    try {
        const schoolData = { ...req.body, userId: req.user.id };
        const school = await School.create(schoolData);
        
        await User.findByIdAndUpdate(req.user.id, { profileCompleted: true });
        
        res.status(201).json(school);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// Submit club registration
router.post('/club', auth, async (req, res) => {
    try {
        const clubData = { ...req.body, userId: req.user.id };
        const club = await Club.create(clubData);
        
        await User.findByIdAndUpdate(req.user.id, { profileCompleted: true });
        
        res.status(201).json(club);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// Update profile (for rejected applications)
router.put('/profile/:type', auth, async (req, res) => {
    try {
        const { type } = req.params;
        let updatedProfile;

        switch (type) {
            case 'fencer':
                updatedProfile = await Fencer.findOneAndUpdate(
                    { userId: req.user.id },
                    req.body,
                    { new: true }
                );
                break;
            case 'coach':
                updatedProfile = await Coach.findOneAndUpdate(
                    { userId: req.user.id },
                    req.body,
                    { new: true }
                );
                break;
            case 'referee':
                updatedProfile = await Referee.findOneAndUpdate(
                    { userId: req.user.id },
                    req.body,
                    { new: true }
                );
                break;
            case 'school':
                updatedProfile = await School.findOneAndUpdate(
                    { userId: req.user.id },
                    req.body,
                    { new: true }
                );
                break;
            case 'club':
                updatedProfile = await Club.findOneAndUpdate(
                    { userId: req.user.id },
                    req.body,
                    { new: true }
                );
                break;
        }

        res.json(updatedProfile);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

module.exports = router;