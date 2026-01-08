


import express from 'express';
import upload from "../Middleware/multer.middleware.js";
import { commonLogin, loginUser, registerUser } from '../Controllers/authController.js';
import { authenticate,  isFranchise } from '../Middleware/auth.js';
import { deleteUserProfile, getUserProfile, updateUserPassword, updateUserProfile } from '../Controllers/userController.js';

import { createFranchise, createFranchisePaymentOrder, getAllFranchises, getDashboardReports, getMyLeads, getPendingListings, franchiseLogin, razorpayWebhook, updateFranchiseStatus, rejectCarListing, getFranchiseListings, createFranchiseCar, createPackageOrder, verifyPackagePayment, getFranchiseCars, deleteFranchiseCar, editFranchiseCar, getFranchiseDashboardReports, approveCarListing, editListingByFranchise, getFranchiseListingStats, getTerritoryRequests, requestTerritoryUpdate, markCarAsSold,  } from '../Controllers/franchiseController.js';
import { getAllPackages, getCarListingPackages, getFranchisePackages, getPackageById } from '../Controllers/packageController.js';
import { deleteFranchiseInquiry, getFranchiseInquiries, getSingleCarInquiries, updateInquiryStatus } from '../Controllers/inquiryController.js';
import bodyParser from "body-parser";
import { finalizeDeal, getDealDetails, getFranchiseDeals, makeOffer, startDeal, updateDealStatus } from '../Controllers/dealController.js';
import { getFranchiseAnalytics } from '../Controllers/reportController.js';
import { approveAndMakeLive, assigninspection, createFranchiseinspection, deleteFranchiseinspection, getCompletedinspectionByCarId, getCompletedinspectionsForFranchise, getMyinspections, scheduleinspection, updateFranchiseinspection } from '../Controllers/inspectionController.js';
const router = express.Router();

router.post( "/createFranchise", upload.fields([
    { name: "profileImage", maxCount: 1 },
    { name: "kycDocuments", maxCount: 10 },
  ]),
  createFranchise
);

router.post("/login", commonLogin);
 router.get("/all", getAllFranchises);

router.get("/dashboard/reports", getDashboardReports);

/* ============================================================
   7. CREATE PAYMENT ORDER (Razorpay Payment)
============================================================ */
router.post("/payment/order", createFranchisePaymentOrder);

router.post("/payment/webhook",  bodyParser.raw({ type: "application/json" }), razorpayWebhook );


// router.post("/payment/verify", verifyPackagePayment);


// --------------- PACKAGE ROUTES -------------------- //
router.get("/getAllFranchisePackages", getFranchisePackages);

router.get("/getAllCarListingPackages", getCarListingPackages);

router.get("/getPackageById/:id", getPackageById);


router.use(authenticate,isFranchise); 

// *********************** USER PROFILE ROUTES ************************//
router.get("/profile", getUserProfile);
// router.put("/profile", upload.single("profileImage"), updateUserProfile);
router.put(
  "/profile",
  upload.fields([
    { name: "profileImage", maxCount: 1 }, // User/Franchise Profile Pic
    { name: "documents", maxCount: 5 }     // KYC Documents (Required: N)
  ]),
  updateUserProfile
);
router.put("/profile/password", updateUserPassword);
router.delete("/profile", deleteUserProfile);

router.post("/payment/packageorder", createPackageOrder);


// ************************************************************************************************
//                               createFranchise 
//*************************************************************************************************** */

router.post(  "/self-car-list", upload.fields([
    { name: "images", maxCount: 10 },
    { name: "documents", maxCount: 5 }
  ]),
  createFranchiseCar
);

router.get("/selfcars/list", getFranchiseCars);

router.put("/edit/:id", upload.fields([{ name: 'images' }, { name: 'documents' }]), editFranchiseCar);
router.delete("/delete/:id", deleteFranchiseCar);




router.get(
  "/listing-stats",
  getFranchiseListingStats
);

//*****************************************listings routes************************************************//
router.put("/listings/reject/:carId", rejectCarListing); 
// router.get("/pending-listings", getPendingListings);
router.get("/franchise-car-listings", getFranchiseListings);
router.put("/listings/approve/:carId", approveCarListing);
router.put("/listings/edit/:carId", editListingByFranchise);



// router.get("/my-leads", getMyLeads);  

//*****************************************inquiry routes ************************************************//

router.get("/inquiries", getFranchiseInquiries);

// Update inquiry status
router.put(
  "/inquiries/:inquiryId/status",
  updateInquiryStatus
);

router.delete("/inquiry/:id", deleteFranchiseInquiry);

router.get(
  "/car-inquiries/:carId",
  getSingleCarInquiries
);


//*****************************************deal routes ************************************************//
router.post("/deal/create", startDeal);
router.put("/deal/update", makeOffer);
router.get("/deal/:dealId", getDealDetails);
router.put("/deal/finalize", finalizeDeal);
 

//********************************Reports************************* */
router.get("/franchise-analytics", getFranchiseAnalytics);

//**********************************Dashboard************************ */
router.get("/dashboard", getFranchiseDashboardReports);


// 👇 NEW DEAL ROUTES
router.get("/deals",  getFranchiseDeals);
router.put("/deals/:dealId/status", updateDealStatus);

// Territory Routes
router.post("/territory/request",requestTerritoryUpdate );
router.get("/territory/history", getTerritoryRequests);


//=====================inspections=====================//
router.post(
  "/inspections/create",
  upload.single("profileImage"),
  createFranchiseinspection
);

router.put(
  "/inspections/:id",
  upload.single("profileImage"),
  updateFranchiseinspection
);

router.delete(
  "/inspections/:id",
  deleteFranchiseinspection
);


 
router.get("/inspections/all", getMyinspections);       // Step 2
router.post("/inspection/schedule", scheduleinspection); // Step 3
router.put("/inspection/assign", assigninspection);       // Step 5
router.get("/inspection/completed", getCompletedinspectionsForFranchise);
router.put("/inspection/make-live", approveAndMakeLive);  // Step 6


router.get(
  "/inspection/completed/:carId",  getCompletedinspectionByCarId);
router.put("/inspection/mark-sold", markCarAsSold);

export default router;