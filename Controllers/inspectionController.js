
import Car from "../Models/car.model.js";
import Inspection from "../Models/inspection.model.js";
import User from "../Models/user.model.js";
import { uploadFileToSpaces } from "../Services/s3Service.js";
import { ApiError } from "../Utils/apiError.js";
 

//======================inspection====================
export const createFranchiseinspection = async (req, res, next) => {
    try {
        const { fullName, email, phone, password, pincode } = req.body;
        const loggedInFranchiseId = req.user.franchiseId; // Token से मिलेगा
 
        // चेक करें कि ईमेल पहले से तो नहीं है
        const exists = await User.findOne({ email });
        if (exists) throw new ApiError(400, "Email already exists");
 
        // नया यूजर बनाएँ जिसका रोल 'inspection' हो और वो इस Franchise से जुड़ा हो
 
         // 🖼 Upload profile image to Spaces
    let profileImage = null;
    if (req.file) {
      profileImage = await uploadFileToSpaces(req.file, "inspections");
    }
 
        const inspection = await User.create({
            fullName,
            email,
            phone,
            password,
            pincode,
            role: 'inspection',
            franchiseId: loggedInFranchiseId ,// 👈 Link to this specific franchise
            profileImage,
        });
 
        res.status(201).json({
            success: true,
            message: "inspection created successfully for your franchise",
            data: { id: inspection._id, fullName: inspection.fullName, email: inspection.email }
        });
    } catch (err) { next(err); }
};
//======================inspection updated inspection API///////////////////
export const updateFranchiseinspection = async (req, res, next) => {
  try {
    const inspectionId = req.params.id;
    const loggedInFranchiseId = req.user.franchiseId;

    const { fullName, phone, pincode } = req.body;

    // 🔍 inspection check
    const inspection = await User.findOne({
      _id: inspectionId,
      role: "inspection",
      franchiseId: loggedInFranchiseId,
    });

    if (!inspection) {
      throw new ApiError(404, "inspection not found for your franchise");
    }

    // 🖼 Profile Image Update
    if (req.file) {
      inspection.profileImage = await uploadFileToSpaces(
        req.file,
        "inspections"
      );
    }

    // ✏ Update fields
    if (fullName) inspection.fullName = fullName;
    if (phone) inspection.phone = phone;
    if (pincode) inspection.pincode = pincode;

    await inspection.save();

    res.status(200).json({
      success: true,
      message: "inspection updated successfully",
      data: inspection,
    });
  } catch (err) {
    next(err);
  }
};

//======================inspection DELETE inspection API///////////////////
export const deleteFranchiseinspection = async (req, res, next) => {
  try {
    const inspectionId = req.params.id;
    const loggedInFranchiseId = req.user.franchiseId;

    const inspection = await User.findOneAndDelete({
      _id: inspectionId,
      role: "inspection",
      franchiseId: loggedInFranchiseId,
    });

    if (!inspection) {
      throw new ApiError(404, "inspection not found for your franchise");
    }

    res.status(200).json({
      success: true,
      message: "inspection deleted successfully",
    });
  } catch (err) {
    next(err);
  }
};

 
 
// =========================================================================
// 2. FRANCHISE: Get All My inspections (सिर्फ अपने वाले)
 
export const getMyinspections = async (req, res, next) => {
    try {
        const franchiseId = req.user.franchiseId;
 
        if (!franchiseId) {
            throw new ApiError(403, "Franchise access required");
        }
 
        const inspections = await User.find({
            role: "inspection",
            franchiseId
        }).select("franchiseId fullName email phone pincode createdAt profileImage                   ");
 
        res.status(200).json({
            success: true,
            message: "Franchise inspections fetched successfully",
            totalinspections: inspections.length,
            data: inspections
        });
 
    } catch (err) {
        next(err);
    }
};
 
 
// STEP 1: FRANCHISE - Schedule inspection
 
export const scheduleinspection = async (req, res, next) => {
    try {
        const { carId, date, time } = req.body;
        const car = await Car.findById(carId);
       
        if (!car) throw new ApiError(404, "Car not found");
 
          // ❌ Already in inspection flow
    if (['scheduled', 'user_accepted', 'assigned', 'completed'].includes(car.inspectionStatus)) {
      throw new ApiError(400, "inspection already exists for this car");
    }
 
    // 🔐 Franchise ownership check
    if (String(car.franchise) !== String(req.user.franchiseId)) {
      throw new ApiError(403, "You cannot schedule inspection for this car");
    }
 
 
        car.inspectionStatus = 'scheduled';
        car.scheduledDate = date;
        car.scheduledTime = time;
        await car.save();
 
        // यहाँ Notification logic आएगा (User को बताना कि टाइम फिक्स हुआ है)
        res.status(200).json({ success: true, message: "inspection scheduled. Waiting for user to accept." });
    } catch (err) { next(err); }
};
 
// // STEP 2: USER (SELLER) - Accept or Reject Schedule
// export const respondToSchedule = async (req, res, next) => {
//     try {
//         const { carId, action } = req.body; // action: 'accept' or 'reject'
//         const car = await Car.findById(carId);
 
//          if (!car) throw new ApiError(404, "Car not found");
 
//     // 🔐 Ownership validation
//     if (String(car.listedBy) !== String(req.user.id)) {
//       throw new ApiError(403, "You cannot respond to someone else's inspection");
//     }
 
//     if (car.inspectionStatus !== 'scheduled') {
//       throw new ApiError(400, "inspection not in scheduled state");
//     }
 
//         if (action === 'accept') {
//             car.inspectionStatus = 'user_accepted';
//         } else {
//             car.inspectionStatus = 'user_rejected';
//         }
//         await car.save();
 
//         res.status(200).json({ success: true, message: `Schedule ${action}ed successfully.` });
//     } catch (err) { next(err); }
// };


export const respondToSchedule = async (req, res, next) => {
    try {
        const { carId, action, rejectionReason } = req.body; // Action: 'accept' or 'reject'
       
        const car = await Car.findById(carId);
 
        if (!car) {
            return next(new ApiError(404, "Car listing not found"));
        }
 
        // 🔐 Ownership validation
        if (String(car.listedBy) !== String(req.user.id)) {
            return next(new ApiError(403, "You cannot respond to this inspection"));
        }
 
        // Check if current status is scheduled
        if (car.inspectionStatus !== 'scheduled') {
            return next(new ApiError(400, "There is no active schedule to respond to"));
        }
 
        if (action === 'accept') {
            car.inspectionStatus = 'user_accepted';
            // Status update ho gaya, ab assigned inspector ko notify kiya ja sakta hai
        }
        else if (action === 'reject') {
            // Agar reject kiya, toh status ko 'pending' kar dete hain
            // taaki Admin/Franchise naya time set kar sake
            car.inspectionStatus = 'pending';
           
            // Purana scheduled data clear karna zaroori hai
            car.scheduledDate = null;
            car.scheduledTime = null;
           
            // Optional: Aap rejection reason bhi store kar sakte hain track karne ke liye
            car.rejectionReason = rejectionReason || "Seller rejected the scheduled time";
        }
        else {
            return next(new ApiError(400, "Invalid action. Use 'accept' or 'reject'"));
        }
 
        await car.save();
 
        res.status(200).json({
            success: true,
            message: `Inspection schedule ${action === 'accept' ? 'accepted' : 'rejected and reset'}.`,
            status: car.inspectionStatus
        });
 
    } catch (err) {
        next(err);
    }
};
 
// STEP 3: FRANCHISE - Assign inspection to Accepted Task
export const assigninspection = async (req, res, next) => {
    try {
        const { carId, inspectionId } = req.body;
 
       
       
        const car = await Car.findById(carId);
        if (car.inspectionStatus !== 'user_accepted') {
            throw new ApiError(400, "User must accept the schedule first.");
        }
 
        const inspection = await User.findOne({ _id: inspectionId, role: 'inspection', franchiseId: req.user.franchiseId });
        if (!inspection) throw new ApiError(404, "inspection not found or invalid role.");
 
        car.assignedinspection = inspectionId;
        car.inspectionStatus = 'assigned';
        await car.save();
 
        res.status(200).json({ success: true, message: "inspection assigned. Seller can now see inspection details." });
    } catch (err) { next(err); }
};
 
// STEP 4: inspection - Get My Tasks
export const getinspectionTasks = async (req, res, next) => {
    try {
        const tasks = await Car.find({
            assignedinspection: req.user.id,
            inspectionStatus: 'assigned'
        }).select("make model  variant year scheduledDate scheduledTime city pincode images sellerName sellerMobile");
 
        res.status(200).json({ success: true, data: tasks });
    } catch (err) { next(err); }
};
 
// STEP 5: inspection - Submit inspection Form (Updates Car Details too)
export const submitCarinspectionForm = async (req, res, next) => {
    try {
        const {
            carId, exteriorScore, interiorScore, engineMechanicalScore,
            tyresBrakesScore, odometerReading, tyreCondition,
            accidentHistory, minorIssues, inspectionName
        } = req.body;
 
        const car = await Car.findById(carId);
        if (!car) throw new ApiError(404, "Car not found");
         // 🔐 inspection ownership
    if (String(car.assignedinspection) !== String(req.user.id)) {
      throw new ApiError(403, "Not assigned to this inspection");
    }
 
         if (car.inspectionStatus === 'completed') {
      throw new ApiError(400, "inspection already submitted");
    }
 
        // Photos Upload
        let photoUrls = [];
        if (req.files && req.files.length > 0) {
            photoUrls = await Promise.all(req.files.map(file => uploadFileToSpaces(file, "inspections")));
        }
 
        // Create inspection Report
        const inspection = await Inspection.create({
            car: carId,
            // franchise: car.franchise,
            franchise: req.user.franchiseId,
            inspection: req.user.id,
            inspectionName: inspectionName,
            inspectionDate: new Date(),
            exteriorScore, interiorScore, engineMechanicalScore, tyresBrakesScore,
            odometerReading, tyreCondition, accidentHistory, minorIssues,
            photos: photoUrls,
            status: 'submitted'
        });
 
        // UPDATE CAR DATA (Except Price)
        car.kmDriven = odometerReading;
        car.inspectionStatus = 'completed';
        car.status = 'approved';
        car.inspectionReport = inspection._id;
        // आप यहाँ car के अन्य specs भी अपडेट कर सकते हैं जो inspection ने चेक किए
        await car.save();
 
        res.status(201).json({ success: true, message: "inspection submitted to Franchise for review." });
    } catch (err) { next(err); }
};
 
// STEP 6: FRANCHISE - Final Approve and Make Live
export const approveAndMakeLive = async (req, res, next) => {
    try {
        const { carId, qualityRating } = req.body;
        const car = await Car.findById(carId);
 
        car.status = 'live';
        car.qualityRating = qualityRating; // Franchise report देख कर रेटिंग देगा
        car.liveDate = new Date();
        car.liveBy = req.user.id;
        await car.save();
 
        res.status(200).json({ success: true, message: "Car is now LIVE for buyers." });
    } catch (err) { next(err); }
};
 
export const getMyPendinginspections = async (req, res, next) => {
    try {
        const userId = req.user.id;
 
        // वैसी कारें ढूंढो जो इस यूजर की हैं और जिनका स्टेटस 'scheduled' है
        const cars = await Car.find({
            listedBy: userId,
            inspectionStatus: 'scheduled'
        }).select("make model year scheduledDate scheduledTime inspectionStatus");
 
        res.status(200).json({
            success: true,
            message: "Pending inspection schedules fetched",
            data: cars
        });
    } catch (err) {
        next(err);
    }
};
 
// जब इंस्पेक्टर असाइन हो जाए, तब उसकी प्रोफाइल सेलर को दिखाने के लिए
export const getAssignedinspectionDetails = async (req, res, next) => {
    try {
        const { carId } = req.params;
        const car = await Car.findById(carId)
            .populate("assignedinspection", "fullName phone profileImage");
 
        if (!car || car.inspectionStatus !== 'assigned') {
            return res.status(400).json({ message: "inspection not assigned yet or car not found" });
        }
 
        res.status(200).json({
            success: true,
            data: car.assignedinspection // इसमें नाम, नंबर और फोटो होगी
        });
    } catch (err) { next(err); }
};
 
// 🔐 inspection – Get my completed inspections
 
export const getMyCompletedinspections = async (req, res, next) => {
    try {
        const inspectionId = req.user.id;
 
        const cars = await Car.find({
            assignedinspection: inspectionId,
            inspectionStatus: 'completed'
        })
        .populate("inspectionReport")
        .select("make model year city kmDriven fuelType  registrationNumber  images inspectionReport inspectionStatus");
 
        res.status(200).json({
            success: true,
            message: "Your completed inspections fetched",
            data: cars
        });
    } catch (err) {
        next(err);
    }
};
 
 
export const getCompletedinspectionsForFranchise = async (req, res, next) => {
    try {
        const franchiseId = req.user.franchiseId;
 
        const cars = await Car.find({
            franchise: franchiseId,
            inspectionStatus: 'completed'
        })
        .populate("inspectionReport")
        .populate("assignedinspection", "fullName phone")
        .select("make model year city price inspectionStatus inspectionReport");
 
        res.status(200).json({
            success: true,
            message: "Completed inspections fetched successfully",
            data: cars
        });
    } catch (err) {
        next(err);
    }
};
 
 

export const getCompletedinspectionByCarId = async (req, res, next) => {
  try {
    const { carId } = req.params;
    const franchiseId = req.user.franchiseId;
 
    // Fetch car with populated inspection report and users
    const car = await Car.findOne({
      _id: carId,
      franchise: franchiseId,
    })
      .populate({
        path: "inspectionReport",
        match: { status: "submitted" }, // only completed/submitted inspections
        populate: {
          path: "inspection",
          select: "fullName phone email",
        },
        select: "-__v -createdAt -updatedAt", // remove system fields from inspection
      })
      .populate("assignedinspection", "fullName phone email")
      .populate("listedBy", "name email phone") // seller
      .populate("franchise", "name email phone") // franchise
      .select(
        "sellerName sellerMobile sellerEmail city pincode make model variant year kmDriven fuelType transmission registrationCity registrationNumber noOfOwners expectedPrice negotiable description images documents inspectionStatus scheduledDate scheduledTime inspectionReport assignedinspection listedBy franchise"
      );
 
    // Check if inspection exists
    if (!car || !car.inspectionReport) {
      return res.status(404).json({
        success: false,
        message: "Completed inspection not found for this car",
      });
    }
 
    // Convert to plain JS object and remove any remaining system fields
    const response = car.toObject();
    delete response.__v;
 
    res.status(200).json({
      success: true,
      message: "Car inspection details fetched successfully",
      data: response,
    });
  } catch (err) {
    next(err);
  }
};


export const getinspectionDashboardStats = async (req, res, next) => {
    try {
        const inspectionId = req.user.id;
 
        // Ek saath saare counts nikalne ke liye Promise.all ka use karenge
        const [totalTasks, pendingTasks, completedTasks] = await Promise.all([
            Car.countDocuments({ assignedinspection: inspectionId }),
            Car.countDocuments({ assignedinspection: inspectionId, inspectionStatus: 'assigned' }),
            Car.countDocuments({ assignedinspection: inspectionId, inspectionStatus: 'completed' }),
        ]);
 
        // Agar aapke paas "re-inspection" ka koi logic hai toh yahan filter add kar sakte hain
        // Abhi ke liye hum ise dummy 0 ya completed ka logic de sakte hain
        const reinspectionTasks = 0;
 
        res.status(200).json({
            success: true,
            data: {
                totalTasks,
                pendingTasks,
                completedTasks,
                reinspectionTasks
            }
        });
    } catch (err) {
        next(err);
    }
};
 