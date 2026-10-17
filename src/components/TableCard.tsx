import { Trophy } from 'lucide-react';
import type { PokerTable } from '@/types';
import { syp } from '@/utils/format';

export default function TableCard({
  table,
  onJoin,
}: {
  table: PokerTable;
  onJoin: (t: PokerTable) => void;
}) {
  const full = table.seated >= table.capacity;
  const fillPct = Math.round((table.seated / table.capacity) * 100);

  return (
    <article className="group relative rounded-2xl overflow-hidden border border-ink-700/80 bg-ink-850/90 shadow-card animate-riseIn">
      {/* Felt header */}
      <div className="relative bg-felt-radial px-4 pt-4 pb-5 border-b border-gold-700/20">
        <div className="absolute inset-0 bg-felt-radial opacity-90" />
        <div className="relative flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-gold-500/15 border border-gold-600/40 grid place-items-center">
              <Trophy className="w-6 h-6 text-gold-300" strokeWidth={2} />
            </div>
            <div>
              <h3 className="text-base font-bold text-white leading-tight">{table.name}</h3>
              <p className="text-xs text-gold-200/70 mt-0.5">
                {table.city} · {table.variant === 'texas' ? 'تكساس هولدم' : 'أوماها'}
              </p>
            </div>
          </div>
          <span
            className={`text-[11px] font-bold px-2.5 py-1 rounded-full border ${
              full
                ? 'bg-ember-500/15 border-ember-500/40 text-ember-400'
                : 'bg-emerald-500/10 border-emerald-500/40 text-emerald-300'
            }`}
          >
            {full ? 'ممتلئة' : 'متاحة'}
          </span>
        </div>

        {/* Seats oval */}
        <div className="relative mt-4 flex items-center justify-center">
          <div className="relative w-44 h-20 rounded-full border-2 border-dashed border-gold-600/30 bg-felt-900/40">
            <div className="absolute inset-2 rounded-full bg-felt-950/70 border border-gold-700/20 grid place-items-center">
              <div className="text-center">
                <div className="text-2xl font-extrabold text-gold-200 leading-none">
                  {table.seated}
                  <span className="text-gold-600">/{table.capacity}</span>
                </div>
                <div className="text-[10px] text-gray-400 mt-0.5">لاعبين</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Details */}
      <div className="px-4 py-3.5 space-y-3 bg-ink-850/90">
        <div className="grid grid-cols-3 gap-2 text-center">
          <Stat label="البلايند" value={`${table.blinds} ل.س`} />
          <Stat label="أدنى رسم" value={syp(table.buyInMin)} />
          <Stat label="أعلى رسم" value={syp(table.buyInMax)} />
        </div>

        <div>
          <div className="flex justify-between text-[11px] text-gray-400 mb-1">
            <span>الإشغال</span>
            <span>{fillPct}%</span>
          </div>
          <div className="h-1.5 rounded-full bg-ink-700 overflow-hidden">
            <div
              className="h-full bg-gradient-to-l from-gold-400 to-gold-600 transition-all"
              style={{ width: `${fillPct}%` }}
            />
          </div>
        </div>

        <button
          onClick={() => onJoin(table)}
          disabled={full}
          className={`w-full rounded-xl py-3 font-bold text-sm transition-all ${
            full
              ? 'bg-ink-700 text-gray-500 cursor-not-allowed'
              : 'bg-gradient-to-l from-gold-500 to-gold-400 text-ink-950 hover:shadow-gold-glow active:scale-[0.98]'
          }`}
        >
          {full ? 'لا تتوفر مقاعد' : 'دخول الطاولة'}
        </button>
      </div>
    </article>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-ink-800/80 border border-ink-700/60 py-2">
      <div className="text-[10px] text-gray-400">{label}</div>
      <div className="text-xs font-bold text-gray-100 mt-0.5 truncate">{value}</div>
    </div>
  );
}
