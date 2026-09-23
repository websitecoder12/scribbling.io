'use client';

import React, { useState, useEffect } from 'react';
import { io, Socket } from 'socket.io-client';
import { Press_Start_2P } from 'next/font/google';
import Canvas from '../components/Canvas';
import VotingGallery from '../components/VotingGallery';
import Podium from '../components/Podium';

const pixelFont = Press_Start_2P({ weight: '400', subsets: ['latin'] });

interface Player {
  id: string;
  username: string;
  isHost: boolean;
  score: number;
}

interface RoomState {
  code: string;
  phase: 'LOBBY' | 'DRAWING' | 'VOTING' | 'RESULTS';
  theme: string;
  timer: number;
  players: Record<string, Player>;
  drawings: Record<string, string>;
  votes: Record<string, string>;
}

let socket: Socket;

export default function Home() {
  const [view, setView] = useState<'LANDING' | 'SETUP' | 'GAME'>('LANDING');
  const [username, setUsername] = useState('');
  const [roomCodeInput, setRoomCodeInput] = useState('');
  const [roomState, setRoomState] = useState<RoomState | null>(null);
  const [timer, setTimer] = useState(0);
  const [errorMsg, setErrorMsg] = useState('');
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    socket = io('http://localhost:4000', {
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 5,
    });

    socket.on('connect', () => {
      setIsConnected(true);
      setErrorMsg('');
    });

    socket.on('disconnect', () => {
      setIsConnected(false);
    });

    socket.on('connect_error', () => {
      setIsConnected(false);
      setErrorMsg('Cannot connect to game server. Is backend running?');
    });

    socket.on('room:state-update', (state: RoomState) => {
      setRoomState(state);
      setView('GAME');
    });

    socket.on('timer:tick', (time: number) => {
      setTimer(time);
    });

    return () => {
      if (socket) socket.disconnect();
    };
  }, []);

  const handleCreateRoom = () => {
    if (!username.trim()) return setErrorMsg('Please enter a username!');
    if (!isConnected) return setErrorMsg('Server not connected! Make sure server is running on port 4000.');
    setErrorMsg('');

    socket.emit('room:create', { username }, (res: { roomCode: string }) => {
      if (!res?.roomCode) {
        setErrorMsg('Failed to create room. Please try again.');
      }
    });
  };

  const handleJoinRoom = () => {
    if (!username.trim()) return setErrorMsg('Please enter a username!');
    if (!roomCodeInput.trim()) return setErrorMsg('Please enter a room code!');
    if (!isConnected) return setErrorMsg('Server not connected!');
    setErrorMsg('');

    socket.emit(
      'room:join',
      { roomCode: roomCodeInput, username },
      (res: { success: boolean; message?: string }) => {
        if (!res?.success) setErrorMsg(res?.message || 'Failed to join room');
      }
    );
  };

  const handleStartGame = () => {
    socket.emit('game:start');
  };

  const handleCanvasSubmit = (imageData: string) => {
    socket.emit('drawing:submit', { imageData });
  };

  const handleVoteCast = (targetPlayerId: string) => {
    socket.emit('vote:cast', { targetPlayerId });
  };

  return (
    <main className="fixed inset-0 w-screen h-screen bg-slate-950 text-white flex items-center justify-center p-4 overflow-hidden select-none">
      <style jsx global>{`
        @keyframes rainbow {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        .rainbow-text {
          background: linear-gradient(90deg, #ff0000, #ff7f00, #ffff00, #00ff00, #0000ff, #4b0082, #9400d3, #ff0000);
          background-size: 400% 400%;
          animation: rainbow 4s linear infinite;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }
      `}</style>

      {/* Connection Indicator in Top Corner */}
      <div className="absolute top-4 right-4 flex items-center gap-2 bg-gray-900 border border-gray-800 px-3 py-1.5 rounded-full text-xs font-bold z-50">
        <span className={`w-2.5 h-2.5 rounded-full ${isConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
        <span className="text-gray-300">{isConnected ? 'Server Online' : 'Server Offline'}</span>
      </div>

      {/* 1. LANDING VIEW (PERFECTLY CENTERED) */}
      {view === 'LANDING' && (
        <div className="flex flex-col items-center justify-center gap-10 text-center w-full max-w-2xl">
          <h1
            style={{ WebkitTextStroke: '2.5px black' }}
            className={`${pixelFont.className} rainbow-text text-3xl sm:text-5xl md:text-6xl tracking-wider leading-relaxed px-4`}
          >
            scribbling.io
          </h1>

          <button
            onClick={() => setView('SETUP')}
            style={{ WebkitTextStroke: '1.5px black' }}
            className={`${pixelFont.className} bg-gray-400 hover:bg-gray-300 text-white text-xl sm:text-2xl px-12 py-5 rounded-md border-4 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] active:translate-x-1 active:translate-y-1 active:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all cursor-pointer`}
          >
            PLAY
          </button>
        </div>
      )}

      {/* 2. SETUP VIEW */}
      {view === 'SETUP' && (
        <div className="w-full max-w-md bg-gray-900 border-4 border-black p-6 rounded-2xl shadow-[8px_8px_0px_0px_rgba(0,0,0,0.8)] flex flex-col gap-6">
          <h2
            style={{ WebkitTextStroke: '1px black' }}
            className={`${pixelFont.className} text-xl text-center text-yellow-400`}
          >
            PLAYER LOBBY
          </h2>

          {errorMsg && (
            <p className="text-red-400 text-xs text-center font-bold bg-red-950/80 p-3 rounded-xl border border-red-800">
              {errorMsg}
            </p>
          )}

          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">
              Enter Username
            </label>
            <input
              type="text"
              placeholder="e.g. PixelArtist"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="bg-gray-800 border-2 border-gray-700 focus:border-indigo-500 text-white p-3 rounded-xl font-medium outline-none transition-colors"
            />
          </div>

          <div className="flex flex-col gap-3">
            <button
              onClick={handleCreateRoom}
              className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 rounded-xl shadow-lg transition-transform hover:scale-[1.02] cursor-pointer"
            >
              Create New Room
            </button>

            <div className="relative flex py-2 items-center">
              <div className="flex-grow border-t border-gray-800"></div>
              <span className="flex-shrink mx-4 text-xs text-gray-500 font-bold">OR</span>
              <div className="flex-grow border-t border-gray-800"></div>
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Room Code"
                value={roomCodeInput}
                onChange={(e) => setRoomCodeInput(e.target.value.toUpperCase())}
                className="bg-gray-800 border-2 border-gray-700 focus:border-indigo-500 text-white p-3 rounded-xl font-medium outline-none w-full uppercase tracking-widest text-center"
              />
              <button
                onClick={handleJoinRoom}
                className="bg-gray-800 hover:bg-gray-700 text-white font-bold px-6 rounded-xl border border-gray-700 cursor-pointer"
              >
                Join
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3. GAME PHASES */}
      {view === 'GAME' && roomState && (
        <div className="w-full max-w-6xl h-full flex flex-col items-center justify-start overflow-y-auto py-6">
          <div className="w-full flex items-center justify-between bg-gray-900 border border-gray-800 px-6 py-4 rounded-2xl mb-6 shadow-lg">
            <div className="flex items-center gap-3">
              <span className="text-xs font-bold text-gray-400 uppercase">Room:</span>
              <span className="font-extrabold text-indigo-400 tracking-widest bg-indigo-950/60 px-3 py-1 rounded-lg border border-indigo-800/50">
                {roomState.code}
              </span>
            </div>

            {roomState.phase !== 'LOBBY' && (
              <div className="flex items-center gap-2 bg-gray-800 px-4 py-1.5 rounded-full border border-gray-700">
                <span className="text-xs font-bold text-gray-400">Time Left:</span>
                <span className="font-extrabold text-yellow-400 text-lg">{timer}s</span>
              </div>
            )}

            {roomState.theme && (
              <div className="hidden sm:flex items-center gap-2">
                <span className="text-xs font-bold text-gray-400 uppercase">Theme:</span>
                <span className="font-bold text-yellow-300 bg-yellow-950/40 px-3 py-1 rounded-lg border border-yellow-800/50">
                  {roomState.theme}
                </span>
              </div>
            )}
          </div>

          {roomState.phase === 'LOBBY' && (
            <div className="flex flex-col items-center gap-6 bg-gray-900 border border-gray-800 p-8 rounded-2xl w-full max-w-xl text-center shadow-xl">
              <h2 className="text-2xl font-black text-white">Waiting for Players</h2>
              <div className="w-full bg-gray-800/50 p-4 rounded-xl border border-gray-700/50 flex flex-col gap-2 max-h-60 overflow-y-auto">
                {Object.values(roomState.players).map((p) => (
                  <div key={p.id} className="flex items-center justify-between bg-gray-800 px-4 py-2 rounded-lg">
                    <span className="font-bold text-gray-200">{p.username}</span>
                    {p.isHost && (
                      <span className="text-[10px] font-extrabold bg-yellow-500/20 text-yellow-400 px-2 py-0.5 rounded border border-yellow-500/30">
                        HOST
                      </span>
                    )}
                  </div>
                ))}
              </div>

              {roomState.players[socket?.id]?.isHost ? (
                <button
                  onClick={handleStartGame}
                  className="w-full py-4 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-extrabold rounded-xl shadow-lg transition-transform hover:scale-[1.02] cursor-pointer"
                >
                  Start Game
                </button>
              ) : (
                <p className="text-xs text-gray-400 font-medium">Waiting for host to start the game...</p>
              )}
            </div>
          )}

          {roomState.phase === 'DRAWING' && (
            <div className="flex flex-col items-center gap-4 w-full">
              <Canvas onAutoSubmit={handleCanvasSubmit} isTimeUp={timer <= 0} />
            </div>
          )}

          {roomState.phase === 'VOTING' && (
            <VotingGallery
              drawings={roomState.drawings}
              currentSocketId={socket?.id || ''}
              onVote={handleVoteCast}
            />
          )}

          {roomState.phase === 'RESULTS' && (
            <Podium
              players={roomState.players}
              drawings={roomState.drawings}
              votes={roomState.votes}
              isHost={roomState.players[socket?.id]?.isHost || false}
              onPlayAgain={handleStartGame}
            />
          )}
        </div>
      )}
    </main>
  );
}