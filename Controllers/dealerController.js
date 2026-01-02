import User from "../Models/user.model.js";
import { uploadFileToSpaces, deleteFileFromSpaces } from "../Services/s3Service.js";
import { ApiError } from "../Utils/apiError.js";

export const registerdealer = async (req, res, next) => {
  const { fullName, email, phone, password, country, state, city, pincode } = req.body;
  let imageUrl = null;

  try {
    // Required fields check
    if (!fullName || !email || !phone || !password || !pincode) {
      throw new ApiError(400, "All required fields must be filled.");
    }

    // Check if email already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      throw new ApiError(409, "Email already exists.");
    }

    // Upload admin profile image (optional)
    if (req.file) {
      imageUrl = await uploadFileToSpaces(req.file, "profile-images");
    }

    // Create Admin
    const admin = await User.create({
      fullName,
      email,
      phone,
      password,
      country,
      state,
      city,
      pincode,
      profileImage: imageUrl,
      role: "dealer", // 👈 FIXED ROLE FOR ADMIN
    });

    return res.status(201).json({
      message: "Admin registration successful",
      admin,
      token: admin.getSignedJwtToken(),
    });

  } catch (err) {
    if (imageUrl) await deleteFileFromSpaces(imageUrl);
    next(err);
  }
};

// ================= LOGIN Dealer =================

export const loginDealer = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const dealer = await User.findOne({ email }).select("+password");
    if (!dealer || dealer.role !== "dealer") throw new ApiError(401, "Unauthorized");

    const match = await dealer.comparePassword(password);
    if (!match) throw new ApiError(401, "Invalid credentials");

    return res.status(200).json({
      message: "Dealer login success",
      dealer,
      token: dealer.getSignedJwtToken(),
    });
  } catch (err) {
    next(err);
  }
};



// ========================================================
// ✔ CREATE RAZORPAY ORDER FOR WALLET RECHARGE
// ========================================================
export const createWalletOrder = async (req, res, next) => {
  try {
    const { amount } = req.body;
    if (!amount) throw new ApiError(400, "Amount is required");

    const order = await razorpayInstance.orders.create({
      amount: amount * 100,
      currency: "INR",
      receipt: "wallet_" + Date.now(),
    });

    return res.status(200).json({
      success: true,
      orderId: order.id,
      amount,
      key: process.env.RAZORPAY_KEY_ID,
    });
  } catch (err) {
    next(err);
  }
};

// ========================================================
// ✔ VERIFY PAYMENT + ADD MONEY IN WALLET
// ========================================================
export const verifyWalletPayment = async (req, res, next) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, amount } = req.body;
    const dealerId = req.user.id;

    const sign = razorpay_order_id + "|" + razorpay_payment_id;

    const expectedSign = crypto
      .createHmac("sha256", process.env.RAZORPAY_SECRET)
      .update(sign.toString())
      .digest("hex");

    if (expectedSign !== razorpay_signature) {
      throw new ApiError(400, "Invalid payment signature");
    }

    const dealer = await User.findById(dealerId);

    dealer.wallet += Number(amount);
    dealer.walletHistory.push({
      amount,
      type: "credit",
      description: "Wallet Recharge",
      transactionId: razorpay_payment_id,
    });

    await dealer.save();

    return res.status(200).json({
      success: true,
      message: "Wallet recharge successful",
      wallet: dealer.wallet,
    });
  } catch (err) {
    next(err);
  }
};

// ========================================================
// ✔ WALLET HISTORY
// ========================================================
export const getWalletHistory = async (req, res, next) => {
  try {
    const dealer = await User.findById(req.user.id);

    return res.status(200).json({
      success: true,
      wallet: dealer.wallet,
      history: dealer.walletHistory,
    });
  } catch (err) {
    next(err);
  }
};

// ========================================================
// ✔ PURCHASE LEAD (Wallet Deduction)
// ========================================================
export const purchaseLead = async (req, res, next) => {
  try {
    const { leadId, price } = req.body;

    const dealer = await User.findById(req.user.id);

    if (dealer.wallet < price) {
      throw new ApiError(400, "Insufficient wallet balance");
    }

    dealer.wallet -= price;
    dealer.walletHistory.push({
      amount: price,
      type: "debit",
      description: `Lead Purchase #${leadId}`,
      transactionId: "LEAD-" + Date.now(),
    });

    await dealer.save();

    return res.status(200).json({
      success: true,
      message: "Lead purchased successfully",
      wallet: dealer.wallet,
    });
  } catch (err) {
    next(err);
  }
};

// ========================================================
// ✔ LIST CAR (Auto-Approved + Listing Limit Based on Package)
// ========================================================
export const listCar = async (req, res, next) => {
  try {
    const dealerId = req.user.id;
    const { title, model, year, price } = req.body;

    const dealer = await User.findById(dealerId);

    const listedCars = await Car.countDocuments({ dealer: dealerId });

    let maxLimit = 3; // Default free limit

    const activePackage = await Package.findOne({ dealer: dealerId, isActive: true });
    if (activePackage) maxLimit = activePackage.maxCars;

    if (listedCars >= maxLimit) {
      throw new ApiError(400, "Car listing limit exceeded. Please buy a package.");
    }

    const car = await Car.create({
      dealer: dealerId,
      title,
      model,
      year,
      price,
      status: "approved", // Auto-approved
    });

    return res.status(201).json({
      success: true,
      message: "Car listed successfully",
      car,
    });
  } catch (err) {
    next(err);
  }
};