

// import mongoose from "mongoose";
// import bcrypt from "bcryptjs";

// const franchiseSchema = new mongoose.Schema(
//   {
  
//     owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', },
//     franchiseName: { type: String, required: true },
  
//     fullName: { type: String, required: true },
//     email: { type: String, required: true, unique: true },
//     phone: { type: String, required: true },
//     password: { type: String, required: true, select: false },


    

//     franchiseCode: {
//       type: String,
//       required: true,
//       unique: true,
//       trim: true,     
//     },

//     gstNumber: { type: String },

//     address: { type: String, required: true },
//       // A franchise can manage multiple pincodes
//     managedPincodes: [{ type: String, required: true }],
    

//     country: { type: mongoose.Schema.Types.ObjectId, ref: "Country" },
//     state: { type: mongoose.Schema.Types.ObjectId, ref: "State" },
//     city: { type: mongoose.Schema.Types.ObjectId, ref: "City" },


//     bankAccountNumber: { type: String },
//     ifscCode: { type: String },
//     commissionPercent: { type: Number, default: 0 },

 
//     assignedDealers: [
//       { type: mongoose.Schema.Types.ObjectId, ref: "Dealer" }
//     ],

   
//     profileImage: { type: String },
//        kycDocuments: [
//       {
//         type: String, 
//       },
//     ],


 
//     role: { type: String, default: "franchise" },
    
//    verificationStatus: {
//       type: String,
//       enum: ["pending", "verified"],
//       default: "pending",
//     },

//     paymentStatus: {
//       type: String,
//       enum: ["pending", "paid"],
//       default: "pending",
//     },

//         // Franchise Model me add karo
//       listingLimit: {
//         type: Number,
//         default: 3, // 🎯 free listings
//       },

//       usedListings: {
//         type: Number,
//         default: 0,
//       },

//       activePackage: {
//         type: mongoose.Schema.Types.ObjectId,
//         ref: "Package",
//         default: null,
//       },

//     status: {
//       type: String,
//       enum: ["inactive", "active"],
//       default: "inactive",
//     },
//   },
//   { timestamps: true }
// );


// franchiseSchema.pre("save", async function () {
//   if (!this.isModified("password")) return;  // no next()
//   this.password = await bcrypt.hash(this.password, 10);
// });


// franchiseSchema.methods.comparePassword = async function (plain) {
//   return await bcrypt.compare(plain, this.password);
// };


// export default mongoose.model("Franchise", franchiseSchema);



import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const franchiseSchema = new mongoose.Schema(
  {
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },

    // --- 1. Basic Info (Contact Person) ---
    fullName: { type: String, required: true }, // Contact Person Name
    email: { type: String, required: true, unique: true },
    phone: { type: String, required: true },
    password: { type: String, required: true, select: false },

    // --- 2. Franchise Info ---
    franchiseName: { type: String, required: true }, // Duplicate removed
    franchiseCode: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    gstNumber: { type: String },

    // --- 3. Location & Address ---
    address: { type: String, required: true }, // Requirement: N, but Schema: Y (Keep as is if needed)
    managedPincodes: [{ type: String, required: true }],
    
    country: { type: mongoose.Schema.Types.ObjectId, ref: "Country" },
    state: { type: mongoose.Schema.Types.ObjectId, ref: "State" },
    city: { type: mongoose.Schema.Types.ObjectId, ref: "City" },

    // --- 4. Bank Details (Expanded) ---
    bankAccountNumber: { type: String, default: "" },
    ifscCode: { type: String, default: "" },
    bankName: { type: String, default: "" }, // ✅ Added
    upiId: { type: String, default: "" },    // ✅ Added

    // --- 5. New Field ---
    workingHours: { type: String, default: "" }, // ✅ Added (Required: N)

    commissionPercent: { type: Number, default: 0 },
    assignedDealers: [
      { type: mongoose.Schema.Types.ObjectId, ref: "Dealer" }
    ],

    // --- 6. Media & Docs ---
    profileImage: { type: String },
    
    // KYC Documents (Array of URLs)
    kycDocuments: [
      {
        type: String, 
      },
    ],

    // --- 7. Status & Role ---
    role: { type: String, default: "franchise" },
    
    verificationStatus: {
      type: String,
      enum: ["pending", "verified"],
      default: "pending",
    },

    paymentStatus: {
      type: String,
      enum: ["pending", "paid"],
      default: "pending",
    },

    // --- 8. Listings & Package Logic ---
    listingLimit: {
      type: Number,
      default: 3, // 🎯 free listings
    },

    usedListings: {
      type: Number,
      default: 0,
    },

    activePackage: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Package",
      default: null,
    },

    status: {
      type: String,
      enum: ["inactive", "active"],
      default: "inactive",
    },
  },
  { timestamps: true }
);

// Password Hashing Middleware
franchiseSchema.pre("save", async function () {
  if (!this.isModified("password")) return;
  this.password = await bcrypt.hash(this.password, 10);
});

// Password Comparison Method
franchiseSchema.methods.comparePassword = async function (plain) {
  return await bcrypt.compare(plain, this.password);
};

export default mongoose.model("Franchise", franchiseSchema);