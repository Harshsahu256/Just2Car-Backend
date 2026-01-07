

 
import Car from "../Models/car.model.js";
import Inspection from "../Models/inspection.model.js";
import User from "../Models/user.model.js";
import { uploadFileToSpaces } from "../Services/s3Service.js";
import { ApiError } from "../Utils/apiError.js";
 

//======================inspection====================
export const createFranchiseInspector = async (req, res, next) => {
    try {
        const { fullName, email, phone, password, pincode } = req.body;
        const loggedInFranchiseId = req.user.franchiseId; // Token से मिलेगा
 
        // चेक करें कि ईमेल पहले से तो नहीं है
        const exists = await User.findOne({ email });
        if (exists) throw new ApiError(400, "Email already exists");
 
        // नया यूजर बनाएँ जिसका रोल 'inspector' हो और वो इस Franchise से जुड़ा हो
 
         // 🖼 Upload profile image to Spaces
    let profileImage = null;
    if (req.file) {
      profileImage = await uploadFileToSpaces(req.file, "inspectors");
    }
 
        const inspector = await User.create({
            fullName,
            email,
            phone,
            password,
            pincode,
            role: 'inspector',
            franchiseId: loggedInFranchiseId ,// 👈 Link to this specific franchise
            profileImage,
        });
 
        res.status(201).json({
            success: true,
            message: "Inspector created successfully for your franchise",
            data: { id: inspector._id, fullName: inspector.fullName, email: inspector.email }
        });
    } catch (err) { next(err); }
};
//======================inspection updated Inspector API///////////////////
export const updateFranchiseInspector = async (req, res, next) => {
  try {
    const inspectorId = req.params.id;
    const loggedInFranchiseId = req.user.franchiseId;

    const { fullName, phone, pincode } = req.body;

    // 🔍 Inspector check
    const inspector = await User.findOne({
      _id: inspectorId,
      role: "inspector",
      franchiseId: loggedInFranchiseId,
    });

    if (!inspector) {
      throw new ApiError(404, "Inspector not found for your franchise");
    }

    // 🖼 Profile Image Update
    if (req.file) {
      inspector.profileImage = await uploadFileToSpaces(
        req.file,
        "inspectors"
      );
    }

    // ✏ Update fields
    if (fullName) inspector.fullName = fullName;
    if (phone) inspector.phone = phone;
    if (pincode) inspector.pincode = pincode;

    await inspector.save();

    res.status(200).json({
      success: true,
      message: "Inspector updated successfully",
      data: inspector,
    });
  } catch (err) {
    next(err);
  }
};

//======================inspection DELETE Inspector API///////////////////
export const deleteFranchiseInspector = async (req, res, next) => {
  try {
    const inspectorId = req.params.id;
    const loggedInFranchiseId = req.user.franchiseId;

    const inspector = await User.findOneAndDelete({
      _id: inspectorId,
      role: "inspector",
      franchiseId: loggedInFranchiseId,
    });

    if (!inspector) {
      throw new ApiError(404, "Inspector not found for your franchise");
    }

    res.status(200).json({
      success: true,
      message: "Inspector deleted successfully",
    });
  } catch (err) {
    next(err);
  }
};

 
 
// =========================================================================
// 2. FRANCHISE: Get All My Inspectors (सिर्फ अपने वाले)
 
export const getMyInspectors = async (req, res, next) => {
    try {
        const franchiseId = req.user.franchiseId;
 
        if (!franchiseId) {
            throw new ApiError(403, "Franchise access required");
        }
 
        const inspectors = await User.find({
            role: "inspector",
            franchiseId
        }).select("franchiseId fullName email phone pincode createdAt profileImage                   ");
 
        res.status(200).json({
            success: true,
            message: "Franchise inspectors fetched successfully",
            totalInspectors: inspectors.length,
            data: inspectors
        });
 
    } catch (err) {
        next(err);
    }
};
 
 
// STEP 1: FRANCHISE - Schedule Inspection
 
export const scheduleInspection = async (req, res, next) => {
    try {
        const { carId, date, time } = req.body;
        const car = await Car.findById(carId);
       
        if (!car) throw new ApiError(404, "Car not found");
 
          // ❌ Already in inspection flow
    if (['scheduled', 'user_accepted', 'assigned', 'completed'].includes(car.inspectionStatus)) {
      throw new ApiError(400, "Inspection already exists for this car");
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
        res.status(200).json({ success: true, message: "Inspection scheduled. Waiting for user to accept." });
    } catch (err) { next(err); }
};
 
// STEP 2: USER (SELLER) - Accept or Reject Schedule
export const respondToSchedule = async (req, res, next) => {
    try {
        const { carId, action } = req.body; // action: 'accept' or 'reject'
        const car = await Car.findById(carId);
 
         if (!car) throw new ApiError(404, "Car not found");
 
    // 🔐 Ownership validation
    if (String(car.listedBy) !== String(req.user.id)) {
      throw new ApiError(403, "You cannot respond to someone else's inspection");
    }
 
    if (car.inspectionStatus !== 'scheduled') {
      throw new ApiError(400, "Inspection not in scheduled state");
    }
 
        if (action === 'accept') {
            car.inspectionStatus = 'user_accepted';
        } else {
            car.inspectionStatus = 'user_rejected';
        }
        await car.save();
 
        res.status(200).json({ success: true, message: `Schedule ${action}ed successfully.` });
    } catch (err) { next(err); }
};
 
// STEP 3: FRANCHISE - Assign Inspector to Accepted Task
export const assignInspector = async (req, res, next) => {
    try {
        const { carId, inspectorId } = req.body;
 
       
       
        const car = await Car.findById(carId);
        if (car.inspectionStatus !== 'user_accepted') {
            throw new ApiError(400, "User must accept the schedule first.");
        }
 
        const inspector = await User.findOne({ _id: inspectorId, role: 'inspector', franchiseId: req.user.franchiseId });
        if (!inspector) throw new ApiError(404, "Inspector not found or invalid role.");
 
        car.assignedInspector = inspectorId;
        car.inspectionStatus = 'assigned';
        await car.save();
 
        res.status(200).json({ success: true, message: "Inspector assigned. Seller can now see inspector details." });
    } catch (err) { next(err); }
};
 
// STEP 4: INSPECTOR - Get My Tasks
export const getInspectorTasks = async (req, res, next) => {
    try {
        const tasks = await Car.find({
            assignedInspector: req.user.id,
            inspectionStatus: 'assigned'
        }).select("make model  variant year scheduledDate scheduledTime city pincode images sellerName sellerMobile");
 
        res.status(200).json({ success: true, data: tasks });
    } catch (err) { next(err); }
};
 
// STEP 5: INSPECTOR - Submit Inspection Form (Updates Car Details too)
export const submitCarInspectionForm = async (req, res, next) => {
    try {
        const {
            carId, exteriorScore, interiorScore, engineMechanicalScore,
            tyresBrakesScore, odometerReading, tyreCondition,
            accidentHistory, minorIssues, inspectorName
        } = req.body;
 
        const car = await Car.findById(carId);
        if (!car) throw new ApiError(404, "Car not found");
         // 🔐 Inspector ownership
    if (String(car.assignedInspector) !== String(req.user.id)) {
      throw new ApiError(403, "Not assigned to this inspection");
    }
 
         if (car.inspectionStatus === 'completed') {
      throw new ApiError(400, "Inspection already submitted");
    }
 
        // Photos Upload
        let photoUrls = [];
        if (req.files && req.files.length > 0) {
            photoUrls = await Promise.all(req.files.map(file => uploadFileToSpaces(file, "inspections")));
        }
 
        // Create Inspection Report
        const inspection = await Inspection.create({
            car: carId,
            // franchise: car.franchise,
            franchise: req.user.franchiseId,
            inspector: req.user.id,
            inspectorName: inspectorName,
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
        // आप यहाँ car के अन्य specs भी अपडेट कर सकते हैं जो inspector ने चेक किए
        await car.save();
 
        res.status(201).json({ success: true, message: "Inspection submitted to Franchise for review." });
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
 
export const getMyPendingInspections = async (req, res, next) => {
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
export const getAssignedInspectorDetails = async (req, res, next) => {
    try {
        const { carId } = req.params;
        const car = await Car.findById(carId)
            .populate("assignedInspector", "fullName phone profileImage");
 
        if (!car || car.inspectionStatus !== 'assigned') {
            return res.status(400).json({ message: "Inspector not assigned yet or car not found" });
        }
 
        res.status(200).json({
            success: true,
            data: car.assignedInspector // इसमें नाम, नंबर और फोटो होगी
        });
    } catch (err) { next(err); }
};
 
// 🔐 Inspector – Get my completed inspections
 
export const getMyCompletedInspections = async (req, res, next) => {
    try {
        const inspectorId = req.user.id;
 
        const cars = await Car.find({
            assignedInspector: inspectorId,
            inspectionStatus: 'completed'
        })
        .populate("inspectionReport")
        .select("make model year city inspectionReport inspectionStatus");
 
        res.status(200).json({
            success: true,
            message: "Your completed inspections fetched",
            data: cars
        });
    } catch (err) {
        next(err);
    }
};
 
 
export const getCompletedInspectionsForFranchise = async (req, res, next) => {
    try {
        const franchiseId = req.user.franchiseId;
 
        const cars = await Car.find({
            franchise: franchiseId,
            inspectionStatus: 'completed'
        })
        .populate("inspectionReport")
        .populate("assignedInspector", "fullName phone")
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
 
 

export const getCompletedInspectionByCarId = async (req, res, next) => {
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
          path: "inspector",
          select: "fullName phone email",
        },
        select: "-__v -createdAt -updatedAt", // remove system fields from inspection
      })
      .populate("assignedInspector", "fullName phone email")
      .populate("listedBy", "name email phone") // seller
      .populate("franchise", "name email phone") // franchise
      .select(
        "sellerName sellerMobile sellerEmail city pincode make model variant year kmDriven fuelType transmission registrationCity registrationNumber noOfOwners expectedPrice negotiable description images documents inspectionStatus scheduledDate scheduledTime inspectionReport assignedInspector listedBy franchise"
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