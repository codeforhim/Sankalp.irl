const express = require('express');
const router = express.Router();
const multer = require('multer');
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = file.originalname.split('.').pop();
        cb(null, file.fieldname + '-' + uniqueSuffix + '.' + ext);
    }
});
const upload = multer({ storage: storage });
const complaintsController = require('../controllers/complaintsController');
const { authenticateToken, restrictToRole } = require('../middleware/authMiddleware');

// Anyone logged in can create a complaint
router.post('/create', authenticateToken, restrictToRole(['user', 'ward_staff', 'admin']), upload.fields([{ name: 'image', maxCount: 1 }, { name: 'audio', maxCount: 1 }]), complaintsController.createComplaint);

// Anyone logged in as a user can fetch their own complaints
router.get('/my', authenticateToken, restrictToRole(['user']), complaintsController.getMyComplaints);

// Read-only map routes or dashboard routes (secured)
router.get('/city/:city_id', authenticateToken, restrictToRole(['admin', 'ward_staff']), complaintsController.getComplaintsByCity);

router.get('/ward/:ward_id', authenticateToken, restrictToRole(['admin', 'ward_staff']), complaintsController.getComplaintsByWard);

// Only ward staff (or admin) can update status
router.patch('/status/:id', authenticateToken, restrictToRole(['ward_staff', 'admin']), complaintsController.updateComplaintStatus);

// Feature 3: Image Verification explicitly allowing ward staff to submit resolution proof
router.post('/:id/verify-resolution', authenticateToken, restrictToRole(['ward_staff']), upload.single('after_image'), complaintsController.verifyResolution);

// Admin only: Export ward analytics to Excel
router.get('/admin/export-pending', authenticateToken, restrictToRole(['admin']), complaintsController.exportPendingWardsData);

module.exports = router;
