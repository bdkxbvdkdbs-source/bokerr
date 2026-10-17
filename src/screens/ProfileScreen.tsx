import { useState } from 'react';
import {
  Users,
  UserCog,
  KeyRound,
  LogOut,
  ChevronLeft,
  X,
  Trophy,
  CalendarDays,
} from 'lucide-react';
import { syp } from '@/utils/format';
import type { User } from '@/types';

export default function ProfileScreen({
  user,
  onLogout,
  onRename,
  onPasswordChange,
}: {
  user: User;
  onLogout: () => void;
  onRename: (name: string) => void;
  onPasswordChange: (oldP: string, newP: string) => void;
}) {
  const [renameOpen, setRenameOpen] = useState(false);
  const [pwdOpen, setPwdOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [oldP, setOldP] = useState('');
  const [newP, setNewP] = useState('');

  return (
    <div className="px-4 pt-4 pb-28 space-y-5">
      <header>
        <h1 className="text-2xl font-extrabold text-white">حسابي</h1>
      </header>

      {/* Profile card */}
      <div className="relative rounded-2xl overflow-hidden border border-gold-700/40 bg-felt-radial p-5 shadow-card">
        <div className="absolute inset-0 bg-gold-sheen opacity-10 animate-shimmer" />
        <div className="relative flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-gold-400 to-gold-600 grid place-items-center text-ink-950 font-extrabold text-xl shrink-0">
            {user.username.slice(0, 2)}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-lg font-extrabold text-white truncate">{user.username}</div>
            <div className="text-sm text-gold-200 font-bold mt-0.5">{syp(user.balance)}</div>
            <div className="flex items-center gap-1 text-[11px] text-gray-400 mt-1">
              <CalendarDays className="w-3 h-3" />
              عضو منذ {user.joined}
            </div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3">
        <StatBox icon={<Users className="w-4 h-4" />} label="الأصدقاء" value={String(user.friends)} />
        <StatBox
          icon={<Trophy className="w-4 h-4" />}
          label="جلسات لُعبت"
          value={String(user.gamesPlayed)}
        />
      </div>

      {/* Options */}
      <div className="rounded-2xl bg-ink-850/90 border border-ink-700/70 divide-y divide-ink-700/60 overflow-hidden">
        <OptionRow
          icon={<Users className="w-4 h-4" />}
          label="الأصدقاء"
          onClick={() => {}}
        />
        <OptionRow
          icon={<UserCog className="w-4 h-4" />}
          label="تغيير اسم المستخدم"
          onClick={() => {
            setNewName('');
            setRenameOpen(true);
          }}
        />
        <OptionRow
          icon={<KeyRound className="w-4 h-4" />}
          label="تغيير كلمة المرور"
          onClick={() => {
            setOldP('');
            setNewP('');
            setPwdOpen(true);
          }}
        />
        <OptionRow
          icon={<LogOut className="w-4 h-4 text-ember-400" />}
          label="تسجيل الخروج"
          onClick={onLogout}
          danger
        />
      </div>

      {/* Rename modal */}
      {renameOpen && (
        <Modal title="تغيير اسم المستخدم" onClose={() => setRenameOpen(false)}>
          <input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="الاسم الجديد"
            className="w-full rounded-xl bg-ink-900 border border-ink-700 px-4 py-3 text-white outline-none focus:border-gold-500 mb-3"
          />
          <button
            onClick={() => {
              if (newName.trim()) {
                onRename(newName.trim());
                setRenameOpen(false);
              }
            }}
            className="w-full rounded-xl bg-gradient-to-l from-gold-500 to-gold-400 text-ink-950 font-bold py-3"
          >
            حفظ
          </button>
        </Modal>
      )}

      {/* Password modal */}
      {pwdOpen && (
        <Modal title="تغيير كلمة المرور" onClose={() => setPwdOpen(false)}>
          <input
            type="password"
            value={oldP}
            onChange={(e) => setOldP(e.target.value)}
            placeholder="كلمة المرور الحالية"
            className="w-full rounded-xl bg-ink-900 border border-ink-700 px-4 py-3 text-white outline-none focus:border-gold-500 mb-3"
          />
          <input
            type="password"
            value={newP}
            onChange={(e) => setNewP(e.target.value)}
            placeholder="كلمة المرور الجديدة"
            className="w-full rounded-xl bg-ink-900 border border-ink-700 px-4 py-3 text-white outline-none focus:border-gold-500 mb-3"
          />
          <button
            onClick={() => {
              if (oldP && newP) {
                onPasswordChange(oldP, newP);
                setPwdOpen(false);
              }
            }}
            className="w-full rounded-xl bg-gradient-to-l from-gold-500 to-gold-400 text-ink-950 font-bold py-3"
          >
            تحديث
          </button>
        </Modal>
      )}
    </div>
  );
}

function StatBox({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-xl bg-ink-850/90 border border-ink-700/70 px-4 py-3 flex items-center gap-3">
      <span className="text-gold-300">{icon}</span>
      <div>
        <div className="text-lg font-extrabold text-white">{value}</div>
        <div className="text-[11px] text-gray-400">{label}</div>
      </div>
    </div>
  );
}

function OptionRow({
  icon,
  label,
  onClick,
  danger,
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  danger?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center justify-between px-4 py-3.5 hover:bg-ink-800/60 transition-colors"
    >
      <div className="flex items-center gap-2.5">
        <span className={danger ? '' : 'text-gold-300'}>{icon}</span>
        <span className={`text-sm font-semibold ${danger ? 'text-ember-400' : 'text-gray-100'}`}>
          {label}
        </span>
      </div>
      <ChevronLeft className="w-4 h-4 text-gray-500" />
    </button>
  );
}

function Modal({
  title,
  children,
  onClose,
}: {
  title: string;
  children: React.ReactNode;
  onClose: () => void;
}) {
  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center px-6">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-sm bg-ink-850 border border-ink-700 rounded-2xl p-5 animate-riseIn">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-bold text-white">{title}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
