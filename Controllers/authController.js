// import User from "../Models/user.model.js";
// import { uploadFileToSpaces, deleteFileFromSpaces } from "../Services/s3Service.js";
// import { STATUS_CODES, MESSAGES } from "../Utils/status.codes.messages.js";
// import { ApiError } from "../Utils/apiError.js";
// import { Category, SubCategory, Country, State, City } from '../Models/lookupData.model.js';
// // ================= REGISTER USER ==================
// export const registerUser = async (req, res, next) => {
//     const {
//         fullName,
//         email,
//         phone,
//         password,
//         country,
//         state,
//         city,
//         pincode,
//     } = req.body;

//     const profileImageFile = req.file;
//     let profileImageUrl = null;

//     try {
//         // Validation
//         if (!fullName || !email || !phone || !password || !pincode) {
//             throw new ApiError(400, "All required fields must be filled.");
//         }

//         // Check existing user
//         const existingUser = await User.findOne({ email });
//         if (existingUser) {
//             throw new ApiError(409, "Email already exists.");
//         }

//         // Upload profile image if provided
//         if (profileImageFile) {
//             profileImageUrl = await uploadFileToSpaces(profileImageFile, "profile-images");
//         }

//         // CREATE USER
//         const user = await User.create({
//             fullName,
//             email,
//             phone,
//             password,
//             country,
//             state,
//             city,
//             pincode,
//             profileImage: profileImageUrl,
//         });

//         res.status(201).json({
//             message: "Registration successful",
//             user: {
//                 id: user._id,
//                 fullName: user.fullName,
//                 email: user.email,
//                 phone: user.phone,
//                 country: user.country,
//                 state: user.state,
//                 city: user.city,
//                 pincode: user.pincode,
//                 profileImage: user.profileImage,
//             },
//             token: user.getSignedJwtToken(),
//         });

//     } catch (err) {
//         // Delete uploaded file if registration fails
//         if (profileImageUrl) {
//             await deleteFileFromSpaces(profileImageUrl);
//         }
//         next(err);
//     }
// };


// // ================= LOGIN USER ==================
// export const loginUser = async (req, res, next) => {
//     const { email, password } = req.body;

//     try {

//         // Find user with password included
//         const user = await User.findOne({ email }).select("+password");

//         if (!user) {
//             return res.status(401).json({ message: "Invalid Email " });
//         }

//         // Compare password
//         const isMatch = await user.comparePassword(password);
//         if (!isMatch) {
//             return res.status(401).json({ message: "Invalid  Password" });
//         }

//         // SUCCESS
//         res.status(200).json({
//             message: "Login successful",
//             user: {
//                 id: user._id,
//                 fullName: user.fullName,
//                 email: user.email,
//                 phone: user.phone,
//                 profileImage: user.profileImage,
//                 country: user.country,
//                 state: user.state,
//                 city: user.city,
//                 pincode: user.pincode,
//             },
//             token: user.getSignedJwtToken(),
//         });

//     } catch (err) {
//         next(err);
//     }
// };


import Franchise from "../Models/franchise.model.js";
import User from "../Models/user.model.js";
import { uploadFileToSpaces, deleteFileFromSpaces } from "../Services/s3Service.js";
import { ApiError } from "../Utils/apiError.js";
import { STATUS_CODES } from "../Utils/status.codes.messages.js";

// ================= REGISTER =================
export const registerUser = async (req, res, next) => {
  const { fullName, email, phone, password, country, state, city, pincode } = req.body;
  let imageUrl = null;

  try {
    if (!fullName || !email || !phone || !password || !pincode) {
      throw new ApiError(400, "All required fields must be filled.");
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      throw new ApiError(409, "Email already exists.");
    }

    if (req.file) {
      imageUrl = await uploadFileToSpaces(req.file, "profile-images");
    }

    const user = await User.create({
      fullName,
      email,
      phone,
      password,
      country,
      state,
      city,
      pincode,
      profileImage: imageUrl,
    });

    return res.status(201).json({
      message: "Registration successful",
      user,
      token: user.getSignedJwtToken(),
    });

  } catch (err) {
    if (imageUrl) await deleteFileFromSpaces(imageUrl);
    next(err);
  }
};

// ================= LOGIN =================
export const  loginUser = async (req, res, next) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email }).select("+password");

    if (!user) return next(new ApiError(401, "Invalid Email"));
    const match = await user.comparePassword(password);
    if (!match) return next(new ApiError(401, "Invalid Password"));

    return res.status(200).json({
      message: "Login successful",
      user,
      token: user.getSignedJwtToken(),
    });

  } catch (err) {
    next(err);
  }
};


export const commonLogin = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      throw new ApiError(400, "Email and password required");
    }

    // 1️⃣ Find user
    const user = await User.findOne({ email: email.toLowerCase() })
      .select("+password");

    if (!user) {
      throw new ApiError(401, "Invalid email or password");
    }

    // 2️⃣ Password check
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      throw new ApiError(401, "Invalid email or password");
    }

    // ================= ROLE BASED LOGIC =================
    let franchiseId = null;
    let dealerId = null;

    // 🟢 FRANCHISE
    if (user.role === "franchise") {
      const franchise = await Franchise.findOne({ owner: user._id });

      if (!franchise)
        throw new ApiError(403, "Franchise profile not linked");

      if (franchise.status !== "active")
        throw new ApiError(403, "Franchise account inactive");

      franchiseId = franchise._id;
    }

    // 🟢 DEALER
    if (user.role === "dealer") {
      const dealer = await Dealer.findOne({ owner: user._id });

      if (!dealer)
        throw new ApiError(403, "Dealer profile not linked");

      if (dealer.status !== "active")
        throw new ApiError(403, "Dealer account inactive");

      dealerId = dealer._id;
    }

    // 🟢 ADMIN & USER → no extra check

    // 3️⃣ Generate token
    const token = user.getSignedJwtToken({
      franchiseId,
      dealerId,
    });

    // 4️⃣ Response
    res.status(200).json({
      success: true,
      message: "Login successful",
      token,
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
      },
      meta: {
        franchiseId,
        dealerId,
      },
    });

  } catch (err) {
    next(err);
  }
};


