import type { LiveTableRow, Session, TableStage } from '@/types';

const DEFAULT_API_BASE = 'https://bokerr-api.bdkxbvdkdbs.workers.dev';
const TOKEN_KEY = 'bokerr.session.token';

export const BOKERR_API_BASE_URL = (import.meta.env.VITE_BOKERR_API_BASE_URL || DEFAULT_API_BASE).replace(/\/$/, '');

export type SessionPatch = { displayName?: string; lastTableId?: string | null };

export type ClientMessage = {
  type: 'start' | 'fold' | 'check' | 'call' | 'bet' | 'raise' | 'allIn' | 'startNextHand';
  actionId: string;
  stateID?: number;
  amount?: number;
};

export type ServerMessage =
  | { type: 'ready'; playerId: string; playerIndex?: number; stateID?: number; turnSeconds?: number }
  | { type: 'presence'; seated: number; players: PresencePlayer[] }
  | { type: 'state'; stateID?: number; stage: TableStage; board: RemoteCard[]; yourCards: RemoteCard[]; pot: number; currentPlayerId?: string | null; players: StatePlayer[]; dealerId?: string; smallBlind?: number; bigBlind?: number; currentBet?: number; toCall?: number; minRaise?: number; winners?: string[]; resultMessage?: string; handNumber?: number; variant?: 'texas' | 'omaha' }
  | { type: 'showdown'; winners?: string[]; pot?: number; resultMessage?: string }
  | { type: 'round_started'; stage?: TableStage; stateID?: number }
  | { type: 'action'; action: string; stage?: TableStage; pot?: number; stateID?: number }
  | { type: 'error'; error: string; actionId?: string };

export type RemoteCard = { rank: number | string; suit: string };
export type PresencePlayer = { id: string; name: string; seat?: number; isConnected?: boolean; stack?: number; folded?: boolean; allIn?: boolean; isTurn?: boolean };
export type StatePlayer = PresencePlayer & { bet?: number; committed?: number };

export class BokerrApiError extends Error {
  code: string;
  status: number;

  constructor(code: string, status: number) {
    super(code);
    this.name = 'BokerrApiError';
    this.code = code;
    this.status = status;
  }
}

function token(): string | null {
  if (typeof window === 'undefined') return null;
  return window.localStorage.getItem(TOKEN_KEY);
}

function saveToken(value: string) {
  if (typeof window !== 'undefined') window.localStorage.setItem(TOKEN_KEY, value);
}

function forgetToken() {
  if (typeof window !== 'undefined') window.localStorage.removeItem(TOKEN_KEY);
}

async function parseResponse<T>(response: Response): Promise<T> {
  let body: unknown = null;
  try {
    body = await response.json();
  } catch {
    body = null;
  }
  if (!response.ok) {
    const code = typeof body === 'object' && body !== null && 'error' in body && typeof body.error === 'string'
      ? body.error
      : `http_${response.status}`;
    throw new BokerrApiError(code, response.status);
  }
  return body as T;
}

async function apiRequest<T>(path: string, init: RequestInit = {}, authToken?: string): Promise<T> {
  const headers = new Headers(init.headers);
  headers.set('Accept', 'application/json');
  if (init.body) headers.set('Content-Type', 'application/json');
  if (authToken) headers.set('Authorization', `Bearer ${authToken}`);
  const response = await fetch(`${BOKERR_API_BASE_URL}${path}`, { ...init, headers });
  return parseResponse<T>(response);
}

async function createSession(displayName?: string): Promise<Session> {
  const body = displayName?.trim() ? JSON.stringify({ displayName: displayName.trim() }) : JSON.stringify({});
  const result = await apiRequest<{ token: string; session: Session }>('/api/session', { method: 'POST', body });
  saveToken(result.token);
  return result.session;
}

export async function getOrCreateSession(displayName?: string, forceRefresh = false): Promise<Session> {
  if (forceRefresh) forgetToken();
  const existing = token();
  if (existing) {
    try {
      const result = await apiRequest<{ session: Session }>('/api/session', {}, existing);
      return result.session;
    } catch (error) {
      if (!(error instanceof BokerrApiError) || !['session_expired', 'session_required'].includes(error.code)) throw error;
      forgetToken();
    }
  }
  return createSession(displayName);
}

export async function updateSession(patch: SessionPatch, displayName?: string): Promise<Session> {
  let currentToken = token();
  if (!currentToken) {
    await getOrCreateSession(displayName);
    currentToken = token();
  }
  try {
    const result = await apiRequest<{ session: Session }>('/api/session', { method: 'PUT', body: JSON.stringify(patch) }, currentToken || undefined);
    return result.session;
  } catch (error) {
    if (error instanceof BokerrApiError && ['session_expired', 'session_required'].includes(error.code)) {
      const fresh = await getOrCreateSession(displayName, true);
      const retry = await apiRequest<{ session: Session }>('/api/session', { method: 'PUT', body: JSON.stringify(patch) }, token() || undefined);
      return retry.session || fresh;
    }
    throw error;
  }
}

export async function getTables(): Promise<LiveTableRow[]> {
  return apiRequest<LiveTableRow[]>('/api/tables');
}

export function websocketUrl(tableId: string): string {
  const url = new URL(`${BOKERR_API_BASE_URL}/ws/${encodeURIComponent(tableId)}`);
  url.protocol = url.protocol === 'http:' ? 'ws:' : 'wss:';
  return url.toString();
}

export function sessionToken(): string | null {
  return token();
}

export function stageLabel(stage: TableStage): string {
  const labels: Record<TableStage, string> = {
    waiting: 'بانتظار اللاعبين',
    preflop: 'قبل الفلوب',
    flop: 'الفلوب',
    turn: 'التيرن',
    river: 'الريفر',
    showdown: 'كشف الأوراق',
  };
  return labels[stage] || stage;
}
