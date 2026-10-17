import { Home, Wallet, Headset, User } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { TabKey } from '@/types';

interface NavItem {
  key: TabKey;
  label: string;
  icon: LucideIcon;
}

const NAV: NavItem[] = [
  { key: 'lobby', label: 'الصالة', icon: Home },
  { key: 'wallet', label: 'المحفظة', icon: Wallet },
  { key: 'support', label: 'الدعم', icon: Headset },
  { key: 'profile', label: 'حسابي', icon: User },
];

export default function BottomNav({
  active,
  onChange,
}: {
  active: TabKey;
  onChange: (k: TabKey) => void;
}) {
  return (
    <nav className="absolute bottom-0 inset-x-0 z-30">
      <div className="mx-auto max-w-md px-3 pb-3 pt-1">
        <div className="rounded-2xl bg-ink-900/95 backdrop-blur border border-ink-700/80 shadow-[0_-8px_30px_-12px_rgba(0,0,0,0.7)]">
          <ul className="grid grid-cols-4">
            {NAV.map((item) => {
              const Icon = item.icon;
              const isActive = active === item.key;
              return (
                <li key={item.key}>
                  <button
                    onClick={() => onChange(item.key)}
                    className={`relative w-full flex flex-col items-center gap-1 py-3 transition-all ${
                      isActive ? 'text-gold-300' : 'text-gray-400 hover:text-gray-200'
                    }`}
                    aria-current={isActive ? 'page' : undefined}
                  >
                    {isActive && (
                      <span className="absolute -top-px h-0.5 w-10 rounded-full bg-gradient-to-r from-transparent via-gold-400 to-transparent" />
                    )}
                    <Icon
                      className={`transition-transform ${isActive ? 'scale-110' : 'scale-100'}`}
                      strokeWidth={isActive ? 2.4 : 2}
                    />
                    <span className={`text-[11px] font-semibold ${isActive ? 'font-bold' : ''}`}>
                      {item.label}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </nav>
  );
}
