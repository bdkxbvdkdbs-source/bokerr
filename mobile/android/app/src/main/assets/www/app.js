(() => {
  const native = window.BokerrNative;
  const $ = (id) => document.getElementById(id);
  const homeScreen = $('homeScreen');
  const gameScreen = $('gameScreen');
  const tablesElement = $('tables');
  const apiBase = (native?.apiBaseUrl?.() || '').replace(/\/$/, '');
  let sessionToken = native?.getSessionToken?.() || '';
  let session = null;
  let activeTable = null;
  let socket = null;
  let currentState = null;
  let readyPlayerId = null;
  let readyStateID = null;
  let pendingActionId = null;
  let lastPlayers = [];

  function setSessionStatus(text) { $('sessionStatus').textContent = text; }
  function setConnection(connected, label) {
    $('connectionDot').classList.toggle('muted', !connected);
    $('connectionLabel').textContent = label;
  }
  function showError(container, text) {
    container.innerHTML = '';
    const card = document.createElement('div');
    card.className = 'error-card';
    card.textContent = text;
    container.appendChild(card);
  }
  function escapeHtml(value) {
    return String(value ?? '').replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
  }
  function newActionId() {
    if (window.crypto?.randomUUID) return window.crypto.randomUUID();
    return `${Date.now().toString(16)}-${Math.random().toString(16).slice(2)}-${Math.random().toString(16).slice(2)}`;
  }
  function sameId(left, right) { return left != null && right != null && String(left) === String(right); }
  function selfId() { return readyPlayerId ?? session?.id; }
  function isSelf(player) { return sameId(player?.id, selfId()); }
  function stateID() { return currentState?.stateID ?? readyStateID; }
  function formatChips(value) {
    if (value == null || value === '') return '—';
    const number = Number(value);
    return Number.isFinite(number) ? number.toLocaleString('ar-EG', { maximumFractionDigits: 2 }) : escapeHtml(value);
  }
  function stageLabel(stage) {
    return ({ waiting: 'انتظار', preflop: 'قبل الفلوب', flop: 'فلوب', turn: 'تيرن', river: 'ريفر', showdown: 'النتيجة' })[stage] || stage || 'انتظار';
  }
  async function request(path, options = {}) {
    if (!apiBase.startsWith('https://')) throw new Error('عنوان API الآمن غير مضبوط في نسخة التطبيق.');
    const headers = new Headers(options.headers || {});
    if (sessionToken) headers.set('Authorization', `Bearer ${sessionToken}`);
    if (options.body && !headers.has('Content-Type')) headers.set('Content-Type', 'application/json');
    const response = await fetch(`${apiBase}${path}`, { ...options, headers, cache: 'no-store' });
    let data = {};
    try { data = await response.json(); } catch { /* empty response */ }
    if (!response.ok) throw new Error(data.error || `HTTP ${response.status}`);
    return data;
  }
  async function createSession() {
    const savedName = native?.getDisplayName?.() || '';
    const data = await request('/api/session', { method: 'POST', body: JSON.stringify({ displayName: savedName || undefined }) });
    sessionToken = data.token;
    session = data.session;
    native?.saveSessionToken?.(sessionToken);
    if (session?.displayName) native?.saveDisplayName?.(session.displayName);
    return session;
  }
  async function initializeSession() {
    if (!apiBase.startsWith('https://')) throw new Error('عنوان API غير مضبوط في التطبيق.');
    if (sessionToken) {
      try {
        const data = await request('/api/session', { method: 'GET' });
        session = data.session;
      } catch (error) {
        if (!String(error.message).includes('session_expired') && !String(error.message).includes('session_required')) throw error;
        sessionToken = '';
        native?.clearSessionToken?.();
      }
    }
    if (!session) await createSession();
    $('displayName').value = session.displayName || native?.getDisplayName?.() || '';
    setSessionStatus('جلستك محفوظة على هذا الهاتف والسيرفر لمدة 30 يوماً.');
  }
  async function loadTables() {
    tablesElement.innerHTML = '<div class="loading-card"><span class="spinner"></span><span>جارٍ تحديث الطاولات...</span></div>';
    try {
      const data = await request('/api/tables', { method: 'GET' });
      const tables = Array.isArray(data) ? data : [];
      $('tableCount').textContent = String(tables.length);
      tablesElement.innerHTML = '';
      if (!tables.length) return showError(tablesElement, 'لا توجد طاولات متاحة الآن. حاول التحديث بعد قليل.');
      tables.forEach((table) => {
        const variant = table.variant === 'omaha' ? 'أوماها' : 'تكساس هولدم';
        const stage = table.stage === 'waiting' ? 'بانتظار لاعبين' : `جولة ${table.stage}`;
        const card = document.createElement('article');
        card.className = 'table-card';
        card.innerHTML = `<div class="table-card-head"><div><h3>${escapeHtml(table.name)}</h3><div class="table-subtitle">${escapeHtml(variant)} · ${escapeHtml(stage)}</div></div><span class="variant-pill">${escapeHtml(variant)}</span></div><div class="table-details"><span class="detail-chip">حد المقاعد ${escapeHtml(table.capacity)}</span><span class="detail-chip">${escapeHtml(table.blinds || 'بدون رصيد')}</span></div><div class="table-card-bottom"><span class="seat-line"><strong>${Number(table.seated) || 0}</strong> جالسون الآن</span><button class="primary-button join-button">دخول الطاولة</button></div>`;
        card.querySelector('.join-button').addEventListener('click', () => joinTable(table));
        tablesElement.appendChild(card);
      });
    } catch (error) {
      showError(tablesElement, `تعذر تحميل الطاولات: ${error.message}`);
    }
  }
  function suitInfo(suit) {
    const map = { S: ['♠', false], H: ['♥', true], D: ['♦', true], C: ['♣', false] };
    return map[suit] || ['•', false];
  }
  function cardMarkup(card) {
    const rank = { 14: 'A', 13: 'K', 12: 'Q', 11: 'J', 10: '10', 1: 'A' }[card.rank] || String(card.rank);
    const [suit, red] = suitInfo(card.suit);
    return `<span class="playing-card${red ? ' red' : ''}">${rank}${suit}</span>`;
  }
  function renderPlayers(players = []) {
    const element = $('players');
    lastPlayers = Array.isArray(players) ? players : [];
    element.innerHTML = '';
    $('seatCount').textContent = `${lastPlayers.length} لاعب`;
    if (!lastPlayers.length) {
      element.innerHTML = '<div class="empty-seat">بانتظار اللاعبين</div>';
      return;
    }
    lastPlayers.forEach((player) => {
      const chip = document.createElement('div');
      const isTurn = Boolean(player.isTurn) || sameId(currentState?.currentPlayerId, player.id);
      const isDisconnected = player.isConnected === false;
      const status = player.folded ? 'انسحب' : player.allIn ? 'الكل' : isTurn ? 'دوره الآن' : isDisconnected ? 'غير متصل' : 'على الطاولة';
      const seat = player.seat == null ? '—' : escapeHtml(player.seat);
      chip.className = `player-chip${isTurn ? ' current' : ''}${player.folded ? ' folded' : ''}${isDisconnected ? ' disconnected' : ''}`;
      chip.innerHTML = `<div class="player-top"><strong>${escapeHtml(player.name || 'لاعب')}</strong><span class="seat-label">مقعد ${seat}</span></div><div class="player-stats"><span>رصيد <b>${formatChips(player.stack)}</b></span><span>رهان <b>${formatChips(player.bet)}</b></span></div><small>${status}${isSelf(player) ? ' · أنت' : ''}</small>`;
      element.appendChild(chip);
    });
  }
  function winnerName(winner) {
    if (winner && typeof winner === 'object') return winner.name || winner.playerName || winner.id || 'لاعب';
    const player = lastPlayers.find((candidate) => sameId(candidate.id, winner));
    return player?.name || winner || 'لاعب';
  }
  function renderWinners(winners = []) {
    const list = Array.isArray(winners) ? winners : [];
    const panel = $('winnerPanel');
    const element = $('winnerList');
    element.innerHTML = '';
    if (!list.length) { panel.hidden = true; return; }
    list.forEach((winner) => {
      const row = document.createElement('div');
      const payout = winner && typeof winner === 'object' && winner.amount != null ? ` · ${formatChips(winner.amount)} رقائق` : '';
      row.textContent = `${winnerName(winner)}${payout}`;
      element.appendChild(row);
    });
    panel.hidden = false;
  }
  function updateActionControls() {
    const state = currentState || {};
    const waiting = state.stage === 'waiting' || !state.stage;
    const showdown = state.stage === 'showdown';
    const myTurn = sameId(state.currentPlayerId, selfId());
    const amount = state.toCall == null ? 'مجاراة' : `مجاراة ${formatChips(state.toCall)}`;
    document.querySelector('[data-action="call"]').textContent = amount;
    $('actionButtons').hidden = waiting || showdown;
    $('amountPanel').hidden = waiting || showdown || !myTurn;
    const currentBet = Number(state.currentBet) || 0;
    const minimumAmount = currentBet > 0 ? currentBet + (Number(state.minRaise) || 0) : (Number(state.bigBlind) || 10);
    $('amountHint').textContent = currentBet > 0
      ? `أقل إجمالي للرفع: ${formatChips(minimumAmount)} · للمجاراة: ${formatChips(state.toCall ?? 0)}`
      : `أقل رهان: ${formatChips(minimumAmount)} · للمجاراة: ${formatChips(state.toCall ?? 0)}`;
    document.querySelectorAll('[data-action]').forEach((button) => {
      const action = button.dataset.action;
      const impossibleNow = (action === 'check' && (Number(state.toCall) || 0) > 0)
        || (action === 'call' && (Number(state.toCall) || 0) <= 0)
        || (action === 'bet' && currentBet > 0)
        || (action === 'raise' && currentBet <= 0);
      button.disabled = !myTurn || showdown || impossibleNow || Boolean(pendingActionId) || !socket || socket.readyState !== WebSocket.OPEN;
    });
    $('startButton').hidden = !waiting;
    $('startButton').disabled = (state.players || lastPlayers).length < 2 || Boolean(pendingActionId) || !socket || socket.readyState !== WebSocket.OPEN;
    $('nextHandButton').hidden = !showdown;
    $('nextHandButton').disabled = Boolean(pendingActionId) || !socket || socket.readyState !== WebSocket.OPEN;
  }
  function renderState(state) {
    currentState = state || {};
    readyStateID = currentState.stateID ?? readyStateID;
    $('stagePill').textContent = stageLabel(currentState.stage);
    $('potValue').textContent = formatChips(currentState.pot ?? 0);
    $('communityCards').innerHTML = (currentState.board || []).map(cardMarkup).join('');
    $('yourCards').innerHTML = (currentState.yourCards || []).length ? currentState.yourCards.map(cardMarkup).join('') : '<span class="card-back">♠</span><span class="card-back">♠</span>';
    renderPlayers(currentState.players || []);
    renderWinners(currentState.winners || []);
    if (currentState.stage === 'showdown') $('gameMessage').textContent = currentState.resultMessage || 'انتهت الجولة. يمكن بدء جولة جديدة من الطاولة.';
    else if (sameId(currentState.currentPlayerId, selfId())) $('gameMessage').textContent = 'دورك الآن. اختر حركة للمتابعة.';
    else $('gameMessage').textContent = currentState.currentPlayerId ? 'الجولة جارية؛ انتظر دورك.' : 'بانتظار بدء الجولة.';
    updateActionControls();
  }
  function joinTable(table) {
    if (!sessionToken || !session) { setSessionStatus('لم تكتمل الجلسة بعد. انتظر لحظة ثم حاول مجدداً.'); return; }
    activeTable = table;
    currentState = null;
    readyPlayerId = null;
    readyStateID = null;
    pendingActionId = null;
    lastPlayers = [];
    $('gameTitle').textContent = table.name;
    homeScreen.hidden = true;
    gameScreen.hidden = false;
    $('gameMessage').textContent = 'جارٍ الاتصال بطاولة Cloudflare...';
    $('startButton').hidden = false;
    $('startButton').disabled = true;
    $('nextHandButton').hidden = true;
    $('winnerPanel').hidden = true;
    $('amountPanel').hidden = true;
    $('actionButtons').hidden = true;
    setConnection(false, 'جارٍ الاتصال');
    native?.saveLastTableId?.(table.id);
    request('/api/session', { method: 'PUT', body: JSON.stringify({ lastTableId: table.id }) }).catch(() => {});
    const socketBase = apiBase.replace(/^https:/, 'wss:');
    try {
      socket = new WebSocket(`${socketBase}/ws/${encodeURIComponent(table.id)}`, ['bokerr-v1', sessionToken]);
    } catch (error) {
      $('gameMessage').textContent = `تعذر فتح الاتصال: ${error.message}`;
      return;
    }
    socket.onopen = () => {
      setConnection(true, 'متصل بالسيرفر');
      $('gameMessage').textContent = 'أنت على الطاولة. بانتظار لاعب آخر.';
      updateActionControls();
      loadTables();
    };
    socket.onmessage = (event) => {
      let message;
      try { message = JSON.parse(event.data); } catch { return; }
      if (message.type === 'ready') {
        readyPlayerId = message.playerId ?? readyPlayerId;
        readyStateID = message.stateID ?? readyStateID;
        setConnection(true, 'متصل بالسيرفر');
        updateActionControls();
        return;
      }
      if (message.type === 'presence') {
        if (!currentState || currentState.stage === 'waiting') renderPlayers(message.players || []);
        const seated = Number(message.seated ?? (message.players || []).length) || 0;
        $('seatCount').textContent = `${seated} لاعب`;
        if (!currentState || currentState.stage === 'waiting') {
          $('gameMessage').textContent = seated < 2 ? 'أنت على الطاولة. بانتظار لاعب آخر.' : 'يوجد لاعبون؛ ابدأ الجولة عندما تكون مستعداً.';
        }
        updateActionControls();
        return;
      }
      if (message.type === 'state') { renderState(message); return; }
      if (message.type === 'round_started') {
        pendingActionId = null;
        renderWinners([]);
        $('gameMessage').textContent = 'بدأت الجولة من محرك اللعب على السيرفر.';
        updateActionControls();
        return;
      }
      if (message.type === 'action') {
        pendingActionId = null;
        $('gameMessage').textContent = 'تم تسجيل الحركة على السيرفر.';
        updateActionControls();
        return;
      }
      if (message.type === 'showdown') {
        pendingActionId = null;
        currentState = { ...(currentState || {}), stage: 'showdown', winners: message.winners || [] };
        renderWinners(message.winners || []);
        const won = (message.winners || []).some((winner) => sameId(winner?.id ?? winner, selfId()));
        $('stagePill').textContent = 'النتيجة';
        $('actionButtons').hidden = true;
        $('amountPanel').hidden = true;
        $('startButton').hidden = true;
        $('nextHandButton').hidden = false;
        $('gameMessage').textContent = won ? 'أنت الفائز في هذه الجولة.' : 'انتهت الجولة، واحتُسبت النتيجة على السيرفر.';
        updateActionControls();
        return;
      }
      if (message.type === 'error') {
        if (!message.actionId || message.actionId === pendingActionId) pendingActionId = null;
        $('gameMessage').textContent = `تعذر تنفيذ الحركة: ${message.error || 'طلب غير صالح'}`;
        updateActionControls();
      }
    };
    socket.onerror = () => {
      setConnection(false, 'تعذر الاتصال');
      $('gameMessage').textContent = 'فشل اتصال الطاولة. تحقق من الشبكة ثم ارجع إلى الصالة وحاول مجدداً.';
      updateActionControls();
    };
    socket.onclose = () => {
      pendingActionId = null;
      setConnection(false, 'انقطع الاتصال');
      updateActionControls();
    };
  }
  function leaveTable() {
    if (socket) { try { socket.close(); } catch { /* ignore */ } }
    socket = null;
    activeTable = null;
    currentState = null;
    readyPlayerId = null;
    readyStateID = null;
    pendingActionId = null;
    lastPlayers = [];
    gameScreen.hidden = true;
    homeScreen.hidden = false;
    loadTables();
  }
  function sendMessage(type) {
    if (!socket || socket.readyState !== WebSocket.OPEN) return;
    const payload = { type, actionId: newActionId() };
    const currentStateID = stateID();
    if (currentStateID != null) payload.stateID = currentStateID;
    if (type === 'bet' || type === 'raise') {
      const amount = Number($('amountInput').value);
      if (!Number.isFinite(amount) || amount <= 0) {
        $('gameMessage').textContent = 'أدخل مبلغاً رقمياً أكبر من صفر قبل متابعة الرهان.';
        $('amountInput').focus();
        return;
      }
      payload.amount = amount;
    }
    pendingActionId = payload.actionId;
    socket.send(JSON.stringify(payload));
    $('gameMessage').textContent = 'جارٍ إرسال الحركة إلى السيرفر...';
    updateActionControls();
  }
  async function saveDisplayName() {
    const name = $('displayName').value.trim().replace(/\s+/g, ' ');
    if (!name || name.length > 24) { setSessionStatus('اكتب اسماً من حرف إلى 24 حرفاً.'); return; }
    try {
      const data = await request('/api/session', { method: 'PUT', body: JSON.stringify({ displayName: name }) });
      session = data.session;
      native?.saveDisplayName?.(name);
      setSessionStatus('تم حفظ الاسم في جلسة السيرفر.');
      if (activeTable) $('gameTitle').textContent = activeTable.name;
    } catch (error) { setSessionStatus(`تعذر الحفظ: ${error.message}`); }
  }

  $('refreshButton').addEventListener('click', loadTables);
  $('saveNameButton').addEventListener('click', saveDisplayName);
  $('backButton').addEventListener('click', leaveTable);
  $('startButton').addEventListener('click', () => sendMessage('start'));
  $('nextHandButton').addEventListener('click', () => sendMessage('startNextHand'));
  document.querySelectorAll('[data-action]').forEach((button) => button.addEventListener('click', () => sendMessage(button.dataset.action)));
  $('amountInput').addEventListener('input', () => {
    $('amountInput').setCustomValidity('');
  });
  window.addEventListener('beforeunload', () => { if (socket) socket.close(); });

  (async () => {
    try {
      await initializeSession();
      await loadTables();
    } catch (error) {
      setSessionStatus(`تعذر إنشاء الجلسة: ${error.message}`);
      showError(tablesElement, 'تعذر الاتصال بخدمة Bokerr. تحقق من الشبكة أو أعد فتح التطبيق.');
    }
  })();
})();
