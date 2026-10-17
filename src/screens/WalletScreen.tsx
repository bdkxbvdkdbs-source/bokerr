import { ArrowDownToLine, ArrowUpFromLine, Wallet, History, Smartphone, CheckCircle2, Clock, XCircle } from 'lucide-react';
import { syp } from '@/utils/format';
import type { WalletTx } from '@/types';

export default function WalletScreen({
  balance,
  txs,
  onDeposit,
  onWithdraw,
  onSkip,
}: {
  balance: number;
  txs: WalletTx[];
  onDeposit: () => void;
  onWithdraw: () => void;
  onSkip: () => void;
}) {
  return (
    <div className="px-4 pt-4 pb-28 space-y-5">
      <header>
        <h1 className="text-2xl font-extrabold text-white">المحفظة</h1>
        <p className="text-xs text-gray-400 mt-0.5">رصيدك ومعاملاتك بالليرة السورية</p>
      </header>

      {/* Balance card */}
      <div className="relative rounded-2xl overflow-hidden border border-gold-700/40 bg-felt-radial p-5 shadow-card">
        <div className="absolute -top-10 -left-10 w-32 h-32 rounded-full bg-gold-500/10 blur-2xl" />
        <div className="relative">
          <div className="flex items-center gap-2 text-gold-200/80">
            <Wallet className="w-4 h-4" />
            <span className="text-xs">الرصيد المتاح</span>
          </div>
          <div className="mt-2 text-4xl font-extrabold text-white tracking-tight">
            {syp(balance)}
          </div>
          <div className="mt-4 flex items-center gap-2 rounded-lg bg-emerald-500/10 border border-emerald-600/30 px-3 py-2 w-fit">
            <Smartphone className="w-4 h-4 text-emerald-300" />
            <span className="text-xs text-emerald-200 font-semibold">شام كاش مفعّلة</span>
          </div>
        </div>
      </div>

      {/* Action buttons */}
      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={onDeposit}
          className="rounded-xl bg-gradient-to-l from-gold-500 to-gold-400 text-ink-950 font-bold py-4 flex items-center justify-center gap-2 hover:shadow-gold-glow active:scale-[0.98] transition-all"
        >
          <ArrowDownToLine className="w-5 h-5" />
          إيداع
        </button>
        <button
          onClick={onWithdraw}
          className="rounded-xl bg-ink-800 border border-ink-700 text-white font-bold py-4 flex items-center justify-center gap-2 hover:border-ember-500/50 active:scale-[0.98] transition-all"
        >
          <ArrowUpFromLine className="w-5 h-5 text-ember-400" />
          سحب
        </button>
      </div>
      <div className="rounded-xl border border-gold-700/25 bg-ink-850/70 px-4 py-3">
        <p className="text-xs leading-5 text-gray-400">
          إضافة المحفظة ووسيلة الدفع اختيارية. يمكنك تخطيها والبدء باستكشاف الصالة الآن.
        </p>
        <button
          onClick={onSkip}
          className="mt-2 text-sm font-bold text-gold-300 underline underline-offset-4 hover:text-gold-200"
        >
          تخطي الآن
        </button>
      </div>

      {/* Transactions */}
      <section>
        <div className="flex items-center gap-2 mb-3">
          <History className="w-4 h-4 text-gray-400" />
          <h2 className="text-sm font-bold text-gray-200">آخر العمليات</h2>
        </div>
        <ul className="space-y-2.5">
          {txs.map((tx) => {
            const deposit = tx.type === 'deposit';
            const StatusIcon =
              tx.status === 'completed' ? CheckCircle2 : tx.status === 'pending' ? Clock : XCircle;
            const statusColor =
              tx.status === 'completed'
                ? 'text-emerald-300'
                : tx.status === 'pending'
                ? 'text-gold-300'
                : 'text-ember-400';
            return (
              <li
                key={tx.id}
                className="rounded-xl bg-ink-850/90 border border-ink-700/70 px-4 py-3 flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-9 h-9 rounded-lg grid place-items-center ${
                      deposit ? 'bg-emerald-500/15' : 'bg-ember-500/15'
                    }`}
                  >
                    {deposit ? (
                      <ArrowDownToLine className="w-4 h-4 text-emerald-300" />
                    ) : (
                      <ArrowUpFromLine className="w-4 h-4 text-ember-400" />
                    )}
                  </div>
                  <div>
                    <div className="text-sm font-bold text-white">
                      {deposit ? 'إيداع' : 'سحب'} · {tx.method}
                    </div>
                    <div className="text-[11px] text-gray-400">{tx.date} · {tx.ref}</div>
                  </div>
                </div>
                <div className="text-left">
                  <div className={`text-sm font-bold ${deposit ? 'text-emerald-300' : 'text-ember-400'}`}>
                    {deposit ? '+' : '−'} {syp(tx.amount)}
                  </div>
                  <div className={`text-[11px] flex items-center gap-1 justify-end ${statusColor}`}>
                    <StatusIcon className="w-3 h-3" />
                    {tx.status === 'completed' ? 'مكتمل' : tx.status === 'pending' ? 'قيد المعالجة' : 'فاشل'}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}
