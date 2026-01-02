// import mongoose from "mongoose";

// const dealSchema = new mongoose.Schema({
//     inquiry: { type: mongoose.Schema.Types.ObjectId, ref: 'Inquiry', required: true },
//     car: { type: mongoose.Schema.Types.ObjectId, ref: 'Car', required: true },
//     franchise: { type: mongoose.Schema.Types.ObjectId, ref: 'Franchise', required: true },
//     buyer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },

//     // --- Negotiation Flow ---
//     negotiationHistory: [
//         {
//             offeredBy: { type: String, enum: ["buyer", "franchise"], required: true },
//             amount: { type: Number, required: true },
//             message: { type: String },
//             timestamp: { type: Date, default: Date.now }
//         }
//     ],

//     // --- Final Selling Info ---
//     finalSellingPrice: { type: Number },
//     paymentMode: { type: String, enum: ["cash", "online", "finance"], default: "cash" },

//     franchiseCommission: { type: Number, default: 0 },
//     platformCommission: { type: Number, default: 0 },

//     // --- Status ---
//     dealStatus: {
//         type: String,
//         enum: ["in_progress", "sold", "cancelled"],
//         default: "in_progress"
//     },

//     closingNotes: { type: String },
//     cancelledReason: { type: String },

// }, { timestamps: true });

// export default mongoose.model("Deal", dealSchema);


import mongoose from "mongoose";

const dealSchema = new mongoose.Schema({
  inquiry: { type: mongoose.Schema.Types.ObjectId, ref: "Inquiry", required: true, unique: true },
  car: { type: mongoose.Schema.Types.ObjectId, ref: "Car", required: true },
  franchise: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  buyer: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },

  // OLX style negotiation history
  // Ismein Buyer aur Franchise ki baatein rahengi
  negotiation: [
    {
      sender: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      senderRole: { type: String, enum: ["buyer", "franchise"] },
      offeredPrice: { type: Number },
      message: { type: String },
      createdAt: { type: Date, default: Date.now }
    }
  ],

  // Final details
  initialPrice: { type: Number, required: true }, // Car ki original price
  finalAgreedPrice: { type: Number, default: null },
  
  status: {
    type: String,
    enum: ["negotiating", "accepted", "sold", "cancelled"],
    default: "negotiating"
  },

  // Payment & Delivery
  paymentMethod: { type: String },
  paymentStatus: { type: String, enum: ["pending", "completed"], default: "pending" },
  rcTransferStatus: { type: String, default: "not_initiated" },
  franchiseCommission: { type: Number },

}, { timestamps: true });

export default mongoose.model("Deal", dealSchema);