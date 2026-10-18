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
    element.innerHTML = '';
    $('seatCount').textContent = `${players.length} لاعب`;
    if (!players.length) {
      element.innerHTML = '<div class="empty-seat">بانتظار اللاعبين</div>';
      return;
    }
    players.forEach((player) => {
      const chip = document.createElement('div');
      chip.className = `player-chip${player.isTurn ? ' current' : ''}${player.folded ? ' folded' : ''}`;
      chip.innerHTML = `${escapeHtml(player.name)}${player.id === session?.id ? ' · أنت' : ''}<small>${player.isTurn ? 'دوره الآن' : player.folded ? 'انسحب' : 'على الطاولة'}</small>`;
      element.appendChild(chip);
    });
  }
  function renderState(state) {
    currentState = state;
    $('stagePill').textContent = ({ preflop: 'قبل الفلوب', flop: 'فلوب', turn: 'تيرن', river: 'ريفر', showdown: 'النتيجة' })[state.stage] || state.stage;
    $('potValue').textContent = String(state.pot ?? 0);
    $('communityCards').innerHTML = (state.board || []).map(cardMarkup).join('');
    $('yourCards').innerHTML = (state.yourCards || []).length ? state.yourCards.map(cardMarkup).join('') : '<span class="card-back">♠</span><span class="card-back">♠</span>';
    renderPlayers(state.players || []);
    const myTurn = state.currentPlayerId === session?.id;
    $('startButton').hidden = state.stage !== 'waiting' && state.stage !== 'showdown';
    $('startButton').disabled = (state.players || []).length < 2;
    $('actionButtons').hidden = state.stage === 'waiting' || state.stage === 'showdown';
    document.querySelectorAll('[data-action]').forEach((button) => { button.disabled = !myTurn || state.stage === 'showdown'; });
    if (state.stage === 'showdown') $('gameMessage').textContent = 'انتهت الجولة. يمكن بدء جولة جديدة من الطاولة.';
    else if (myTurn) $('gameMessage').textContent = 'دورك الآن. اختر حركة للمتابعة.';
    else $('gameMessage').textContent = 'الجولة جارية؛ انتظر دورك.';
  }
  function joinTable(table) {
    if (!sessionToken || !session) { setSessionStatus('لم تكتمل الجلسة بعد. انتظر لحظة ثم حاول مجدداً.'); return; }
    activeTable = table;
    currentState = null;
    $('gameTitle').textContent = table.name;
    homeScreen.hidden = true;
    gameScreen.hidden = false;
    $('gameMessage').textContent = 'جارٍ الاتصال بطاولة Cloudflare...';
    $('startButton').hidden = false;
    $('startButton').disabled = true;
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
      $('startButton').disabled = true;
      loadTables();
    };
    socket.onmessage = (event) => {
      let message;
      try { message = JSON.parse(event.data); } catch { return; }
      if (message.type === 'ready') {
        setConnection(true, 'متصل بالسيرفر');
        return;
      }
      if (message.type === 'presence') {
        renderPlayers((message.players || []).map((player) => ({ ...player, isTurn: false })));
        $('startButton').disabled = (message.seated || 0) < 2;
        $('gameMessage').textContent = (message.seated || 0) < 2 ? 'أنت على الطاولة. بانتظار لاعب آخر.' : 'يوجد لاعبون؛ ابدأ جولة تجريبية عندما تكون مستعداً.';
        return;
      }
      if (message.type === 'state') { renderState(message); return; }
      if (message.type === 'round_started') { $('gameMessage').textContent = 'بدأت الجولة من محرك اللعب على السيرفر.'; return; }
      if (message.type === 'action') { $('gameMessage').textContent = 'تم تسجيل الحركة على السيرفر.'; return; }
      if (message.type === 'showdown') {
        const won = (message.winners || []).includes(session?.id);
        $('gameMessage').textContent = won ? 'أنت الفائز في هذه الجولة.' : 'انتهت الجولة، واحتُسبت النتيجة على السيرفر.';
        return;
      }
      if (message.type === 'error') $('gameMessage').textContent = `تعذر تنفيذ الحركة: ${message.error}`;
    };
    socket.onerror = () => {
      setConnection(false, 'تعذر الاتصال');
      $('gameMessage').textContent = 'فشل اتصال الطاولة. تحقق من الشبكة ثم ارجع إلى الصالة وحاول مجدداً.';
    };
    socket.onclose = () => setConnection(false, 'انقطع الاتصال');
  }
  function leaveTable() {
    if (socket) { try { socket.close(); } catch { /* ignore */ } }
    socket = null;
    activeTable = null;
    currentState = null;
    gameScreen.hidden = true;
    homeScreen.hidden = false;
    loadTables();
  }
  function sendMessage(type) {
    if (!socket || socket.readyState !== WebSocket.OPEN) return;
    socket.send(JSON.stringify({ type, actionId: newActionId() }));
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
  document.querySelectorAll('[data-action]').forEach((button) => button.addEventListener('click', () => sendMessage(button.dataset.action)));
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
