import { io } from "socket.io-client";
import { API_BASE_URL } from "./api";

let socket = null;
let isConnecting = false;
let reconnectAttempts = 0;
const MAX_RECONNECT_ATTEMPTS = 20;

export const getSocket = () => {
  if (socket && socket.connected) return socket;
  if (isConnecting && socket) return socket;
  if (typeof window === "undefined") return null;

  isConnecting = true;

  if (socket) {
    socket.removeAllListeners();
    socket.close();
  }

  socket = io(API_BASE_URL, {
    autoConnect: false,
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 10000,
    reconnectionAttempts: MAX_RECONNECT_ATTEMPTS,
    timeout: 20000,
    transports: ["websocket", "polling"],
    forceNew: true,
  });

  socket.on("connect", () => {
    isConnecting = false;
    reconnectAttempts = 0;

    const user = localStorage.getItem("user");
    if (user) {
      try {
        const { id } = JSON.parse(user);
        if (id) {
          socket.emit("registerUser", id);
        }
      } catch (e) {
        console.error("Socket register user error:", e);
      }
    }
  });

  socket.on("disconnect", (reason) => {
    isConnecting = false;
    if (reason === "io server disconnect") {
      socket.connect();
    }
  });

  socket.on("connect_error", (err) => {
    reconnectAttempts++;
    isConnecting = false;
  });

  return socket;
};

export const disconnectSocket = () => {
  if (socket) {
    socket.removeAllListeners();
    socket.close();
    socket = null;
  }
  isConnecting = false;
  reconnectAttempts = 0;
};

export default new Proxy({}, {
  get(_, prop) {
    const s = getSocket();
    return s ? Reflect.get(s, prop) : undefined;
  },
}) as any;
