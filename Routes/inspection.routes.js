import express from "express";
import upload from "../Middleware/multer.middleware.js";
import { authenticate, isinspection } from "../Middleware/auth.js";
 
import { getinspectionDashboardStats, getinspectionTasks, getMyCompletedinspections, submitCarinspectionForm } from "../Controllers/inspectionController.js";
import { commonLogin } from "../Controllers/authController.js";
 
const router = express.Router();
 
router.post("/login", commonLogin);
 
router.use(authenticate,isinspection);
 
// Sirf inspection apni assigned gaadiyan dekh sakega
router.get("/my-tasks", getinspectionTasks);
 
 
// inspection hi inspection form bharega
// router.post("/submit-report", upload.array("photos", 10), submitCarinspectionForm);
 // ✅ UPDATE: Use 'upload.fields' to accept both Photos and Video
router.post("/submit-report", 
    upload.array("photos", 10),
    submitCarinspectionForm
);

// Dashboard stats route
router.get("/dashboard-stats", getinspectionDashboardStats);
 

router.get("/inspection/completed",  getMyCompletedinspections);

 
export default router;
 