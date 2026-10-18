import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowRight,
  CircleAlert,
  CircleCheck,
  Loader2,
  RefreshCw,
  Send,
  Signal,
  Users,
} from 'lucide-react';
import { PlayingCard, type CardModel } from '@/components/PlayingCard';
import {
  getOrCreateSession,
  sessionToken,
  stageLabel,
  updateSession,
  websocketUrl,
  type ClientMessage,
  type PresencePlayer,
  type RemoteCard,
  type ServerMessage,
  type StatePlayer,
} from '@/api/bokerr';
import type { PokerTable, TableStage } from '@/types';
import { syp } from '@/utils/format';

type ConnectionStatus = 'connecting' | 'connected' | 'reconnecting' | 'disconnected';

interface OnlineGameScreenProps {
  table: PokerTable;
  displayName: string;
  onLeave: () => void;
}

interface GameState {
  stateID?: number;
  stage: TableStage;
  board: RemoteCard[];
  yourCards: RemoteCard[];
  pot: number;
  currentPlayerId?: string | null;
  players: StatePlayer[];
  winners?: string[];
  resultMessage?: string;
  handNumber?: number;
  variant?: 'texas' | 'omaha';
  toCall?: number;
  minRaise?: number;
  currentBet?: number;
  bigBlind?: number;
}

export default function OnlineGameScreen({ table, displayName, onLeave }: OnlineGameScreenProps) {
  const socketRef = useRef<WebSocket | null>(null);
  const reconnectTimerRef = useRef<number | null>(null);
  const connectionAttemptRef = useRef(0);
  const manualLeaveRef = useRef(false);
  const reconnectAttemptRef = useRef(0);
  const [status, setStatus] = useState<ConnectionStatus>('connecting');
  const [sessionPlayerId, setSessionPlayerId] = useState<string | null>(null);
  const [presence, setPresence] = useState<{ seated: number; players: PresencePlayer[] }>({ seated: 0, players: [] });
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [amount, setAmount] = useState('');
  const [busyAction, setBusyAction] = useState<string | null>(null);

  const send = useCallback((message: Omit<ClientMessage, 'actionId'>) => {
    const socket = socketRef.current;
    if (!socket || socket.readyState !== WebSocket.OPEN) {
      setConnectionError('الاتصال غير متاح الآن. حاول مجدداً بعد عودة الاتصال.');
      return;
    }
    const actionId = typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID()
      : `action-${Date.now()}-${Math.random().toString(16).slice(2)}`;
    const payload: ClientMessage = { ...message, actionId, stateID: message.stateID || gameState?.stateID };
    setBusyAction(message.type);
    socket.send(JSON.stringify(payload));
  }, [gameState?.stateID]);

  const connect = useCallback(async (forceRefresh = false) => {
    const attempt = ++connectionAttemptRef.current;
    setStatus(forceRefresh || reconnectAttemptRef.current > 0 ? 'reconnecting' : 'connecting');
    setConnectionError(null);
    try {
      const session = await getOrCreateSession(displayName, forceRefresh);
      if (attempt !== connectionAttemptRef.current || manualLeaveRef.current) return;
      setSessionPlayerId(session.id);
      await updateSession({ lastTableId: table.id }, displayName);
      const token = sessionToken();
      if (!token) throw new Error('session_required');
      const socket = new WebSocket(websocketUrl(table.id), ['bokerr-v1', token]);
      socketRef.current = socket;
      socket.onopen = () => {
        reconnectAttemptRef.current = 0;
        setStatus('connected');
        setNotice(null);
        setConnectionError(null);
      };
      socket.onmessage = (event) => {
        let message: ServerMessage;
        try {
          message = JSON.parse(String(event.data)) as ServerMessage;
        } catch {
          setConnectionError('وصلت رسالة غير صالحة من الطاولة.');
          return;
        }
        if (message.type === 'ready') {
          setSessionPlayerId(message.playerId);
          setBusyAction(null);
        } else if (message.type === 'presence') {
          setPresence({ seated: message.seated, players: message.players || [] });
        } else if (message.type === 'state') {
          setGameState(message);
          setBusyAction(null);
          setNotice(null);
        } else if (message.type === 'round_started') {
          setBusyAction(null);
          setNotice('بدأت الجولة. حظاً موفقاً!');
        } else if (message.type === 'action') {
          setBusyAction(null);
          setNotice(actionLabel(message.action));
        } else if (message.type === 'showdown') {
          setBusyAction(null);
          setNotice(message.resultMessage || 'انتهت الجولة — راجع نتيجة كشف الأوراق.');
        } else if (message.type === 'error') {
          setBusyAction(null);
          if (message.error === 'session_expired' || message.error === 'session_required') {
            socket.close();
            void connect(true);
          } else {
            setConnectionError(errorLabel(message.error));
          }
        }
      };
      socket.onerror = () => {
        setStatus('reconnecting');
        setConnectionError('تعذر الاتصال بالطاولة. تتم إعادة المحاولة…');
      };
      socket.onclose = () => {
        if (manualLeaveRef.current || attempt !== connectionAttemptRef.current) return;
        socketRef.current = null;
        setStatus('reconnecting');
        setConnectionError('انقطع الاتصال. تتم إعادة المحاولة تلقائياً…');
        const retry = Math.min(8000, 1000 * 2 ** reconnectAttemptRef.current);
        reconnectAttemptRef.current += 1;
        reconnectTimerRef.current = window.setTimeout(() => void connect(), retry);
      };
    } catch (error) {
      if (attempt !== connectionAttemptRef.current || manualLeaveRef.current) return;
      setStatus('disconnected');
      setConnectionError(error instanceof Error && error.message === 'session_required'
        ? 'تعذر إنشاء جلسة اللعب.'
        : 'تعذر فتح الطاولة الآن.');
    }
  }, [displayName, table.id]);

  useEffect(() => {
    manualLeaveRef.current = false;
    void connect();
    return () => {
      manualLeaveRef.current = true;
      connectionAttemptRef.current += 1;
      if (reconnectTimerRef.current !== null) window.clearTimeout(reconnectTimerRef.current);
      socketRef.current?.close(1000, 'left table');
      socketRef.current = null;
    };
  }, [connect]);

  const myPlayer = gameState?.players.find((player) => player.id === sessionPlayerId);
  const isMyTurn = Boolean(sessionPlayerId && (gameState?.currentPlayerId === sessionPlayerId || myPlayer?.isTurn));
  const waitingToStart = !gameState || gameState.stage === 'waiting';
  const canStart = presence.seated >= 2 && gameState?.stage === 'waiting';
  const canNextHand = gameState?.stage === 'showdown';
  const displayPlayers = gameState?.players.length ? gameState.players : presence.players;
  const connectionText: Record<ConnectionStatus, string> = {
    connecting: 'جارٍ الاتصال',
    connected: 'متصل',
    reconnecting: 'إعادة الاتصال',
    disconnected: 'غير متصل',
  };

  const boardCards = useMemo(() => gameState?.board || [], [gameState?.board]);
  const ownCards = useMemo(() => gameState?.yourCards || [], [gameState?.yourCards]);

  const submitAction = (type: ClientMessage['type'], actionAmount?: number) => {
    if (actionAmount !== undefined && (!Number.isFinite(actionAmount) || actionAmount <= 0)) return;
    send({ type, amount: actionAmount });
    if (actionAmount !== undefined) setAmount('');
  };

  return (
    <div className="px-4 pt-4 pb-8 space-y-4 animate-riseIn">
      <header className="flex items-center justify-between gap-3">
        <button
          onClick={onLeave}
          className="rounded-xl border border-ink-700 bg-ink-850 px-3 py-2 text-sm text-gray-200 flex items-center gap-2 hover:border-gold-700/60"
        >
          <ArrowRight className="w-4 h-4" />
          مغادرة
        </button>
        <div className="text-right min-w-0">
          <div className="flex items-center justify-end gap-2">
            <ConnectionDot status={status} />
            <span className="text-[11px] text-gray-300">{connectionText[status]}</span>
          </div>
          <h1 className="text-xl font-extrabold text-white truncate">{table.name}</h1>
          <p className="text-[11px] text-gold-200/70">{table.variant === 'texas' ? 'تكساس هولدم' : 'أوماها'} · {table.blinds}</p>
        </div>
      </header>

      {(connectionError || notice) && (
        <div className={`rounded-xl border px-3 py-2.5 text-xs flex items-start gap-2 ${connectionError ? 'bg-ember-500/10 border-ember-500/30 text-ember-200' : 'bg-gold-500/10 border-gold-700/30 text-gold-100'}`}>
          {connectionError ? <CircleAlert className="w-4 h-4 shrink-0 mt-0.5" /> : <CircleCheck className="w-4 h-4 shrink-0 mt-0.5" />}
          <span className="flex-1">{connectionError || notice}</span>
          {status === 'disconnected' && (
            <button onClick={() => void connect()} className="text-gold-200 underline underline-offset-2">إعادة</button>
          )}
        </div>
      )}

      <section className="rounded-2xl border border-gold-700/30 bg-felt-radial p-4 shadow-inner-felt">
        <div className="flex items-center justify-between text-xs text-gray-300 mb-4">
          <span className="flex items-center gap-1.5"><Users className="w-4 h-4 text-gold-300" /> {presence.seated}/{table.capacity} لاعبين</span>
          <span>{gameState ? stageLabel(gameState.stage) : 'بانتظار الجولة'}</span>
        </div>
        <div className="min-h-36 rounded-xl border border-gold-700/20 bg-felt-950/60 p-3 flex flex-col items-center justify-center">
          <div className="text-[11px] text-gray-400 mb-2">البورد</div>
          <div className="flex items-center justify-center gap-2 min-h-24">
            {boardCards.length ? boardCards.map((card, index) => <Card key={`${card.suit}-${card.rank}-${index}`} card={card} size="md" />) : <span className="text-xs text-gray-500">تظهر أوراق البورد عند بدء الجولة</span>}
          </div>
          <div className="mt-2 text-sm text-gold-100 font-bold">البوت: {syp(gameState?.pot || 0)}</div>
        </div>
      </section>

      <section className="rounded-2xl border border-ink-700/80 bg-ink-850/90 p-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-bold text-white">اللاعبون</h2>
          <span className="text-[11px] text-gray-500">{gameState?.handNumber ? `يد #${gameState.handNumber}` : 'جلسة مباشرة'}</span>
        </div>
        <div className="space-y-2">
          {displayPlayers.length ? displayPlayers.map((player) => (
            <PlayerRow key={player.id} player={player} isMe={player.id === sessionPlayerId} />
          )) : <div className="text-center text-xs text-gray-500 py-3">جارٍ تحميل المقاعد…</div>}
        </div>
      </section>

      <section className="rounded-2xl border border-gold-700/30 bg-ink-850/95 p-4">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="text-sm font-bold text-white">أوراقك</h2>
            <p className="text-[11px] text-gray-500">{isMyTurn ? 'دورك الآن' : gameState ? 'بانتظار دورك' : 'ابدأ الجولة بعد اكتمال لاعبين'}</p>
          </div>
          {isMyTurn && <span className="rounded-full bg-emerald-500/15 border border-emerald-500/30 px-2 py-1 text-[10px] font-bold text-emerald-200">دورك</span>}
        </div>
        <div className="flex justify-center gap-2 min-h-28">
          {ownCards.length ? ownCards.map((card, index) => <Card key={`${card.suit}-${card.rank}-${index}`} card={card} size="lg" />) : <div className="flex items-center text-xs text-gray-500">الأوراق مخفية حتى تبدأ الجولة</div>}
        </div>
      </section>

      {waitingToStart && (
        <button
          onClick={() => submitAction('start')}
          disabled={!canStart || Boolean(busyAction)}
          className="w-full rounded-xl bg-gradient-to-l from-gold-500 to-gold-400 text-ink-950 font-bold py-3.5 disabled:cursor-not-allowed disabled:opacity-45 flex items-center justify-center gap-2"
        >
          {busyAction === 'start' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Signal className="w-4 h-4" />}
          {canStart ? 'بدء الجولة' : 'بانتظار لاعب آخر'}
        </button>
      )}

      {canNextHand && (
        <button
          onClick={() => submitAction('startNextHand')}
          disabled={Boolean(busyAction)}
          className="w-full rounded-xl bg-gradient-to-l from-gold-500 to-gold-400 text-ink-950 font-bold py-3.5 disabled:opacity-45 flex items-center justify-center gap-2"
        >
          {busyAction === 'startNextHand' ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
          بدء اليد التالية
        </button>
      )}

      {gameState && gameState.stage !== 'showdown' && (
        <section className="rounded-2xl border border-ink-700/80 bg-ink-850/90 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-white">إجراءات اللعب</h2>
            <span className="text-[11px] text-gray-400">{isMyTurn ? `المطلوب: ${syp(gameState.toCall || 0)}` : 'ليست حركتك بعد'}</span>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <ActionButton label="انسحاب" disabled={!isMyTurn || Boolean(busyAction)} onClick={() => submitAction('fold')} tone="danger" />
            <ActionButton label="تحقق" disabled={!isMyTurn || Boolean(busyAction) || (gameState.toCall || 0) > 0} onClick={() => submitAction('check')} />
            <ActionButton label="اتصال" disabled={!isMyTurn || Boolean(busyAction) || (gameState.toCall || 0) <= 0} onClick={() => submitAction('call')} />
          </div>
          <div className="grid grid-cols-[1fr_auto] gap-2">
            <input
              value={amount}
              onChange={(event) => setAmount(event.target.value.replace(/[^0-9]/g, ''))}
              inputMode="numeric"
              placeholder={`المبلغ (${(gameState.currentBet || 0) > 0 ? (gameState.currentBet || 0) + (gameState.minRaise || 0) : (gameState.bigBlind || 10)}+)`}
              className="min-w-0 rounded-xl bg-ink-900 border border-ink-700 px-3 py-2 text-sm text-white outline-none focus:border-gold-500 ltr-text"
              dir="ltr"
              aria-label="مبلغ الرهان أو الرفع"
            />
            {(gameState.currentBet || 0) > 0
              ? <ActionButton label="رفع إلى" disabled={!isMyTurn || Boolean(busyAction) || !amount} onClick={() => submitAction('raise', Number(amount))} />
              : <ActionButton label="رهان" disabled={!isMyTurn || Boolean(busyAction) || !amount} onClick={() => submitAction('bet', Number(amount))} />}
          </div>
          <button
            onClick={() => submitAction('allIn')}
            disabled={!isMyTurn || Boolean(busyAction)}
            className="w-full rounded-xl border border-ember-500/35 bg-ember-500/10 py-2.5 text-sm font-bold text-ember-200 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            <Send className="w-4 h-4" /> الكل (All-in)
          </button>
        </section>
      )}

      {gameState?.resultMessage && (
        <div className="rounded-xl border border-gold-700/30 bg-gold-500/10 px-3 py-3 text-center text-sm text-gold-100">{gameState.resultMessage}</div>
      )}
    </div>
  );
}

function PlayerRow({ player, isMe }: { player: PresencePlayer | StatePlayer; isMe: boolean }) {
  const statePlayer = player as StatePlayer;
  return (
    <div className={`rounded-xl border px-3 py-2 flex items-center gap-3 ${isMe ? 'border-gold-700/45 bg-gold-500/10' : 'border-ink-700/70 bg-ink-900/60'}`}>
      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-gold-400 to-gold-600 text-ink-950 grid place-items-center text-xs font-extrabold">{player.name.slice(0, 2)}</div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 text-sm font-bold text-white truncate">
          <span className="truncate">{player.name}</span>
          {isMe && <span className="text-[10px] text-gold-200">أنت</span>}
        </div>
        <div className="text-[10px] text-gray-500">{statePlayer.folded ? 'منسحب' : statePlayer.allIn ? 'All-in' : statePlayer.isTurn ? 'يلعب الآن' : 'على الطاولة'}</div>
      </div>
      {(statePlayer.stack !== undefined || statePlayer.bet !== undefined || statePlayer.committed !== undefined) && (
        <div className="text-left text-[11px] text-gold-200">{syp(statePlayer.stack ?? statePlayer.bet ?? statePlayer.committed ?? 0)}</div>
      )}
    </div>
  );
}

function ActionButton({ label, disabled, onClick, tone = 'normal' }: { label: string; disabled: boolean; onClick: () => void; tone?: 'normal' | 'danger' }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`rounded-xl py-2.5 text-sm font-bold transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${tone === 'danger' ? 'border border-ember-500/30 bg-ember-500/10 text-ember-200 hover:bg-ember-500/20' : 'border border-gold-700/35 bg-gold-500/10 text-gold-100 hover:bg-gold-500/20'}`}
    >
      {label}
    </button>
  );
}

function ConnectionDot({ status }: { status: ConnectionStatus }) {
  return <span className={`w-2 h-2 rounded-full ${status === 'connected' ? 'bg-emerald-300' : status === 'disconnected' ? 'bg-ember-400' : 'bg-gold-300 animate-pulse'}`} />;
}

function Card({ card, size }: { card: RemoteCard; size: 'md' | 'lg' }) {
  const suitMap: Record<string, CardModel['suit']> = { S: 'spades', H: 'hearts', D: 'diamonds', C: 'clubs', spades: 'spades', hearts: 'hearts', diamonds: 'diamonds', clubs: 'clubs' };
  const rankMap: Record<string, string> = { '11': 'J', '12': 'Q', '13': 'K', '14': 'A' };
  const rank = String(card.rank);
  return <PlayingCard card={{ rank: rankMap[rank] || rank, suit: suitMap[card.suit] || 'spades' }} size={size} />;
}

function actionLabel(action: string): string {
  const labels: Record<string, string> = { fold: 'تم الانسحاب.', check: 'تم التحقق.', call: 'تم الاتصال.', bet: 'تم تسجيل الرهان.', raise: 'تم تسجيل الرفع.', allIn: 'تم تسجيل All-in.' };
  return labels[action] || 'تم تنفيذ الحركة.';
}

function errorLabel(error: string): string {
  const labels: Record<string, string> = {
    need_two_players: 'تحتاج الطاولة إلى لاعبين على الأقل لبدء الجولة.',
    not_your_turn: 'انتظر دورك قبل تنفيذ الحركة.',
    round_in_progress: 'الجولة بدأت بالفعل.',
    round_not_started: 'ابدأ الجولة أولاً.',
    invalid_action_id: 'تعذر التحقق من الحركة. حاول مرة أخرى.',
    invalid_action: 'الحركة غير متاحة وفق حالة الطاولة الحالية.',
    invalid_amount: 'أدخل مبلغاً صحيحاً ومتوافقاً مع الحد الأدنى للرهان.',
    stale_state: 'تحدّثت الطاولة؛ راجع الحالة الجديدة ثم أعد المحاولة.',
    replayed_action: 'تم تجاهل حركة مكررة.',
    could_not_start_hand: 'تعذر بدء الجولة الآن. تأكد من وجود لاعبين متصلين.',
    game_not_ready: 'الطاولة لا تزال تجهّز الحالة. حاول بعد لحظة.',
    unsupported_action: 'هذه الحركة غير متاحة في هذه الجولة.',
    table_full: 'الطاولة ممتلئة.',
  };
  return labels[error] || `تعذر تنفيذ الحركة (${error}).`;
}
