import { Server } from "socket.io";
 
let io;
 
export const initSocket = (server) => {
  io = new Server(server, {
    cors: { origin: "*" }
  });
 
  io.use((socket, next) => {
    const userId = socket.handshake.auth?.userId;
    if (!userId) return next(new Error("Unauthorized"));
    socket.userId = userId;
    next();
  });
 
  io.on("connection", (socket) => {
    console.log("🟢 Socket connected:", socket.userId);
 
    socket.on("joinDealRoom", (dealId) => {
      socket.join(dealId);
      console.log("Joined deal room:", dealId);
    });
  });
};
 
export const getIO = () => {
  if (!io) throw new Error("Socket not initialized");
  return io;
};
 