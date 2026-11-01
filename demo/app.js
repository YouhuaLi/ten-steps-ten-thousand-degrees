/* 十步万度 · 群论演示
 * 规则：点击一格，箭头顺时针转 90°；若转后指向棋盘内另一格，该格继续转，直到指向棋盘外。
 * 群论：局面 ↔ 沙堆群 S(G)=Z^25 / Z^25 Δ' 的元素，Δ' = 4I − A。
 */
(() => {
  const N = 5, M = N * N;

  const { N: _N, M: _M, DR, DC, idx, inside, NB, D, DINV, inverseOf, orderOf, matVec } = window.TenK;

  // ---------- 界面文字（英文页面 <html lang="en"> 用英文）----------
  const EN = document.documentElement.lang === 'en';
  const fmt = n => n.toLocaleString(EN ? 'en-US' : 'zh-CN');
  const T = EN ? {
    idNames: ['σ₁: each corner 2, each other edge cell 1 (20 clicks, one of the fewest)',
              'σ₂: corners 2, inner-ring corners 2, inner-ring edge midpoints 1 (20 clicks)',
              'σ₃: corners 2, inner-ring corners 2, center 4 (20 clicks)',
              'I: the recurrent identity configuration (52 clicks)',
              'Center 104 times (the order of a center click)'],
    random: '5 random clicks',
    randomDone: (n, d) => `5 random clicks: ${n} rotations, +${d}°. Now try applying an identity or the inverse.`,
    invCount: n => fmt(n),
    invEmpty: 'This is the starting position; its inverse is the empty set of clicks.',
    invNote: (t, ord, c) => `The inverse has ${t} clicks. It brings the board back to all up. The current element has order ${ord}, so repeating all your clicks so far ${ord - 1} more times would also restore it, but that takes ${fmt(c)} clicks.`,
    idNote: t => `${t} clicks in all. Afterwards the position is exactly the same as now.`,
    clicked: (r, c, n) => `Clicked (${r}, ${c}): a chain of ${n} rotations, +${n * 90}°.`,
    reset: 'Reset to all up.',
    progress: (label, done, total) => `${label}: ${done}/${total} clicks…`,
    applyId: 'Applying identity',
    idDone: (name, t, g, d, same) => `Identity “${name}” applied: ${t} clicks, ${g} rotations, +${d}°. The position ${same ? 'is exactly as before ✓' : 'changed ✗ (this should not happen)'}.`,
    idToast: (same, d) => same ? `Same position, +${d}°` : 'Error: the position changed',
    alreadyHome: 'Already at the starting position',
    applyInv: 'Applying inverse',
    invDone: (t, g, home, c) => `Inverse applied: ${t} clicks, ${g} rotations. The board is ${home ? 'back to all up ✓' : 'not back to the start ✗ (this should not happen)'}. Your ${c} clicks now form an identity, so computing the inverse again gives nothing.`,
    invToast: home => home ? 'Back to the starting position' : 'Error: not back to the start',
  } : {
    idNames: ['σ₁：四角各 2 次、边格各 1 次（20 次，最少之一）',
              'σ₂：四角 2、内环角 2、内环边中 1（20 次）',
              'σ₃：四角 2、内环角 2、中心 4（20 次）',
              'I：常返单位元配置（52 次）',
              '中心 104 次（中心元素的阶）'],
    random: '随机 5 次点击',
    randomDone: (n, d) => `随机点了 5 次：${n} 次旋转，+${d}°。现在可以试试施加单位元或逆元。`,
    invCount: n => n + ' 次',
    invEmpty: '当前就是初始局面，逆元是空操作。',
    invNote: (t, ord, c) => `逆元共 ${t} 次点击。施加后棋盘回到全朝上；当前元素的阶为 ${ord}，所以把目前的全部点击再重复 ${ord - 1} 遍也能复原，但那需要 ${fmt(c)} 次。`,
    idNote: t => `共 ${t} 次点击。施加后局面与现在完全相同。`,
    clicked: (r, c, n) => `点击 (${r}, ${c})：连锁 ${n} 次旋转，+${n * 90}°。`,
    reset: '已重置为全朝上。',
    progress: (label, done, total) => `${label}：${done}/${total} 次点击…`,
    applyId: '施加单位元',
    idDone: (name, t, g, d, same) => `单位元「${name}」施加完毕：${t} 次点击，${g} 次旋转，+${d}°。局面${same ? '与施加前完全相同 ✓' : '发生了变化 ✗（不应出现）'}。`,
    idToast: (same, d) => same ? '局面不变，度数增加了 ' + d + '°' : '出错：局面改变了',
    alreadyHome: '当前已是初始局面',
    applyInv: '施加逆元',
    invDone: (t, g, home, c) => `逆元施加完毕：${t} 次点击，${g} 次旋转。棋盘${home ? '回到全朝上 ✓' : '未回到初始 ✗（不应出现）'}。累计点击 ${c} 次现在是单位元，可以再次计算逆元（结果为空）。`,
    invToast: home => home ? '已回到初始局面' : '出错：未回到初始局面',
  };

  // ---------- 单位元代表 ----------
  const grid = rows => rows.flat();
  const IDENTITIES = [
    { name: T.idNames[0], v: grid([[2,1,1,1,2],[1,0,0,0,1],[1,0,0,0,1],[1,0,0,0,1],[2,1,1,1,2]]) },
    { name: T.idNames[1], v: grid([[2,0,0,0,2],[0,2,1,2,0],[0,1,0,1,0],[0,2,1,2,0],[2,0,0,0,2]]) },
    { name: T.idNames[2], v: grid([[2,0,0,0,2],[0,2,0,2,0],[0,0,4,0,0],[0,2,0,2,0],[2,0,0,0,2]]) },
    { name: T.idNames[3], v: grid([[2,3,2,3,2],[3,2,1,2,3],[2,1,0,1,2],[3,2,1,2,3],[2,3,2,3,2]]) },
    { name: T.idNames[4], v: (() => { const a = new Array(M).fill(0); a[12] = 104; return a; })() },
  ];
  // 校验：每个代表都应满足 Δ'^{-1}σ 为整数向量
  IDENTITIES.forEach(id => { if (orderOf(id.v) !== 1) console.warn('不是单位元：', id.name); });

  // ---------- 状态 ----------
  const dir = new Array(M).fill(0);       // 0 上 1 右 2 下 3 左
  const angle = new Array(M).fill(0);     // 累计角度，用于顺时针动画
  const sigma = new Array(M).fill(0);     // 自重置以来每格点击次数
  let rotations = 0, clicks = 0, busy = false, speed = 160;

  // ---------- DOM ----------
  const $ = id => document.getElementById(id);
  const boardEl = $('board'), cells = [], arrows = [], cnts = [];
  for (let v = 0; v < M; v++) {
    const cell = document.createElement('div');
    cell.className = 'cell';
    cell.innerHTML = `<svg viewBox="0 0 40 40"><line x1="20" y1="34" x2="20" y2="10" stroke="#d32f2f" stroke-width="4" stroke-linecap="round"/><polygon points="20,4 12,16 28,16" fill="#d32f2f"/></svg><span class="cnt zero">0</span>`;
    cell.addEventListener('click', () => userClick(v));
    boardEl.appendChild(cell);
    cells.push(cell); arrows.push(cell.querySelector('svg')); cnts.push(cell.querySelector('.cnt'));
  }
  $('speed').addEventListener('change', e => { speed = +e.target.value; });
  $('showCounts').addEventListener('change', e => boardEl.classList.toggle('nocounts', !e.target.checked));
  $('btnReset').addEventListener('click', resetBoard);
  $('btnRandom').addEventListener('click', async () => {
    const vec = randomMultiset(5);
    const res = await runMultiset(vec, T.random);
    if (res) setStatus(T.randomDone(res.gained, fmt(res.gained * 90)));
  });
  $('btnIdentity').addEventListener('click', applyIdentity);
  $('btnInverse').addEventListener('click', applyInverse);
  const idSelect = $('idSelect');
  IDENTITIES.forEach((id, i) => { const o = document.createElement('option'); o.value = i; o.textContent = id.name; idSelect.appendChild(o); });
  idSelect.addEventListener('change', renderIdentityPreview);

  // ---------- 渲染 ----------
  function pointsInside(v, d) {
    const r = Math.floor(v / N) + DR[d], c = (v % N) + DC[d];
    return inside(r, c) ? idx(r, c) : -1;
  }
  function render() {
    for (let v = 0; v < M; v++) {
      arrows[v].style.transform = `rotate(${angle[v]}deg)`;
      cells[v].classList.toggle('can', pointsInside(v, (dir[v] + 1) % 4) >= 0);
      cells[v].classList.toggle('cannot', pointsInside(v, (dir[v] + 1) % 4) < 0);
      cnts[v].textContent = sigma[v];
      cnts[v].classList.toggle('zero', sigma[v] === 0);
    }
    $('stClicks').textContent = clicks;
    $('stRot').textContent = rotations;
    $('stDeg').textContent = fmt(rotations * 90) + '°';
    const inv = inverseOf(sigma);
    const invTotal = inv.reduce((a, b) => a + b, 0);
    $('stInv').textContent = T.invCount(invTotal);
    const ord = orderOf(sigma);
    $('stOrd').textContent = ord === null ? '?' : fmt(ord);
    renderMini($('invPreview'), inv);
    $('invNote').textContent = invTotal === 0
      ? T.invEmpty
      : T.invNote(invTotal, ord, clicks * (ord - 1));
    renderIdentityPreview();
  }
  function renderMini(el, vec) {
    el.innerHTML = '';
    vec.forEach(n => {
      const d = document.createElement('div');
      d.textContent = n;
      if (n > 0) d.classList.add('c' + Math.min(n, 5));
      el.appendChild(d);
    });
  }
  function renderIdentityPreview() {
    const id = IDENTITIES[+idSelect.value || 0];
    renderMini($('idPreview'), id.v);
    const total = id.v.reduce((a, b) => a + b, 0);
    $('idNote').textContent = T.idNote(total);
  }
  function setStatus(html) { $('status').innerHTML = html; }
  let toastTimer = null;
  function toast(text, ok) {
    const t = $('toast'); t.textContent = text; t.className = 'toast' + (ok ? ' ok' : '');
    clearTimeout(toastTimer); toastTimer = setTimeout(() => t.classList.add('hidden'), 2600);
  }
  const sleep = ms => new Promise(r => setTimeout(r, ms));

  // ---------- 游戏动作 ----------
  async function rotate(v, cls) {
    dir[v] = (dir[v] + 1) % 4; angle[v] += 90; rotations++;
    arrows[v].style.transform = `rotate(${angle[v]}deg)`;
    if (speed > 0) {
      cells[v].classList.add(cls);
      await sleep(speed);
      cells[v].classList.remove(cls);
    }
  }
  async function clickCell(v) {
    clicks++; sigma[v]++;
    let cur = v, first = true, n = 0;
    while (cur >= 0) {
      await rotate(cur, first ? 'fire' : 'chain');
      first = false; n++;
      cur = pointsInside(cur, dir[cur]);
    }
    return n;
  }
  async function userClick(v) {
    if (busy) return;
    lock(true);
    const n = await clickCell(v);
    render();
    setStatus(T.clicked(Math.floor(v / N), v % N, n));
    lock(false);
  }
  function lock(b) {
    busy = b; boardEl.classList.toggle('locked', b);
    ['btnIdentity', 'btnInverse', 'btnRandom', 'btnReset'].forEach(id => $(id).disabled = b);
  }
  function resetBoard() {
    if (busy) return;
    for (let v = 0; v < M; v++) { dir[v] = 0; angle[v] = 0; sigma[v] = 0; }
    rotations = 0; clicks = 0;
    render(); setStatus(T.reset);
  }
  function randomMultiset(k) {
    const a = new Array(M).fill(0);
    for (let i = 0; i < k; i++) a[Math.floor(Math.random() * M)]++;
    return a;
  }
  // 依次施加一个点击多重集（按行优先顺序），返回旋转次数
  async function runMultiset(vec, label) {
    if (busy) return;
    lock(true);
    const before = dir.slice(), rot0 = rotations;
    const total = vec.reduce((a, b) => a + b, 0);
    let done = 0;
    for (let v = 0; v < M; v++) {
      for (let k = 0; k < vec[v]; k++) {
        await clickCell(v); done++;
        if (speed > 0) { setStatus(T.progress(label, done, total)); render(); }
      }
    }
    render(); lock(false);
    return { before, gained: rotations - rot0, total };
  }
  async function applyIdentity() {
    const id = IDENTITIES[+idSelect.value || 0];
    const snap = dir.slice();
    const res = await runMultiset(id.v, T.applyId);
    if (!res) return;
    const same = snap.every((d, i) => d === dir[i]);
    setStatus(T.idDone(id.name, res.total, res.gained, fmt(res.gained * 90), same));
    toast(T.idToast(same, fmt(res.gained * 90)), same);
  }
  async function applyInverse() {
    const inv = inverseOf(sigma);
    const total = inv.reduce((a, b) => a + b, 0);
    if (total === 0) { toast(T.alreadyHome); return; }
    const res = await runMultiset(inv, T.applyInv);
    if (!res) return;
    const home = dir.every(d => d === 0);
    setStatus(T.invDone(res.total, res.gained, home, clicks));
    toast(T.invToast(home), home);
  }

  render();
})();
