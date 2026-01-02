
import mongoose from "mongoose";

const packageSchema = new mongoose.Schema(
  {
    // 🔹 Package kisne banaya
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User", // admin ya franchise
      required: true,
    },

    creatorRole: {
      type: String,
      enum: ["admin", "franchise"],
      required: true,
    },

    // 🔹 Package ka TYPE
    packageType: {
      type: String,
      enum: ["CAR_LISTING", "FRANCHISE", "ADS"],
      required: true,
    },

    // 🔹 Common fields
    name: {
      type: String,
      required: true, // "Gold Listing", "Franchise Gold"
    },

    price: {
      type: Number,
      required: true,
    },

    isActive: {
      type: Boolean,
      default: true,
    },

    // ==========================
    // 🟢 CAR LISTING PACKAGE
    // ==========================
    carListingLimit: {
      type: Number,
      default: 0,
    },

    validityDays: {
      type: Number,
      default: null,
    },

    // ==========================
    // 🔵 FRANCHISE PACKAGE
    // ==========================
    commissionPercent: {
      type: Number,
      min: 0,
      max: 100,
      default: 0, // Admin ka cut
    },

    // ==========================
    // 🟣 ADS PACKAGE
    // ==========================
    adSlots: {
      type: Number,
      default: 0,
    },

    description: String,
  },
  { timestamps: true }
);

export default mongoose.model("Package", packageSchema);
