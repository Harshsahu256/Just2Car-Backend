import mongoose from "mongoose";

const territoryRequestSchema = new mongoose.Schema({
  franchise: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User", // Franchise User ID
    required: true
  },
  currentPincodes: [{ type: String }], // Request ke time jo pincodes the
  requestedPincodes: [{ type: String, required: true }], // Jo naye chahiye
  reason: { type: String, required: true },
  
  status: {
    type: String,
    enum: ["pending", "approved", "rejected"],
    default: "pending"
  },
  adminRemark: { type: String, default: "" } // Agar admin reject kare to kyu kiya
}, { timestamps: true });

export default mongoose.model("TerritoryRequest", territoryRequestSchema);