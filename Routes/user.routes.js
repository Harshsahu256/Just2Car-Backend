
import express from 'express';
import upload from "../Middleware/multer.middleware.js";

import { authenticate, isUser } from '../Middleware/auth.js';
import { createUserCarListing, deleteUserProfile, getUserProfile, updateUserPassword, updateUserProfile } from '../Controllers/userController.js';
import { loginAdmin, registerAdmin } from '../Controllers/adminAuthController.js';
import { loginUser, registerUser } from '../Controllers/authController.js';
import { sendInquiry } from '../Controllers/inquiryController.js';
import { getDealDetails, makeOffer } from '../Controllers/dealController.js';
import { getAssignedinspectionDetails, getMyPendinginspections, respondToSchedule } from '../Controllers/inspectionController.js';

const router = express.Router();



router.post("/register", upload.single("profileImage"), registerUser);
router.post("/login", loginUser);

router.use(authenticate,isUser); 

router.get("/profile", getUserProfile);
router.put("/profile", upload.single("profileImage"), updateUserProfile);
router.put("/profile/password", updateUserPassword);
router.delete("/profile", deleteUserProfile);

router.post("/sell-car",   upload.fields([
         { name: "images", maxCount: 10 },
        { name: "documents", maxCount: 5 }
    ]),
    createUserCarListing
);

 
// Public Inquiry Route
router.post("/inquiry/send", sendInquiry);
router.get("/deal/:dealId", getDealDetails);
router.put("/deal/update", makeOffer);


 // inspection Routes
 router.get("/my-inspection-requests", getMyPendinginspections);
 router.put("/inspection/respond", respondToSchedule);
 router.get("/assigned-inspection/:carId", getAssignedinspectionDetails);
 
 
export default router;