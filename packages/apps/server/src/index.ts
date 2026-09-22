import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: { origin: '*' }
});

interface Player {
  id: string;
  username: string;
  isHost: boolean;
}

interface Room {
  code: string;
  players: Record<string, Player>;
  phase: 'LOBBY' | 'DRAWING';
}

const rooms: Record<string, Room> = {};

io.on('connection', (socket) => {
  socket.on('room:create', ({ username }, callback) => {
    const roomCode = Math.random().toString(36).substring(2, 8).toUpperCase();
    rooms[roomCode] = {
      code: roomCode,
      players: { [socket.id]: { id: socket.id, username, isHost: true } },
      phase: 'LOBBY'
    };
    socket.join(roomCode);
    callback({ roomCode });
    io.to(roomCode).emit('room:state-update', rooms[roomCode]);
  });

  socket.on('room:join', ({ roomCode, username }, callback) => {
    const code = roomCode?.toUpperCase();
    const room = rooms[code];
    if (!room) {
      return callback({ success: false, message: 'Room not found' });
    }
    room.players[socket.id] = { id: socket.id, username, isHost: false };
    socket.join(code);
    callback({ success: true });
    io.to(code).emit('room:state-update', room);
  });

  socket.on('game:start', () => {
    const roomCode = Array.from(socket.rooms).find((r) => r !== socket.id);
    if (roomCode && rooms[roomCode]) {
      rooms[roomCode].phase = 'DRAWING';
      io.to(roomCode).emit('room:state-update', rooms[roomCode]);
    }
  });
});

const PORT = process.env.PORT || 4000;
httpServer.listen(PORT, () => {
  console.log(`Socket Server running on port ${PORT}`);
});