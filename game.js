(() => {
  const COLS=10, ROWS=20, SIZE=30;
  const COLORS={I:'#00ffff',O:'#ffff00',T:'#cc66ff',S:'#00dd66',Z:'#ff4444',J:'#4488ff',L:'#ff9900'};
  const SHAPES={
    I:[[1,1,1,1]], O:[[1,1],[1,1]], T:[[0,1,0],[1,1,1]],
    S:[[0,1,1],[1,1,0]], Z:[[1,1,0],[0,1,1]],
    J:[[1,0,0],[1,1,1]], L:[[0,0,1],[1,1,1]]
  };
  const boardCanvas=document.getElementById('board'), ctx=boardCanvas.getContext('2d');
  const nextCanvas=document.getElementById('next'), nctx=nextCanvas.getContext('2d');
  const $=id=>document.getElementById(id);
  let grid, piece, nextType, score=0, lines=0, level=1, running=false, paused=false, over=false;
  let timer=0, startedAt=0, elapsedBefore=0, dropCounter=0, lastTime=0, raf=0;
  const clone=m=>m.map(r=>r.slice());
  const randomType=()=>Object.keys(SHAPES)[Math.floor(Math.random()*7)];
  function newPiece(type=randomType()){return {type,matrix:clone(SHAPES[type]),x:Math.floor(COLS/2)-Math.ceil(SHAPES[type][0].length/2),y:0};}
  function reset(){grid=Array.from({length:ROWS},()=>Array(COLS).fill(null));score=0;lines=0;level=1;elapsedBefore=0;timer=0;piece=newPiece();nextType=randomType();over=false;paused=false;updateStats();draw();setStatus('Partida pronta. Boa sorte!');}
  function drawCell(context,x,y,color,size){context.fillStyle=color;context.fillRect(x*size+1,y*size+1,size-2,size-2);context.fillStyle='#ffffff55';context.fillRect(x*size+2,y*size+2,size-4,3);context.fillStyle='#00000055';context.fillRect(x*size+2,y*size+size-5,size-4,3);context.strokeStyle='#000';context.strokeRect(x*size+1.5,y*size+1.5,size-3,size-3);}
  function draw(){ctx.fillStyle='#080808';ctx.fillRect(0,0,300,600);ctx.strokeStyle='#202020';ctx.lineWidth=1;for(let x=0;x<=COLS;x++){ctx.beginPath();ctx.moveTo(x*SIZE,0);ctx.lineTo(x*SIZE,600);ctx.stroke()}for(let y=0;y<=ROWS;y++){ctx.beginPath();ctx.moveTo(0,y*SIZE);ctx.lineTo(300,y*SIZE);ctx.stroke()}
    grid.forEach((row,y)=>row.forEach((v,x)=>{if(v)drawCell(ctx,x,y,v,SIZE)}));
    if(piece){piece.matrix.forEach((row,y)=>row.forEach((v,x)=>{if(v)drawCell(ctx,piece.x+x,piece.y+y,COLORS[piece.type],SIZE)}))}
    drawNext();
  }
  function drawNext(){nctx.fillStyle='#080808';nctx.fillRect(0,0,120,100);const m=SHAPES[nextType], s=20, ox=(120-m[0].length*s)/2, oy=(100-m.length*s)/2;m.forEach((r,y)=>r.forEach((v,x)=>{if(v){nctx.fillStyle=COLORS[nextType];nctx.fillRect(ox+x*s+1,oy+y*s+1,s-2,s-2);nctx.strokeStyle='#000';nctx.strokeRect(ox+x*s+1,oy+y*s+1,s-2,s-2)}}))}
  function collide(p,dx=0,dy=0,m=p.matrix){for(let y=0;y<m.length;y++)for(let x=0;x<m[y].length;x++)if(m[y][x]){let nx=p.x+x+dx,ny=p.y+y+dy;if(nx<0||nx>=COLS||ny>=ROWS)return true;if(ny>=0&&grid[ny][nx])return true}return false;}
  function rotate(matrix){return matrix[0].map((_,i)=>matrix.map(row=>row[i]).reverse());}
  function move(dx){if(!running||paused)return;if(!collide(piece,dx,0))piece.x+=dx;draw();}
  function turn(){if(!running||paused)return;const rotated=rotate(piece.matrix);for(const kick of [0,-1,1,-2,2])if(!collide(piece,0,0,rotated)&&!collide({...piece,x:piece.x+kick},0,0,rotated)){piece.x+=kick;piece.matrix=rotated;break}draw();}
  function softDrop(){if(!running||paused)return;if(!collide(piece,0,1)){piece.y++;score+=1}else lockPiece();updateStats();draw();}
  function hardDrop(){if(!running||paused)return;let n=0;while(!collide(piece,0,1)){piece.y++;n++}score+=n*2;lockPiece();updateStats();draw();}
  function lockPiece(){piece.matrix.forEach((r,y)=>r.forEach((v,x)=>{if(v&&piece.y+y>=0)grid[piece.y+y][piece.x+x]=COLORS[piece.type]}));let cleared=0;for(let y=ROWS-1;y>=0;y--){if(grid[y].every(Boolean)){grid.splice(y,1);grid.unshift(Array(COLS).fill(null));cleared++;y++}}if(cleared){lines+=cleared;score+=[0,100,300,500,800][cleared]*level;level=Math.floor(lines/10)+1}piece=newPiece(nextType);nextType=randomType();if(collide(piece)){finish()}updateStats();}
  function updateStats(){$('score').textContent=String(score).padStart(6,'0');$('lines').textContent=lines;$('level').textContent=level;$('time').textContent=formatTime(timer);}
  function formatTime(s){return `${String(Math.floor(s/60)).padStart(2,'0')}:${String(s%60).padStart(2,'0')}`;}
  function setStatus(s){$('status').textContent=s;}
  function loop(ts){if(!running||paused)return;if(!lastTime)lastTime=ts;const delta=ts-lastTime;lastTime=ts;dropCounter+=delta;if(ts-startedAt>=1000){timer=elapsedBefore+Math.floor((ts-startedAt)/1000);updateStats()}if(dropCounter>Math.max(90,800-(level-1)*65)){softDrop();dropCounter=0}draw();raf=requestAnimationFrame(loop);}
  function start(){if(over)reset();if(running&&!paused)return;running=true;paused=false;startedAt=performance.now();lastTime=0;$('startBtn').disabled=true;$('pauseBtn').disabled=false;$('pauseBtn').textContent='Pausar';setStatus('Jogo em andamento');cancelAnimationFrame(raf);raf=requestAnimationFrame(loop);}
  function pause(){if(!running)return;if(!paused){paused=true;elapsedBefore=timer;cancelAnimationFrame(raf);$('pauseBtn').textContent='Continuar';setStatus('Jogo pausado')}else{paused=false;startedAt=performance.now();lastTime=0;$('pauseBtn').textContent='Pausar';setStatus('Jogo em andamento');raf=requestAnimationFrame(loop)}}
  function finish(){running=false;paused=false;over=true;cancelAnimationFrame(raf);$('startBtn').disabled=false;$('pauseBtn').disabled=true;$('pauseBtn').textContent='Pausar';elapsedBefore=timer;saveRecord();setStatus('Fim de jogo! Recorde registrado.');showDialog('Fim de jogo',`Você fez ${score} pontos em ${formatTime(timer)}.`);}
  function showDialog(title,msg){$('dialogTitle').textContent=title;$('dialogText').textContent=msg;$('messageDialog').showModal()}
  function saveRecord(){const name=$('playerName').value.trim().slice(0,14)||'Jogador';const list=JSON.parse(localStorage.getItem('tetris31-records')||'[]');list.push({name,score,time:timer,date:Date.now()});list.sort((a,b)=>b.score-a.score||a.time-b.time);localStorage.setItem('tetris31-records',JSON.stringify(list.slice(0,10)));renderRecords();}
  function renderRecords(){const list=JSON.parse(localStorage.getItem('tetris31-records')||'[]');$('recordsBody').innerHTML='';if(!list.length){$('recordsBody').innerHTML='<tr><td colspan="4">Ainda não há recordes.</td></tr>';return}list.forEach((r,i)=>{const tr=document.createElement('tr');[i+1,r.name,r.score,formatTime(r.time)].forEach(v=>{const td=document.createElement('td');td.textContent=v;tr.appendChild(td)});$('recordsBody').appendChild(tr)})}
  function keyHandler(e){const map={ArrowLeft:()=>move(-1),ArrowRight:()=>move(1),ArrowDown:softDrop,ArrowUp:turn,' ':hardDrop,p:pause,P:pause};if(map[e.key]){e.preventDefault();map[e.key]();}}
  document.addEventListener('keydown',keyHandler);
  $('startBtn').addEventListener('click',start);$('pauseBtn').addEventListener('click',pause);
  $('restartBtn').addEventListener('click',()=>{cancelAnimationFrame(raf);running=false;$('startBtn').disabled=false;$('pauseBtn').disabled=true;reset()});
  $('menuNew').addEventListener('click',()=>{cancelAnimationFrame(raf);running=false;$('startBtn').disabled=false;$('pauseBtn').disabled=true;reset()});
  $('menuHelp').addEventListener('click',()=>showDialog('Ajuda - Tetris 3.1','Complete linhas horizontais para marcar pontos. Use as setas para mover e girar. No celular, use os botões abaixo do tabuleiro. O recorde é salvo neste dispositivo.'));
  $('clearRecords').addEventListener('click',()=>{if(confirm('Apagar todos os recordes deste dispositivo?')){localStorage.removeItem('tetris31-records');renderRecords()}});
  document.querySelectorAll('[data-key]').forEach(btn=>{const action={left:()=>move(-1),right:()=>move(1),rotate:turn,down:softDrop,drop:hardDrop}[btn.dataset.key];btn.addEventListener('pointerdown',e=>{e.preventDefault();action()})});
  $('playerName').value=localStorage.getItem('tetris31-player')||'';$('playerName').addEventListener('change',()=>localStorage.setItem('tetris31-player',$('playerName').value.trim()));renderRecords();reset();
  if('serviceWorker'in navigator&&location.protocol!=='file:')navigator.serviceWorker.register('./sw.js').catch(err=>console.warn('SW:',err));
})();