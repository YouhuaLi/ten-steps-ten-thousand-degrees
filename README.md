# 十步万度 · Ten Steps, Ten Thousand Degrees

一个 5×5 箭头小游戏，以及它背后的转子路由 / 沙堆群数学。
A 5×5 arrow-rotation puzzle and the rotor-router / sandpile-group mathematics behind it.

**在线演示 · Live demo:** `demo/` 目录是一个纯静态页面，可直接用 GitHub Pages 发布。
The `demo/` folder is a static page ready for GitHub Pages.

---

## 游戏规则 · Rules

棋盘是 5×5 的格子，每格有一个箭头，初始全部朝上。点击一格，它的箭头顺时针转 90°；若转后指向棋盘内的另一格，该格也转 90°，如此连锁，直到箭头指向棋盘外为止。每次旋转记 90°，原版给 10 次点击机会，目标是累计一万度。

The board is a 5×5 grid of arrows, all pointing up at the start. Clicking a cell rotates its arrow 90° clockwise; if the arrow now points at another cell, that cell rotates too, and the chain continues until an arrow points off the board. Each rotation scores 90°. The original game allows 10 clicks and asks for 10,000 degrees.

## 主要结论 · Main results

| 中文 | English |
|---|---|
| 总度数只依赖点击的多重集，与顺序无关（阿贝尔性质，Diaconis–Fulton / 最小作用原理证明）。 | The total score depends only on the multiset of clicks, not their order (abelian property; proof via the odometer / least-action principle). |
| 局面与沙堆群 $S(G)=\mathbb{Z}^{25}/\mathbb{Z}^{25}\Delta'$ 的元素一一对应，群的阶为 32,565,539,635,200，结构为 $\mathbb{Z}_4\oplus\mathbb{Z}_{16}\oplus\mathbb{Z}_{48}\oplus\mathbb{Z}_{102960}^2$。 | Board states correspond bijectively to elements of the sandpile group $S(G)=\mathbb{Z}^{25}/\mathbb{Z}^{25}\Delta'$, of order 32,565,539,635,200 and type $\mathbb{Z}_4\oplus\mathbb{Z}_{16}\oplus\mathbb{Z}_{48}\oplus\mathbb{Z}_{102960}^2$. |
| 10 步最高 10,800°，恰有两个最优方案；平均每步得分在 10 步时达到峰值。 | The 10-click maximum is 10,800°, attained by exactly two multisets; the per-click average peaks at 10 clicks. |
| 单位元的最少点击代表需要 20 次，恰有 3 个；中心点击一次的逆元最少 19 次。 | The cheapest click representatives of the identity use 20 clicks (exactly three of them); the inverse of one center click needs 19 clicks. |
| 中心点击的阶是 104，角格的阶是 102,960（群的指数）。 | A center click has order 104; a corner click has order 102,960, the exponent of the group. |

## 目录 · Contents

| 路径 · Path | 说明 · Description |
|---|---|
| `index.html`, `script.js`, `style.css` | 原版游戏 · The original game |
| `demo/` | 群论演示页：不限步数、施加单位元、施加逆元 · Interactive demo: unlimited clicks, apply an identity, apply the inverse |
| `PROOF.md` | 次序无关的证明与群论视角 · Proof of order-independence and the group-theoretic view |
| `reference.md` / `reference.pdf` | 沙堆群参考笔记（4 点图例子、三种理解方式、最少单位元代表） · Sandpile-group notes (4-vertex example, three descriptions, minimal identity) |
| `inverse.md` | 求逆元的方法 · Computing inverses |
| `order.md` | 元素的阶、阶最小与最大的元素 · Orders of elements, smallest and largest orders |
| `subgroup.md` | 子群在游戏中的含义 · What subgroups mean on the board |
| `optimal_play.md`, `opt_*.png` | 1 到 12 步的最佳玩法与结论 · Optimal play for 1–12 clicks |
| `optimal_search.c` | 最优解穷举搜索 · Exhaustive search for optimal multisets |
| `group_analysis.py` | sympy 群结构计算 · Group computations with sympy |
| `chip_firing.gif`, `chip_firing_gif.py` | 筹码发射动画 · Chip-firing animation |
| `article/` | 微信文章草稿与配图 · Article draft and figures |

## 参考 · Reference

A. E. Holroyd, L. Levine, K. Mészáros, Y. Peres, J. Propp, D. B. Wilson, *Chip-Firing and Rotor-Routing on Directed Graphs*, [arXiv:0801.3306](https://arxiv.org/abs/0801.3306).

## 发布演示 · Publishing the demo

在仓库 Settings → Pages 中选择 `main` 分支根目录，然后访问 `https://<user>.github.io/<repo>/demo/`。
In Settings → Pages choose the `main` branch, root folder, then open `https://<user>.github.io/<repo>/demo/`.
