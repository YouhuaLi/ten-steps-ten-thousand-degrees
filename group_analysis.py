import random, itertools
from fractions import Fraction
N = 5
D = [(-1,0),(0,1),(1,0),(0,-1)]
cells = [(r,c) for r in range(N) for c in range(N)]
idx = {v:i for i,v in enumerate(cells)}
def inside(r,c): return 0<=r<N and 0<=c<N
def nbrs(v):
    r,c=v; return [(r+dr,c+dc) for dr,dc in D if inside(r+dr,c+dc)]

def click(grid, r, c):
    n=0
    while True:
        grid[r][c]=(grid[r][c]+1)%4; n+=1
        dr,dc=D[grid[r][c]]; r,c=r+dr,c+dc
        if not inside(r,c): return n

def run(init, clicks):
    g=[row[:] for row in init]; u=[[0]*N for _ in range(N)]
    tot=0
    for r,c in clicks:
        # track per-cell odometer
        rr,cc=r,c
        while True:
            g[rr][cc]=(g[rr][cc]+1)%4; u[rr][cc]+=1; tot+=1
            dr,dc=D[g[rr][cc]]; rr,cc=rr+dr,cc+dc
            if not inside(rr,cc): break
    return tot,g,u

def acyclic(g):
    # following arrows from every cell must exit the grid
    for v in cells:
        r,c=v; seen=set()
        while inside(r,c):
            if (r,c) in seen: return False
            seen.add((r,c)); dr,dc=D[g[r][c]]; r,c=r+dr,c+dc
    return True

ALLUP=[[0]*N for _ in range(N)]

# ---- 1. reduced Laplacian, determinant, Smith normal form
import sympy
L=sympy.zeros(25,25)
for v in cells:
    L[idx[v],idx[v]]=4
    for w in nbrs(v): L[idx[v],idx[w]]=-1
det=L.det()
print("det Delta' (number of oriented spanning trees / |S(G)|):", det, "=", sympy.factorint(det))
from sympy.matrices.normalforms import smith_normal_form
S=smith_normal_form(L, domain=sympy.ZZ)
inv=[S[i,i] for i in range(25) if S[i,i]!=1]
print("invariant factors (non-trivial):", inv, " -> S(G) =", " x ".join(f"Z_{d}" for d in inv))

# ---- 2. acyclicity invariant in random games
random.seed(0)
ok=True
for _ in range(2000):
    clicks=[random.choice(cells) for _ in range(10)]
    tot,g,u=run(ALLUP,clicks); ok&=acyclic(g)
print("all arrow configurations after random 10-click games are spanning trees rooted outside:", ok)

# ---- 3. order of E_v for center / corner / edge-mid: clicks needed to return to all-up
for name,v in [("center",(2,2)),("corner",(0,0)),("edge-mid",(0,2)),("(1,1)",(1,1))]:
    g=[row[:] for row in ALLUP]; k=0; deg=0
    while True:
        deg+=90*click(g,*v); k+=1
        if g==ALLUP: break
    print(f"order of E_{name}: {k} clicks return to all-up, accumulating {deg} degrees")

# ---- 4. expected exit time tau(v) of simple random walk, and exact total formula
Linv=L.inv()
one=sympy.ones(25,1)
tau=4*Linv*one   # tau = (I-P)^{-1} 1 = 4 Delta'^{-1} 1
tau_c=tau[idx[(2,2)]]
print("expected exit time tau(center) =", tau_c, "=", float(tau_c))
print("tau grid:")
for r in range(N): print("  ", [str(tau[idx[(r,c)]]) for c in range(N)])
tot10,_,_=run(ALLUP,[(2,2)]*10)
print("10 clicks at center: total rotations", tot10, "=", tot10*90, "degrees; 10*tau(center) =", float(10*tau_c))
# brute force best 10-click multiset? too many; check best single cell repeated
best=max(((run(ALLUP,[v]*10)[0],v) for v in cells))
print("best 'same cell x10':", best[1], best[0]*90, "degrees")

# exact formula: sum u = sum_v sigma(v) tau(v) + 4*1^T Linv (p - r) + sum r
def check_formula(init, clicks):
    tot,g,u=run(init,clicks)
    sigma=sympy.zeros(25,1); pr=sympy.zeros(25,1); sum_r=0
    for v in cells:
        sigma[idx[v]]+=0
    for v in clicks: sigma[idx[v]]+=1
    # p(x) = number of partial-turn chips arriving at x; r(y) = u(y) mod 4
    p=[0]*25
    for y in cells:
        ry=u[y[0]][y[1]]%4; sum_r+=ry
        pr[idx[y]]-=ry
        for k in range(1,ry+1):
            d=(init[y[0]][y[1]]+k)%4
            x=(y[0]+D[d][0],y[1]+D[d][1])
            if inside(*x): pr[idx[x]]+=1
    val=(sigma.T*tau)[0] + (4*one.T*Linv*pr)[0] + sum_r
    return tot, val
random.seed(3)
allok=True
for t in range(200):
    init=ALLUP if t%2==0 else [[random.randrange(4) for _ in range(N)] for _ in range(N)]
    clicks=[random.choice(cells) for _ in range(random.randint(1,12))]
    tot,val=check_formula(init,clicks)
    allok&=(tot==val)
print("exact formula  total = sigma.tau + 4*1^T Delta'^{-1}(p-r) + sum r  holds on 200 random cases:", allok)
# size of correction term for 10 center clicks from all-up
tot,val=check_formula(ALLUP,[(2,2)]*10)
print("10 center clicks: sigma.tau =", float(10*tau_c), " correction =", tot-float(10*tau_c))

# ---- 5. Laplacian relation in game terms: 4 clicks at v == one click at each neighbor, +360 deg
random.seed(5); ok=True
for _ in range(300):
    init=[[random.randrange(4) for _ in range(N)] for _ in range(N)]
    v=random.choice(cells)
    t1,g1,_=run(init,[v]*4); t2,g2,_=run(init,nbrs(v))
    ok&=(g1==g2 and t1==t2+4)
print("4 clicks at v vs one click per in-grid neighbour: same arrows and exactly +360 degrees:", ok)

# ---- 6. recurrent identity of the sandpile group, and its action on all-up
def stabilize(s):
    s=s[:]; changed=True
    while changed:
        changed=False
        for v in cells:
            i=idx[v]
            if s[i]>=4:
                q=s[i]//4; s[i]-=4*q
                for w in nbrs(v): s[idx[w]]+=q
                changed=True
    return s
smax=[3]*25
two=[6]*25
I=stabilize([2*3 - x for x in stabilize(two)])   # I = (2*sigma_max - (2*sigma_max)^o)^o
print("recurrent identity I of S(G) (chips per cell):")
for r in range(N): print("  ", I[r*N:(r+1)*N])
clicks=[v for v in cells for _ in range(I[idx[v]])]
tot,g,u=run(ALLUP,clicks)
print("clicking I(v) times at each v from all-up returns to all-up:", g==ALLUP, "; total clicks", len(clicks), "; total degrees", tot*90)
random.seed(7); ok=True
for _ in range(50):
    init=[[random.randrange(4) for _ in range(N)] for _ in range(N)]
    # make it acyclic first by clicking every cell once (Lemma 3.15)
    _,g0,_=run(init,cells)
    assert acyclic(g0)
    _,g1,_=run(g0,clicks); ok&=(g1==g0)
print("I acts as identity on random spanning-tree configurations:", ok)
