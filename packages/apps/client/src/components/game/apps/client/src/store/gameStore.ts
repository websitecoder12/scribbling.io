import { create } from 'zustand';
import { RoomState, GamePhase } from '@shared/types';

interface GameStore {
  roomState: RoomState | null;
  timeRemaining: number;
  totalDuration: number;
  currentPromptOrDrawing: string | null;
  
  setRoomState: (state: Partial<RoomState>) => void;
  syncTimer: (timeRemaining: number, totalDuration: number) => void;
  setGamePhase: (phase: GamePhase, currentRound: number, payload?: string) => void;
  resetGame: () => void;
}

export const useGameStore = create<GameStore>((set) => ({
  roomState: null,
  timeRemaining: 0,
  totalDuration: 0,
  currentPromptOrDrawing: null,

  setRoomState: (newState) =>
    set((state) => ({
      roomState: state.roomState ? { ...state.roomState, ...newState } : (newState as RoomState),
    })),

  syncTimer: (timeRemaining, totalDuration) =>
    set({ timeRemaining, totalDuration }),

  setGamePhase: (phase, currentRound, payload) =>
    set((state) => ({
      currentPromptOrDrawing: payload ?? null,
      roomState: state.roomState
        ? { ...state.roomState, phase, currentRound }
        : null,
    })),

  resetGame: () =>
    set({ roomState: null, timeRemaining: 0, totalDuration: 0, currentPromptOrDrawing: null }),
}));