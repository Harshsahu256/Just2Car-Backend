import Inquiry from "../Models/inquiry.model.js";
import Car from "../Models/car.model.js";
import Deal from "../Models/deal.model.js";
import { getIO } from "../Services/socket.js";
 
export const startDeal = async (req, res) => {
  try {
    const io = getIO();
    const { inquiryId } = req.body;
    const userId = req.user.id;
 
    const inquiry = await Inquiry.findById(inquiryId).populate("car");
    if (!inquiry) {
      return res.status(404).json({ message: "Inquiry not found" });
    }
 
    // ✅ STEP 1: Check existing deal for this inquiry
    const existingDeal = await Deal.findOne({ inquiry: inquiryId });
 
    if (existingDeal) {
      return res.status(400).json({
        message: "Deal already exists",
        dealId: existingDeal._id
      });
    }
 
    // ✅ STEP 2: Create new deal
    const deal = await Deal.create({
      inquiry: inquiryId,
      car: inquiry.car._id,
      franchise: userId,
      buyer: inquiry.buyer,
      initialPrice: inquiry.car.expectedPrice,
      status: "negotiating",
      negotiation: []
    });
 
    io.to(deal._id.toString()).emit("dealStarted", { dealId: deal._id });
 
    res.json({ success: true, data: deal });
 
  } catch (error) {
    console.error("Start Deal Error:", error);
    res.status(500).json({ message: error.message });
  }
};
 
 
export const makeOffer = async (req, res) => {
  try {
    const io = getIO();
    const { dealId, offeredPrice, message } = req.body;
    const userId = req.user.id;
 
    const deal = await Deal.findById(dealId);
    if (!deal) return res.status(404).json({ message: "Deal not found" });
 
    const role = deal.franchise.toString() === userId.toString() ? "franchise" : "buyer";
 
    const newMessage = { sender: userId, senderRole: role, offeredPrice, message, timestamp: new Date() };
    deal.negotiation.push(newMessage);
    await deal.save();
 
    // Broadcast to the room
    io.to(dealId.toString()).emit("newOffer", newMessage);
 
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
 
 
export const finalizeDeal = async (req, res, next) => {
  try {
    const io = getIO();
    const { dealId, finalPrice, paymentMethod } = req.body;
    const userId = req.user.id;
 
    const deal = await Deal.findById(dealId);
    if (!deal) return res.status(404).json({ message: "Deal not found" });
 
    if (deal.franchise.toString() !== userId.toString()) {
      return res.status(403).json({ message: "Only franchise can finalize deal" });
    }
 
    deal.finalAgreedPrice = finalPrice;
    deal.paymentMethod = paymentMethod;
    deal.status = "sold";
    deal.paymentStatus = "completed";
    deal.closureDate = new Date();
 
    await deal.save();
 
    await Car.findByIdAndUpdate(deal.car, { status: "sold" });
    await Inquiry.findByIdAndUpdate(deal.inquiry, { status: "converted" });
 
    io.to(dealId.toString()).emit("dealFinalized", {
      dealId,
      finalPrice,
      status: "sold",
    });
 
    res.json({ success: true, message: "Deal finalized", data: deal });
  } catch (err) {
    next(err);
  }
};
 
export const getDealDetails = async (req, res) => {
  try {
    const { dealId } = req.params;
 
    const deal = await Deal.findById(dealId)
      .populate("negotiation.sender", "fullName role");
 
    if (!deal) {
      return res.status(404).json({ message: "Deal not found" });
    }
 
    res.json({
      success: true,
      data: deal
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
 

// 1. Get All Deals for Franchise
export const getFranchiseDeals = async (req, res) => {
  try {
    const deals = await Deal.find({ franchise: req.user.id })
      .populate("car", "make model year expectedPrice images registrationNumber")
      .populate("buyer", "fullName email phone")
      .sort({ updatedAt: -1 }); // Jo abhi update hui wo upar dikhegi

    res.json({ success: true, data: deals });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 2. Update Deal Status (Negotiate -> Sold)
export const updateDealStatus = async (req, res) => {
  try {
    const { dealId } = req.params;
    const { status, finalPrice, note } = req.body;

    const deal = await Deal.findById(dealId);
    if (!deal) return res.status(404).json({ success: false, message: "Deal not found" });

    // Status Update
    deal.status = status;

    // Agar Note aaya hai (Negotiation history ke liye)
    if (note) {
      deal.negotiation.push({
        sender: req.user.id,
        senderRole: "franchise",
        message: note,
        offeredPrice: finalPrice || 0
      });
    }

    // 🔥 CRITICAL: Agar Deal "Sold" mark ho rahi hai
    if (status === "sold") {
      if (!finalPrice) {
        return res.status(400).json({ success: false, message: "Final Price is required to close the deal" });
      }

      deal.finalAgreedPrice = finalPrice;
      deal.paymentStatus = "completed";
      
      // Calculate Commission (Example: 2% of Final Price)
      deal.franchiseCommission = finalPrice * 0.02; 

      // 🛑 Car Status ko bhi "Sold" update karna padega
      await Car.findByIdAndUpdate(deal.car, { 
        status: "sold",
        soldBy: req.user.id,
        soldDate: new Date()
      });
    }

    // Agar Deal Cancel ho gayi
    if (status === "cancelled") {
        // Car ko wapas available kar do agar deal toot gayi
        await Car.findByIdAndUpdate(deal.car, { status: "approved" });
    }

    await deal.save();

    res.json({ success: true, message: "Deal updated successfully", data: deal });

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
 