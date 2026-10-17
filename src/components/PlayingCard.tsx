import { Spade, Heart, Diamond, Club } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export type Suit = 'spades' | 'hearts' | 'diamonds' | 'clubs';

export const SUIT_ICON: Record<Suit, LucideIcon> = {
  spades: Spade,
  hearts: Heart,
  diamonds: Diamond,
  clubs: Club,
};

export const SUIT_RED: Suit[] = ['hearts', 'diamonds'];

export interface CardModel {
  rank: string;
  suit: Suit;
}

export function PlayingCard({
  card,
  size = 'md',
}: {
  card?: CardModel;
  size?: 'sm' | 'md' | 'lg';
}) {
  const dims =
    size === 'lg'
      ? 'w-16 h-24 rounded-lg'
      : size === 'sm'
      ? 'w-9 h-13 rounded-md'
      : 'w-12 h-17 rounded-lg';

  if (!card) {
    return (
      <div
        className={`${dims} bg-gradient-to-br from-ink-800 to-ink-950 border border-gold-700/40 shadow-card flex items-center justify-center`}
      >
        <div className="w-2/3 h-4/5 rounded border border-gold-700/30 bg-[repeating-linear-gradient(45deg,rgba(212,175,55,0.12)_0_6px,transparent_6px_12px)]" />
      </div>
    );
  }

  const Icon = SUIT_ICON[card.suit];
  const red = SUIT_RED.includes(card.suit);
  return (
    <div
      className={`${dims} bg-gradient-to-br from-white to-gray-200 shadow-card relative overflow-hidden flex flex-col justify-between p-1`}
    >
      <div className={`text-[10px] font-bold leading-none ${red ? 'card-suit-red' : 'card-suit-dark'}`}>
        {card.rank}
      </div>
      <Icon
        className={`self-center ${red ? 'card-suit-red' : 'card-suit-dark'} ${
          size === 'lg' ? 'w-6 h-6' : 'w-4 h-4'
        }`}
        strokeWidth={2.2}
      />
      <div
        className={`text-[10px] font-bold leading-none rotate-180 self-end ${
          red ? 'card-suit-red' : 'card-suit-dark'
        }`}
      >
        {card.rank}
      </div>
    </div>
  );
}
