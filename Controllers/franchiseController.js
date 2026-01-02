



import Franchise from "../Models/franchise.model.js";
import { uploadFileToSpaces, uploadMultipleFilesToSpaces, deleteFileFromSpaces } from "../Services/s3Service.js"; // 👈 Import S3 Services
import { Country, State, City } from "../Models/lookupData.model.js";
import inquiryModel from "../Models/inquiry.model.js";
import carModel from "../Models/car.model.js";
import User from "../Models/user.model.js";
import Package from "../Models/package.model.js";
import { razorpayInstance } from "../Config/razorpay.js";
import crypto from "crypto";  
import { ApiError } from "../Utils/apiError.js";
import PackagePurchase from "../Models/packagePurchase.model.js";
import Inquiry from "../Models/inquiry.model.js";
import Car from "../Models/car.model.js";
import Deal from "../Models/deal.model.js";
import mongoose from "mongoose";
import TerritoryRequest from "../models/TerritoryRequest.js"; 
 


export const franchiseLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    // 1️⃣ Validation
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required",
      });
    }

    // 2️⃣ Find user with password
    const user = await User.findOne({
      email: email.toLowerCase(),
      role: "franchise",
    }).select("+password");

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    // 3️⃣ Password check
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    // 4️⃣ Check franchise link
    const franchise = await Franchise.findOne({ owner: user._id });

    if (!franchise) {
      return res.status(403).json({
        success: false,
        message: "Franchise profile not linked",
      });
    }

    if (franchise.status !== "active") {
      return res.status(403).json({
        success: false,
        message: "Franchise account not active",
      });
    }

    // 5️⃣ Generate token (USING YOUR SCHEMA METHOD)
    const token = user.getSignedJwtToken();

    // 6️⃣ Success
    res.status(200).json({
      success: true,
      message: "Franchise login successful",
      token,
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        pincode: user.pincode,
      },
      franchise: {
        id: franchise._id,
        managedPincodes: franchise.managedPincodes,
        status: franchise.status,
      },
    });

  } catch (error) {
    console.error("Franchise login error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};


export const createFranchise = async (req, res) => {
  let profileImageUrl = null;
  let kycDocumentUrls = [];

  try {
    const {
      fullName,   
      email,
      phone,
      password,
      franchiseName,
      franchiseCode,
      gstNumber,
      address,
      managedPincodes,
      country,
      state,
      city,
      bankAccountNumber,
      ifscCode,
      commissionPercent,
      assignedDealers
    } = req.body;

    // 1) Email Check
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: "इस ईमेल से यूजर पहले से रजिस्टर्ड है।" });
    }
    const exist = await Franchise.findOne({ email });
    if (exist) {
      return res.status(400).json({ message: "Franchise already registered with this email" });
    }

    // // 2) managedPincodes Check
    // const existingFranchiseBymanagedPincodes = await Franchise.findOne({ managedPincodes });
    // if (existingFranchiseBymanagedPincodes) {
    //   return res.status(400).json({
    //     success: false,
    //     message: `Franchise already exists for managedPincodes: ${managedPincodes}. Only ONE franchise allowed per managedPincodes.`,
    //   });
    // }

    
    const existingFranchiseBymanagedPincodes = await Franchise.findOne({ managedPincodes: { $in: managedPincodes } });
    if (existingFranchiseBymanagedPincodes) {
      return res.status(400).json({
        success: false,
        message: `A franchise already exists for one of the provided pincodes.`,
      });
    }

    // ================= FILE UPLOAD LOGIC STARTS HERE =================

    // 3) Upload Profile Image (Single File)
    if (req.files && req.files.profileImage && req.files.profileImage.length > 0) {
      // "franchise-profiles" फोल्डर का नाम है जहाँ इमेज सेव होगी
      profileImageUrl = await uploadFileToSpaces(req.files.profileImage[0], "franchise-profiles");
    }

    // 4) Upload KYC Documents (Multiple Files)
    if (req.files && req.files.kycDocuments && req.files.kycDocuments.length > 0) {
      // "franchise-kyc" फोल्डर का नाम है
      kycDocumentUrls = await uploadMultipleFilesToSpaces(req.files.kycDocuments, "franchise-kyc");
    }

    // ================= FILE UPLOAD LOGIC ENDS HERE =================

    // 5) Create Franchise in Database
    const franchise = await Franchise.create({
      fullName,
      email,
      phone,
      password,
      franchiseName,
      franchiseCode,
      gstNumber,
      address,
      managedPincodes,
      country,
      state,
      city,
      bankAccountNumber,
      ifscCode,
      commissionPercent,
      assignedDealers,
      profileImage: profileImageUrl, // 👈 S3 URL yahan save hoga
      kycDocuments: kycDocumentUrls, // 👈 S3 URLs array yahan save hoga
  
    });

    res.status(201).json({
      success: true,
      message: "Franchise Created Successfully",
      franchise,
    });

  } catch (error) {
    console.error("Error creating franchise:", error);

    // Rollback: अगर DB save फेल हो जाए, तो जो इमेज अपलोड हुई हैं उन्हें डिलीट कर दें (Optional but recommended)
    if (profileImageUrl) await deleteFileFromSpaces(profileImageUrl);
    if (kycDocumentUrls.length > 0) {
      for (const url of kycDocumentUrls) {
        await deleteFileFromSpaces(url);
      }
    }

    res.status(500).json({ message: "Server Error", error: error.message });
  }
};





// UPDATE VERIFICATION OR PAYMENT STATUS
export const updateFranchiseStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { verificationStatus, paymentStatus } = req.body;

    const franchise = await Franchise.findById(id);
    if (!franchise) {
      return res.status(404).json({ message: "Franchise not found" });
    }

    // Update incoming fields
    if (verificationStatus) franchise.verificationStatus = verificationStatus;
    if (paymentStatus) franchise.paymentStatus = paymentStatus;

    // AUTO STATUS LOGIC
    if (
      franchise.verificationStatus === "verified" &&
      franchise.paymentStatus === "paid"
    ) {
      franchise.status = "active"; // 🎯 Fully activated
    } else {
      franchise.status = "inactive"; // ❌ Not fully ready
    }

    await franchise.save();

    return res.status(200).json({
      success: true,
      message: "Franchise status updated",
      franchise,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};


export const getAllFranchises = async (req, res) => {
  try {
    const {
      status,
      verificationStatus,
      paymentStatus,
      search = "",
      page = 1,
      limit = 10,
    } = req.query;

    const query = {};

    // ---------------------------
    // FILTERS
    // ---------------------------
    if (status) query.status = status;
    if (verificationStatus) query.verificationStatus = verificationStatus;
    if (paymentStatus) query.paymentStatus = paymentStatus;

    // ---------------------------
    // SEARCH
    // ---------------------------
    if (search.trim() !== "") {
      const searchRegex = new RegExp(search, "i");
      query.$or = [
        { fullName: searchRegex },
        { email: searchRegex },
        { phone: searchRegex },
        { franchiseName: searchRegex },
        { franchiseCode: searchRegex },
        { managedPincodes: searchRegex },
      ];
    }

    // ---------------------------
    // PAGINATION
    // ---------------------------
    const skip = (Number(page) - 1) * Number(limit);

    // ---------------------------
    // GET DATA
    // ---------------------------
    const franchises = await Franchise.find(query)
      .populate({ path: "country", select: "name" })
      .populate({ path: "state", select: "name" })
      .populate({ path: "city", select: "name" })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    const total = await Franchise.countDocuments(query);

    // ---------------------------
    // RESPONSE
    // ---------------------------
    return res.status(200).json({
      success: true,
      message: "Franchises fetched successfully",
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(total / limit),
      },
      data: franchises,
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Server error while fetching franchises",
      error: error.message,
    });
  }
};

export const getPendingListings = async (req, res, next) => {
  try {
    // 🔐 token se direct franchise id
    const franchiseId = req.user?.franchiseId;

    if (!franchiseId) {
      return next(new ApiError(403, "Franchise ID missing in token"));
    }

    const franchise = await Franchise.findById(franchiseId);
    if (!franchise) {
      return next(new ApiError(404, "Franchise not found"));
    }

const listings = await carModel
  .find({
    pincode: { $in: franchise.managedPincodes },
    status: "pending_verification",
  })
  .select(
    "-approvedBy -approvalDate -rejectedBy -rejectionReason -rejectionDate -liveBy -liveDate -soldBy -soldDate -inquiries"
  );


    res.status(200).json({
      success: true,
      count: listings.length,
      data: listings,
    });
  } catch (err) {
    next(err);
  }
};



// ✅ Approve Listing with Comments
export const approveCarListing = async (req, res, next) => {
  try {
    const { carId } = req.params;
    const { comment } = req.body;

    const franchiseUserId = req.franchiseId; // same as reject ✅

    // ✅ comment mandatory
    if (!comment || comment.trim() === "") {
      return next(
        new ApiError(400, "Approval comment is required.")
      );
    }

    const car = await carModel.findById(carId);

    if (!car || car.status !== "pending_verification") {
      return next(
        new ApiError(404, "Car listing not found or not pending verification.")
      );
    }

    // ✅ approve logic
    car.status = "approved"; // ya "live" agar direct live karna ho
    car.approvalRemarks = comment;
    car.approvedBy = franchiseUserId;
    car.approvalDate = new Date();

    await car.save();

    res.status(200).json({
      success: true,
      message: "Car listing approved successfully.",
      data: car,
    });

  } catch (err) {
    next(err);
  }
};

// ✅ Edit Minor Info Only (SAFE)
export const editListingByFranchise = async (req, res, next) => {
  try {
    const { carId } = req.params;

    // ✅ allowed fields only
    const allowedFields = [
      "make",
      "model",
      "variant",
      "year",
      "kmDriven",
      "color",
      "expectedPrice",
      "negotiable",
      "description",
      "fuelType",
      "transmission"
    ];

    const updateData = {};

    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        updateData[field] = req.body[field];
      }
    });

    // ❌ empty update protection
    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({
        success: false,
        message: "No valid fields provided for update",
      });
    }

    const car = await carModel.findOneAndUpdate(
      {
        _id: carId,
        status: "pending_verification", // ✅ rule: only pending editable
      },
      { $set: updateData },
      { new: true, runValidators: true }
    );

    if (!car) {
      return res.status(404).json({
        success: false,
        message: "Car not found or cannot be edited",
      });
    }

    res.status(200).json({
      success: true,
      message: "Listing updated successfully",
      data: car,
    });

  } catch (err) {
    next(err);
  }
};


export const getFranchiseListings = async (req, res, next) => {
  try {
    // 🔐 Franchise ID from token
    const franchiseId = req.user?.franchiseId;

    if (!franchiseId) {
      return next(new ApiError(403, "Franchise ID missing in token"));
    }

    const franchise = await Franchise.findById(franchiseId);
    if (!franchise) {
      return next(new ApiError(404, "Franchise not found"));
    }

    // 🎯 status from query
    const { status } = req.query;

    // Allowed statuses
    const allowedStatuses = [
      "pending_verification",
      "approved",
      "live",
      "sold",
      "rejected",
    ];

    const filter = {
      pincode: { $in: franchise.managedPincodes },
    };

    // Apply status filter only if provided
    if (status) {
      if (!allowedStatuses.includes(status)) {
        return next(
          new ApiError(
            400,
            `Invalid status. Allowed: ${allowedStatuses.join(", ")}`
          )
        );
      }
      filter.status = status;
    }

    const listings = await carModel
      .find(filter)
      .select(
        "-approvedBy -approvalDate -rejectedBy  -rejectionDate -liveBy -liveDate -soldBy -soldDate -inquiries"
      )
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      status: status || "all",
      count: listings.length,
      data: listings,
    });
  } catch (err) {
    next(err);
  }
};


export const rejectCarListing = async (req, res, next) => {
  try {
    const { carId } = req.params;
    const { reason } = req.body;

    const franchiseUserId = req.franchiseId; // ✅ FIX

    if (!reason) {
      return next(new ApiError(400, "A reason for rejection is required."));
    }

    const car = await carModel.findById(carId);

    if (!car || car.status !== "pending_verification") {
      return next(
        new ApiError(404, "Car listing not found or not pending verification.")
      );
    }

    car.status = "rejected";
    car.rejectionReason = reason;
    car.rejectedBy = franchiseUserId;
    car.rejectionDate = new Date();

    await car.save();

    res.status(200).json({
      success: true,
      message: "Car listing rejected successfully.",
      data: car,
    });

  } catch (err) {
    next(err);
  }
};


export const getMyLeads = async (req, res, next) => {
  try {
    const franchise = await Franchise.findOne({ owner: req.user.id });

    if (!franchise) {
      return res.status(404).json({
        success: false,
        message: "Franchise not found for this user"
      });
    }

    const leads = await inquiryModel.find({
      pincode: { $in: franchise.managedPincodes }
    })
    .populate("car")
    .populate("buyer");

    res.status(200).json({
      success: true,
      count: leads.length,
      data: leads
    });

  } catch (err) {
    next(err);
  }
};


export const getDashboardReports = async (req, res, next) => {
    try {
        const franchiseId = req.user.id;
        
        // 1. Month-wise Sales & Revenue
        const monthlySales = await Deal.aggregate([
            { $match: { franchiseId: franchiseId, status: 'sold' } },
            {
                $group: {
                    _id: { year: { $year: "$updatedAt" }, month: { $month: "$updatedAt" } },
                    totalSales: { $sum: 1 },
                    totalRevenue: { $sum: "$finalSellingPrice" }
                }
            },
            { $sort: { "_id.year": 1, "_id.month": 1 } }
        ]);

        // 2. Lead Conversion Rate (Example: Sold Deals / Total Deals)
        const totalDeals = await Deal.countDocuments({ franchiseId: franchiseId });
        const soldDeals = await Deal.countDocuments({ franchiseId: franchiseId, status: 'sold' });
        const leadConversionRate = totalDeals > 0 ? (soldDeals / totalDeals) * 100 : 0;

        res.status(200).json({
            success: true,
            data: {
                monthlySales,
                totalRevenueGenerated: monthlySales.reduce((acc, item) => acc + item.totalRevenue, 0),
                leadConversionRate: `${leadConversionRate.toFixed(2)}%`,
            }
        });

    } catch (err) {
        next(err);
    }
};


/* ============================================================
   CREATE PAYMENT ORDER (Franchise Pays)
============================================================ */
export const createFranchisePaymentOrder = async (req, res) => {
  try {
    const { franchiseId, packageId } = req.body;

    const franchise = await Franchise.findById(franchiseId);
    if (!franchise) {
      return res.status(404).json({ message: "Franchise not found" });
    }

    if (franchise.verificationStatus !== "verified") {
      return res.status(400).json({ message: "Franchise not verified yet" });
    }

    const selectedPackage = await Package.findById(packageId);
    if (!selectedPackage || !selectedPackage.isActive) {
      return res.status(404).json({ message: "Invalid package" });
    }

    const order = await razorpayInstance.orders.create({
      amount: selectedPackage.price * 100,
      currency: "INR",
      receipt: `franchise_${franchise._id}`,
      notes: {
        type: "FRANCHISE_ACTIVATION",
        franchiseId: franchise._id.toString(),
        packageId: selectedPackage._id.toString(),
      },
    });

    res.status(200).json({
      success: true,
      order,
      package: selectedPackage
    });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};





export const razorpayWebhook = async (req, res) => {
  try {
    const secret = process.env.RZP_WEBHOOK_SECRET;

    const shasum = crypto
      .createHmac("sha256", secret)
      .update(JSON.stringify(req.body))
      .digest("hex");

    if (shasum !== req.headers["x-razorpay-signature"]) {
      return res.status(400).json({ message: "Invalid signature" });
    }

    const event = req.body;
    if (event.event !== "payment.captured") {
      return res.json({ ok: true });
    }

    const payment = event.payload.payment.entity;
    const { type, franchiseId, packageId } = payment.notes || {};

    // ==============================
    // 🟢 CAR LISTING PACKAGE
    // ==============================
    if (type === "CAR_LISTING_PACKAGE") {
      const purchase = await PackagePurchase.findOne({
        razorpayOrderId: payment.order_id,
      });

      if (!purchase) return res.json({ ok: true });

      const pkg = await Package.findById(packageId);
      if (!pkg) return res.json({ ok: true });

      await PackagePurchase.findByIdAndUpdate(purchase._id, {
        status: "SUCCESS",
        razorpayPaymentId: payment.id,
      });

      // 🔥 DIRECT FRANCHISE UPDATE
      await Franchise.findByIdAndUpdate(franchiseId, {
        $inc: { listingLimit: pkg.carListingLimit },
        activePackage: packageId,
      });

      return res.json({ ok: true });
    }

    // ==============================
    // 🟢 FRANCHISE ACTIVATION
    // ==============================
    if (type === "FRANCHISE_ACTIVATION") {
      const franchise = await Franchise.findById(franchiseId).select("+password");
      const selectedPackage = await Package.findById(packageId);

      if (!franchise || !selectedPackage) return res.json({ ok: true });

      // 👤 CREATE USER IF NOT EXISTS
      if (!franchise.owner) {
        const user = await User.create({
          fullName: franchise.fullName,
          email: franchise.email,
          phone: franchise.phone,
          password: franchise.password,
          role: "franchise",
          franchiseId: franchise._id,
        });
        franchise.owner = user._id;
      }

      franchise.paymentStatus = "paid";
      franchise.status = "active";
      franchise.activePackage = packageId;
      franchise.commissionPercent = selectedPackage.commissionPercent || 0;

      await franchise.save();
      return res.json({ ok: true });
    }

    res.json({ ok: true });
  } catch (err) {
    console.error("Webhook error:", err);
    res.status(500).json({ message: "Webhook failed" });
  }
};


////////////////////////////////////////////////////////////// end of webhook ////////////////////////////////////////////////////////////////////////////////////////////////////////





export const createFranchiseCar = async (req, res, next) => {
  try {
    const {  id: userId, role, franchiseId } = req.user;

    // 🔐 ROLE CHECK (FAST)
    if (role !== "franchise") {
      throw new ApiError(403, "Only franchise can self list cars");
    }

    // 🧠 REAL FRANCHISE DOCUMENT
    const franchise = await Franchise.findById(franchiseId);

    if (!franchise) {
      throw new ApiError(404, "Franchise profile not found");
    }

    // 🔐 LISTING LIMIT CHECK (FROM FRANCHISE MODEL)
    if (franchise.usedListings >= franchise.listingLimit) {
      throw new ApiError(
        403,
        "Free listing limit exhausted. Please purchase a package."
      );
    }

    const {
      make,
      model,
      variant,
      year,
      kmDriven,
      fuelType,
      transmission,
      expectedPrice,
      description,
      registrationCity,
      noOfOwners,
      color,
      negotiable,
      city,
     
    } = req.body;

    if (!req.files?.images) {
      throw new ApiError(400, "At least one car image is required");
    }

    const images = await Promise.all(
      req.files.images.map(file =>
        uploadFileToSpaces(file, "car-images")
      )
    );

    const documents = req.files.documents
      ? await Promise.all(
          req.files.documents.map(file =>
            uploadFileToSpaces(file, "car-documents")
          )
        )
      : [];

    const car = await carModel.create({
      sellerType: "franchise",

      make,
      model,
      variant,
      year,
      registrationCity,
      kmDriven,
      fuelType,
      transmission,
      noOfOwners,
      color,
      expectedPrice,
      negotiable,
      description,

      images,
      documents,

      sellerName: franchise.fullName,
      sellerMobile: franchise.phone,
      sellerEmail: franchise.email,

      city: registrationCity || franchise.city,
      pincode:  franchise.managedPincodes[0],

      listedBy: userId,
      franchise: franchiseId,
      isFranchiseListing: true,
      listingType: "self",

      status: "live",
      liveBy: userId,
      liveDate: new Date()
    });

    // ➕ UPDATE LIMIT
    franchise.usedListings += 1;
    await franchise.save();

    res.status(201).json({
      success: true,
      message: "Franchise car listed successfully",
      remainingLimit: franchise.listingLimit - franchise.usedListings,
      data: car
    });

  } catch (err) {
    next(err);
  }
};

 
 
// ===================================================
//      GET : FRANCHISE SELF CAR LIST
// ===================================================
export const getFranchiseCars = async (req, res, next) => {
  try {
    // 🔐 AUTH CHECK
    if (req.user.role !== "franchise") {
      throw new ApiError(403, "Only franchise can access this");
    }

    const franchiseId = req.user.franchiseId; // ✅ FIX

    // 🚗 FETCH FRANCHISE CARS
    const cars = await carModel.find({
      franchise: franchiseId,
      isFranchiseListing: true
    })
    .sort({ createdAt: -1 })
    .select(`
      sellerType
      make
      model
      variant
      year
      registrationCity
      kmDriven
      fuelType
      transmission
      noOfOwners
      color
      expectedPrice
      negotiable
      images
      description
      documents
      createdAt
      status
    `);

    res.status(200).json({
      success: true,
      total: cars.length,
      data: cars
    });

  } catch (err) {
    next(err);
  }
};


// ===================================================
//      PUT : EDIT FRANCHISE CAR
// ===================================================
export const editFranchiseCar = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { role, franchiseId } = req.user;

    if (role !== "franchise") {
      throw new ApiError(403, "Only franchise can edit listings");
    }

    const car = await carModel.findOne({
      _id: id,
      franchise: franchiseId,
      isFranchiseListing: true
    });

    if (!car) {
      throw new ApiError(404, "Car listing not found");
    }

    // ✅ ALLOWED FIELDS ONLY
    const allowedFields = [
      "make",
      "model",
      "variant",
      "year",
      "kmDriven",
      "fuelType",
      "transmission",
      "expectedPrice",
      "description",
      "registrationCity",
      "noOfOwners",
      "color",
      "negotiable"
    ];

    const updateData = {};
    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) {
        updateData[field] = req.body[field];
      }
    });

    // 🖼️ IMAGES
    if (req.files?.images) {
      const newImages = await Promise.all(
        req.files.images.map(file =>
          uploadFileToSpaces(file, "car-images")
        )
      );
      updateData.images = [...car.images, ...newImages];
    }

    // 📄 DOCUMENTS
    if (req.files?.documents) {
      const newDocs = await Promise.all(
        req.files.documents.map(file =>
          uploadFileToSpaces(file, "car-documents")
        )
      );
      updateData.documents = [...car.documents, ...newDocs];
    }

    const updatedCar = await carModel.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      message: "Car listing updated successfully",
      data: updatedCar
    });

  } catch (err) {
    next(err);
  }
};




//===============================================
//      DELETE : DELETE FRANCHISE CAR
// ===================================================


export const deleteFranchiseCar = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { role, franchiseId } = req.user;

    // 🔐 ROLE CHECK
    if (role !== "franchise") {
      throw new ApiError(403, "Only franchise can delete listings");
    }

    // 🔍 FIND CAR FIRST (DON'T DELETE YET)
    const car = await carModel.findOne({ _id: id, franchise: franchiseId });

    if (!car) {
      throw new ApiError(404, "Car not found or unauthorized");
    }

    // 🗑️ DELETE IMAGES FROM S3
    if (car.images && car.images.length > 0) {
      for (const imageUrl of car.images) {
        await deleteFileFromSpaces(imageUrl);
      }
    }

    // 🗑️ DELETE DOCUMENTS FROM S3
    if (car.documents && car.documents.length > 0) {
      for (const docUrl of car.documents) {
        await deleteFileFromSpaces(docUrl);
      }
    }

    // ❌ DELETE CAR FROM DB
    await carModel.deleteOne({ _id: id });

    // ➖ RESTORE LISTING SLOT
    await Franchise.findByIdAndUpdate(franchiseId, {
      $inc: { usedListings: -1 }
    });

    res.status(200).json({
      success: true,
      message: "Car deleted successfully and S3 files removed"
    });

  } catch (err) {
    next(err);
  }
};





export const createPackageOrder = async (req, res, next) => {
  try {
    // const { franchiseId, packageId } = req.body;

     const franchiseId = req.user.franchiseId;
    const { packageId } = req.body;
 

    const pkg = await Package.findById(packageId);
    if (!pkg || pkg.packageType !== "CAR_LISTING") {
      throw new ApiError(404, "Invalid package selected");
    }

    const order = await razorpayInstance.orders.create({
      amount: pkg.price * 100,
      currency: "INR",
      receipt: `pkg_${Date.now()}`,

   notes: {
  type: "CAR_LISTING_PACKAGE", // 🔥 SAME AS WEBHOOK
  franchiseId,
  packageId
}
    });

    // Save pending purchase
    await PackagePurchase.create({
      franchise: franchiseId,
      package: packageId,
      amount: pkg.price,
      razorpayOrderId: order.id,
      status: "PENDING",
    });

    res.status(200).json({
      success: true,
      order
    });

  } catch (err) {
    next(err);
  }
};

///////////////////////// optonl banya hai bhai /////////////////////////

export const verifyPackagePayment = async (req, res, next) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature
    } = req.body;

    const body = razorpay_order_id + "|" + razorpay_payment_id;

    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_SECRET)
      .update(body)
      .digest("hex");

    if (expectedSignature !== razorpay_signature) {
      throw new ApiError(400, "Payment verification failed");
    }

    const purchase = await PackagePurchase.findOne({
      razorpayOrderId: razorpay_order_id
    }).populate("package franchise");

    if (!purchase) {
      throw new ApiError(404, "Purchase record not found");
    }

    // ✅ Update purchase
    purchase.status = "SUCCESS";
    purchase.razorpayPaymentId = razorpay_payment_id;
    purchase.razorpaySignature = razorpay_signature;
    await purchase.save();

    // 🔥 INCREASE FRANCHISE LIMIT
    purchase.franchise.listingLimit += purchase.package.carListingLimit;
    await purchase.franchise.save();

    res.status(200).json({
      success: true,
      message: "Payment successful & package activated"
    });

  } catch (err) {
    next(err);
  }
};


//////////// bhia ya weed hook 2 nd bana ka liya hai /////////////

// export const getFranchiseDashboardReports = async (req, res) => {
//   const franchise = await Franchise.findOne({ owner: req.user.id });
 
//   const [
//     pendingListings,
//     approvedListings,
//     rejectedListings,
//     myListings,
//     activeLeads,
//     dealsInProgress
//   ] = await Promise.all([
//     Car.countDocuments({ pincode: { $in: franchise.managedPincodes }, status: "pending_verification" }),
//     Car.countDocuments({ pincode: { $in: franchise.managedPincodes }, status: "approved" }),
//     Car.countDocuments({ pincode: { $in: franchise.managedPincodes }, status: "rejected" }),
//     Car.countDocuments({ franchise: franchise._id }),
//     Inquiry.countDocuments({ pincode: { $in: franchise.managedPincodes } }),
//     Deal.countDocuments({ franchise: req.user.id, status: { $in: ["negotiating", "accepted"] } })
//   ]);
 
//   res.json({
//     success: true,
//     stats: {
//       pendingListings,
//       activeLeads,
//       dealsInProgress,
//       approvedListings,
//       rejectedListings,
//       myListings
//     }
//   });
// };

export const getFranchiseDashboardReports = async (req, res) => {
  const franchise = await Franchise.findOne({ owner: req.user.id });
 
  const [
    pendingListings,
    approvedListings,
    rejectedListings,
    myListings,
    activeLeads,
    dealsInProgress
  ] = await Promise.all([
    // Baaki sab waisa ka waisa hai
    Car.countDocuments({ pincode: { $in: franchise.managedPincodes }, status: "pending_verification" }),
    Car.countDocuments({ pincode: { $in: franchise.managedPincodes }, status: "approved" }),
    Car.countDocuments({ pincode: { $in: franchise.managedPincodes }, status: "rejected" }),
    Car.countDocuments({ franchise: franchise._id }),
    
    // 👇 SIRF YE LINE CORRECT KI HAI (Pincode hata kar ID lagaya hai)
    Inquiry.countDocuments({ 
        assignedFranchise: req.user.id, 
        status: { $in: ["pending", "contacted", "new"] } // Sirf Active wale
    }),

    Deal.countDocuments({ franchise: req.user.id, status: { $in: ["negotiating", "accepted"] } })
  ]);
 
  res.json({
    success: true,
    stats: {
      pendingListings,
      activeLeads,
      dealsInProgress,
      approvedListings,
      rejectedListings,
      myListings
    }
  });
};  


 
export const getFranchiseListingStats = async (req, res, next) => {
  try {
    const { role, franchiseId } = req.user;
 
    // 🔐 Role Check
    if (role !== "franchise") {
      throw new ApiError(403, "Only franchise can access listing stats");
    }
 
    // 🧠 Franchise Fetch
    const franchise = await Franchise.findById(franchiseId)
      .select("listingLimit usedListings activePackage");
 
    if (!franchise) {
      throw new ApiError(404, "Franchise not found");
    }
 
    const remainingListings =
      franchise.listingLimit - franchise.usedListings;
 
    res.status(200).json({
      success: true,
      message: "Franchise listing stats fetched successfully",
      data: {
        totalLimit: franchise.listingLimit,
        usedListings: franchise.usedListings,
        remainingListings:
          remainingListings > 0 ? remainingListings : 0,
        hasActivePackage: !!franchise.activePackage,
        activePackage: franchise.activePackage,
      },
    });
  } catch (error) {
    next(error);
  }
};
 
 

// ===================================================
//      TERRITORY UPDATE REQUESTS
// ===================================================

// --- 1. REQUEST TERRITORY UPDATE ---
export const requestTerritoryUpdate = async (req, res) => {
  try {
    const { requestedPincodes, reason } = req.body; // Frontend se aayega

    // Franchise Details nikalo current pincodes ke liye
    const franchiseData = await Franchise.findOne({ owner: req.user.id });
    if (!franchiseData) return res.status(404).json({ message: "Franchise profile not found" });

    // Check karo koi request already pending to nahi hai
    const existingRequest = await TerritoryRequest.findOne({ 
        franchise: req.user.id, 
        status: "pending" 
    });

    if (existingRequest) {
        return res.status(400).json({ success: false, message: "You already have a pending request. Please wait for admin approval." });
    }

    // New Request Create karo
    const newRequest = await TerritoryRequest.create({
        franchise: req.user.id,
        currentPincodes: franchiseData.managedPincodes,
        requestedPincodes: requestedPincodes, // Array of strings e.g. ["452010", "452012"]
        reason: reason
    });

    res.status(201).json({ success: true, message: "Request sent to Admin", data: newRequest });

  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

// --- 2. GET MY REQUEST HISTORY ---
export const getTerritoryRequests = async (req, res) => {
  try {
    const requests = await TerritoryRequest.find({ franchise: req.user.id })
                                           .sort({ createdAt: -1 }); // Latest upar
    res.json({ success: true, data: requests });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server Error" });
  }
};