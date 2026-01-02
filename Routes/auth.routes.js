
import express from 'express';
import upload from "../Middleware/multer.middleware.js";

import { authenticate, isUser } from '../Middleware/auth.js';
import { createUserCarListing, deleteUserProfile, getUserProfile, updateUserPassword, updateUserProfile } from '../Controllers/userController.js';
import { loginAdmin, registerAdmin } from '../Controllers/adminAuthController.js';
import { commonLogin, loginUser, registerUser } from '../Controllers/authController.js';
import { sendInquiry } from '../Controllers/inquiryController.js';

const router = express.Router();



router.post("/login", commonLogin);


export default router;