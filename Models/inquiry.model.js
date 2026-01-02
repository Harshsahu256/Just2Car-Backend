// import mongoose from "mongoose";

// const inquirySchema = new mongoose.Schema({
//     car: { type: mongoose.Schema.Types.ObjectId, ref: 'Car', required: true },
//     inquirer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // The user who is interested
//     franchise: { type: mongoose.Schema.Types.ObjectId, ref: 'Franchise' }, // The franchise handling the deal
//     dealer: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // The dealer if car is listed by dealer
    
//     finalOfferPrice: { type: Number },
//     status: { 
//         type: String, 
//         enum: ['new', 'contacted', 'negotiating', 'deal_closed', 'cancelled'], 
//         default: 'new' 
//     },
//     sellerResponse: { type: String, enum: ['pending', 'accepted', 'rejected'], default: 'pending' },
//     buyerResponse: { type: String, enum: ['pending', 'accepted', 'rejected'], default: 'pending' },
    
// }, { timestamps: true });

// export default mongoose.model('Inquiry', inquirySchema);


 
import mongoose from "mongoose";
 
const inquirySchema = new mongoose.Schema({
 
    // --- Buyer Details (UI / display ke liye) ---
    buyerName: { type: String, required: true },
    buyerPhone: { type: String, required: true },
    buyerMessage: { type: String },
 
    // ✅ NEW FIELD (MAIN FIX)
    buyer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",      // ya "Buyer" agar alag model hai
        required: false  // ⚠️ old inquiries break na ho
    },
 
    // --- Car & Seller Info ---
    car: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Car",
        required: true
    },
 
    assignedFranchise: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
 
    status: {
        type: String,
        enum: ["pending", "contacted", "closed", "converted"],
        default: "pending"
    }
 
}, { timestamps: true });
 
export default mongoose.model("Inquiry", inquirySchema);
 
 