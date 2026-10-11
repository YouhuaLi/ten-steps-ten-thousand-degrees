/* 十步万度 · 群论演示
 * 规则：点击一格，箭头顺时针转 90°；若转后指向棋盘内另一格，该格继续转，直到指向棋盘外。
 * 群论：局面 ↔ 沙堆群 S(G)=Z^25 / Z^25 Δ' 的元素，Δ' = 4I − A。
 */
(() => {
  const N = 5, M = N * N;

  const { N: _N, M: _M, DR, DC, idx, inside, NB, D, DINV, inverseOf, orderOf, matVec } = window.TenK;

  // ---------- 单位元代表 ----------
  const grid = rows => rows.flat();
  const IDENTITIES = [
    { name: 'σ₁：四角各 2 次、边格各 1 次（20 次，最少之一）', v: grid([[2,1,1,1,2],[1,0,0,0,1],[1,0,0,0,1],[1,0,0,0,1],[2,1,1,1,2]]) },
    { name: 'σ₂：四角 2、内环角 2、内环边中 1（20 次）', v: grid([[2,0,0,0,2],[0,2,1,2,0],[0,1,0,1,0],[0,2,1,2,0],[2,0,0,0,2]]) },
    { name: 'σ₃：四角 2、内环角 2、中心 4（20 次）', v: grid([[2,0,0,0,2],[0,2,0,2,0],[0,0,4,0,0],[0,2,0,2,0],[2,0,0,0,2]]) },
    { name: 'I：常返单位元配置（52 次）', v: grid([[2,3,2,3,2],[3,2,1,2,3],[2,1,0,1,2],[3,2,1,2,3],[2,3,2,3,2]]) },
    { name: '中心 104 次（中心元素的阶）', v: (() => { const a = new Array(M).fill(0); a[12] = 104; return a; })() },
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
    const res = await runMultiset(vec, '随机 5 次点击');
    if (res) setStatus(`随机点了 5 次：${res.gained} 次旋转，+${(res.gained * 90).toLocaleString()}°。现在可以试试施加单位元或逆元。`);
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
    $('stDeg').textContent = (rotations * 90).toLocaleString() + '°';
    const inv = inverseOf(sigma);
    const invTotal = inv.reduce((a, b) => a + b, 0);
    $('stInv').textContent = invTotal + ' 次';
    const ord = orderOf(sigma);
    $('stOrd').textContent = ord === null ? '?' : ord.toLocaleString();
    renderMini($('invPreview'), inv);
    $('invNote').textContent = invTotal === 0
      ? '当前就是初始局面，逆元是空操作。'
      : `逆元共 ${invTotal} 次点击。施加后棋盘回到全朝上；当前元素的阶为 ${ord}，所以把目前的全部点击再重复 ${ord - 1} 遍也能复原，但那需要 ${(clicks * (ord - 1)).toLocaleString()} 次。`;
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
    $('idNote').textContent = `共 ${total} 次点击。施加后局面与现在完全相同。`;
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
    setStatus(`点击 (${Math.floor(v / N)}, ${v % N})：连锁 ${n} 次旋转，+${n * 90}°。`);
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
    render(); setStatus('已重置为全朝上。');
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
        if (speed > 0) { setStatus(`${label}：${done}/${total} 次点击…`); render(); }
      }
    }
    render(); lock(false);
    return { before, gained: rotations - rot0, total };
  }
  async function applyIdentity() {
    const id = IDENTITIES[+idSelect.value || 0];
    const snap = dir.slice();
    const res = await runMultiset(id.v, '施加单位元');
    if (!res) return;
    const same = snap.every((d, i) => d === dir[i]);
    setStatus(`单位元「${id.name}」施加完毕：${res.total} 次点击，${res.gained} 次旋转，+${(res.gained * 90).toLocaleString()}°。局面${same ? '与施加前完全相同 ✓' : '发生了变化 ✗（不应出现）'}。`);
    toast(same ? '局面不变，度数增加了 ' + (res.gained * 90).toLocaleString() + '°' : '出错：局面改变了', same);
  }
  async function applyInverse() {
    const inv = inverseOf(sigma);
    const total = inv.reduce((a, b) => a + b, 0);
    if (total === 0) { toast('当前已是初始局面'); return; }
    const res = await runMultiset(inv, '施加逆元');
    if (!res) return;
    const home = dir.every(d => d === 0);
    setStatus(`逆元施加完毕：${res.total} 次点击，${res.gained} 次旋转。棋盘${home ? '回到全朝上 ✓' : '未回到初始 ✗（不应出现）'}。累计点击 ${clicks} 次现在是单位元，可以再次计算逆元（结果为空）。`);
    toast(home ? '已回到初始局面' : '出错：未回到初始局面', home);
  }

  render();
})();
