

// import mongoose from "mongoose";
 
// const carSchema = new mongoose.Schema({
//     // --- Seller Details (From Form) ---
//     sellerName: { type: String, required: true },
//     sellerMobile: { type: String, required: true },
//     sellerEmail: { type: String }, // Optional (N)
 
//     // --- Car Details ---
//     city: { type: String, required: true },
//     pincode: { type: String, required: true }, // Franchise assign karne ke liye
   
//     make: { type: String, required: true },     // e.g., Maruti
//     model: { type: String, required: true },    // e.g., Swift
//     variant: { type: String },                  // e.g., VXI (Optional N)
//     year: { type: Number, required: true },
//     kmDriven: { type: Number, required: true },

 
   
//     fuelType: {
//         type: String,
//         enum: ['Petrol', 'Diesel', 'CNG', 'Electric', 'LPG', 'Hybrid'],
//         required: true
//     },
   
//     transmission: {
//         type: String,
//         enum: ['Manual', 'Automatic'],
//         required: true
//     },  
 
//     registrationNumber: { type: String }, // Optional (N) - Image says partial/optional
   
//     noOfOwners: { type: Number }, // Optional (N) - Replaces 'ownership' string to number
 
//     expectedPrice: { type: Number }, // Optional (N) in image, but usually important
   
//     description: { type: String }, // Optional (N)
 
//     // --- Media ---
//     images: [{ type: String, required: true }], // Min 5 recommended (Validated in controller)
//     documents: [{ type: String }], // Optional in Schema, but Form says Y (Required) - we can handle in controller
//     inspectionVideo: { type: String }, // Optional
 
//     // --- System Fields ---
//     listedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
   
//     // Franchise logic: Pincode ke base par backend assign karega
//     franchise: { type: mongoose.Schema.Types.ObjectId, ref: 'Franchise' },
   
//     status: {
//         type: String,
//         enum: ['pending_verification', 'approved', 'live', 'sold', 'rejected'],
//         default: 'pending_verification'
//     },
   
//     qualityRating: { type: Number, min: 0, max: 5, default: 0 },
//     views: { type: Number, default: 0 },
//     inquiries: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Inquiry' }],

//     // ------------------------------------
//     // APPROVAL / REJECTION TRACKING SYSTEM
//     // ------------------------------------
//     approvedBy: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: "User",
//       default: null,
//     },

//     approvalDate: {
//       type: Date,
//       default: null,
//     },

//     rejectedBy: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: "User",
//       default: null,
//     },

//     rejectionReason: {
//       type: String,
//       default: null,
//     },

//     rejectionDate: {
//       type: Date,
//       default: null,
//     },

//     liveBy: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: "User",
//       default: null,
//     },

//     liveDate: {
//       type: Date,
//       default: null,
//     },

//     soldBy: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: "User",
//       default: null,
//     },

//     soldDate: {
//       type: Date,
//       default: null,
//     },

 
// }, { timestamps: true });
 
// export default mongoose.model('Car', carSchema);




 
    import mongoose from "mongoose";
 
    const carSchema = new mongoose.Schema({
 
        // ============================================================
        // 1. SELLER & CAR BASIC DETAILS
        // ============================================================
        sellerName: { type: String, required: true },
        sellerMobile: { type: String, required: true },
        sellerEmail: { type: String },
 
        city: { type: String, required: true },
        pincode: { type: String, required: true },
 
        make: { type: String, required: true },
        model: { type: String, required: true },
        variant: { type: String },
 
        year: { type: Number, required: true }, // Manufacturing Year
        kmDriven: { type: Number, required: true },
 
        fuelType: {
            type: String,
            enum: ['Petrol', 'Diesel', 'CNG', 'Electric', 'LPG', 'Hybrid'],
            required: true
        },
 
        transmission: {
            type: String,
            enum: ['Manual', 'Automatic'],
            required: true
        },
        // 🔥 NEW (Excel: Registration Year / City)
        registrationCity: {
            type: String,
            required: true
        },
 
        registrationNumber: { type: String },
 
        noOfOwners: { type: Number, default: 1 },
 
        // 🔥 NEW
        color: { type: String },
 
        expectedPrice: { type: Number, required: true },
 
        // 🔥 NEW
        negotiable: {
            type: Boolean,
            default: false
        },
 
        description: { type: String },
 
        // ============================================================
        // 2. MEDIA & DOCUMENTS
        // ============================================================
        images: [{ type: String, required: true }],
 
        documents: [{ type: String, required: true }], // Excel me Y tha
 
        inspectionVideo: { type: String },
 
        // ============================================================
        // 3. LISTING OWNERSHIP & TYPE
        // ============================================================
        listedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
 
        franchise: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            default: null
        },
 
        listingType: {
            type: String,
            enum: ['self', 'assisted'],
            default: 'assisted'
        },
 
        isFranchiseListing: {
            type: Boolean,
            default: false
        },
 
        // 🔥 NEW (Seller Type)
        sellerType: {
            type: String,
            enum: ['franchise', 'individual'],
            required: true,
              default: 'individual'
        },
 
        // ============================================================
        // 4. STATUS & VISIBILITY
        // ============================================================
        status: {
            type: String,
            enum: ['pending_verification', 'approved', 'live', 'sold', 'rejected'],
            default: 'pending_verification'
        },
 
        qualityRating: { type: Number, min: 0, max: 5, default: 0 },
        views: { type: Number, default: 0 },
        inquiries: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Inquiry' }],
 
        // ============================================================
        // 5. VERIFICATION & APPROVAL
        // ============================================================
        verificationChecks: {
            rcVerified: { type: Boolean, default: false },
            insuranceVerified: { type: Boolean, default: false },
            pucVerified: { type: Boolean, default: false }
        },
 
        inspectionReport: { type: String, default: null },
        approvalRemarks: { type: String, default: null },
 
        // ============================================================
        // 6. TRACKING LOGS
        // ============================================================
        approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
        approvalDate: { type: Date, default: null },
 
        rejectedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
        rejectionReason: { type: String, default: null },
        rejectionDate: { type: Date, default: null },
 
        liveBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
        liveDate: { type: Date, default: null },
 
        soldBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
        soldDate: { type: Date, default: null },
 
    }, { timestamps: true });
 
    export default mongoose.model('Car', carSchema);
 


