import { io } from "socket.io-client";

// Port 5001 is used based on current backend configuration
export let SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5001';

if (import.meta.env.PROD && !import.meta.env.VITE_SOCKET_URL) {
  SOCKET_URL = window.location.origin;
}

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
