import { useState } from 'react';
import BottomNav from '@/components/BottomNav';
import ShamCashSheet from '@/components/ShamCashSheet';
import LobbyScreen from '@/screens/LobbyScreen';
import WalletScreen from '@/screens/WalletScreen';
import SupportScreen from '@/screens/SupportScreen';
import ProfileScreen from '@/screens/ProfileScreen';
import { CURRENT_USER, INITIAL_TXS, SUPPORT_WHATSAPP } from '@/data';
import { syp } from '@/utils/format';
import type { TabKey, PokerTable, WalletTx } from '@/types';

function App() {
  const [tab, setTab] = useState<TabKey>('lobby');
  const [balance, setBalance] = useState(CURRENT_USER.balance);
  const [txs, setTxs] = useState<WalletTx[]>(INITIAL_TXS);
  const [user, setUser] = useState(CURRENT_USER);
  const [sheet, setSheet] = useState<null | 'deposit' | 'withdraw'>(null);
  const [toast, setToast] = useState<string | null>(null);

  const flash = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2600);
  };

  const addTx = (
    type: 'deposit' | 'withdraw',
    amount: number,
    status: WalletTx['status'] = 'completed'
  ) => {
    const now = new Date();
    const date = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(
      now.getDate()
    ).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(
      now.getMinutes()
    ).padStart(2, '0')}`;
    const tx: WalletTx = {
      id: `tx-${Date.now()}`,
      type,
      method: 'شام كاش',
      amount,
      status,
      date,
      ref: `SC-${Math.floor(100000 + Math.random() * 899999)}`,
    };
    setTxs((prev) => [tx, ...prev]);
  };

  const handleSheetSubmit = (amount: number, _phone: string) => {
    if (sheet === 'deposit') {
      setBalance((b) => b + amount);
      addTx('deposit', amount, 'completed');
      flash(`تم إيداع ${syp(amount)} بنجاح`);
    } else if (sheet === 'withdraw') {
      setBalance((b) => b - amount);
      addTx('withdraw', amount, 'pending');
      flash(`تم تسجيل طلب سحب ${syp(amount)}`);
    }
    setSheet(null);
  };

  const openWhatsApp = () => {
    const url = `https://wa.me/${SUPPORT_WHATSAPP}?text=${encodeURIComponent(
      'مرحباً الدعم الفني، أحتاج مساعدة.'
    )}`;
    window.open(url, '_blank');
  };

  const handleRename = (name: string) => {
    setUser((u) => ({ ...u, username: name }));
    flash('تم تحديث اسم المستخدم');
  };

  const handlePassword = () => flash('تم تحديث كلمة المرور');
  const handleLogout = () => flash('تم تسجيل الخروج');

  const handleJoin = (t: PokerTable) => flash(`جارٍ الدخول إلى ${t.name}…`);

  return (
    <div className="relative min-h-screen bg-felt-950 text-gray-100 max-w-md mx-auto overflow-hidden">
      {/* Ambient backdrop */}
      <div className="pointer-events-none absolute inset-0 bg-felt-radial opacity-80" />
      <div className="pointer-events-none absolute top-0 inset-x-0 h-40 bg-gold-sheen opacity-[0.06] animate-shimmer" />

      <main className="relative min-h-screen">
        {tab === 'lobby' && <LobbyScreen onJoin={handleJoin} />}
        {tab === 'wallet' && (
          <WalletScreen
            balance={balance}
            txs={txs}
            onDeposit={() => setSheet('deposit')}
            onWithdraw={() => setSheet('withdraw')}
          />
        )}
        {tab === 'support' && <SupportScreen onOpenWhatsApp={openWhatsApp} />}
        {tab === 'profile' && (
          <ProfileScreen
            user={{ ...user, balance }}
            onLogout={handleLogout}
            onRename={handleRename}
            onPasswordChange={handlePassword}
          />
        )}
      </main>

      <BottomNav active={tab} onChange={setTab} />

      <ShamCashSheet
        open={sheet !== null}
        mode={sheet ?? 'deposit'}
        balance={balance}
        onClose={() => setSheet(null)}
        onSubmit={handleSheetSubmit}
      />

      {/* Toast */}
      {toast && (
        <div className="absolute bottom-28 inset-x-0 z-50 flex justify-center px-6 animate-riseIn">
          <div className="rounded-full bg-ink-900/95 border border-gold-700/40 px-4 py-2.5 text-sm text-gold-100 shadow-card">
            {toast}
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
