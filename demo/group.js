/* 十步万度 · 群论计算核心（浏览器与 Node 通用） */
(function (root) {
  const N = 5, M = N * N;
  const DR = [-1, 0, 1, 0], DC = [0, 1, 0, -1];
  const idx = (r, c) => r * N + c;
  const inside = (r, c) => r >= 0 && r < N && c >= 0 && c < N;
  // ---------- 约化拉普拉斯矩阵与它的逆 ----------
  const NB = [];           // 网格内邻居
  const D = [];            // Δ'
  for (let v = 0; v < M; v++) {
    const r = Math.floor(v / N), c = v % N;
    NB[v] = [];
    D[v] = new Array(M).fill(0);
    D[v][v] = 4;
    for (let k = 0; k < 4; k++) {
      const rr = r + DR[k], cc = c + DC[k];
      if (inside(rr, cc)) { NB[v].push(idx(rr, cc)); D[v][idx(rr, cc)] = -1; }
    }
  }
  const DINV = invert(D);

  function invert(A) {
    const n = A.length;
    const a = A.map((row, i) => [...row, ...row.map((_, j) => (i === j ? 1 : 0))]);
    for (let col = 0; col < n; col++) {
      let p = col;
      for (let i = col + 1; i < n; i++) if (Math.abs(a[i][col]) > Math.abs(a[p][col])) p = i;
      [a[col], a[p]] = [a[p], a[col]];
      const piv = a[col][col];
      for (let j = 0; j < 2 * n; j++) a[col][j] /= piv;
      for (let i = 0; i < n; i++) if (i !== col) {
        const f = a[i][col];
        if (f !== 0) for (let j = 0; j < 2 * n; j++) a[i][j] -= f * a[col][j];
      }
    }
    return a.map(row => row.slice(n));
  }
  const matVec = (A, x) => A.map(row => row.reduce((s, aij, j) => s + aij * x[j], 0));

  // ---------- 群论计算 ----------
  // 最少点击的逆元代表：σ^{-1} = Δ'x − σ，x 为满足 Δ'x ≥ σ 的最小整数向量
  function inverseOf(sigma) {
    const lb = matVec(DINV, sigma).map(v => Math.ceil(v - 1e-7));
    const x = lb.map(v => Math.max(v, 0));
    let changed = true, guard = 0;
    while (changed && guard++ < 100000) {
      changed = false;
      for (let v = 0; v < M; v++) {
        let s = sigma[v];
        for (const u of NB[v]) s += x[u];
        const need = Math.ceil(s / 4 - 1e-9);
        if (x[v] < need) { x[v] = need; changed = true; }
      }
    }
    const inv = matVec(D, x).map((v, i) => Math.round(v) - sigma[i]);
    return inv;
  }
  // 元素的阶：使 k·Δ'^{-1}σ 为整数向量的最小 k；k 必整除群指数 102960
  const EXP = 102960;
  const DIVISORS = (() => { const d = []; for (let k = 1; k <= EXP; k++) if (EXP % k === 0) d.push(k); return d; })();
  function orderOf(sigma) {
    const y = matVec(DINV, sigma);
    for (const k of DIVISORS) {
      let ok = true;
      for (let i = 0; i < M && ok; i++) { const t = y[i] * k; if (Math.abs(t - Math.round(t)) > 1e-6) ok = false; }
      if (ok) return k;
    }
    return null;
  }

  const api = { N, M, DR, DC, idx, inside, NB, D, DINV, inverseOf, orderOf, matVec, EXP };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.TenK = api;
})(typeof window !== 'undefined' ? window : globalThis);
