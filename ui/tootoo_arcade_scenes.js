/* Canvas scenery only: no game state, RNG, rewards, storage or listeners. */
(() => {
  "use strict";
  const themes = Object.freeze([
    {id:"moon_tide_observatory", icon:"🌙", name:"月潮观测站", swatch:"#4CC6EF", reaction:"引动月潮", desc:"触发后，月引涟漪穿过海面"},
    {id:"aurora_crown", icon:"❄️", name:"极光王冠", swatch:"#71F9CE", reaction:"折射极光", desc:"触发后，冰镜折出彩色极光"},
    {id:"dragon_ink_seal", icon:"🐉", name:"墨龙天印", swatch:"#D99F62", reaction:"唤醒墨龙", desc:"触发后，墨龙循着朱印掠过山岭"},
    {id:"prism_clockwork", icon:"💠", name:"棱镜时轮", swatch:"#B599FF", reaction:"拨动时轮", desc:"触发后，机械星轮转过一格，沿齿边传导光波"},
    {id:"lantern_skyline", icon:"🏮", name:"万灯天城", swatch:"#FF8F65", reaction:"点放天灯", desc:"触发后，一束暖色天灯飞过城楼"},
  ].map(theme => Object.freeze({ ...theme, r:"SSR", dark:true, interactive:true })));
  const TAU = Math.PI * 2;
  function line(c, points, color, width = 1, close = false, fill = null) {
    c.beginPath(); c.moveTo(...points[0]);
    for (let i = 1; i < points.length; i++) c.lineTo(...points[i]);
    if (close) c.closePath();
    if (fill) { c.fillStyle = fill; c.fill(); }
    if (color) { c.strokeStyle = color; c.lineWidth = width; c.stroke(); }
  }
  function oval(c, x,y,rx,ry,fill,stroke = null,width = 1, angle = 0) {
    c.beginPath(); c.ellipse(x,y,rx,ry,angle,0,TAU);
    if (fill) { c.fillStyle = fill; c.fill(); }
    if (stroke) { c.strokeStyle = stroke; c.lineWidth = width; c.stroke(); }
  }
  function sky(c, top, mid, bottom) {
    const g = c.createLinearGradient(0,0,0,180);
    g.addColorStop(0,top); g.addColorStop(.52,mid); g.addColorStop(1,bottom);
    c.fillStyle = g; c.fillRect(0,0,440,180);
  }
  function glow(c,x,y,r,inner,outer) {
    const g = c.createRadialGradient(x,y,0,x,y,r);
    g.addColorStop(0,inner); g.addColorStop(1,outer);
    c.fillStyle = g; c.fillRect(x-r,y-r,2*r,2*r);
  }
  function stars(c,t,color, count = 36) {
    c.fillStyle = color;
    for (let i=0;i<count;i++) {
      const x = (i*83.43+13)%440, y = (i*57.57+8)%116;
      c.globalAlpha = .35 + .35*Math.sin(t*.45+i)**2;
      c.fillRect(x,y,i%7===0?1.7:1,i%7===0?1.7:1);
    }
    c.globalAlpha = 1;
  }
  function ridge(c, y, amp, phase, fill) {
    const points = [[0,180]];
    for (let x=0;x<=440;x+=10) points.push([x, y+amp*(Math.sin(x*.061+phase)*.35 + Math.cos(x*.025-phase)*.65)]);
    points.push([440,180]); line(c,points,null,1,true,fill);
  }
  function tide(c,t,p) {
    sky(c,"#061426","#103253","#062131");
    glow(c,306,64,100,"#336b97a0","#336b9700"); stars(c,t,"#cce9ff");
    oval(c,306,52,25,25,"#9fd2f3","#ccecff");
    oval(c,314,47,23,23,"#183552");
    ridge(c,110,15,2,"#122d45"); ridge(c,117,11,3,"#0b2235");
    for (let i=0;i<10;i++) {
      const y=114+i*6.5, points=[];
      for (let x=0;x<=440;x+=10) points.push([x,y+Math.sin(x*.045+t*1.2+i)*(.9+i*.13)]);
      line(c,points,i<4?"#63b6e546":"#67c2eb60",.85);
    }
    for (let i=0;i<9;i++) {
      const x=306+Math.sin(t+i*1.9)*(13+i*2);
      line(c,[[x-5-i*.9,116+i*6],[x+5+i*.9,116+i*6]],"#a5def974");
    }
    if (p) {
      const y=116+p.y*.31;
      for (let i=0;i<4;i++) {
        const k=Math.max(0,p.age-i*.13);
        if (k<=0) continue;
        c.globalAlpha=(1-p.age)*.82;
        oval(c,p.x,y,7+k*125,2+k*32,null,"#99e9ff",1.25);
      }
      c.globalAlpha=1;
    }
  }
  function aurora(c,t,p) {
    sky(c,"#080d29","#17354b","#151f37"); stars(c,t,"#d5ddff",42);
    glow(c,238,72,114,"#488f9a75","#488f9a00");
    const colors=["#54eeb9","#66bad9","#a482ef"];
    for(let band=0;band<3;band++) {
      const pts=[], bottom=[];
      for(let x=0;x<=440;x+=10) {
        const y=68+band*12 + Math.sin(x*.016+t*.48+band*.6)*29 + Math.cos(x*.036)*8;
        const intensity=p?Math.max(0,1-Math.abs(x-p.x)/135)*(1-p.age):0;
        pts.push([x,y-intensity*26]);
        bottom.unshift([x,y+14+Math.sin(x*.031+band)*7+intensity*17]);
      }
      line(c,pts.concat(bottom),null,1,true,colors[band]+"3d");
      line(c,pts,colors[band]+"96",1.4);
    }
    ridge(c,139,15,4,"#202b48"); ridge(c,159,15,.6,"#132944");
    for(const [x,y,height,w] of [[35,178,45,16],[63,180,28,11],[391,180,52,16],[414,181,32,12]]) {
      line(c,[[x-w,y],[x-5,y-height+10],[x+5,y-height],[x+w,y]],"#719ac085",1,true,"#36949f33");
      line(c,[[x+5,y-height],[x,y]],"#b1eafa70");
    }
    if(p) {
      const y=114+(p.y-85)*.2;
      for(let i=0;i<5;i++) {
        c.globalAlpha=(1-p.age)*.68;
        line(c,[[p.x,y],[p.x+(i-2)*(17+p.age*27),y-40-p.age*30]],colors[i%3],1.2);
      }
      c.globalAlpha=1;
    }
  }
  function ink(c,t,p) {
    sky(c,"#251b2a","#503c4b","#2d242e");
    glow(c,93,61,108,"#c080586d","#c0805800");
    oval(c,93,60,23,23,"#daad7777","#f0c69c9e");
    ridge(c,112,33,3,"#55434f"); ridge(c,141,37,1,"#372c39"); ridge(c,173,30,4,"#201e2c");
    for(let i=0;i<7;i++) {
      const x=(i*87+t*9)%510-35;
      line(c,[[x,115+i*5],[x+17,113+i*5],[x+56,114+i*5]],"#e2b69a4a");
    }
    const x0=p?p.x:300,y0=p?p.y:75,a=p?p.age:0;
    if (p) {
      c.globalAlpha=(1-a)*.75;
      for(let i=0;i<3;i++) {
        c.strokeStyle="#f28f64"; c.lineWidth=1;
        const r=12+a*22+i*5;
        c.strokeRect(x0-r,y0-r,r*2,r*2);
      }
      c.globalAlpha=1;
    }
    const x= x0+(p?(a*165-30):Math.sin(t*.5)*22),
          y= y0-(p?(a*36):0);
    const dragon=[];
    for(let i=0;i<18;i++) dragon.push([x-i*6,y+Math.sin(i*.53+t*1.8-a*8)*14-i*.45]);
    const [hx,hy]=dragon[0];
    c.globalAlpha=p?(.23+.77*(1-a)):.38;
    line(c,dragon,"#160f1d",9); line(c,dragon,"#ddb186",1.9);
    line(c,[[hx-12,hy-2],[hx-8,hy-13],[hx-1,hy-6],[hx+9,hy-7],[hx+16,hy],[hx+9,hy+6],[hx-10,hy+5]],"#ebbb8c",1.25,true,"#231624");
    oval(c,hx+6,hy-1,1.7,1.5,"#ffc277");
    c.globalAlpha=1;
  }
  function gears(c,t,p) {
    sky(c,"#101229","#231944","#100e25"); stars(c,t,"#ecd6ff");
    const palette=["#c099ff","#77d5e9","#dbb77d"];
    for (const [j,x,y,r,n] of [[0,221,87,60,20],[1,114,115,29,12],[2,322,114,26,10]]) {
      const phase=t*(j===1?-.26:.17)+(p?(1-(1-p.age)**3)*.7:0);
      const pts=[];
      for(let i=0;i<n*4;i++) {
        const a=i/(n*4)*TAU+phase;
        const rr=r+(i%4===1||i%4===2?4:0);
        pts.push([x+Math.cos(a)*rr,y+Math.sin(a)*rr]);
      }
      oval(c,x,y,r+9,r+9,null,"#855dc672");
      line(c,pts,palette[j]+"b0",1.4,true,palette[j]+"18");
      oval(c,x,y,r*.76,r*.76,null,palette[j]+"89");
      for(let i=0;i<6;i++) {
        const a=phase+i*TAU/6, xx=x+Math.cos(a)*r*.64, yy=y+Math.sin(a)*r*.64;
        line(c,[[x,y],[xx,yy]],palette[j]+"55");
        oval(c,xx,yy,1.8,1.8,palette[j]+"ae");
      }
      if(p) {
        const a=Math.atan2(p.y-y,p.x-x)+p.age*TAU;
        c.globalAlpha=(1-p.age)*.9;
        oval(c,x+Math.cos(a)*r,y+Math.sin(a)*r,3.4,3.4,palette[j]);
        c.globalAlpha=1;
      }
    }
  }
  function lantern(c,x,y,k,opacity) {
    c.save(); c.translate(x,y); c.scale(k,k); c.globalAlpha=opacity;
    oval(c,0,0,16,14,"#eb88532c");
    line(c,[[-5,-6],[5,-6],[7,4],[4,7],[-4,7],[-7,4]],"#fed4a1",.8,true,"#db713d");
    line(c,[[0,-5],[0,6]],"#ffe4b3");
    line(c,[[-4,7],[4,7],[0,11]],"#e49d62",.8);
    c.restore();
  }
  function lanternCity(c,t,p) {
    sky(c,"#281738","#512745","#311d39"); stars(c,t,"#ffdbbf");
    glow(c,204,108,131,"#ec7c557a","#ec7c5500");
    ridge(c,126,17,5,"#442a49");
    for(let i=0;i<12;i++) {
      const x=i*39-14,y=128+(i*17)%25;
      line(c,[[x-21,y+7],[x-6,y+2],[x,y-5],[x+7,y+2],[x+20,y+7]],"#a76b648c",1,true,"#231c33");
      c.fillStyle="#241c34"; c.fillRect(x-13,y+7,26,48);
      c.fillStyle="#e9955778"; c.fillRect(x-7,y+13,2,4); c.fillRect(x+5,y+13,2,4);
    }
    for(let i=0;i<12;i++) {
      const y=137-((i*33+t*(5+i%3))%124);
      lantern(c,(i*107+31)%429+Math.sin(t+i)*4,y,.35+(i%3)*.12,.65);
    }
    if(p) for(let i=0;i<7;i++) {
      const x=p.x+(i-3)*(7+p.age*17)+Math.sin(p.age*8+i)*4;
      const y=p.y-p.age*(60+i*6)-Math.abs(3-i)*6;
      lantern(c,x,y,.75+(i%3)*.15,(1-p.age)*.95);
    }
  }
  const renderers = {moon_tide_observatory:tide, aurora_crown:aurora, dragon_ink_seal:ink,
    prism_clockwork:gears, lantern_skyline:lanternCity};
  function draw(c,id,w,h,time,pulse) {
    if (!Object.hasOwn(renderers,id) || !(w>0 && h>0)) return false;
    c.save(); c.scale(w/440,h/180);
    try { renderers[id](c,time*.001,pulse); }
    finally { c.restore(); }
    return true;
  }
  const api=Object.freeze({themes,draw,durationMs:2150});
  if (typeof module === "object" && module.exports) module.exports=api;
  else globalThis.TooTooArcadeScenes=api;
})();
