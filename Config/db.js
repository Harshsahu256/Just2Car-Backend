    // Config/db.js
    import mongoose from 'mongoose';
    import { MESSAGES } from '../Utils/status.codes.messages.js';

    const connectDB = async () => {
        try {
            const conn = await mongoose.connect(process.env.MONGO_URI, {});
            console.log(`MongoDB Connected: ${MESSAGES.SUCCESS}`);
        } catch (err) {
            console.error(`${MESSAGES.INTERNAL_SERVER_ERROR}: ${err.message}`);
            process.exit(1); 
        }
    };

    export default connectDB;