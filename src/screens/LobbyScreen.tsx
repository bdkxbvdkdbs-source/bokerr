import { useCallback, useEffect, useMemo, useState } from 'react';
import { ArrowLeft, Loader2, RefreshCw, Wifi, Users } from 'lucide-react';
import { TABLES } from '@/data';
import type { LiveTableRow, PokerTable } from '@/types';
import TableCard from '@/components/TableCard';
import { getTables } from '@/api/bokerr';

export default function LobbyScreen({ onJoin }: { onJoin: (t: PokerTable) => void }) {
  const [tables, setTables] = useState<PokerTable[]>(TABLES);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadTables = useCallback(async () => {
    setLoading(true);
    try {
      const liveTables = await getTables();
      setTables(liveTables.map(toPokerTable));
      setError(null);
    } catch {
      setError('تعذر تحديث الطاولات المباشرة — نعرض آخر إعدادات معروفة.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadTables();
  }, [loadTables]);

  const seated = useMemo(() => tables.reduce((total, table) => total + table.seated, 0), [tables]);

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

      <div className="rounded-2xl bg-gradient-to-l from-felt-800/80 to-ink-850/80 border border-gold-700/25 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Users className="w-5 h-5 text-gold-300" />
          <span className="text-sm text-gray-200">لاعبون على الطاولات الآن</span>
        </div>
        <span className="text-lg font-extrabold text-gold-200">{seated.toLocaleString('ar')}</span>
      </div>

      {error && (
        <div className="rounded-xl border border-gold-700/30 bg-gold-500/10 px-3 py-2.5 text-xs text-gold-100 flex items-center gap-2">
          <span className="flex-1">{error}</span>
          <button onClick={() => void loadTables()} className="flex items-center gap-1 text-gold-200 underline underline-offset-2">
            <RefreshCw className="w-3 h-3" /> تحديث
          </button>
        </div>
      )}

      {loading && !tables.length ? (
        <div className="rounded-2xl border border-ink-700/70 bg-ink-850/80 py-10 text-center text-sm text-gray-400">
          <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-gold-300" />
          جارٍ تحميل الطاولات…
        </div>
      ) : (
        <div className="space-y-4">
          {tables.map((table) => <TableCard key={table.id} table={table} onJoin={onJoin} />)}
        </div>
      )}

      <p className="text-center text-[11px] text-gray-500 flex items-center justify-center gap-1 pt-1">
        <ArrowLeft className="w-3 h-3" /> اللعب لأغراض الترفيه فقط
      </p>
    </div>
  );
}

function toPokerTable(table: LiveTableRow): PokerTable {
  const knownTable = TABLES.find((item) => item.id === table.id);
  return {
    id: table.id,
    name: table.name,
    city: table.id.startsWith('berlin') ? 'Berlin' : table.id.startsWith('london') ? 'London' : 'Bokerr',
    variant: table.variant,
    blinds: table.blinds,
    buyInMin: table.buyInMin ?? knownTable?.buyInMin ?? 0,
    buyInMax: table.buyInMax ?? knownTable?.buyInMax ?? 0,
    capacity: table.capacity,
    seated: table.seated,
    stage: table.stage,
    status: table.seated >= table.capacity ? 'full' : table.stage !== 'waiting' ? 'running' : 'open',
  };
}
