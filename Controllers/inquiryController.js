import Inquiry from "../Models/inquiry.model.js";
import Car from "../Models/car.model.js";
import { ApiError } from "../Utils/apiError.js";
 import Franchise from "../Models/franchise.model.js";
import User from "../Models/user.model.js";

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