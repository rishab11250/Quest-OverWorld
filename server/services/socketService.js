const { Server } = require('socket.io');

// In-memory squad presence tracking
// squadPresence: Map<teamId, Map<userId, { socketId, userId, userName, userAvatar, latitude, longitude, heading, updatedAt }>>
const squadPresence = new Map();

// Stale telemetry timeout: 90 seconds
const STALE_TIMEOUT_MS = 90 * 1000;

function initSocketService(httpServer) {
  const io = new Server(httpServer, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST'],
      credentials: true,
    },
    pingInterval: 10000,
    pingTimeout: 5000,
  });

  io.on('connection', (socket) => {
    let currentTeamId = null;
    let currentUserId = null;

    // Teammate joins their squad room
    socket.on('squad:join', (payload = {}) => {
      const { teamId, userId, userName, userAvatar } = payload;
      if (!teamId || !userId) return;

      currentTeamId = String(teamId);
      currentUserId = String(userId);

      const roomName = `squad:${currentTeamId}`;
      socket.join(roomName);

      if (!squadPresence.has(currentTeamId)) {
        squadPresence.set(currentTeamId, new Map());
      }

      const teamMap = squadPresence.get(currentTeamId);
      teamMap.set(currentUserId, {
        socketId: socket.id,
        userId: currentUserId,
        userName: userName || 'Teammate',
        userAvatar: userAvatar || 'shield-crown',
        latitude: null,
        longitude: null,
        heading: 0,
        updatedAt: Date.now(),
      });

      // Send initial snapshot of all active squad members to newly joined member
      const activeMembers = Array.from(teamMap.values())
        .filter((m) => m.userId !== currentUserId)
        .map(({ socketId, ...rest }) => rest);

      socket.emit('squad:roster_snapshot', activeMembers);

      // Notify others in room
      socket.to(roomName).emit('squad:member_joined', {
        userId: currentUserId,
        userName,
        userAvatar,
      });
    });

    // Teammate streams GPS location & compass heading
    socket.on('squad:telemetry', (payload = {}) => {
      const { teamId, userId, userName, userAvatar, latitude, longitude, heading } = payload;
      if (!teamId || !userId || latitude == null || longitude == null) return;

      const teamKey = String(teamId);
      const userKey = String(userId);
      const roomName = `squad:${teamKey}`;

      if (!squadPresence.has(teamKey)) {
        squadPresence.set(teamKey, new Map());
      }

      const memberData = {
        socketId: socket.id,
        userId: userKey,
        userName: userName || 'Teammate',
        userAvatar: userAvatar || 'shield-crown',
        latitude,
        longitude,
        heading: heading || 0,
        updatedAt: Date.now(),
      };

      squadPresence.get(teamKey).set(userKey, memberData);

      // Broadcast telemetry to other squad members in real-time
      const { socketId, ...broadcastPayload } = memberData;
      socket.to(roomName).emit('squad:member_telemetry', broadcastPayload);
    });

    // Teammate leaves or changes squad
    socket.on('squad:leave', (payload = {}) => {
      const teamId = payload.teamId || currentTeamId;
      const userId = payload.userId || currentUserId;
      if (!teamId || !userId) return;

      const teamKey = String(teamId);
      const userKey = String(userId);
      const roomName = `squad:${teamKey}`;

      socket.leave(roomName);

      if (squadPresence.has(teamKey)) {
        const teamMap = squadPresence.get(teamKey);
        teamMap.delete(userKey);
        if (teamMap.size === 0) {
          squadPresence.delete(teamKey);
        }
      }

      socket.to(roomName).emit('squad:member_left', { userId: userKey });
      currentTeamId = null;
      currentUserId = null;
    });

    // Disconnect cleanup
    socket.on('disconnect', () => {
      if (currentTeamId && currentUserId) {
        const teamKey = currentTeamId;
        const userKey = currentUserId;
        const roomName = `squad:${teamKey}`;

        if (squadPresence.has(teamKey)) {
          const teamMap = squadPresence.get(teamKey);
          teamMap.delete(userKey);
          if (teamMap.size === 0) {
            squadPresence.delete(teamKey);
          }
        }

        socket.to(roomName).emit('squad:member_left', { userId: userKey });
      }
    });
  });

  // Background cleanup for inactive/stale heartbeats
  setInterval(() => {
    const now = Date.now();
    for (const [teamId, teamMap] of squadPresence.entries()) {
      for (const [userId, member] of teamMap.entries()) {
        if (now - member.updatedAt > STALE_TIMEOUT_MS) {
          teamMap.delete(userId);
          io.to(`squad:${teamId}`).emit('squad:member_left', { userId });
        }
      }
      if (teamMap.size === 0) {
        squadPresence.delete(teamId);
      }
    }
  }, 30000);

  return io;
}

module.exports = { initSocketService };
