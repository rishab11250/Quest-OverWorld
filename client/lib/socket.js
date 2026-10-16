import { io } from 'socket.io-client';
import { Platform } from 'react-native';

const getSocketUrl = () => {
  if (process.env.EXPO_PUBLIC_API_URL) {
    return process.env.EXPO_PUBLIC_API_URL.replace(/\/api\/?$/, '');
  }
  if (Platform.OS === 'android') {
    return 'http://10.0.2.2:5000';
  }
  return 'http://localhost:5000';
};

let socketInstance = null;
let lastTelemetrySent = 0;
const TELEMETRY_THROTTLE_MS = 1500; // Throttle socket GPS transmissions to 1.5s

/**
 * Get or initialize persistent Socket.io connection
 */
export function getSocket() {
  if (!socketInstance) {
    const url = getSocketUrl();
    socketInstance = io(url, {
      transports: ['websocket', 'polling'],
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 2000,
    });
  }
  return socketInstance;
}

/**
 * Join team squad room
 */
export function joinSquadRoom(teamId, user = {}) {
  if (!teamId || !user?._id) return;
  const socket = getSocket();
  if (!socket.connected) {
    socket.connect();
  }

  socket.emit('squad:join', {
    teamId: String(teamId),
    userId: String(user._id),
    userName: user.name || 'Teammate',
    userAvatar: user.avatar || 'shield-crown',
  });
}

/**
 * Leave team squad room
 */
export function leaveSquadRoom(teamId, userId) {
  if (!teamId || !userId) return;
  const socket = getSocket();
  if (socket?.connected) {
    socket.emit('squad:leave', {
      teamId: String(teamId),
      userId: String(userId),
    });
  }
}

/**
 * Broadcast GPS location & heading to fellow squad mates (throttled)
 */
export function sendSquadTelemetry({ teamId, user, latitude, longitude, heading = 0 }) {
  if (!teamId || !user?._id || latitude == null || longitude == null) return;

  const now = Date.now();
  if (now - lastTelemetrySent < TELEMETRY_THROTTLE_MS) return;
  lastTelemetrySent = now;

  const socket = getSocket();
  if (!socket?.connected) {
    socket.connect();
  }

  socket.emit('squad:telemetry', {
    teamId: String(teamId),
    userId: String(user._id),
    userName: user.name || 'Teammate',
    userAvatar: user.avatar || 'shield-crown',
    latitude,
    longitude,
    heading,
  });
}
