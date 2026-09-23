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

export default function Podium({
  players,
  drawings,
  votes,
  isHost,
  onPlayAgain
}: PodiumProps) {
  const voteCounts: Record<string, number> = {};
  Object.values(votes).forEach((targetId) => {
    voteCounts[targetId] = (voteCounts[targetId] || 0) + 1;
  });

  const sorted = Object.values(players).sort(
    (a, b) => (voteCounts[b.id] || 0) - (voteCounts[a.id] || 0)
  );

  const first = sorted[0];
  const second = sorted[1];
  const third = sorted[2];

  return (
    <div className="flex flex-col items-center gap-8 w-full max-w-4xl mx-auto p-6">
      <div className="text-center">
        <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-amber-300 to-yellow-500 flex items-center justify-center gap-2">
          <Sparkles className="w-8 h-8 text-yellow-400" /> Round Results!
        </h1>
        <p className="text-gray-400 mt-2">Top 3 masterpieces based on player votes!</p>
      </div>

      <div className="grid grid-cols-3 gap-4 items-end w-full max-w-3xl pt-8">
        {/* 2nd Place */}
        <div className="flex flex-col items-center">
          {second && (
            <>
              <div className="relative mb-2 w-full aspect-[4/3] bg-white rounded-xl overflow-hidden border-2 border-gray-400 shadow-lg">
                <img
                  src={drawings[second.id]}
                  alt={second.username}
                  className="w-full h-full object-contain"
                />
              </div>
              <span className="font-bold text-gray-200 text-sm">{second.username}</span>
              <span className="text-xs text-gray-400 font-medium">
                {voteCounts[second.id] || 0} votes
              </span>
            </>
          )}
          <div className="w-full bg-slate-700 border-t-4 border-slate-400 h-32 rounded-t-xl flex items-center justify-center font-black text-3xl text-slate-300 mt-2">
            2nd
          </div>
        </div>

        {/* 1st Place */}
        <div className="flex flex-col items-center">
          {first && (
            <>
              <Crown className="w-8 h-8 text-yellow-400 mb-1 animate-bounce" />
              <div className="relative mb-2 w-full aspect-[4/3] bg-white rounded-xl overflow-hidden border-4 border-yellow-400 shadow-2xl shadow-yellow-500/20">
                <img
                  src={drawings[first.id]}
                  alt={first.username}
                  className="w-full h-full object-contain"
                />
              </div>
              <span className="font-extrabold text-yellow-400 text-base">{first.username}</span>
              <span className="text-xs text-yellow-300 font-bold">
                {voteCounts[first.id] || 0} votes
              </span>
            </>
          )}
          <div className="w-full bg-gradient-to-b from-yellow-500 to-amber-600 border-t-4 border-yellow-300 h-44 rounded-t-xl flex items-center justify-center font-black text-4xl text-amber-950 shadow-xl mt-2">
            1st
          </div>
        </div>

        {/* 3rd Place */}
        <div className="flex flex-col items-center">
          {third && (
            <>
              <div className="relative mb-2 w-full aspect-[4/3] bg-white rounded-xl overflow-hidden border-2 border-amber-700 shadow-lg">
                <img
                  src={drawings[third.id]}
                  alt={third.username}
                  className="w-full h-full object-contain"
                />
              </div>
              <span className="font-bold text-amber-600 text-sm">{third.username}</span>
              <span className="text-xs text-gray-400 font-medium">
                {voteCounts[third.id] || 0} votes
              </span>
            </>
          )}
          <div className="w-full bg-amber-900/80 border-t-4 border-amber-600 h-24 rounded-t-xl flex items-center justify-center font-black text-2xl text-amber-400 mt-2">
            3rd
          </div>
        </div>
      </div>

      {isHost ? (
        <button
          onClick={onPlayAgain}
          className="mt-6 px-8 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-extrabold rounded-xl shadow-lg transition-transform hover:scale-105"
        >
          Start Next Round
        </button>
      ) : (
        <p className="text-sm text-gray-500 mt-4">Waiting for host to start the next round...</p>
      )}
    </div>
  );
}