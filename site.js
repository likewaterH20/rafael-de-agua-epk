/* Rafael De Agua EPK — behaviour */
(function(){
  const $=(s,r=document)=>r.querySelector(s), $$=(s,r=document)=>[...r.querySelectorAll(s)];
  const audioRef={a:null};

  // nav state
  const nav=$('.nav');

  // active nav link by section
  const links=$$('.nav a[href^="#"]');
  const secs=links.map(a=>$(a.getAttribute('href'))).filter(Boolean);
  if(secs.length){
    const io=new IntersectionObserver(es=>{
      es.forEach(e=>{ if(e.isIntersecting){ links.forEach(a=>a.classList.toggle('active',a.getAttribute('href')==='#'+e.target.id)); } });
    },{rootMargin:'-40% 0px -55% 0px'});
    secs.forEach(s=>io.observe(s));
  }

  // reveal
  // reveal: rect check on scroll (IntersectionObserver alone is unreliable in hidden/background tabs)
  let pending=$$('.rv');
  if(/[?&]shot=1/.test(location.search)){ document.body.classList.add('shot'); pending.forEach(el=>el.classList.add('in')); pending=[]; }  // full-page capture mode
  function reveal(){
    if(!pending.length) return;
    const h=innerHeight;
    pending=pending.filter(el=>{ const r=el.getBoundingClientRect(); if(r.top<h*.92&&r.bottom>0){ el.classList.add('in'); return false;} return true; });
  }
  addEventListener('scroll',reveal,{passive:true}); addEventListener('resize',reveal); addEventListener('load',reveal); reveal();
  setTimeout(reveal,300);

  // placeholder toggle
  const phBtn=$('#ph-toggle');
  if(phBtn){
    const apply=()=>{ let h=false; try{h=localStorage.getItem('hidePh')==='1';}catch(_){}
      document.body.classList.toggle('hide-ph',h); phBtn.textContent=h?'Show placeholder labels':'Hide placeholder labels'; };
    phBtn.addEventListener('click',()=>{ try{localStorage.setItem('hidePh',document.body.classList.contains('hide-ph')?'0':'1');}catch(_){ } apply(); });
    apply();
  }

  // bio toggle
  const bt=$('.bio-toggle');
  if(bt){ bt.addEventListener('click',()=>{ const l=$('.bio .long'); const open=l.hidden; l.hidden=!open; bt.textContent=open?'Short bio':'Read the long bio'; }); }

  // lightbox
  const lb=$('.lb');
  if(lb){
    const im=$('img',lb);
    let dragged=false; addEventListener('mousedown',()=>{dragged=false}); addEventListener('mousemove',e=>{ if(e.buttons) dragged=true; });
    $$('.gallery figure img').forEach(i=>i.parentElement.addEventListener('click',()=>{ if(dragged) return; im.src=i.src; lb.classList.add('open'); }));
    lb.addEventListener('click',()=>lb.classList.remove('open'));
    addEventListener('keydown',e=>{ if(e.key==='Escape') lb.classList.remove('open'); });
  }

  // ---- mixes: hidden SoundCloud widget driven by our own list ----
  // Rows are rebuilt from the LIVE playlist on ready (top N), so renames/reorders on SoundCloud flow through.
  const mp=$('#mixplayer');
  let scPause=()=>{};
  if(mp && window.SC && SC.Widget){
    const w=SC.Widget($('.sc-hidden',mp));
    const list=$('.mixlist',mp), N=+list.dataset.count||5;
    const big=$('.mx-big',mp), title=$('.mx-title',mp), sub=$('.mx-sub',mp), time=$('.mx-time',mp), seek=$('.mx-seek',mp), fill=$('.mx-seek b',mp);
    let rows=$$('.mx',mp), cur=-1, playing=false, dur=0, ready=false;
    const fmt=ms=>{ const s=Math.floor(ms/1000); const h=Math.floor(s/3600), m=Math.floor(s%3600/60), x=s%60; return (h?h+':'+String(m).padStart(2,'0'):m)+':'+String(x).padStart(2,'0'); };
    const fmtLen=ms=>{ const m=Math.round(ms/60000); return m>=60?`${Math.floor(m/60)} h ${String(m%60).padStart(2,'0')}`:`${m} min`; };
    const setPlaying=p=>{ playing=p; big.firstElementChild.textContent=p?'❚❚':'▶'; rows.forEach((r,i)=>r.classList.toggle('playing',p&&i===cur)); };
    const select=i=>{ cur=i; rows.forEach(r=>r.classList.remove('loading')); if(!rows[i]) return; rows[i].classList.add('loading'); title.textContent=rows[i].querySelector('.mx-t').textContent; sub.textContent='Set '+String(i+1).padStart(2,'0')+' · '+rows[i].querySelector('.mx-d').textContent; };
    const onRow=(r,i)=>r.addEventListener('click',()=>{ if(!ready) return; if(i===cur){ playing?w.pause():w.play(); return; } select(i); w.skip(i); w.play(); });
    const build=sounds=>{
      const top=sounds.slice(0,N); if(!top.length) return;
      list.textContent='';
      rows=top.map((t,i)=>{ const li=document.createElement('li'); li.className='mx'; li.dataset.i=i;
        const n=document.createElement('span'); n.className='mx-n'; n.textContent=String(i+1).padStart(2,'0');
        const tt=document.createElement('span'); tt.className='mx-t'; tt.textContent=t.title;
        const d=document.createElement('span'); d.className='mx-d'; d.textContent=fmtLen(t.duration);
        li.append(n,tt,d); list.appendChild(li); onRow(li,i); return li; });
    };
    rows.forEach(onRow);
    scPause=()=>{ if(playing) w.pause(); };
    // the widget fills sound metadata lazily; wait until the top N all have titles (else keep the static rows)
    const tryBuild=n=>w.getSounds(s=>{ const top=(s||[]).slice(0,N); if(top.length===N&&top.every(t=>t&&t.title&&t.duration)) build(top); else if(n<8) setTimeout(()=>tryBuild(n+1),700); });
    w.bind(SC.Widget.Events.READY,()=>{ ready=true; tryBuild(0); });
    w.bind(SC.Widget.Events.PLAY,()=>{ if(audioRef.a&&!audioRef.a.paused) audioRef.a.pause(); w.getCurrentSoundIndex(i=>{ if(i>=rows.length){ w.pause(); return; } if(i!==cur) select(i); rows[cur].classList.remove('loading'); setPlaying(true); }); });
    w.bind(SC.Widget.Events.PAUSE,()=>setPlaying(false));
    w.bind(SC.Widget.Events.FINISH,()=>setPlaying(false));
    w.bind(SC.Widget.Events.ERROR,()=>{ mp.classList.add('unavailable'); sub.textContent='Stream unavailable right now'; });
    w.bind(SC.Widget.Events.PLAY_PROGRESS,e=>{ fill.style.width=(e.relativePosition*100)+'%'; w.getDuration(d=>{ dur=d; if(dur) time.textContent=fmt(e.currentPosition)+' / '+fmt(dur); }); });
    big.addEventListener('click',()=>{ if(!ready) return; if(cur<0){ select(0); w.skip(0); w.play(); return; } playing?w.pause():w.play(); });
    seek.addEventListener('click',e=>{ if(!dur) return; const r=seek.getBoundingClientRect(); w.seekTo((e.clientX-r.left)/r.width*dur); });
  } else if(mp){ mp.classList.add('unavailable'); $('.mx-sub',mp).textContent='Player script blocked. Check the connection.'; }

  // ---- watch: swipeable row of YouTube sets; iframe only on click ----
  // A figure with data-sets="start-end,start-end" (seconds, end optional) plays ONLY those windows, in order:
  // when a window ends it jumps to the next one, and stops after the last. That is how his parts of a longer stream play.
  let ytPlayer=null, ytPoll=null;
  const ytUnload=f=>{ if(ytPoll){ clearInterval(ytPoll); ytPoll=null; } if(ytPlayer&&f.querySelector('iframe')){ try{ytPlayer.destroy();}catch(_){ } ytPlayer=null; }
    const i=f.querySelector('iframe'); if(i) i.remove(); f.classList.remove('on'); f.style.cursor=''; $$('.yt-cue',f).forEach(c=>c.classList.remove('on')); };
  const parseSets=f=>(f.dataset.sets||'').split(',').filter(Boolean).map(x=>{ const [a,b]=x.split('-'); return {start:+a, end:b?+b:null}; });
  const ytLoad=(f,setIdx)=>{
    scPause(); if(audioRef.a&&!audioRef.a.paused) audioRef.a.pause();
    $$('.yt').forEach(o=>{ if(o!==f) ytUnload(o); }); ytUnload(f);
    const sets=parseSets(f); const start=sets.length?sets[setIdx||0].start:(+f.dataset.start||0);
    const host=document.createElement('div'); host.className='yt-host';
    f.insertBefore(host,f.querySelector('img')); f.classList.add('on'); f.style.cursor='default';
    $$('.yt-cue',f).forEach(c=>c.classList.toggle('on',+c.dataset.set===(setIdx||0)));
    const boot=()=>{
      ytPlayer=new YT.Player(host,{videoId:f.dataset.id,playerVars:{autoplay:1,start:start,rel:0,modestbranding:1,color:'white',playsinline:1},
        host:'https://www.youtube.com',
        events:{onReady:e=>{ e.target.playVideo(); },
          onStateChange:e=>{
            if(!sets.length) return;
            if(e.data===YT.PlayerState.PLAYING && !ytPoll){
              ytPoll=setInterval(()=>{ if(!ytPlayer||!ytPlayer.getCurrentTime) return; const t=ytPlayer.getCurrentTime();
                const k=sets.findIndex((w,i)=>t>=w.start-1&&(w.end==null||t<w.end)); const cur=sets.findIndex(w=>t>=w.start-1&&(w.end!=null&&t>=w.end));
                // reached the end of a window -> next window or stop
                const done=sets.findIndex(w=>w.end!=null&&t>=w.end&&t<w.end+3);
                if(done>-1){ const nx=sets[done+1]; if(nx){ ytPlayer.seekTo(nx.start,true); $$('.yt-cue',f).forEach(c=>c.classList.toggle('on',+c.dataset.set===done+1)); } else { ytPlayer.pauseVideo(); } }
              },500);
            }
          }}});
    };
    if(window.YT&&YT.Player) boot(); else { const prev=window.onYouTubeIframeAPIReady; window.onYouTubeIframeAPIReady=()=>{ if(prev) prev(); boot(); }; }
  };
  $$('.yt').forEach(f=>{
    f.dataset.title=f.querySelector('img').alt;
    const go=()=>{ if(!f.classList.contains('on')) ytLoad(f,0); };
    f.querySelector('img').addEventListener('click',go);
    const pb=f.querySelector('.yt-play'); if(pb) pb.addEventListener('click',go);
    $$('.yt-cue',f).forEach(c=>c.addEventListener('click',e=>{ e.stopPropagation(); ytLoad(f,+c.dataset.set); }));
  });
  // photo slideshow: same carousel mechanics + dots + gentle autoplay (pauses on any interaction)
  $$('.slideshow').forEach(blk=>{
    const g=$('.gallery',blk), sl=$$('figure',g), count=$('.w-count',blk), dots=$('.ss-dots',blk); if(!sl.length) return;
    sl.forEach(()=>dots.appendChild(document.createElement('i')));
    let idx=0, timer=null;
    const paint=()=>{ count.textContent=(idx+1)+' / '+sl.length; $$('i',dots).forEach((d,k)=>d.classList.toggle('on',k===idx)); };
    const update=()=>{ const i=Math.round(g.scrollLeft/g.clientWidth); if(i!==idx){ idx=i; } paint(); };
    const to=i=>{ i=(i+sl.length)%sl.length; g.scrollTo({left:i*g.clientWidth,behavior:document.hidden?'auto':'smooth'}); setTimeout(update,60); setTimeout(update,700); };
    const stop=()=>{ if(timer){ clearInterval(timer); timer=null; } };
    const start=()=>{ stop(); timer=setInterval(()=>{ if(!document.hidden) to(idx+1); },4500); };
    g.addEventListener('scroll',update,{passive:true}); paint();
    $('.w-prev',blk).addEventListener('click',()=>{ stop(); to(idx-1); }); $('.w-next',blk).addEventListener('click',()=>{ stop(); to(idx+1); });
    g.addEventListener('keydown',e=>{ if(e.key==='ArrowRight'){ stop(); to(idx+1);} if(e.key==='ArrowLeft'){ stop(); to(idx-1);} });
    ['touchstart','wheel','mousedown'].forEach(ev=>g.addEventListener(ev,stop,{passive:true}));
    let down=null; g.addEventListener('mousedown',e=>{ down={x:e.clientX,l:g.scrollLeft,t:Date.now()}; });
    addEventListener('mousemove',e=>{ if(down){ g.scrollLeft=down.l-(e.clientX-down.x); } });
    addEventListener('mouseup',e=>{ if(down){ const moved=Math.abs(e.clientX-down.x)>8; down=null; if(moved){ to(Math.round(g.scrollLeft/g.clientWidth)); } } });
    addEventListener('resize',()=>g.scrollTo({left:idx*g.clientWidth}));
    start();
  });

  // one carousel per .watch-block
  $$('.watch-block').forEach(blk=>{
    const wg=$('.watch-grid',blk), sl=$$('.yt',wg), count=$('.w-count',blk); if(!wg||!sl.length) return;
    let idx=0;
    const update=()=>{ const i=Math.round(wg.scrollLeft/wg.clientWidth); if(i!==idx){ idx=i; sl.forEach((f,k)=>{ if(k!==idx) ytUnload(f); }); } count.textContent=(idx+1)+' / '+sl.length; };
    wg.addEventListener('scroll',update,{passive:true}); update();
    const to=i=>{ i=Math.max(0,Math.min(sl.length-1,i)); wg.scrollTo({left:i*wg.clientWidth,behavior:document.hidden?'auto':'smooth'}); setTimeout(update,50); setTimeout(update,700); };
    $('.w-prev',blk).addEventListener('click',()=>to(idx-1)); $('.w-next',blk).addEventListener('click',()=>to(idx+1));
    wg.addEventListener('keydown',e=>{ if(e.key==='ArrowRight') to(idx+1); if(e.key==='ArrowLeft') to(idx-1); });
    let down=null; wg.addEventListener('mousedown',e=>{ if(e.target.closest('iframe,button')) return; down={x:e.clientX,l:wg.scrollLeft}; });
    addEventListener('mousemove',e=>{ if(down){ wg.scrollLeft=down.l-(e.clientX-down.x); } });
    addEventListener('mouseup',e=>{ if(down){ const moved=Math.abs(e.clientX-down.x)>8; down=null; if(moved){ to(Math.round(wg.scrollLeft/wg.clientWidth)); } } });
    addEventListener('resize',()=>wg.scrollTo({left:idx*wg.clientWidth}));
  });

  // player — click-to-play, Web Audio analyser for the bars
  const player=$('.player');
  if(!player) return;
  const audio=new Audio(); audio.preload='none'; audio.crossOrigin='anonymous'; audioRef.a=audio;
  audio.addEventListener('play',()=>scPause());
  const bars=$('.bars',player); const N=48;
  for(let i=0;i<N;i++){ bars.appendChild(document.createElement('i')); }
  const els=$$('i',bars);
  const seek=$('.seek',player), seekFill=$('.seek b',player);
  let ctx,an,data,src,raf,cur=null;
  const fmt=s=>isFinite(s)?`${Math.floor(s/60)}:${String(Math.floor(s%60)).padStart(2,'0')}`:'--:--';
  function draw(){
    raf=requestAnimationFrame(draw);
    if(an){ an.getByteFrequencyData(data);
      for(let i=0;i<N;i++){ const v=data[Math.floor(i*data.length/N*0.6)]/255; els[i].style.height=(8+v*92)+'%'; } }
    if(audio.duration){ seekFill.style.width=(audio.currentTime/audio.duration*100)+'%';
      if(cur){ $('.t-time',cur).textContent=fmt(audio.currentTime)+' / '+fmt(audio.duration); } }
  }
  function stopAll(){ $$('.track',player).forEach(t=>t.classList.remove('playing')); player.classList.remove('on'); }
  $$('.track',player).forEach(t=>{
    t.addEventListener('click',()=>{
      const file=t.dataset.src;
      if(!file){ return; }
      if(cur===t && !audio.paused){ audio.pause(); t.classList.remove('playing'); player.classList.remove('on'); return; }
      if(!ctx){ ctx=new (window.AudioContext||window.webkitAudioContext)(); an=ctx.createAnalyser(); an.fftSize=256; data=new Uint8Array(an.frequencyBinCount); src=ctx.createMediaElementSource(audio); src.connect(an); an.connect(ctx.destination); }
      if(ctx.state==='suspended') ctx.resume();
      if(cur!==t){ audio.src=file; cur=t; }
      stopAll(); t.classList.add('playing'); player.classList.add('on');
      audio.play().catch(()=>{});
      cancelAnimationFrame(raf); draw();
    });
  });
  audio.addEventListener('ended',()=>{ stopAll(); cancelAnimationFrame(raf); els.forEach(e=>e.style.height='8%'); seekFill.style.width='0'; });
  seek.addEventListener('click',e=>{ if(!audio.duration) return; const r=seek.getBoundingClientRect(); audio.currentTime=(e.clientX-r.left)/r.width*audio.duration; });
})();
