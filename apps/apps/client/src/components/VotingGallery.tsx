'use client';

import React, { useState } from 'react';
import { Check, Trophy } from 'lucide-react';

interface VotingGalleryProps {
  drawings: Record<string, string>;
  currentSocketId: string;
  onVote: (targetPlayerId: string) => void;
}

export default function VotingGallery({
  drawings,
  currentSocketId,
  onVote
}: VotingGalleryProps) {
  const [votedId, setVotedId] = useState<string | null>(null);

  const handleVote = (id: string) => {
    if (id === currentSocketId) return;
    setVotedId(id);
    onVote(id);
  };

  const entries = Object.entries(drawings);

  return (
    <div className="flex flex-col items-center gap-6 w-full max-w-5xl mx-auto p-6">
      <div className="text-center">
        <h2 className="text-3xl font-extrabold text-white flex items-center justify-center gap-2">
          <Trophy className="w-8 h-8 text-yellow-400" /> Cast Your Vote!
        </h2>
        <p className="text-gray-400 mt-1">
          Vote for your favorite drawing. Votes are anonymous (you cannot vote for your own).
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full">
        {entries.map(([playerId, imageData], idx) => {
          const isSelf = playerId === currentSocketId;
          const isSelected = votedId === playerId;

          return (
            <div
              key={playerId}
              className={`relative flex flex-col items-center p-4 bg-gray-900 rounded-2xl border-2 transition-all ${
                isSelected
                  ? 'border-green-500 shadow-green-500/20 shadow-xl scale-[1.02]'
                  : isSelf
                  ? 'border-gray-800 opacity-60 cursor-not-allowed'
                  : 'border-gray-800 hover:border-indigo-500 hover:shadow-lg'
              }`}
            >
              <div className="relative w-full aspect-[4/3] bg-white rounded-xl overflow-hidden border border-gray-700">
                <img
                  src={imageData}
                  alt={`Artwork ${idx + 1}`}
                  className="w-full h-full object-contain"
                />
                {isSelf && (
                  <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                    <span className="text-xs font-semibold text-gray-300 bg-gray-800/80 px-3 py-1 rounded-full border border-gray-700">
                      Your Artwork
                    </span>
                  </div>
                )}
              </div>

              <button
                onClick={() => handleVote(playerId)}
                disabled={isSelf || !!votedId}
                className={`mt-4 w-full py-2.5 px-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all ${
                  isSelected
                    ? 'bg-green-600 text-white cursor-default'
                    : isSelf
                    ? 'bg-gray-800 text-gray-500 cursor-not-allowed'
                    : votedId
                    ? 'bg-gray-800 text-gray-400 cursor-not-allowed'
                    : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg'
                }`}
              >
                {isSelected ? (
                  <>
                    <Check className="w-5 h-5" /> Voted!
                  </>
                ) : isSelf ? (
                  'Cannot vote for self'
                ) : (
                  'Vote for this'
                )}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}