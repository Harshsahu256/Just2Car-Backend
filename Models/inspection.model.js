//     import mongoose from "mongoose";
 
// const inspectionSchema = new mongoose.Schema({
//     car: { type: mongoose.Schema.Types.ObjectId, ref: 'Car', required: true },
//     franchise: { type: mongoose.Schema.Types.ObjectId, ref: 'Franchise', },
//     inspection: {type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
//     inspectionName: { type: String, required: true },
//     inspectionDate: { type: Date, required: true },
   
//     // Scores
//     exteriorScore: { type: Number, required: true }, // 1-10
//     interiorScore: { type: Number, required: true },
//     engineMechanicalScore: { type: Number, required: true },
//     tyresBrakesScore: { type: Number, required: true },
   
//      tyreCondition: { type: String, enum: ['New', 'Half-used', 'Need Replacement'] },
//     odometerReading: { type: Number, required: true },
//     vinChassisVerified: { type: Boolean, default: false },
//     accidentHistory: { type: String, enum: ['Yes', 'No'], required: true },
//     actualKmDriven: { type: Number },
//     photos: [{ type: String }], // S3 URLs
//     estimatedMarketPrice: { type: Number }, // Optional (N)
//     overallGrade: { type: String, enum: ['A', 'B', 'C', 'D', 'E'] }, // Optional (N)
//     minorIssues: { type: String },
//      finalRecommendation: { type: String, enum: ['approve', 'reject'] },
//     status: { type: String, enum: ['pending', 'submitted'], default: 'pending' }
// }, { timestamps: true });
 
// export default mongoose.model("inspection", inspectionSchema);


// Models/inspection.model.js



import mongoose from "mongoose";

const inspectionSchema = new mongoose.Schema({
    car: { type: mongoose.Schema.Types.ObjectId, ref: 'Car', required: true },
    franchise: { type: mongoose.Schema.Types.ObjectId, ref: 'Franchise' },
    inspection: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    inspectionName: { type: String, required: true },
    inspectionDate: { type: Date, required: true },
   
    // Scores
    exteriorScore: { type: Number, required: true },
    interiorScore: { type: Number, required: true },
    engineMechanicalScore: { type: Number, required: true },
    tyresBrakesScore: { type: Number, required: true },
   
    tyreCondition: { type: String, enum: ['New', 'Half-used', 'Need Replacement'] },
    odometerReading: { type: Number, required: true },
    vinChassisVerified: { type: Boolean, default: false },
    accidentHistory: { type: String, enum: ['Yes', 'No'], required: true },
    actualKmDriven: { type: Number },
    
    // ✅ PHOTOS & VIDEO
    photos: [{ type: String }], // Array of S3 URLs
    video: { type: String },    // ✅ NEW: Single S3 URL for inspection Video

    estimatedMarketPrice: { type: Number },
    overallGrade: { type: String, enum: ['A', 'B', 'C', 'D', 'E'] },
    minorIssues: { type: String },
    finalRecommendation: { type: String, enum: ['approve', 'reject'] },
    status: { type: String, enum: ['pending', 'submitted'], default: 'pending' }
}, { timestamps: true });

export default mongoose.model("Inspection", inspectionSchema);