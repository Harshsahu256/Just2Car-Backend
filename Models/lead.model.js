import mongoose from "mongoose";

const leadSchema = new mongoose.Schema({
    // Lead details uploaded by admin
    name: { type: String, required: true },
    phone: { type: String, required: true },
    email: { type: String },
    city: { type: String },
    requirements: { type: String }, // e.g., "Looking for a hatchback under 5 lakhs"
    
    price: { type: Number, required: true, default: 0 }, // Price to purchase the lead
    
    status: {
        type: String,
        enum: ['available', 'sold_out'],
        default: 'available',
    },
    
    // Dealers who purchased this lead (max 2)
    purchasedBy: [{ 
        dealerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        purchaseDate: { type: Date, default: Date.now }
    }],
    
    // Rating given by dealer
    ratings: [{
        dealerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        rating: { type: Number, min: 1, max: 5 },
        comment: { type: String }
    }]
}, { timestamps: true });

export default mongoose.model('Lead', leadSchema);