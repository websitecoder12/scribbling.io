'use client';

import React from 'react';
import { Crown, Sparkles } from 'lucide-react';

interface Player {
  id: string;
  username: string;
  isHost: boolean;
  score: number;
}

interface PodiumProps {
  players: Record<string, Player>;
  drawings: Record<string, string>;
  votes: Record<string, string>;
  isHost: boolean;
  onPlayAgain: () => void;
}

export default function Podium({ players, drawings, votes, isHost, onPlayAgain }: PodiumProps) {
  const voteCounts: Record<string, number> = {};
  Object.values(votes).forEach((targetId) => {
    voteCounts[targetId] = (voteCounts[targetId] || 0) + 1;
  });

  const sorted = Object.values(players).sort((a, b) => (voteCounts[b.id] || 0) - (voteCounts[a.id] || 0));
  const first = sorted[0];

  return (
    <div className="flex flex-col items-center gap-8 w-full max-w-4xl mx-auto p-6">
      <h1 className="text-4xl font-extrabold text-yellow-400 flex items-center justify-center gap-2">
        <Sparkles className="w-8 h-8" /> Round Results!
      </h1>
      {first && (
        <div className="flex flex-col items-center bg-gray-900 p-6 rounded-2xl border border-gray-800">
          <Crown className="w-10 h-10 text-yellow-400 mb-2" />
          <h3 className="text-2xl font-bold text-white">{first.username} Wins!</h3>
          <p className="text-gray-400 text-sm mb-4">{voteCounts[first.id] || 0} votes</p>
          <div className="w-72 h-52 bg-white rounded-xl overflow-hidden">
            <img src={drawings[first.id]} alt="Winner artwork" className="w-full h-full object-contain" />
          </div>
        </div>
      )}
      {isHost && (
        <button onClick={onPlayAgain} className="px-8 py-3 bg-indigo-600 text-white font-bold rounded-xl">
          Start Next Round
        </button>
      )}
    </div>
  );
}
