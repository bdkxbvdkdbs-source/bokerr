import { ArrowLeft, Wifi, Users } from 'lucide-react';
import { TABLES } from '@/data';
import type { PokerTable } from '@/types';
import TableCard from '@/components/TableCard';

export default function LobbyScreen({
  onJoin,
}: {
  onJoin: (t: PokerTable) => void;
}) {
  return (
    <div className="px-4 pt-4 pb-28 space-y-4">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-white">الصالة</h1>
          <p className="text-xs text-gray-400 mt-0.5">اختر طاولتك وابدأ اللعب</p>
        </div>
        <div className="flex items-center gap-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 px-3 py-1.5">
          <Wifi className="w-3.5 h-3.5 text-emerald-300" />
          <span className="text-[11px] font-bold text-emerald-300">متصل</span>
        </div>
      </header>

      {/* Live count banner */}
      <div className="rounded-2xl bg-gradient-to-l from-felt-800/80 to-ink-850/80 border border-gold-700/25 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Users className="w-5 h-5 text-gold-300" />
          <span className="text-sm text-gray-200">لاعبون متصلون الآن</span>
        </div>
        <span className="text-lg font-extrabold text-gold-200">1,284</span>
      </div>

      <div className="space-y-4">
        {TABLES.map((t) => (
          <TableCard key={t.id} table={t} onJoin={onJoin} />
        ))}
      </div>

      <p className="text-center text-[11px] text-gray-500 flex items-center justify-center gap-1 pt-1">
        <ArrowLeft className="w-3 h-3" /> اللعب لأغراض الترفيه فقط
      </p>
    </div>
  );
}
