import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, { cors: { origin: '*' } });

const THEMES = [
  'Cyberpunk City', 'Floating Island', 'Underwater Monster',
  'Space Cat', 'Haunted House', 'Pizza Party', 'Medieval Knight',
  'Alien Planet', 'Dragon Cave', 'Superhero Mascot'
];

interface Player {
  id: string;
  username: string;
  isHost: boolean;
  score: number;
}

interface Room {
  code: string;
  phase: 'LOBBY' | 'DRAWING' | 'VOTING' | 'RESULTS';
  theme: string;
  timer: number;
  players: Record<string, Player>;
  drawings: Record<string, string>; // socketId -> dataURL (image)
  votes: Record<string, string>;   // voterSocketId -> targetSocketId
  timerInterval?: NodeJS.Timeout;
}

const rooms: Record<string, Room> = {};

function startRoomTimer(roomCode: string, durationSeconds: number, onComplete: () => void) {
  const room = rooms[roomCode];
  if (!room) return;

  if (room.timerInterval) clearInterval(room.timerInterval);
  room.timer = durationSeconds;

  io.to(roomCode).emit('timer:tick', room.timer);

  room.timerInterval = setInterval(() => {
    room.timer -= 1;
    io.to(roomCode).emit('timer:tick', room.timer);

    if (room.timer <= 0) {
      clearInterval(room.timerInterval);
      onComplete();
    }
  }, 1000);
}

io.on('connection', (socket) => {
  // Create Room
  socket.on('room:create', ({ username }, callback) => {
    const roomCode = Math.random().toString(36).substring(2, 8).toUpperCase();
    rooms[roomCode] = {
      code: roomCode,
      phase: 'LOBBY',
      theme: '',
      timer: 0,
      players: { [socket.id]: { id: socket.id, username, isHost: true, score: 0 } },
      drawings: {},
      votes: {}
    };
    socket.join(roomCode);
    callback({ roomCode });
    io.to(roomCode).emit('room:state-update', rooms[roomCode]);
  });

  // Join Room
  socket.on('room:join', ({ roomCode, username }, callback) => {
    const code = roomCode?.toUpperCase();
    const room = rooms[code];
    if (!room) return callback({ success: false, message: 'Room not found' });

    room.players[socket.id] = { id: socket.id, username, isHost: false, score: 0 };
    socket.join(code);
    callback({ success: true });
    io.to(code).emit('room:state-update', room);
  });

  // Start Drawing Phase (2 mins)
  socket.on('game:start', () => {
    const roomCode = Array.from(socket.rooms).find((r) => r !== socket.id);
    const room = rooms[roomCode || ''];
    if (!room) return;

    room.phase = 'DRAWING';
    room.theme = THEMES[Math.floor(Math.random() * THEMES.length)];
    room.drawings = {};
    room.votes = {};

    io.to(roomCode!).emit('room:state-update', room);

    // 120 seconds for drawing phase
    startRoomTimer(roomCode!, 120, () => {
      // Transition to VOTING phase (60 secs)
      room.phase = 'VOTING';
      io.to(roomCode!).emit('room:state-update', room);

      startRoomTimer(roomCode!, 60, () => {
        // Calculate Top 3 Results
        room.phase = 'RESULTS';

        const voteCounts: Record<string, number> = {};
        Object.values(room.votes).forEach((targetId) => {
          voteCounts[targetId] = (voteCounts[targetId] || 0) + 1;
        });

        // Award scores
        Object.entries(voteCounts).forEach(([playerId, count]) => {
          if (room.players[playerId]) {
            room.players[playerId].score += count * 100;
          }
        });

        io.to(roomCode!).emit('room:state-update', room);
      });
    });
  });

  // Submit Drawing Canvas Image
  socket.on('drawing:submit', ({ imageData }) => {
    const roomCode = Array.from(socket.rooms).find((r) => r !== socket.id);
    const room = rooms[roomCode || ''];
    if (room && room.phase === 'DRAWING') {
      room.drawings[socket.id] = imageData;
      io.to(roomCode!).emit('room:state-update', room);
    }
  });

  // Cast Anonymous Vote
  socket.on('vote:cast', ({ targetPlayerId }) => {
    const roomCode = Array.from(socket.rooms).find((r) => r !== socket.id);
    const room = rooms[roomCode || ''];
    // Prevent voting for self
    if (room && room.phase === 'VOTING' && targetPlayerId !== socket.id) {
      room.votes[socket.id] = targetPlayerId;
      io.to(roomCode!).emit('room:state-update', room);
    }
  });
});

const PORT = process.env.PORT || 4000;
httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});