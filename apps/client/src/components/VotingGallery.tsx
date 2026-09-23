'use client';

import React, { useState } from 'react';
import { Check, Trophy } from 'lucide-react';

interface VotingGalleryProps {
  drawings: Record<string, string>;
  currentSocketId: string;
  onVote: (targetPlayerId: string) => void;
}

export default function VotingGallery({ drawings, currentSocketId, onVote }: VotingGalleryProps) {
  const [votedId, setVotedId] = useState<string | null>(null);

  const handleVote = (id: string) => {
    if (id === currentSocketId) return;
    setVotedId(id);
    onVote(id);
  };

  return (
    <div className="flex flex-col items-center gap-6 w-full max-w-5xl mx-auto p-6">
      <h2 className="text-3xl font-extrabold text-white flex items-center justify-center gap-2">
        <Trophy className="w-8 h-8 text-yellow-400" /> Cast Your Vote!
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full">
        {Object.entries(drawings).map(([playerId, imageData], idx) => {
          const isSelf = playerId === currentSocketId;
          const isSelected = votedId === playerId;
          return (
            <div key={playerId} className="flex flex-col items-center p-4 bg-gray-900 rounded-2xl border-2 border-gray-800">
              <div className="w-full aspect-[4/3] bg-white rounded-xl overflow-hidden">
                <img src={imageData} alt={`Artwork ${idx + 1}`} className="w-full h-full object-contain" />
              </div>
              <button
                onClick={() => handleVote(playerId)}
                disabled={isSelf || !!votedId}
                className="mt-4 w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl"
              >
                {isSelected ? 'Voted!' : isSelf ? 'Cannot vote for self' : 'Vote for this'}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
