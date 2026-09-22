'use client';

import React, { useState, useEffect } from 'react';
import { io, Socket } from 'socket.io-client';

let socket: Socket;

export default function Home() {
  const [username, setUsername] = useState('');
  const [roomCodeInput, setRoomCodeInput] = useState('');
  const [currentRoom, setCurrentRoom] = useState<any>(null);

  useEffect(() => {
    socket = io('http://localhost:4000');
    socket.on('room:state-update', (room) => {
      setCurrentRoom(room);
    });
    return () => {
      socket.disconnect();
    };
  }, []);

  const createRoom = () => {
    if (!username) return alert('Please enter a username');
    socket.emit('room:create', { username }, (res: any) => {
      console.log('Room created:', res.roomCode);
    });
  };

  const joinRoom = () => {
    if (!username || !roomCodeInput) return alert('Enter username and room code');
    socket.emit('room:join', { roomCode: roomCodeInput, username }, (res: any) => {
      if (!res.success) alert(res.message);
    });
  };

  const startGame = () => {
    socket.emit('game:start');
  };

  if (!currentRoom) {
    return (
      <main className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-6">
        <div className="bg-slate-900 border border-slate-800 p-8 rounded-2xl w-full max-w-md shadow-2xl flex flex-col gap-4">
          <h1 className="text-3xl font-extrabold text-center bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
            Scribbling.io
          </h1>

          <input
            type="text"
            placeholder="Enter Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full px-4 py-3 rounded-xl bg-slate-800 border border-slate-700 focus:outline-none focus:border-indigo-500"
          />

          <button
            onClick={createRoom}
            className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 font-bold rounded-xl transition-all shadow-lg shadow-indigo-600/30"
          >
            Create Room
          </button>

          <div className="flex items-center gap-2 my-2">
            <div className="h-px bg-slate-800 flex-1" />
            <span className="text-xs text-slate-500 uppercase">OR</span>
            <div className="h-px bg-slate-800 flex-1" />
          </div>

          <input
            type="text"
            placeholder="Enter 6-Letter Room Code"
            value={roomCodeInput}
            onChange={(e) => setRoomCodeInput(e.target.value)}
            className="w-full px-4 py-3 rounded-xl bg-slate-800 border border-slate-700 focus:outline-none focus:border-indigo-500 uppercase"
          />

          <button
            onClick={joinRoom}
            className="w-full py-3 bg-slate-800 hover:bg-slate-700 border border-slate-700 font-bold rounded-xl transition-all"
          >
            Join Room
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-950 text-white p-6">
      <header className="max-w-4xl mx-auto flex items-center justify-between bg-slate-900 p-4 rounded-2xl border border-slate-800 mb-6">
        <div>
          <span className="text-xs text-slate-400 uppercase font-bold">Room Code</span>
          <h2 className="text-2xl font-black text-indigo-400">{currentRoom.code}</h2>
        </div>
        <div>
          <span className="text-xs text-slate-400 uppercase font-bold">Phase</span>
          <h2 className="text-lg font-bold">{currentRoom.phase}</h2>
        </div>
      </header>

      {currentRoom.phase === 'LOBBY' && (
        <div className="max-w-md mx-auto bg-slate-900 border border-slate-800 p-6 rounded-2xl text-center">
          <h3 className="text-xl font-bold mb-4">Players Connected</h3>
          <ul className="flex flex-col gap-2 mb-6">
            {Object.values(currentRoom.players).map((p: any) => (
              <li key={p.id} className="bg-slate-800 py-2 px-4 rounded-lg flex items-center justify-between">
                <span>{p.username}</span>
                {p.isHost && <span className="text-xs bg-indigo-500 px-2 py-0.5 rounded font-bold">HOST</span>}
              </li>
            ))}
          </ul>
          <button
            onClick={startGame}
            className="w-full py-3 bg-green-600 hover:bg-green-500 font-bold rounded-xl transition-all shadow-lg shadow-green-600/30"
          >
            Start Game
          </button>
        </div>
      )}

      {currentRoom.phase === 'DRAWING' && (
        <div className="text-center p-8 bg-slate-900 rounded-2xl border border-slate-800">
          <h2 className="text-2xl font-bold text-indigo-400">Drawing Phase Active!</h2>
        </div>
      )}
    </main>
  );
}
