'use client';
import { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';

let socket: Socket;

export default function Home() {
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    'https://https://humble-dollop-g49v467vqwqxfw9w7-4000.app.github.dev/';
    const SERVER_URL = 'https://humble-dollop-g49v467vqwqxfw9w7-4000.app.github.dev';

    socket = io(SERVER_URL, {
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 5,
    });

    socket.on('connect', () => {
      console.log('Connected to backend socket!');
      setIsConnected(true);
    });

    socket.on('disconnect', () => {
      setIsConnected(false);
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  return (
    <div className="p-4">
      <span className={isConnected ? "text-green-500" : "text-red-500"}>
        {isConnected ? "Server Online" : "Server Offline"}
      </span>
    </div>
  );
}