import Inquiry from "../Models/inquiry.model.js";
import Car from "../Models/car.model.js";
import { ApiError } from "../Utils/apiError.js";
 import Franchise from "../Models/franchise.model.js";
import User from "../Models/user.model.js";
import mongoose from "mongoose";

export const sendInquiry = async (req, res, next) => {
  try {
    const { carId, buyerName, buyerPhone, buyerMessage } = req.body;

    const car = await Car.findById(carId);
    if (!car) {
      return next(new ApiError(404, "Car not found"));
    }

    let finalBuyerName = buyerName;
    let finalBuyerPhone = buyerPhone;
    let buyerId = null;

    // 🔐 Logged-in user case
    if (req.user && req.user.id) {
      const user = await User.findById(req.user.id).select("fullName  phone");
      if (!user) {
        return next(new ApiError(401, "User not found"));
      }

      buyerId = user._id;
      finalBuyerName = user.fullName;
      finalBuyerPhone = user.phone;
    }

    // 🛑 Guest validation
    if (!finalBuyerName || !finalBuyerPhone) {
      return next(new ApiError(400, "Buyer name and phone are required"));
    }

    const newInquiry = await Inquiry.create({
      buyerName: finalBuyerName,
      buyerPhone: finalBuyerPhone,
      buyerMessage,
      buyer: buyerId,
      car: carId,
      assignedFranchise: car.franchise
    });

    res.status(201).json({
      success: true,
      message: "Inquiry sent successfully",
      data: newInquiry
    });

  } catch (error) {
    next(error);
  }
};

export const getFranchiseInquiries = async (req, res, next) => {
  try {
    // ✅ Correct franchiseId
    const franchiseId = req.user.franchiseId;

    if (!franchiseId) {
      return next(new ApiError(403, "Franchise ID missing"));
    }

    // 🔍 Franchise fetch (for managed pincodes)
    const franchise = await Franchise.findById(franchiseId)
      .select("managedPincodes");   

    if (!franchise) {
      return next(new ApiError(404, "Franchise not found"));
    }

    const inquiries = await Inquiry.find({
      $or: [
        { assignedFranchise: franchiseId }, // direct assigned
        {
          car: {
            $in: await Car.find({
              pincode: { $in: franchise.managedPincodes }
            }).distinct("_id")
          }
        }
      ]
    })
      .populate("car", "make model registrationNumber expectedPrice city pincode images")
      .populate("buyer", "fullName phone email")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: inquiries.length,
      data: inquiries
    });

  } catch (error) {
    next(error);
  }
};



// ===================================================
//      DELETE : DELETE FRANCHISE INQUIRY
// ===================================================

export const deleteFranchiseInquiry = async (req, res, next) => {
  try {
    const { id } = req.params; // inquiry ID
    const { role, franchiseId } = req.user;

    // 🔐 ROLE CHECK: sirf franchise delete kar sakti hai
    if (role !== "franchise") {
      return next(new ApiError(403, "Only franchise can delete inquiries"));
    }

    // inquiry fetch karna
    const inquiry = await Inquiry.findById(id);

    if (!inquiry) {
      return next(new ApiError(404, "Inquiry not found"));
    }

    // 🔒 Assigned franchise check
    if (inquiry.assignedFranchise.toString() !== franchiseId) {
      return next(new ApiError(403, "You are not authorized to delete this inquiry"));
    }

    await inquiry.deleteOne();

    res.status(200).json({
      success: true,
      message: "Inquiry deleted successfully"
    });

  } catch (error) {
    next(error);
  }
};

//======================Updated stutes inqury================//

export const updateInquiryStatus = async (req, res, next) => {
  try {
    const { inquiryId } = req.params;
    const { status } = req.body;

    // ✅ Allowed status check
    const allowedStatus = ["pending", "contacted", "closed", "converted"];

    if (!allowedStatus.includes(status)) {
      return next(new ApiError(400, "Invalid status value"));
    }

    // ✅ Inquiry find
    const inquiry = await Inquiry.findById(inquiryId);

    if (!inquiry) {
      return next(new ApiError(404, "Inquiry not found"));
    }

    // ✅ Security: sirf assigned franchise hi update kar sakta hai
    if (inquiry.assignedFranchise.toString() !== req.user.franchiseId.toString()) {
      return next(new ApiError(403, "You are not allowed to update this inquiry"));
    }

    // ✅ Update status
    inquiry.status = status;
    await inquiry.save();

    res.status(200).json({
      success: true,
      message: "Inquiry status updated successfully",
      data: inquiry
    });

  } catch (error) {
    next(error);
  }
};



//==============================each Car inqury/////////////////////////////////////

export const getSingleCarInquiries = async (req, res) => {
  try {
    // ✅ IMPORTANT FIX HERE
    const franchiseId = req.user.franchiseId; 
    const { carId } = req.params;

    // 1️⃣ Car exists check
    const car = await Car.findOne({
      _id: carId,
      franchise: franchiseId,
      status: "live",
    });

    if (!car) {
      return res.status(404).json({
        success: false,
        message: "Car not found or not authorized",
      });
    }

    // 2️⃣ Inquiries fetch
    const inquiries = await Inquiry.find({
      car: carId,
      assignedFranchise: franchiseId,
    }).sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      car: {
        make: car.make,
        model: car.model,
        variant: car.variant,
        year: car.year,
      },
      totalInquiries: inquiries.length,
      inquiries,
    });

  } catch (error) {
    console.error("Single Car Inquiry Error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};
