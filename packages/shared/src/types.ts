export type GamePhase = 'LOBBY' | 'PROMPT' | 'DRAWING' | 'GUESSING' | 'REVEAL';

export interface GameSettings {
  maxPlayers: number;
  roundTimerSeconds: number;
  blindMode: boolean;
  speedrunMode: boolean;
  customWordPack?: string[];
}

export interface Player {
  id: string;
  username: string;
  avatarUrl: string;
  isHost: boolean;
  isReady: boolean;
  connected: boolean;
}

export interface ChainStep {
  type: 'PROMPT' | 'DRAWING';
  authorId: string;
  authorName: string;
  content: string;
  timestamp: number;
}

export interface Chain {
  id: string;
  ownerId: string;
  steps: ChainStep[];
}

export interface RoomState {
  roomCode: string;
  settings: GameSettings;
  phase: GamePhase;
  currentRound: number;
  totalRounds: number;
  players: Record<string, Player>;
  timeRemaining: number;
  chains: Record<string, Chain>;
}

export interface ServerToClientEvents {
  'room:state-update': (state: Partial<RoomState>) => void;
  'timer:sync': (payload: { timeRemaining: number; totalDuration: number }) => void;
  'game:phase-change': (payload: { phase: GamePhase; round: number; promptOrDrawingPayload?: string }) => void;
  'game:reveal-data': (payload: { chains: Chain[] }) => void;
  'error:msg': (payload: { code: string; message: string }) => void;
}

export interface ClientToServerEvents {
  'room:create': (payload: { username: string; settings: GameSettings }, callback: (res: { roomCode: string }) => void) => void;
  'room:join': (payload: { roomCode: string; username: string }, callback: (res: { success: boolean; message?: string }) => void) => void;
  'room:update-settings': (payload: Partial<GameSettings>) => void;
  'game:start': () => void;
  'game:submit-turn': (payload: { content: string }) => void;