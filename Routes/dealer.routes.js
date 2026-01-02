
import express from 'express';
import upload from "../Middleware/multer.middleware.js";

import { authenticate, isAdmin } from '../Middleware/auth.js';

import { loginAdmin, registerAdmin } from '../Controllers/adminAuthController.js';
import { registerdealer } from '../Controllers/dealerController.js';


const router = express.Router();



router.post("/register", upload.single("profileImage"), registerdealer);
router.post("/login", loginAdmin);

router.use(authenticate,isAdmin); 


export default router;