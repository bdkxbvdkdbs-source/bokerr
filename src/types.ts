export type TabKey = 'lobby' | 'wallet' | 'support' | 'profile';

export type GameVariant = 'texas' | 'omaha';

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
