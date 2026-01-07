import express from "express";
import upload from "../Middleware/multer.middleware.js";
import { authenticate, isInspector } from "../Middleware/auth.js";
 
import { getInspectorTasks, getMyCompletedInspections, submitCarInspectionForm } from "../Controllers/inspectionController.js";
import { commonLogin } from "../Controllers/authController.js";
 
const router = express.Router();
 
router.post("/login", commonLogin);
 
router.use(authenticate,isInspector);
 
// Sirf inspector apni assigned gaadiyan dekh sakega
router.get("/my-tasks", getInspectorTasks);
 
 
// Inspector hi inspection form bharega
// router.post("/submit-report", upload.array("photos", 10), submitCarInspectionForm);
 // ✅ UPDATE: Use 'upload.fields' to accept both Photos and Video
router.post("/submit-report", 
    upload.fields([
        { name: "photos", maxCount: 15 }, // Max 15 photos
        { name: "video", maxCount: 1 }    // Max 1 video
    ]), 
    submitCarInspectionForm
);

router.get("/inspector/completed",  getMyCompletedInspections);

 
export default router;
 