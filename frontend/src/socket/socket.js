import { io } from "socket.io-client";

export const socket = io("https://rfq-british-auction-system-cb0c.onrender.com", {
    withCredentials: true,
});