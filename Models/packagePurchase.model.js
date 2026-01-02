import mongoose from "mongoose";

const packagePurchaseSchema = new mongoose.Schema({
  franchise: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Franchise",
    required: true
  },

  package: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Package",
    required: true
  },

  amount: {
    type: Number,
    required: true
  },

  razorpayOrderId: String,
  razorpayPaymentId: String,
  razorpaySignature: String,

  status: {
    type: String,
    enum: ["PENDING", "SUCCESS", "FAILED"],
    default: "PENDING"
  }
}, { timestamps: true });

export default mongoose.model("PackagePurchase", packagePurchaseSchema);
