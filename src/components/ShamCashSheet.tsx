import { useState } from 'react';
import { X, Smartphone, ShieldCheck, Loader2 } from 'lucide-react';
import { syp } from '@/utils/format';

export default function ShamCashSheet({
  open,
  mode,
  balance,
  onClose,
  onSubmit,
}: {
  open: boolean;
  mode: 'deposit' | 'withdraw';
  balance: number;
  onClose: () => void;
  onSubmit: (amount: number, phone: string) => void;
}) {
  const [amount, setAmount] = useState('');
  const [phone, setPhone] = useState('');
  const [stage, setStage] = useState<'form' | 'processing' | 'done'>('form');

  if (!open) return null;

  const isDeposit = mode === 'deposit';
  const submit = () => {
    const amt = Number(amount);
    if (!amt || amt <= 0) return;
    if (!isDeposit && amt > balance) return;
    if (!phone.trim()) return;
    setStage('processing');
    setTimeout(() => {
      setStage('done');
      setTimeout(() => {
        onSubmit(amt, phone);
        setStage('form');
        setAmount('');
        setPhone('');
      }, 900);
    }, 1100);
  };

  return (
    <div className="absolute inset-0 z-50 flex items-end justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-riseIn" onClick={onClose} />
      <div className="relative w-full max-w-md bg-ink-850 border border-ink-700 rounded-t-3xl px-5 pt-3 pb-6 animate-riseIn max-h-[90%] overflow-y-auto no-scrollbar">
        <div className="mx-auto w-10 h-1 rounded-full bg-ink-700 mb-3" />
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-white">
            {isDeposit ? 'إيداع عبر شام كاش' : 'سحب عبر شام كاش'}
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Sham Cash badge */}
        <div className="flex items-center gap-3 rounded-xl bg-gradient-to-l from-emerald-700/30 to-felt-700/30 border border-emerald-600/30 p-3 mb-4">
          <div className="w-10 h-10 rounded-lg bg-emerald-500/20 grid place-items-center">
            <Smartphone className="w-5 h-5 text-emerald-300" />
          </div>
          <div className="flex-1">
            <div className="text-sm font-bold text-emerald-200">شام كاش Sham Cash</div>
            <div className="text-[11px] text-gray-400">معالجة آلية وفورية</div>
          </div>
          <ShieldCheck className="w-5 h-5 text-emerald-400" />
        </div>

        {stage === 'done' ? (
          <div className="py-8 text-center">
            <div className="mx-auto w-14 h-14 rounded-full bg-emerald-500/15 border border-emerald-500/40 grid place-items-center mb-3">
              <ShieldCheck className="w-7 h-7 text-emerald-300" />
            </div>
            <p className="text-emerald-200 font-bold">تم تنفيذ العملية بنجاح</p>
            <p className="text-xs text-gray-400 mt-1">سيُحدّث رصيدك خلال لحظات</p>
          </div>
        ) : stage === 'processing' ? (
          <div className="py-10 text-center">
            <Loader2 className="w-8 h-8 text-gold-300 animate-spin mx-auto mb-3" />
            <p className="text-gray-200 text-sm">جارٍ التحقق من العملية…</p>
          </div>
        ) : (
          <>
            {!isDeposit && (
              <div className="mb-3 rounded-lg bg-ink-800/80 border border-ink-700 px-3 py-2 text-xs text-gray-300">
                الرصيد المتاح للسحب: <span className="font-bold text-gold-200">{syp(balance)}</span>
              </div>
            )}
            <label className="block text-xs text-gray-400 mb-1">المبلغ (ل.س)</label>
            <input
              inputMode="numeric"
              value={amount}
              onChange={(e) => setAmount(e.target.value.replace(/[^0-9]/g, ''))}
              placeholder="0"
              className="w-full rounded-xl bg-ink-900 border border-ink-700 px-4 py-3 text-lg font-bold text-white outline-none focus:border-gold-500 mb-3"
            />
            <div className="flex gap-2 mb-4">
              {[5000, 10000, 25000, 50000].map((q) => (
                <button
                  key={q}
                  onClick={() => setAmount(String(q))}
                  className="flex-1 rounded-lg bg-ink-800 border border-ink-700 py-1.5 text-[11px] text-gray-300 hover:border-gold-600/50"
                >
                  {q.toLocaleString('ar')}
                </button>
              ))}
            </div>
            <label className="block text-xs text-gray-400 mb-1">
              {isDeposit ? 'رقم المحفظة المُحوّل منها' : 'رقم محفظتك للاستلام'}
            </label>
            <input
              inputMode="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="09XXXXXXXX"
              className="w-full rounded-xl bg-ink-900 border border-ink-700 px-4 py-3 text-sm text-white outline-none focus:border-gold-500 mb-4 ltr-text"
              dir="ltr"
            />
            <button
              onClick={submit}
              className={`w-full rounded-xl py-3 font-bold text-sm transition-all ${
                isDeposit
                  ? 'bg-gradient-to-l from-gold-500 to-gold-400 text-ink-950 hover:shadow-gold-glow'
                  : 'bg-gradient-to-l from-ember-500 to-ember-400 text-white hover:shadow-[0_0_0_1px_rgba(224,73,31,0.4),0_8px_30px_-8px_rgba(224,73,31,0.3)]'
              }`}
            >
              {isDeposit ? 'تأكيد الإيداع' : 'تأكيد طلب السحب'}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
