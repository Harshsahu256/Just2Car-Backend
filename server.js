
import express from "express";
import http from "http";
import cors from "cors";
import "dotenv/config";
 
import connectDB from "./Config/db.js";
import adminRoutes from "./Routes/admin.routes.js";
import subadminRoutes from "./Routes/subadmin.routes.js";
import dealerRoutes from "./Routes/dealer.routes.js";
import franchiseRoutes from "./Routes/franchise.routes.js";
import userRoutes from "./Routes/user.routes.js";
import authRoutes from "./Routes/auth.routes.js";
import { initSocket } from "./Services/socket.js";
 
const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 3010;
 
connectDB();
 
app.use(cors({ origin: "*", methods: "*"}));
app.use(express.json());
 
app.use("/api/v1/admin", adminRoutes);
app.use("/api/v1/subadmin", subadminRoutes);
app.use("/api/v1/dealer", dealerRoutes);
app.use("/api/v1/franchise", franchiseRoutes);
app.use("/api/v1/user", userRoutes);
app.use("/api/v1/auth", authRoutes);
 
initSocket(server);
 
server.listen(PORT, () => {
  console.log("🚀 Server + Socket running on", PORT);
});
