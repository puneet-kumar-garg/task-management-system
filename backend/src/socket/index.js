const jwt = require('jsonwebtoken');

const connectedUsers = new Map();

module.exports = (io) => {
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token;
    if (!token) return next(new Error('Authentication error'));
    try {
      socket.user = jwt.verify(token, process.env.JWT_SECRET);
      next();
    } catch {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    const userId = socket.user.id;
    connectedUsers.set(userId, socket.id);
    socket.join(`user:${userId}`);

    socket.on('join_team', (teamId) => socket.join(`team:${teamId}`));
    socket.on('leave_team', (teamId) => socket.leave(`team:${teamId}`));
    socket.on('disconnect', () => connectedUsers.delete(userId));
  });

  io.notifyUser = (userId, event, data) => io.to(`user:${userId}`).emit(event, data);
  io.notifyTeam = (teamId, event, data) => io.to(`team:${teamId}`).emit(event, data);

  return io;
};
