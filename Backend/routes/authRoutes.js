import express from 'express';
import {
    registerAdmin, loginAdmin,
    registerStaff, loginStaff,
    registerUser, loginUser
} from '../controllers/authController.js';

const router = express.Router();

// ---------------------------------------------------------
// Admin Routes
// ---------------------------------------------------------
router.post('/admin/register', registerAdmin);
router.post('/admin/login', loginAdmin);

// ---------------------------------------------------------
// Ward Staff Routes
// ---------------------------------------------------------
router.post('/ward/register', registerStaff);
router.post('/ward/login', loginStaff);

// ---------------------------------------------------------
// User (Citizen) Routes
// ---------------------------------------------------------
router.post('/user/register', registerUser);
router.post('/user/login', loginUser);

export default router;
