
import express from 'express';
import upload from "../Middleware/multer.middleware.js";
import { commonLogin, loginUser, registerUser } from '../Controllers/authController.js';
import { authenticate, isAdmin } from '../Middleware/auth.js';
import { deleteUserProfile, getUserProfile, updateUserPassword, updateUserProfile } from '../Controllers/userController.js';
import { loginAdmin, registerAdmin } from '../Controllers/adminAuthController.js';
import { createFranchise, getAllFranchises, updateFranchiseStatus } from '../Controllers/franchiseController.js';
import { createPackage, deletePackage, getAllPackages, getPackageById, updatePackage } from '../Controllers/packageController.js';

const router = express.Router();



router.post("/register", upload.single("profileImage"), registerAdmin);
router.post("/login", commonLogin);

router.use(authenticate,isAdmin); 

router.get("/profile", getUserProfile);
router.put("/profile", upload.single("profileImage"), updateUserProfile);
router.put("/profile/password", updateUserPassword);
router.delete("/profile", deleteUserProfile);
// ************************************************************************************************
//                               createFranchise 

//*************************************************************************************************** */
router.post( "/create", upload.fields([
    { name: "profileImage", maxCount: 1 },
    { name: "kycDocuments", maxCount: 10 },
  ]),
  createFranchise
);

router.get("/franchise/all", getAllFranchises);
router.put("/franchise/approve/:Id", updateFranchiseStatus);

// ************************************************************************************************
//                                createPackage

//*************************************************************************************************** */

router.post("/createPackage", createPackage);
router.get("/getAllPackages", getAllPackages);
router.get("/getPackageById/:id", getPackageById);
router.put("/updatePackage/:id", updatePackage);
router.delete("/deletePackage/:id", deletePackage);

export default router;