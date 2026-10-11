from PIL import Image, ImageDraw, ImageFont
W,H=720,620
FONT="/System/Library/Fonts/Supplemental/Arial Unicode.ttf"
f_num=ImageFont.truetype(FONT,30); f_title=ImageFont.truetype(FONT,26); f_small=ImageFont.truetype(FONT,18); f_foot=ImageFont.truetype(FONT,20)
# graph from the Wikipedia figure: square with a roof triangle and one diagonal (TR-BL)
P={'A':(360,150),'TL':(230,270),'TR':(490,270),'BR':(490,500),'BL':(230,500)}
E=[('TL','TR'),('TR','BR'),('BR','BL'),('BL','TL'),('A','TL'),('A','TR'),('TR','BL')]
deg={v:sum(v in e for e in E) for v in P}
nbr={v:[b if a==v else a for a,b in E if v in (a,b)] for v in P}
state={'A':3,'TL':1,'TR':0,'BR':4,'BL':0}
fires=['A','BR','BR']
name={'A':'顶部','TL':'左上','TR':'右上','BR':'右下','BL':'左下'}           # the three firings shown in the figure
R=30
def draw(state,red=None,title="",chips=None,footer=""):
    im=Image.new("RGB",(W,H),(255,255,255)); d=ImageDraw.Draw(im)
    d.text((W//2,34),title,fill=(0,0,0),font=f_title,anchor="mm")
    for a,b in E: d.line([P[a],P[b]],fill=(0,0,0),width=4)
    if chips:
        for (x,y) in chips: d.ellipse([x-9,y-9,x+9,y+9],fill=(255,140,0),outline=(0,0,0),width=2)
    for v,(x,y) in P.items():
        col=(204,0,0) if v==red else (0,0,0)
        d.ellipse([x-R,y-R,x+R,y+R],fill=col)
        d.text((x,y),str(state[v]),fill=(255,255,255),font=f_num,anchor="mm")
        dx=-1 if v in('TL','BL') else 1
        d.text((x+dx*(R+12),y+(-R-4 if v=='A' else 0)), f"度 {deg[v]}", fill=(110,110,110), font=f_small, anchor="rm" if dx<0 else "lm")
    d.text((W//2,H-40),footer,fill=(60,60,60),font=f_foot,anchor="mm")
    return im
frames=[];dur=[]
rule="规则：发射顶点 w 时，s(w) 减去 deg(w)，每个邻居各得 1 枚筹码"
for k,v in enumerate(fires,1):
    t=f"第 {k} 步：{name[v]}顶点有 {state[v]} 枚筹码 ≥ 度 {deg[v]}，可以发射（红色）"
    frames.append(draw(state,red=v,title=t,footer=rule)); dur.append(1600)
    # animate chips travelling from v to each neighbour
    x0,y0=P[v]; new=dict(state); new[v]-=deg[v]
    for u in nbr[v]: new[u]+=1
    steps=12
    for i in range(1,steps+1):
        a=i/steps; pos=[(x0+(P[u][0]-x0)*a,y0+(P[u][1]-y0)*a) for u in nbr[v]]
        mid=dict(state); mid[v]-=deg[v]
        frames.append(draw(mid,red=v,title=t,chips=pos,footer=rule)); dur.append(70)
    state=new
    frames.append(draw(state,title=f"第 {k} 步完成",footer=rule)); dur.append(1000)
frames.append(draw(state,title="结束：每个顶点的筹码数都小于它的度",footer="没有顶点可以再发射，游戏终止")); dur.append(3000)
frames[0].save("/Users/y.li/code/math/10_bu_wan_du/chip_firing.gif",save_all=True,append_images=frames[1:],duration=dur,loop=0,optimize=False)
# also a static contact sheet of the 4 states for checking
print("frames:",len(frames),"final state:",state,"deg:",deg)
