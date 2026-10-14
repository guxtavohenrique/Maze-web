
(function(){
  // Direções: 0 cima, 1 direita, 2 baixo, 3 esquerda. Bits de parede: 1,2,4,8.
  var DX=[0,1,0,-1], DY=[-1,0,1,0], BIT=[1,2,4,8], OPP=[2,3,0,1];
  var cv=document.getElementById('c'), ctx=cv.getContext('2d');
  var $=function(id){return document.getElementById(id)};
  var level=1, total=0, n, cell, grid, pos, exit, t0=null, elapsed=0, playing=false, timer=null;

  function points(sec){
    var m=Math.max(1,Math.ceil(sec/60));   // minuto em que terminou
    return Math.max(1,7-m);                // 1min=6, 2=5 ... 6 em diante=1
  }
  function fmt(s){
    var m=Math.floor(s/60), r=Math.floor(s%60);
    return m+':'+(r<10?'0':'')+r;
  }

  function generate(){
    n=5+level*2;                            // fase 1 = 7x7, cresce 2 por fase
    grid=new Array(n*n).fill(15);
    var seen=new Array(n*n).fill(false), start=Math.floor(Math.random()*n*n), stack=[start];
    seen[start]=true;
    while(stack.length){
      var i=stack[stack.length-1], x=i%n, y=(i/n)|0, opts=[];
      for(var d=0;d<4;d++){
        var nx=x+DX[d], ny=y+DY[d];
        if(nx>=0&&ny>=0&&nx<n&&ny<n&&!seen[ny*n+nx]) opts.push(d);
      }
      if(!opts.length){stack.pop();continue;}
      var dd=opts[Math.floor(Math.random()*opts.length)], j=(y+DY[dd])*n+x+DX[dd];
      grid[i]&=~BIT[dd]; grid[j]&=~BIT[OPP[dd]];
      seen[j]=true; stack.push(j);
    }
    // saída = célula mais distante do início (busca em largura)
    var dist=new Array(n*n).fill(-1), q=[start], far=start; dist[start]=0;
    for(var h=0;h<q.length;h++){
      var c=q[h], cx=c%n, cy=(c/n)|0;
      if(dist[c]>dist[far]) far=c;
      for(var k=0;k<4;k++){
        if(grid[c]&BIT[k]) continue;
        var m=(cy+DY[k])*n+cx+DX[k];
        if(dist[m]<0){dist[m]=dist[c]+1;q.push(m);}
      }
    }
    pos=start; exit=far;
  }

  function size(){
    var w=Math.min(640,window.innerWidth-32,window.innerHeight-(matchMedia('(hover:none)').matches?330:190));
    cell=Math.max(8,Math.floor(w/n));
    var px=cell*n+6, dpr=window.devicePixelRatio||1;
    cv.width=px*dpr; cv.height=px*dpr; cv.style.width=px+'px'; cv.style.height=px+'px';
    ctx.setTransform(dpr,0,0,dpr,3,3);
  }

  function draw(){
    ctx.fillStyle='#000'; ctx.fillRect(-3,-3,cv.width,cv.height);
    ctx.strokeStyle='#fff'; ctx.lineWidth=Math.max(2,cell/10); ctx.lineCap='square';
    ctx.beginPath();
    for(var i=0;i<n*n;i++){
      var x=(i%n)*cell, y=((i/n)|0)*cell, g=grid[i];
      if(g&1){ctx.moveTo(x,y);ctx.lineTo(x+cell,y);}
      if(g&2){ctx.moveTo(x+cell,y);ctx.lineTo(x+cell,y+cell);}
      if(g&4){ctx.moveTo(x,y+cell);ctx.lineTo(x+cell,y+cell);}
      if(g&8){ctx.moveTo(x,y);ctx.lineTo(x,y+cell);}
    }
    ctx.stroke();
    // saída: xadrez 2x2
    var ex=(exit%n)*cell, ey=((exit/n)|0)*cell, p=cell*.2, s=(cell-2*p)/2;
    ctx.fillStyle='#fff';
    ctx.fillRect(ex+p,ey+p,s,s); ctx.fillRect(ex+p+s,ey+p+s,s,s);
    ctx.strokeStyle='#fff'; ctx.lineWidth=1; ctx.strokeRect(ex+p,ey+p,s*2,s*2);
    // jogador
    var px=(pos%n)*cell+cell*.28, py=((pos/n)|0)*cell+cell*.28;
    ctx.fillStyle='#fff'; ctx.fillRect(px,py,cell*.44,cell*.44);
  }

  function hud(){
    $('lv').textContent=level; $('sc').textContent=total;
    $('tm').textContent=fmt(t0===null?0:elapsed);
  }

  function newLevel(){
    generate(); size(); draw();
    t0=null; elapsed=0; playing=true; clearInterval(timer); hud();
  }

  function move(d){
    if(!playing||(grid[pos]&BIT[d])) return;
    if(t0===null){
      t0=performance.now();
      timer=setInterval(function(){elapsed=(performance.now()-t0)/1000;hud();},200);
    }
    pos=((pos/n|0)+DY[d])*n+(pos%n)+DX[d];
    draw();
    if(pos===exit) finish();
  }

  function finish(){
    playing=false; clearInterval(timer);
    elapsed=(performance.now()-t0)/1000;
    var pts=points(elapsed); total+=pts; hud();
    $('wt').textContent='Fase '+level+' concluída';
    $('wp').textContent='+'+pts+(pts===1?' ponto':' pontos');
    $('wd').textContent='Tempo: '+fmt(elapsed)+'. Total: '+total+'. A próxima fase é maior ('+(n+2)+'×'+(n+2)+').';
    $('win').hidden=false; $('next').focus();
  }

  function advance(){
    if($('win').hidden) return;
    $('win').hidden=true; level++; newLevel();
  }

  var KEYS={ArrowUp:0,w:0,W:0,ArrowRight:1,d:1,D:1,ArrowDown:2,s:2,S:2,ArrowLeft:3,a:3,A:3};
  document.addEventListener('keydown',function(e){
    if(KEYS.hasOwnProperty(e.key)){e.preventDefault();move(KEYS[e.key]);}
  });

  $('go').onclick=function(){$('intro').hidden=true;newLevel();};
  $('next').onclick=advance;
  document.querySelectorAll('.pad button').forEach(function(b){
    b.addEventListener('pointerdown',function(e){e.preventDefault();move(+b.dataset.d);});
  });

  // deslizar na tela
  var sx,sy;
  cv.addEventListener('pointerdown',function(e){sx=e.clientX;sy=e.clientY;});
  cv.addEventListener('pointerup',function(e){
    if(sx==null) return;
    var dx=e.clientX-sx, dy=e.clientY-sy; sx=null;
    if(Math.max(Math.abs(dx),Math.abs(dy))<24) return;
    move(Math.abs(dx)>Math.abs(dy)?(dx>0?1:3):(dy>0?2:0));
  });

  window.addEventListener('resize',function(){if(grid){size();draw();}});

  // tela inicial: já mostra um labirinto ao fundo
  generate(); size(); draw();
})();
