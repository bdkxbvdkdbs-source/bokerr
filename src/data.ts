import type { PokerTable, WalletTx, User } from '@/types';

export const TABLES: PokerTable[] = [
  {
    id: 'berlin-9max',
    name: 'طاولة بوكر تكساس',
    city: 'Berlin',
    variant: 'texas',
    blinds: '5 / 10',
    buyInMin: 350,
    buyInMax: 5000,
    capacity: 9,
    seated: 6,
    status: 'open',
  },
  {
    id: 'london-5max',
    name: 'طاولة بوكر أوماها',
    city: 'London',
    variant: 'omaha',
    blinds: '5 / 10',
    buyInMin: 500,
    buyInMax: 5000,
    capacity: 5,
    seated: 3,
    status: 'open',
  },
];

export const INITIAL_TXS: WalletTx[] = [
  {
    id: 'tx-1001',
    type: 'deposit',
    method: 'شام كاش',
    amount: 25000,
    status: 'completed',
    date: '2026-10-16 21:42',
    ref: 'SC-884210',
  },
  {
    id: 'tx-1002',
    type: 'withdraw',
    method: 'شام كاش',
    amount: 8000,
    status: 'pending',
    date: '2026-10-17 10:05',
    ref: 'SC-884917',
  },
];

export const CURRENT_USER: User = {
  username: 'لاعب_دمشق',
  balance: 142500,
  avatarSeed: 'دمشق',
  joined: '2025-03-12',
  friends: 28,
  gamesPlayed: 174,
};

export const SUPPORT_WHATSAPP = '963999888777';
