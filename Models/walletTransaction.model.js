import mongoose from 'mongoose';

const walletTransactionSchema = new mongoose.Schema({
    dealer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    amount: { type: Number, required: true }, // Can be positive (credit) or negative (debit)
    type: { type: String, enum: ['credit', 'debit'], required: true },
    reason: { type: String, enum: ['deposit', 'lead_purchase', 'package_purchase', 'refund', 'admin_adjustment'], required: true },
    transactionId: { type: String }, // For Razorpay or other payment gateways
    description: { type: String },
}, { timestamps: true });

export default mongoose.model('WalletTransaction', walletTransactionSchema);