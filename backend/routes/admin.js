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
                    submittedAt: app.createdAt,
                    canViewDocuments: true, // Added for frontend
                    district: app.selectedDistrict
                });
            });
        }

        res.json(pendingApplications);
    } catch (error) {
        console.error('District Admin /applications error:', error.message);
        res.status(400).json({ message: error.message });
    }
});

// Get application details - ENHANCED to include documents
router.get('/application/:type/:id', auth, async (req, res) => {
    try {
        const { type, id } = req.params;
        const Model = { 
            'fencer': Fencer, 'coach': Coach, 'referee': Referee, 'school': School, 'club': Club 
        }[type];

        if (!Model) {
            return res.status(400).json({ message: 'Invalid application type' });
        }

        let application = await Model.findById(id)
            .populate('userId', 'email name registrationDate rejectionReason canEditForm')
            .populate('rejectionHistory.rejectedBy', 'name email');

        if (!application) {
            return res.status(404).json({ message: 'Application not found' });
        }

        // Add additional information for admin view
        const applicationWithDetails = {
            ...application.toObject(),
            userCanEdit: application.userId?.canEditForm || false,
            rejectionHistory: application.rejectionHistory || [],
            requiresResubmission: application.userId?.requiresResubmission || false
        };

        res.json(applicationWithDetails);
    } catch (error) {
        console.error('Error fetching application details:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Approve application - UPDATED for resubmissions
router.post('/approve/:type/:id', auth, async (req, res) => {
    try {
        if (req.user.role !== 'district_admin') {
            return res.status(403).json({ message: 'Access denied' });
        }
        
        const { type, id } = req.params;
        const Model = { 
            'fencer': Fencer, 'coach': Coach, 'referee': Referee, 'school': School, 'club': Club 
        }[type];

        if (!Model) return res.status(400).json({ message: 'Invalid application type' });

        let application = await Model.findById(id);

        if (!application) {
            return res.status(404).json({ message: 'Application not found' });
        }
        
        // 1. Generate DAF ID (Final Step)
        const dafId = generateDAFId(type);

        // 2. Update application status and disable editing
        application.status = 'approved';
        application.isEditable = false; // Disable editing after approval
        application.lastSubmittedAt = new Date();
        await application.save();

        // 3. Update user: SET MAIN APPROVAL FLAG, DAF ID, and disable editing
        let user = await User.findById(application.userId);
        user.isApproved = true; // 👈 CRITICAL: FINAL APPROVAL
        user.districtApproved = true; // Mark District approval done
        user.dafId = dafId;
        user.rejectionReason = undefined;
        user.canEditForm = false; // Disable editing
        user.requiresResubmission = false; // No resubmission needed
        user.lastRejectedAt = undefined; // Clear rejection timestamp
        await user.save();

        res.json({ 
            success: true,
            message: 'Application successfully approved and user activated.',
            dafId,
            userActivated: true
        });
    } catch (error) {
        console.error('District Admin /approve error:', error.message);
        res.status(500).json({ success: false, message: error.message });
    }
});

// Reject application - UPDATED to enable form editing
router.post('/reject/:type/:id', auth, async (req, res) => {
    try {
        if (req.user.role !== 'district_admin') {
            return res.status(403).json({ message: 'Access denied' });
        }

        const { type, id } = req.params;
        const { reason, remarks } = req.body;
        
        if (!reason || reason.trim() === '') {
            return res.status(400).json({ success: false, message: 'Rejection reason is required' });
        }
        
        const Model = { 
            'fencer': Fencer, 'coach': Coach, 'referee': Referee, 'school': School, 'club': Club 
        }[type];

        if (!Model) return res.status(400).json({ success: false, message: 'Invalid application type' });

        let application = await Model.findById(id);

        if (!application) {
            return res.status(404).json({ success: false, message: 'Application not found' });
        }

        // 1. Add to rejection history
        const rejectionRecord = {
            reason: reason.trim(),
            rejectedBy: req.user._id,
            rejectedAt: new Date(),
            remarks: remarks || ''
        };

        // Initialize rejectionHistory array if it doesn't exist
        if (!application.rejectionHistory) {
            application.rejectionHistory = [];
        }
        
        application.rejectionHistory.push(rejectionRecord);

        // 2. Update application status
        application.status = 'rejected';
        application.isEditable = true; // Allow user to edit the form
        await application.save();

        // 3. Update user: Reset approval flags and enable form editing
        await User.findByIdAndUpdate(application.userId, {
            isApproved: false,
            districtApproved: false,
            centralApproved: false,
            rejectionReason: reason.trim(),
            canEditForm: true, // Enable form editing
            requiresResubmission: true, // Flag that resubmission is needed
            lastRejectedAt: new Date(),
            dafId: undefined // Remove DAF ID on rejection
        });

        res.json({ 
            success: true,
            message: 'Application rejected successfully. User can now edit and resubmit.',
            canEdit: true,
            rejectionReason: reason.trim()
        });
    } catch (error) {
        console.error('District Admin /reject error:', error.message);
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
});

// NEW: Get user's application data for editing (for users)
router.get('/my-application/:type', auth, async (req, res) => {
    try {
        const { type } = req.params;
        const userId = req.user._id;
        
        const Model = { 
            'fencer': Fencer, 'coach': Coach, 'referee': Referee, 'school': School, 'club': Club 
        }[type];

        if (!Model) {
            return res.status(400).json({ success: false, message: 'Invalid application type' });
        }

        // Find the user's application
        const application = await Model.findOne({ userId });
        
        if (!application) {
            return res.status(404).json({ success: false, message: 'No application found' });
        }

        // Check if user is allowed to edit this application
        if (!application.isEditable && application.status !== 'rejected') {
            return res.status(403).json({ 
                success: false,
                message: 'This application cannot be edited. Contact admin if you need to make changes.' 
            });
        }

        // Return application data for editing
        res.json({
            success: true,
            data: application,
            canEdit: application.isEditable,
            status: application.status,
            rejectionHistory: application.rejectionHistory || []
        });
    } catch (error) {
        console.error('Error fetching application for editing:', error);
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
});

// NEW: Update application after editing (resubmission)
router.put('/update-application/:type/:id', auth, async (req, res) => {
    try {
        const { type, id } = req.params;
        const userId = req.user._id;
        const updateData = req.body;
        
        const Model = { 
            'fencer': Fencer, 'coach': Coach, 'referee': Referee, 'school': School, 'club': Club 
        }[type];

        if (!Model) {
            return res.status(400).json({ success: false, message: 'Invalid application type' });
        }

        // Find the application
        const application = await Model.findOne({ _id: id, userId });
        
        if (!application) {
            return res.status(404).json({ success: false, message: 'Application not found' });
        }

        // Check if application is editable
        if (!application.isEditable && application.status !== 'rejected') {
            return res.status(403).json({ 
                success: false,
                message: 'This application cannot be edited.' 
            });
        }

        // Update the application
        const updatedFields = {
            ...updateData,
            status: 'pending', // Reset to pending for review
            isEditable: false, // Disable editing while under review
            resubmissionCount: (application.resubmissionCount || 0) + 1,
            lastSubmittedAt: new Date()
        };

        const updatedApplication = await Model.findByIdAndUpdate(
            id,
            updatedFields,
            { new: true, runValidators: true }
        );

        // Update user flags
        await User.findByIdAndUpdate(userId, {
            canEditForm: false, // Disable editing while under review
            requiresResubmission: false,
            rejectionReason: undefined // Clear rejection reason
        });

        res.json({
            success: true,
            message: 'Application updated successfully and submitted for review.',
            data: updatedApplication
        });
    } catch (error) {
        console.error('Error updating application:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Server error', 
            error: error.message 
        });
    }
});

// NEW: Get documents for an application (for admin viewing)
router.get('/documents/:type/:id', auth, async (req, res) => {
    try {
        if (req.user.role !== 'district_admin') {
            return res.status(403).json({ success: false, message: 'Access denied' });
        }

        const { type, id } = req.params;
        const Model = { 
            'fencer': Fencer, 'coach': Coach, 'referee': Referee, 'school': School, 'club': Club 
        }[type];

        if (!Model) {
            return res.status(400).json({ success: false, message: 'Invalid application type' });
        }

        const application = await Model.findById(id).select('documents firstName lastName schoolName clubName');
        
        if (!application) {
            return res.status(404).json({ success: false, message: 'Application not found' });
        }

        res.json({
            success: true,
            data: {
                documents: application.documents,
                applicantName: application.firstName && application.lastName 
                    ? `${application.firstName} ${application.lastName}`
                    : application.schoolName || application.clubName || 'Unknown'
            }
        });
    } catch (error) {
        console.error('Error fetching documents:', error);
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
});

module.exports = router;