import { io } from "socket.io-client";
import { API_BASE_URL } from "./api";

// Guard against SSR — window is not available on the server (Next.js)
let socket = null;
if (typeof window !== "undefined") {
  socket = io(API_BASE_URL, {
    autoConnect: true,
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionAttempts: 5,
    transports: ["websocket", "polling"],
  });
}

export default socket;