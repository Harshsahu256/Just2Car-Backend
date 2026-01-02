

import mongoose from "mongoose";
import { hashPassword, comparePasswords } from '../Utils/bcryptUtils.js';
import jwt from "jsonwebtoken";

const userSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: true,
      trim: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    phone: {
      type: String,
      required: true,
      trim: true,
    },

    password: {
      type: String,
      required: true,
      select: false,
    },

    role: {
      type: String,
      enum: ["user", "subadmin", "franchise", "admin", "dealer"],
      default: "user",
    },
     // For Sub-Admin: Permissions
 permissions: [{ type: String }],
    country: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Country",
      default: null,
    },

    state: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "State",
      default: null,
    },

    city: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "City",
      default: null,
    },

    pincode: {
      type: String,
      required: true,
    },

    profileImage: {
      type: String,
      default: null,
    },

     franchiseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Franchise",
    default: null,
  },
  },
  { timestamps: true }
);

// ================= HASH PASSWORD =================
// ================= HASH PASSWORD =================
userSchema.pre("save", async function () {
  if (!this.isModified("password")) return;

  this.password = await hashPassword(this.password);
});


// ================= COMPARE PASSWORD =================
userSchema.methods.comparePassword = function (plainPassword) {
  return comparePasswords(plainPassword, this.password);
};

// // ================= GENERATE JWT TOKEN =================
// userSchema.methods.getSignedJwtToken = function () {
//   return jwt.sign(
//     { id: this._id, role: this.role },
//     process.env.JWT_SECRET,
//     { expiresIn: process.env.JWT_EXPIRE }
//   );
// };

userSchema.methods.getSignedJwtToken = function ({ franchiseId = null, dealerId = null }= {}) {
  return jwt.sign(
    {
      userId: this._id,
      role: this.role,
      franchiseId,
      dealerId,
    },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRE }
  );
};


export default mongoose.model("User", userSchema);
