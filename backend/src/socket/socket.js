import { Server } from "socket.io";

let io;

export const initializeSocket = (server) => {
    io = new Server(server, {
        cors: {
            origin: "https://rfq-british-auction-system-1-1yzw.onrender.com",
            credentials: true,
        },
    });

    io.on("connection", (socket) => {
        console.log("Client connected:", socket.id);

        socket.on("join_auction", (rfqId) => {
            socket.join(`auction:${rfqId}`);
        });

        socket.on("leave_auction", (rfqId) => {
            socket.leave(`auction:${rfqId}`);
        });

        socket.on("disconnect", () => {
            console.log("Client disconnected:", socket.id);
        });
    });

    return io;
};

export const getIO = () => {
    if (!io) {
        throw new Error("Socket.IO not initialized");
    }

    return io;
};