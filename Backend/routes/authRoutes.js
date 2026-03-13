const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// Municipal Admin routes
router.post('/admin/register', authController.registerAdmin);
router.post('/admin/login', authController.loginAdmin);

// Ward Staff routes
router.post('/ward/register', authController.registerWardStaff);
router.post('/ward/login', authController.loginWardStaff);

// User (Citizen) routes
router.post('/user/register', authController.registerUser);
router.post('/user/login', authController.loginUser);

module.exports = router;
