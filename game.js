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

  // Bipes sintetizados no próprio navegador: não precisa baixar arquivos de áudio.
  let audioCtx=null, audioReady=false, soundOn=true, musicOn=false, musicWanted=false, musicTimer=null, musicStep=0;
  function unlockAudio(){
    const AudioContext=window.AudioContext||window.webkitAudioContext;
    if(!AudioContext)return;
    if(!audioCtx)audioCtx=new AudioContext();
    if(audioCtx.state==='suspended')audioCtx.resume();
    audioReady=true;
  }
  function beep(freq=660,duration=0.055,wave='square',volume=0.045,delay=0){
    if(!soundOn||!audioReady||!audioCtx)return;
    const start=audioCtx.currentTime+delay;
    const osc=audioCtx.createOscillator(), gain=audioCtx.createGain();
    osc.type=wave;osc.frequency.setValueAtTime(freq,start);
    gain.gain.setValueAtTime(0.0001,start);
    gain.gain.exponentialRampToValueAtTime(volume,start+0.006);
    gain.gain.exponentialRampToValueAtTime(0.0001,start+duration);
    osc.connect(gain);gain.connect(audioCtx.destination);
    osc.start(start);osc.stop(start+duration+0.01);
  }
  const sounds={
    start(){beep(523,.08);beep(659,.08,'square',.045,.09);beep(784,.12,'square',.045,.18)},
    move(){beep(440,.035,'square',.025)},
    rotate(){beep(740,.06,'square',.035)},
    drop(){beep(180,.11,'triangle',.055);beep(110,.13,'triangle',.045,.07)},
    lock(){beep(330,.045,'square',.035)},
    line(){beep(660,.08);beep(880,.08,'square',.05,.09);beep(1046,.16,'square',.05,.18)},
    pause(){beep(440,.09,'square',.04);beep(330,.12,'square',.04,.1)},
    over(){beep(440,.13,'square',.05);beep(349,.13,'square',.05,.15);beep(262,.28,'square',.05,.3)}
  };

  // Pequena trilha original em estilo chiptune de 8 bits.
  // A melodia é sintetizada localmente e não utiliza música protegida.
  const melody=[
    [659,0.16],[494,0.16],[523,0.16],[587,0.16],[523,0.16],[494,0.16],
    [440,0.16],[440,0.16],[523,0.16],[659,0.16],[587,0.16],[523,0.16],
    [494,0.24],[523,0.16],[587,0.16],[659,0.24],[523,0.24],[440,0.24],
    [440,0.32],[0,0.12],[587,0.16],[698,0.16],[880,0.24],[784,0.16],
    [698,0.16],[659,0.24],[523,0.16],[659,0.16],[587,0.16],[523,0.16],
    [494,0.32],[0,0.12],[523,0.16],[587,0.16],[659,0.24],[523,0.24],
    [440,0.24],[440,0.32],[0,0.24]
  ];
  function musicNote(freq,duration){
    if(!musicOn||!audioReady||!audioCtx||!freq)return;
    const t=audioCtx.currentTime, osc=audioCtx.createOscillator(), gain=audioCtx.createGain();
    osc.type='square';osc.frequency.setValueAtTime(freq,t);
    gain.gain.setValueAtTime(0.0001,t);
    gain.gain.exponentialRampToValueAtTime(0.012,t+0.012);
    gain.gain.setValueAtTime(0.012,Math.max(t+0.013,t+duration-0.025));
    gain.gain.exponentialRampToValueAtTime(0.0001,t+duration);
    osc.connect(gain);gain.connect(audioCtx.destination);
    osc.start(t);osc.stop(t+duration+0.01);
  }
  function stopMusic(){
    musicOn=false;musicWanted=false;
    if(musicTimer){clearInterval(musicTimer);musicTimer=null}
    $('musicBtn').textContent='♫ Música: desligada';
    $('musicBtn').setAttribute('aria-pressed','false');
  }
  function startMusic(){
    musicWanted=true;
    unlockAudio();
    if(!audioCtx)return;
    if(musicTimer)clearInterval(musicTimer);
    musicOn=true;musicStep=0;
    $('musicBtn').textContent='♫ Música: ligada';
    $('musicBtn').setAttribute('aria-pressed','true');
    const playStep=()=>{
      if(!musicOn)return;
      const [freq,duration]=melody[musicStep];
      musicNote(freq,duration);
      musicStep=(musicStep+1)%melody.length;
    };
    playStep();
    musicTimer=setInterval(playStep,175);
  }
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
  function move(dx){if(!running||paused)return;if(!collide(piece,dx,0)){piece.x+=dx;sounds.move()}draw();}
  function turn(){if(!running||paused)return;const rotated=rotate(piece.matrix);for(const kick of [0,-1,1,-2,2])if(!collide(piece,0,0,rotated)&&!collide({...piece,x:piece.x+kick},0,0,rotated)){piece.x+=kick;piece.matrix=rotated;sounds.rotate();break}draw();}
  function softDrop(){if(!running||paused)return;if(!collide(piece,0,1)){piece.y++;score+=1;sounds.move()}else lockPiece();updateStats();draw();}
  function hardDrop(){if(!running||paused)return;let n=0;while(!collide(piece,0,1)){piece.y++;n++}score+=n*2;sounds.drop();lockPiece();updateStats();draw();}
  function lockPiece(){sounds.lock();piece.matrix.forEach((r,y)=>r.forEach((v,x)=>{if(v&&piece.y+y>=0)grid[piece.y+y][piece.x+x]=COLORS[piece.type]}));let cleared=0;for(let y=ROWS-1;y>=0;y--){if(grid[y].every(Boolean)){grid.splice(y,1);grid.unshift(Array(COLS).fill(null));cleared++;y++}}if(cleared){sounds.line();lines+=cleared;score+=[0,100,300,500,800][cleared]*level;level=Math.floor(lines/10)+1}piece=newPiece(nextType);nextType=randomType();if(collide(piece)){finish()}updateStats();}
  function updateStats(){$('score').textContent=String(score).padStart(6,'0');$('lines').textContent=lines;$('level').textContent=level;$('time').textContent=formatTime(timer);}
  function formatTime(s){return `${String(Math.floor(s/60)).padStart(2,'0')}:${String(s%60).padStart(2,'0')}`;}
  function setStatus(s){$('status').textContent=s;}
  function loop(ts){if(!running||paused)return;if(!lastTime)lastTime=ts;const delta=ts-lastTime;lastTime=ts;dropCounter+=delta;if(ts-startedAt>=1000){timer=elapsedBefore+Math.floor((ts-startedAt)/1000);updateStats()}if(dropCounter>Math.max(90,800-(level-1)*65)){softDrop();dropCounter=0}draw();raf=requestAnimationFrame(loop);}
  function start(){unlockAudio();if(over)reset();if(running&&!paused)return;running=true;paused=false;sounds.start();if(musicWanted)startMusic();startedAt=performance.now();lastTime=0;$('startBtn').disabled=true;$('pauseBtn').disabled=false;$('pauseBtn').textContent='Pausar';setStatus('Jogo em andamento');cancelAnimationFrame(raf);raf=requestAnimationFrame(loop);}
  function pause(){if(!running)return;if(!paused){paused=true;sounds.pause();if(musicOn){musicWanted=true;stopMusic();musicWanted=true}elapsedBefore=timer;cancelAnimationFrame(raf);$('pauseBtn').textContent='Continuar';setStatus('Jogo pausado')}else{paused=false;sounds.start();if(musicWanted)startMusic();startedAt=performance.now();lastTime=0;$('pauseBtn').textContent='Pausar';setStatus('Jogo em andamento');raf=requestAnimationFrame(loop)}}
  function finish(){running=false;paused=false;over=true;sounds.over();if(musicOn){stopMusic()}cancelAnimationFrame(raf);$('startBtn').disabled=false;$('pauseBtn').disabled=true;$('pauseBtn').textContent='Pausar';elapsedBefore=timer;setStatus('Fim de jogo! Informe seu nome para o Ranking.');$('recordSummary').textContent=`Você fez ${score} pontos em ${formatTime(timer)}. Digite seu nome para registrar o resultado.`;$('recordName').value='';$('recordDialog').showModal();setTimeout(()=>$('recordName').focus(),50);}
  function showDialog(title,msg){$('dialogTitle').textContent=title;$('dialogText').textContent=msg;$('messageDialog').showModal()}
  function saveRecord(name){const player=name.trim().slice(0,14);if(!player)return;const list=JSON.parse(localStorage.getItem('tetris31-records')||'[]');list.push({name:player,score,time:timer,date:Date.now()});list.sort((a,b)=>b.score-a.score||a.time-b.time);localStorage.setItem('tetris31-records',JSON.stringify(list.slice(0,10)));renderRecords();setStatus('Recorde salvo no Ranking!');}
  function renderRecords(){const list=JSON.parse(localStorage.getItem('tetris31-records')||'[]');$('recordsBody').innerHTML='';if(!list.length){$('recordsBody').innerHTML='<tr><td colspan="4">Ainda não há recordes.</td></tr>';return}list.forEach((r,i)=>{const tr=document.createElement('tr');[i+1,r.name,r.score,formatTime(r.time)].forEach(v=>{const td=document.createElement('td');td.textContent=v;tr.appendChild(td)});$('recordsBody').appendChild(tr)})}
  function keyHandler(e){const map={ArrowLeft:()=>move(-1),ArrowRight:()=>move(1),ArrowDown:softDrop,ArrowUp:turn,' ':hardDrop,p:pause,P:pause};if(map[e.key]){e.preventDefault();map[e.key]();}}
  document.addEventListener('keydown',keyHandler);
  $('startBtn').addEventListener('click',start);$('pauseBtn').addEventListener('click',pause);
  $('soundBtn').addEventListener('click',()=>{soundOn=!soundOn;$('soundBtn').textContent=soundOn?'♪ Efeitos: ligados':'♪ Efeitos: desligados';$('soundBtn').setAttribute('aria-pressed',String(soundOn));if(soundOn){unlockAudio();sounds.start()}});
  $('musicBtn').addEventListener('click',()=>{if(musicOn)stopMusic();else startMusic()});
  $('restartBtn').addEventListener('click',()=>{cancelAnimationFrame(raf);running=false;$('startBtn').disabled=false;$('pauseBtn').disabled=true;reset()});
  $('menuNew').addEventListener('click',()=>showDialog('Jogo','Para começar, use Iniciar. Para começar uma nova partida, use o botão Reiniciar ao lado do tabuleiro.'));
  $('menuHelp').addEventListener('click',()=>showDialog('Ajuda - Tetris 3.1','Complete linhas horizontais para marcar pontos. Use as setas para mover e girar. No celular, use os botões abaixo do tabuleiro. O recorde é salvo neste dispositivo.'));
  $('clearRecords').addEventListener('click',()=>{if(confirm('Apagar todos os recordes deste dispositivo?')){localStorage.removeItem('tetris31-records');renderRecords()}});
  document.querySelectorAll('[data-key]').forEach(btn=>{const action={left:()=>move(-1),right:()=>move(1),rotate:turn,down:softDrop,drop:hardDrop}[btn.dataset.key];btn.addEventListener('pointerdown',e=>{e.preventDefault();action()})});
  $('recordForm').addEventListener('submit',e=>{e.preventDefault();const name=$('recordName').value.trim();if(!name){$('recordName').focus();return}saveRecord(name);$('recordDialog').close();});
  $('skipRecord').addEventListener('click',()=>$('recordDialog').close());
  renderRecords();reset();
  if('serviceWorker'in navigator&&location.protocol!=='file:')navigator.serviceWorker.register('./sw.js').catch(err=>console.warn('SW:',err));
})();