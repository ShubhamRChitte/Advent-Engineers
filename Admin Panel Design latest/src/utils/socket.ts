import { io } from "socket.io-client";

// Port 5001 is used based on current backend configuration
const SOCKET_URL = "http://localhost:5001";

export const socket = io(SOCKET_URL, {
  withCredentials: true,
  autoConnect: true,
});

socket.on("connect", () => {
  console.log("Connected to Socket.io server");
});

socket.on("disconnect", () => {
  console.log("Disconnected from Socket.io server");
});
