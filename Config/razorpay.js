// File: Config/razorpay.js

import Razorpay from "razorpay";
import dotenv from 'dotenv';

dotenv.config(); // Suraksha ke liye yahan bhi daal sakte hain

// ==========================================================
//          DEBUGGING KE LIYE YEH LINES DAALEIN
// ==========================================================
console.log("RAZORPAY KEY ID FROM ENV:", process.env.RAZORPAY_KEY_ID);
console.log("RAZORPAY KEY SECRET FROM ENV:", process.env.RAZORPAY_SECRET ? "Loaded" : "!!! NOT LOADED !!!");
// ==========================================================


export const razorpayInstance = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_SECRET,
});