#include <stdio.h>
#include <string.h>
#define N 5
#define MAXD 13
static const int DR[4]={-1,0,1,0}, DC[4]={0,1,0,-1};
static int best[MAXD+1]; static int bestcnt[MAXD+1]; static int bestseq[MAXD+1][8][MAXD];
static int seq[MAXD];
static inline int chain(unsigned char g[25], int v){
    int r=v/N,c=v%N,n=0;
    for(;;){ int i=r*N+c; g[i]=(g[i]+1)&3; n++; r+=DR[g[i]]; c+=DC[g[i]];
        if(r<0||r>=N||c<0||c>=N) return n; }
}
static void dfs(unsigned char g[25], int depth, int total, int from){
    if(depth==MAXD) return;
    for(int v=from; v<25; v++){
        unsigned char h[25]; memcpy(h,g,25);
        int t=total+chain(h,v); seq[depth]=v;
        int d=depth+1;
        if(t>best[d]){ best[d]=t; bestcnt[d]=1; memcpy(bestseq[d][0],seq,sizeof(int)*d); }
        else if(t==best[d]){ if(bestcnt[d]<8) memcpy(bestseq[d][bestcnt[d]],seq,sizeof(int)*d); bestcnt[d]++; }
        dfs(h,d,t,v);
    }
}
int main(){
    unsigned char g[25]; memset(g,0,25);
    dfs(g,0,0,0);
    for(int d=1; d<=MAXD; d++){
        printf("n=%2d  max rotations=%4d  degrees=%6d  #optimal multisets=%d\n", d, best[d], best[d]*90, bestcnt[d]);
        for(int k=0;k<bestcnt[d]&&k<8;k++){ printf("      "); for(int i=0;i<d;i++) printf("(%d,%d) ", bestseq[d][k][i]/N, bestseq[d][k][i]%N); printf("\n"); }
    }
    return 0;
}
