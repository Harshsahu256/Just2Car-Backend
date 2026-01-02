import User from "../Models/user.model.js";
import { uploadFileToSpaces, deleteFileFromSpaces } from "../Services/s3Service.js";
import { ApiError } from "../Utils/apiError.js";

// ================= REGISTER ADMIN =================
// export const registerAdmin = async (req, res, next) => {
//   const { fullName, email, phone, password } = req.body;
//   let imageUrl = null;

//   try {
//     if (!fullName || !email || !phone || !password) {
//       throw new ApiError(400, "All required fields must be filled.");
//     }

//     const existingUser = await User.findOne({ email });
//     if (existingUser) throw new ApiError(409, "Email already exists.");

//     if (req.file) imageUrl = await uploadFileToSpaces(req.file, "profile-images");

//     const admin = await User.create({
//       fullName,
//       email,
//       phone,
//       password,
//       role: "admin",
//       profileImage: imageUrl,
//     });

//     return res.status(201).json({
//       message: "Admin registration successful",
//       admin,
//       token: admin.getSignedJwtToken(),
//     });

//   } catch (err) {
//     if (imageUrl) await deleteFileFromSpaces(imageUrl);
//     next(err);
//   }
// };

export const registerAdmin = async (req, res, next) => {
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
      role: "admin", // 👈 FIXED ROLE FOR ADMIN
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

// ================= LOGIN ADMIN =================
export const loginAdmin = async (req, res, next) => {
  const { email, password } = req.body;

  try {
    const admin = await User.findOne({ email }).select("+password");

    if (!admin || admin.role !== "admin") {
      return next(new ApiError(401, "Unauthorized"));
    }

    const match = await admin.comparePassword(password);
    if (!match) return next(new ApiError(401, "Invalid Password"));

    return res.status(200).json({
      message: "Admin login successful",
      admin,
      token: admin.getSignedJwtToken(),
    });

  } catch (err) {
    next(err);
  }
};

export const createSubAdmin = async (req, res, next) => {
    const { fullName, email, phone, password, permissions } = req.body;
    try {
        const subAdmin = await User.create({ fullName, email, phone, password, role: 'subadmin', permissions });
        subAdmin.password = undefined;
        res.status(201).json({ success: true, message: "Sub-admin created.", subAdmin });
    } catch (err) { next(err); }
};


