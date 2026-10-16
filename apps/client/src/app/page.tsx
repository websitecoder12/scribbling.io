'use client';
import { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';

// Reads NEXT_PUBLIC_SERVER_URL from .env.local, and falls back to your Codespaces URL
const SERVER_URL =
  process.env.NEXT_PUBLIC_SERVER_URL ??
  'https://humble-dollop-g49v467vqwqxfw9w7-4000.app.github.dev';

interface Player {
  id: string;
  name: string;
}

interface RoomState {
  roomId: string | null;
  players: Player[];
  isHost: boolean;
}

const EMPTY_ROOM: RoomState = { roomId: null, players: [], isHost: false };

export default function Home() {
  // A ref keeps the socket for the lifetime of this component (instead of a module-level variable)
  const socketRef = useRef<Socket | null>(null);

  const [isConnected, setIsConnected] = useState(false);
  const [username, setUsername] = useState('');
  const [inputRoomId, setInputRoomId] = useState('');
  const [room, setRoom] = useState<RoomState>(EMPTY_ROOM);
  const [errorMsg, setErrorMsg] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    // Initialize socket connection
    const socket = io(SERVER_URL, {
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 5,
    });
    socketRef.current = socket;

    // Event listeners
    socket.on('connect', () => {
      console.log('Connected to backend socket!');
      setIsConnected(true);
      setErrorMsg('');
    });

    socket.on('disconnect', () => {
      console.log('Disconnected from backend socket!');
      setIsConnected(false);
      setRoom(EMPTY_ROOM);
    });

    // Fires when the server can't be reached at all (wrong URL, server down, private port)
    socket.on('connect_error', () => {
      setErrorMsg("Can't reach the server. Check that the backend is running and its port is public.");
    });

    // Room functionality listeners
    socket.on('room-created', ({ roomId, hostId }: { roomId: string; hostId: string }) => {
      setRoom(prev => ({ ...prev, roomId, isHost: socket.id === hostId }));
    });

    socket.on('room-joined', ({ roomId, players }: { roomId: string; players: Player[] }) => {
      setRoom(prev => ({ ...prev, roomId, players }));
    });

    socket.on('error-message', (msg: string) => {
      setErrorMsg(msg);
    });

    // Cleanup on unmount (prevents memory leaks and duplicate connections)
    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, []);

  // Errors disappear on their own after a few seconds
  useEffect(() => {
    if (!errorMsg) return;
    const timer = setTimeout(() => setErrorMsg(''), 4000);
    return () => clearTimeout(timer);
  }, [errorMsg]);

  const handleCreateRoom = () => {
    const name = username.trim();
    if (!name) return setErrorMsg('Enter an editor name first, twin!');
    socketRef.current?.emit('create-room', { username: name });
  };

  const handleJoinRoom = () => {
    const name = username.trim();
    const code = inputRoomId.trim();
    if (!name || !code) return setErrorMsg('Enter both an editor name and a Room ID!');
    socketRef.current?.emit('join-room', { roomId: code, username: name });
  };

  const handleStartGame = () => {
    socketRef.current?.emit('start-game', { roomId: room.roomId });
  };

  const handleCopyCode = async () => {
    if (!room.roomId) return;
    try {
      await navigator.clipboard.writeText(room.roomId);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      setErrorMsg("Couldn't copy the code. Select it and copy it manually.");
    }
  };

  return (
    // h-screen and w-screen with flex justify-center locks the menu dead-center
    <main className="h-screen w-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center overflow-hidden selection:bg-indigo-500 selection:text-white relative">
      
      {/* Absolute positioning keeps the header pinned to the top without pushing the menu off-center */}
      <div className="absolute top-6 flex items-center justify-between w-full max-w-5xl px-6">
        <h1 className="text-xl font-black tracking-wider bg-gradient-to-r from-indigo-400 to-cyan-400 bg-clip-text text-transparent">
          SCRIBBLING.IO
        </h1>
        
        {/* Your requested emoji connection indicator block */}
        <div className="bg-slate-900/80 px-4 py-2 rounded-full border border-slate-800 shadow-inner">
          <span className={`font-bold text-sm ${isConnected ? "text-green-500" : "text-red-500"}`}>
            {isConnected ? "🟢 Server Online" : "🔴 Server Offline"}
          </span>
        </div>
      </div>

      {/* Perfectly Centered Main Menu Card */}
      <div className="w-full max-w-md bg-slate-900/60 border border-slate-800/80 backdrop-blur-xl p-8 rounded-2xl shadow-2xl">
        {errorMsg && (
          <div
            role="alert"
            className="mb-6 bg-rose-500/10 border border-rose-500/30 text-rose-400 text-sm p-3 rounded-xl font-medium animate-shake text-center"
          >
            {errorMsg}
          </div>
        )}

        {!room.roomId ? (
          <div className="space-y-4">
            <div>
              <label
                htmlFor="username"
                className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2"
              >
                Your Editor Name
              </label>
              <input
                id="username"
                type="text"
                value={username}
                maxLength={16}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="e.g. PixelMaster"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-slate-200 placeholder-slate-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition"
              />
            </div>

            <div className="pt-2 space-y-3">
              <button
                onClick={handleCreateRoom}
                disabled={!isConnected}
                className="w-full bg-indigo-600 hover:bg-indigo-500 active:scale-[0.99] text-white font-semibold py-3 px-4 rounded-xl shadow-lg shadow-indigo-600/20 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Create New Room
              </button>

              <div className="relative flex py-2 items-center">
                <div className="flex-grow border-t border-slate-800"></div>
                <span className="flex-shrink mx-4 text-slate-600 text-xs font-semibold uppercase">Or Join</span>
                <div className="flex-grow border-t border-slate-800"></div>
              </div>

              <div className="flex gap-2">
                <input
                  type="text"
                  value={inputRoomId}
                  onChange={(e) => setInputRoomId(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleJoinRoom()}
                  aria-label="Room code"
                  placeholder="Room Code"
                  className="w-2/3 bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-slate-200 placeholder-slate-600 focus:outline-none focus:border-indigo-500 transition uppercase"
                />
                <button
                  onClick={handleJoinRoom}
                  disabled={!isConnected}
                  className="w-1/3 bg-slate-800 hover:bg-slate-700 active:scale-[0.99] text-slate-200 font-semibold py-3 px-4 rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Join
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-6 text-center">
            <div className="bg-slate-950 border border-slate-800 p-4 rounded-xl">
              <span className="text-xs text-slate-500 uppercase tracking-widest block font-semibold">Active Room Code</span>
              <span className="text-2xl font-mono font-bold text-indigo-400 tracking-wider">{room.roomId}</span>
              <button
                onClick={handleCopyCode}
                className="block mx-auto mt-2 text-xs font-semibold text-slate-400 hover:text-indigo-400 transition"
              >
                {copied ? 'Copied!' : 'Copy code'}
              </button>
            </div>

            <div className="space-y-2 text-left">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Squad in Lobby</span>
              <ul className="bg-slate-950 border border-slate-800 rounded-xl divide-y divide-slate-900 max-h-40 overflow-y-auto">
                {room.players.map((p, idx) => (
                  <li key={p.id} className="px-4 py-3 flex items-center justify-between text-sm">
                    <span className="text-slate-200 font-medium">{p.name}</span>
                    {idx === 0 && <span className="text-[10px] bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-2 py-0.5 rounded-full font-semibold">Host</span>}
                  </li>
                ))}
              </ul>
            </div>

            {room.isHost ? (
              <button 
                onClick={handleStartGame}
                className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-semibold py-3 px-4 rounded-xl shadow-lg shadow-emerald-600/20 transition"
              >
                Start Game 🚀
              </button>
            ) : (
              <p className="text-sm text-slate-500 animate-pulse">Waiting for host to start...</p>
            )}
          </div>
        )}
      </div>
    </main>
  );
}