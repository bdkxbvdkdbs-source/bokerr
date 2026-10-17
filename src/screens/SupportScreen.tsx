import { MessageCircle, Phone, Clock, ShieldCheck, ChevronLeft } from 'lucide-react';
import { SUPPORT_WHATSAPP } from '@/data';

export default function SupportScreen({ onOpenWhatsApp }: { onOpenWhatsApp: () => void }) {
  return (
    <div className="px-4 pt-4 pb-28 space-y-5">
      <header>
        <h1 className="text-2xl font-extrabold text-white">الدعم الفني</h1>
        <p className="text-xs text-gray-400 mt-0.5">نحن هنا لمساعدتك على مدار الساعة</p>
      </header>

      {/* WhatsApp CTA */}
      <button
        onClick={onOpenWhatsApp}
        className="w-full rounded-2xl bg-gradient-to-l from-emerald-600 to-emerald-500 text-white p-5 text-right shadow-card hover:shadow-[0_10px_30px_-10px_rgba(16,185,129,0.5)] active:scale-[0.98] transition-all"
      >
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-white/15 grid place-items-center shrink-0">
            <MessageCircle className="w-7 h-7" />
          </div>
          <div className="flex-1">
            <div className="text-lg font-extrabold">محادثة واتساب</div>
            <div className="text-xs text-emerald-50/80 mt-0.5">اضغط لفتح الدعم مباشرة</div>
          </div>
          <ChevronLeft className="w-5 h-5 opacity-70" />
        </div>
      </button>

      {/* Info rows */}
      <div className="rounded-2xl bg-ink-850/90 border border-ink-700/70 divide-y divide-ink-700/60">
        <InfoRow icon={<Phone className="w-4 h-4" />} label="رقم الدعم" value={`+${SUPPORT_WHATSAPP}`} />
        <InfoRow icon={<Clock className="w-4 h-4" />} label="أوقات العمل" value="24 / 7" />
        <InfoRow
          icon={<ShieldCheck className="w-4 h-4" />}
          label="معالجة المعاملات"
          value="آلية وفورية"
        />
      </div>

      {/* FAQ */}
      <section>
        <h2 className="text-sm font-bold text-gray-200 mb-3">أسئلة شائعة</h2>
        <div className="space-y-2.5">
          {[
            { q: 'كم تستغرق عملية الإيداع؟', a: 'تتم تلقائياً خلال ثوانٍ عبر شام كاش.' },
            { q: 'كيف أستلم أرباحي؟', a: 'اطلب السحب من المحفظة ويُحوّل إلى محفظتك.' },
            { q: 'هل بياناتي محمية؟', a: 'نعم، الاتصال مشفّر وجلسات اللعب محمية.' },
          ].map((f, i) => (
            <details
              key={i}
              className="group rounded-xl bg-ink-850/90 border border-ink-700/70 px-4 py-3"
            >
              <summary className="flex items-center justify-between cursor-pointer list-none">
                <span className="text-sm font-semibold text-gray-100">{f.q}</span>
                <ChevronLeft className="w-4 h-4 text-gray-400 group-open:-rotate-90 transition-transform" />
              </summary>
              <p className="text-xs text-gray-400 mt-2 pr-1">{f.a}</p>
            </details>
          ))}
        </div>
      </section>
    </div>
  );
}

function InfoRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center justify-between px-4 py-3.5">
      <div className="flex items-center gap-2.5 text-gray-300">
        <span className="text-gold-300">{icon}</span>
        <span className="text-sm">{label}</span>
      </div>
      <span className="text-sm font-bold text-white" dir="ltr">
        {value}
      </span>
    </div>
  );
}
