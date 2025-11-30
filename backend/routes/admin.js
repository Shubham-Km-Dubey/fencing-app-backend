const express = require('express');
const auth = require('../middleware/auth');
// 👈 CRITICAL: Import the centralized DAF ID utility
const { generateDAFId } = require('../utils/common'); 
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
        if (req.user.role !== 'district_admin') {
            return res.status(403).json({ message: 'Access denied' });
        }

        const district = req.user.district;

        // Get applications that are PENDING and belong to this district
        const pendingApplications = [];

        const models = [
            { model: Fencer, type: 'fencer' },
            { model: Coach, type: 'coach' },
            { model: Referee, type: 'referee' },
            { model: School, type: 'school' },
            { model: Club, type: 'club' }
        ];

        for (const { model, type } of models) {
            // Find applications that are still 'pending' the District Admin's review
            const applications = await model.find({ selectedDistrict: district, status: 'pending' })
                .populate('userId', 'email registrationDate');
            
            applications.forEach(app => {
                pendingApplications.push({
                    id: app._id,
                    type: type,
                    name: type === 'school' ? app.schoolName : 
                          type === 'club' ? app.clubName : `${app.firstName} ${app.lastName}`,
                    email: app.userId.email,
                    registrationDate: app.userId.registrationDate,
                    submittedAt: app.createdAt
                });
            });
        }

        res.json(pendingApplications);
    } catch (error) {
        console.error('District Admin /applications error:', error.message);
        res.status(400).json({ message: error.message });
    }
});

// Get application details (no changes needed)
router.get('/application/:type/:id', auth, async (req, res) => {
    try {
        const { type, id } = req.params;
        const Model = { 
            'fencer': Fencer, 'coach': Coach, 'referee': Referee, 'school': School, 'club': Club 
        }[type];

        if (!Model) {
            return res.status(440).json({ message: 'Invalid application type' });
        }

        let application = await Model.findById(id).populate('userId', 'email');

        if (!application) {
            return res.status(404).json({ message: 'Application not found' });
        }

        res.json(application);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// Approve application - SINGLE STEP APPROVAL
router.post('/approve/:type/:id', auth, async (req, res) => {
    try {
        if (req.user.role !== 'district_admin') {
            return res.status(403).json({ message: 'Access denied' });
        }
        
        const { type, id } = req.params;
        const Model = { 
            'fencer': Fencer, 'coach': Coach, 'referee': Referee, 'school': School, 'club': Club 
        }[type];

        if (!Model) return res.status(440).json({ message: 'Invalid application type' });

        let application = await Model.findById(id);

        if (!application) {
            return res.status(404).json({ message: 'Application not found' });
        }
        
        // 1. Generate DAF ID (Final Step)
        const dafId = generateDAFId(type);

        // 2. Update application status
        application.status = 'approved'; 
        await application.save();

        // 3. Update user: SET MAIN APPROVAL FLAG and DAF ID
        let user = await User.findById(application.userId);
        user.isApproved = true; // 👈 CRITICAL: FINAL APPROVAL
        user.districtApproved = true; // Mark District approval done
        user.dafId = dafId;
        user.rejectionReason = undefined;
        await user.save();

        res.json({ 
            message: 'Application successfully approved and user activated.',
            dafId
        });
    } catch (error) {
        console.error('District Admin /approve error:', error.message);
        res.status(400).json({ message: error.message });
    }
});

// Reject application - Minor update for full reset
router.post('/reject/:type/:id', auth, async (req, res) => {
    try {
        if (req.user.role !== 'district_admin') {
            return res.status(403).json({ message: 'Access denied' });
        }

        const { type, id } = req.params;
        const { reason } = req.body;
        const Model = { 
            'fencer': Fencer, 'coach': Coach, 'referee': Referee, 'school': School, 'club': Club 
        }[type];

        if (!Model) return res.status(440).json({ message: 'Invalid application type' });

        let application = await Model.findById(id);

        if (!application) {
            return res.status(404).json({ message: 'Application not found' });
        }

        // Update application status
        application.status = 'rejected';
        await application.save();

        // Update user: Reset all approval flags, set rejection reason
        await User.findByIdAndUpdate(application.userId, {
            isApproved: false,
            districtApproved: false, 
            centralApproved: false,
            rejectionReason: reason,
            dafId: undefined // Remove DAF ID on rejection if it existed
        });

        res.json({ message: 'Application rejected successfully' });
    } catch (error) {
        console.error('District Admin /reject error:', error.message);
        res.status(400).json({ message: error.message });
    }
});

module.exports = router;