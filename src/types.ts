export type TabKey = 'lobby' | 'wallet' | 'support' | 'profile';

export type GameVariant = 'texas' | 'omaha';
export type TableStage = 'waiting' | 'preflop' | 'flop' | 'turn' | 'river' | 'showdown';

export interface PokerTable {
  id: string;
  name: string;
  city: string;
  variant: GameVariant;
  blinds: string;
  buyInMin: number;
  buyInMax: number;
  capacity: number;
  seated: number;
  status: 'open' | 'running' | 'full';
  stage?: TableStage;
}

export interface LiveTableRow {
  id: string;
  name: string;
  variant: GameVariant;
  capacity: number;
  blinds: string;
  seated: number;
  stage: TableStage;
  buyInMin?: number;
  buyInMax?: number;
}

export interface Session {
  id: string;
  displayName: string;
  lastTableId?: string | null;
  createdAt?: number;
  lastActiveAt?: number;
}

export interface WalletTx {
  id: string;
  type: 'deposit' | 'withdraw';
  method: 'شام كاش';
  amount: number;
  status: 'completed' | 'pending' | 'failed';
  date: string;
  ref: string;
}

export interface User {
  username: string;
  balance: number;
  avatarSeed: string;
  joined: string;
  friends: number;
  gamesPlayed: number;
}
