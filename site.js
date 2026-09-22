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

  // ---- the name behaves like water ----
  // De Agua. Letters lift and ripple away from the pointer or finger, then settle.
  // Split in JS (never innerHTML) so the markup and the reveal animation stay untouched.
  const splitChars=el=>{
    [...el.childNodes].forEach(n=>{
      if(n.nodeType===3){
        const frag=document.createDocumentFragment();
        [...n.textContent].forEach(c=>{
          const s=document.createElement('span'); s.className='ch';
          s.textContent=(c===' ')?' ':c;
          frag.appendChild(s);
        });
        n.replaceWith(frag);
      } else if(n.nodeType===1 && !n.classList.contains('ch')) splitChars(n);
    });
  };

  const calm=matchMedia('(prefers-reduced-motion:reduce)').matches;
  const name=$('.hero-title');
  if(name && !calm){
    splitChars(name);
    const chars=$$('.ch',name);
    const st=chars.map(()=>({y:0,k:0}));
    let px=-9999, py=-9999, hot=0, raf=null, pts=[];
    const R=180;                                   // how far the disturbance carries
    const measure=()=>{ pts=chars.map(c=>{ const r=c.getBoundingClientRect(); return {x:r.left+r.width/2,y:r.top+r.height/2}; }); };
    const loop=()=>{
      const t=performance.now()/1000; let alive=false;
      for(let i=0;i<chars.length;i++){
        const p=pts[i]||{x:0,y:0};
        const d=Math.hypot(p.x-px,p.y-py);
        const f=hot*Math.max(0,1-d/R);
        const ty=(-20*f)+Math.sin(t*5-d*0.025)*8*f;   // lift, plus a wave travelling outward
        const tk=-7*f;
        const s=st[i];
        s.y+=(ty-s.y)*0.16; s.k+=(tk-s.k)*0.16;
        if(Math.abs(s.y)>0.06||Math.abs(s.k)>0.06) alive=true;
        chars[i].style.transform='translate3d(0,'+s.y.toFixed(2)+'px,0) skewX('+s.k.toFixed(2)+'deg)';
      }
      if(alive||hot>0){ raf=requestAnimationFrame(loop); }
      else { raf=null; chars.forEach(c=>{ c.style.transform=''; }); }
    };
    const kick=()=>{ if(!raf) raf=requestAnimationFrame(loop); };
    const touch=e=>{ px=e.clientX; py=e.clientY; hot=1; kick(); };
    name.addEventListener('pointerenter',e=>{ measure(); touch(e); });
    name.addEventListener('pointermove',touch);
    name.addEventListener('pointerdown',e=>{ measure(); touch(e); });
    name.addEventListener('pointerleave',()=>{ hot=0; kick(); });
    addEventListener('scroll',()=>{ if(raf) measure(); },{passive:true});
    addEventListener('resize',()=>{ measure(); },{passive:true});
  }

  // Book button leans toward the cursor a little
  const magnet=$('.nav .book');
  if(magnet && !calm && matchMedia('(hover:hover)').matches){
    magnet.addEventListener('pointermove',e=>{
      const r=magnet.getBoundingClientRect();
      const dx=(e.clientX-(r.left+r.width/2))/r.width, dy=(e.clientY-(r.top+r.height/2))/r.height;
      magnet.style.transform='translate('+(dx*7).toFixed(1)+'px,'+(dy*5).toFixed(1)+'px)';
    });
    magnet.addEventListener('pointerleave',()=>{ magnet.style.transform=''; });
  }

  // room loop: browsers pause muted autoplay when the tab is hidden or the video is off-screen; nudge it back
  // Same rect-on-scroll check the reveal uses. IntersectionObserver missed the re-start here —
  // the browser pauses the muted loop while it is off-screen and it stayed on the poster frame.
  const loop=$('.live-video video');
  if(loop){
    const seen=()=>{ const r=loop.getBoundingClientRect(); return r.top<innerHeight&&r.bottom>0; };
    const kick=()=>{ if(!document.hidden&&loop.paused&&seen()) loop.play().catch(()=>{}); };
    document.addEventListener('visibilitychange',kick);
    addEventListener('load',kick); addEventListener('scroll',kick,{passive:true}); addEventListener('resize',kick);
    kick(); setTimeout(kick,400);
  }

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
    $$('.gallery figure img, .artist-grid figure img').forEach(i=>i.parentElement.addEventListener('click',()=>{ if(dragged) return; im.src=i.src; lb.classList.add('open'); }));
    lb.addEventListener('click',()=>lb.classList.remove('open'));
    addEventListener('keydown',e=>{ if(e.key==='Escape') lb.classList.remove('open'); });
  }

  // ---- mixes: hidden SoundCloud widget driven by our own list ----
  // Rows are rebuilt from the LIVE playlist on ready (top N), so renames/reorders on SoundCloud flow through.
  const mp=$('#mixplayer');
  let scPause=()=>{};
  if(mp && window.SC && SC.Widget){
    const w=SC.Widget($('.sc-hidden',mp));
    const list=$('.mixlist',mp), N=+list.dataset.count||5, SHOW=+list.dataset.show||N;
    const moreBtn=$('.mx-more',mp);
    const fold=()=>{ const rs=$$('.mx',list); rs.forEach((r,i)=>r.classList.toggle('more',i>=SHOW)); const extra=rs.length-SHOW; if(moreBtn){ moreBtn.hidden=extra<=0; const open=list.classList.contains('open'); moreBtn.textContent=open?'–':'···'; moreBtn.setAttribute('aria-label',open?'Show fewer mixes':'Show '+extra+' more mixes'); } };
    if(moreBtn) moreBtn.addEventListener('click',()=>{ list.classList.toggle('open'); fold(); });
    const big=$('.mx-big',mp), title=$('.mx-title',mp), sub=$('.mx-sub',mp), time=$('.mx-time',mp), seek=$('.mx-seek',mp), fill=$('.mx-seek b',mp);
    let rows=$$('.mx',mp), cur=-1, playing=false, dur=0, ready=false, pos=0, dragging=false;
    const fmt=ms=>{ const s=Math.floor(ms/1000); const h=Math.floor(s/3600), m=Math.floor(s%3600/60), x=s%60; return (h?h+':'+String(m).padStart(2,'0'):m)+':'+String(x).padStart(2,'0'); };
    const fmtLen=ms=>{ const m=Math.round(ms/60000); return m>=60?`${Math.floor(m/60)} h ${String(m%60).padStart(2,'0')}`:`${m} min`; };
    const setPlaying=p=>{ playing=p; big.firstElementChild.textContent=p?'❚❚':'▶'; mp.classList.toggle('playing',p);
      rows.forEach((r,i)=>r.classList.toggle('playing',p&&i===cur)); };
    const select=i=>{ cur=i; big.style.setProperty('--p','0'); rows.forEach(r=>r.classList.remove('loading')); if(!rows[i]) return; rows[i].classList.add('loading'); title.textContent=rows[i].querySelector('.mx-t').textContent; sub.textContent='Set '+String(i+1).padStart(2,'0')+' · '+rows[i].querySelector('.mx-d').textContent; };
    const onRow=(r,i)=>r.addEventListener('click',()=>{ if(!ready) return; if(i===cur){ playing?w.pause():w.play(); return; } select(i); w.skip(i); w.play(); });
    const build=sounds=>{
      const top=sounds.slice(0,N); if(!top.length) return;
      list.textContent='';
      rows=top.map((t,i)=>{ const li=document.createElement('li'); li.className='mx'; li.dataset.i=i;
        const n=document.createElement('span'); n.className='mx-n'; n.textContent=String(i+1).padStart(2,'0');
        const tt=document.createElement('span'); tt.className='mx-t'; tt.textContent=t.title;
        const d=document.createElement('span'); d.className='mx-d'; d.textContent=fmtLen(t.duration);
        li.append(n,tt,d); list.appendChild(li); onRow(li,i); return li; });
      fold();
    };
    rows.forEach(onRow); fold();
    scPause=()=>{ if(playing) w.pause(); };
    // the widget fills sound metadata lazily; wait until the top N all have titles (else keep the static rows)
    const tryBuild=n=>w.getSounds(s=>{ const top=(s||[]).slice(0,N); if(top.length===N&&top.every(t=>t&&t.title&&t.duration)) build(top); else if(n<8) setTimeout(()=>tryBuild(n+1),700); });
    w.bind(SC.Widget.Events.READY,()=>{ ready=true; tryBuild(0); });
    w.bind(SC.Widget.Events.PLAY,()=>{ if(audioRef.a&&!audioRef.a.paused) audioRef.a.pause(); w.getCurrentSoundIndex(i=>{ if(i>=rows.length){ w.pause(); return; } if(i!==cur) select(i); rows[cur].classList.remove('loading'); if(rows[cur].classList.contains('more')&&!list.classList.contains('open')){ list.classList.add('open'); fold(); } setPlaying(true); }); });
    w.bind(SC.Widget.Events.PAUSE,()=>setPlaying(false));
    w.bind(SC.Widget.Events.FINISH,()=>setPlaying(false));
    w.bind(SC.Widget.Events.ERROR,()=>{ mp.classList.add('unavailable'); sub.textContent='Stream unavailable right now'; });
    w.bind(SC.Widget.Events.PLAY_PROGRESS,e=>{ pos=e.currentPosition;
      big.style.setProperty('--p',e.relativePosition.toFixed(4));   // the ring IS the progress
      if(!dragging) fill.style.width=(e.relativePosition*100)+'%';
      w.getDuration(d=>{ dur=d; if(dur) time.textContent=fmt(e.currentPosition)+' / '+fmt(dur); }); });
    big.addEventListener('click',()=>{ if(!ready) return; if(cur<0){ select(0); w.skip(0); w.play(); return; } playing?w.pause():w.play(); });

    // scrub: click, drag, or arrow keys. The mixes run 18 min to 1 h 10, so seeking has to be cheap.
    seek.tabIndex=0; seek.setAttribute('role','slider'); seek.setAttribute('aria-label','Seek within the mix');
    const ratioAt=x=>{ const r=seek.getBoundingClientRect(); return Math.min(1,Math.max(0,(x-r.left)/r.width)); };
    const paint=ra=>{ fill.style.width=(ra*100)+'%'; };
    const jump=ms=>{ if(!dur) return; pos=Math.min(dur,Math.max(0,pos+ms)); paint(pos/dur); w.seekTo(pos); };
    seek.addEventListener('pointermove',e=>{ if(dragging) fill.style.width=(ratioAt(e.clientX)*100)+'%'; });
    seek.addEventListener('pointerdown',e=>{ if(!dur) return; dragging=true; seek.classList.add('drag'); try{seek.setPointerCapture(e.pointerId);}catch(_){ } paint(ratioAt(e.clientX)); e.preventDefault(); });
    const endDrag=e=>{ if(!dragging) return; dragging=false; seek.classList.remove('drag'); const ra=ratioAt(e.clientX); pos=ra*dur; paint(ra); w.seekTo(pos); };
    seek.addEventListener('pointerup',endDrag);
    seek.addEventListener('pointercancel',()=>{ dragging=false; seek.classList.remove('drag'); });
    seek.addEventListener('keydown',e=>{ const k=e.key;
      const step={ArrowRight:30000,ArrowLeft:-30000,PageUp:300000,PageDown:-300000}[k];
      if(step!==undefined){ e.preventDefault(); jump(step); return; }
      if(k==='Home'){ e.preventDefault(); if(dur){ pos=0; paint(0); w.seekTo(0); } } });
  } else if(mp){ mp.classList.add('unavailable'); $('.mx-sub',mp).textContent='Player script blocked. Check the connection.'; }

  // ---- watch: swipeable row of YouTube sets; iframe only on click ----
  // A figure with data-sets="start-end,start-end" (seconds, end optional) plays ONLY those windows, in order:
  // when a window ends it jumps to the next one, and stops after the last. That is how his parts of a longer stream play.
  let ytPlayer=null, ytPoll=null, ytFig=null, ytWin=0, ytTick=null;
  // Only tear down the timer and the player when THIS figure is the one that owns them.
  // It used to clear ytPoll unconditionally, so unloading any off-screen slide killed the
  // set-to-set hand-off of the video that was actually playing.
  const ytUnload=f=>{
    if(ytFig===f){
      if(ytPoll){ clearInterval(ytPoll); ytPoll=null; }
      if(ytTick){ clearInterval(ytTick); ytTick=null; }
      if(ytPlayer){ try{ytPlayer.destroy();}catch(_){ } }
      ytPlayer=null; ytFig=null;
    }
    const b=f.querySelector('.yt-bar'); if(b) b.remove();
    const i=f.querySelector('iframe'); if(i) i.remove();
    const h=f.querySelector('.yt-host'); if(h) h.remove();
    const s=f.querySelector('.yt-shield'); if(s) s.remove();
    f.classList.remove('on','playing'); f.style.cursor=''; $$('.yt-cue',f).forEach(c=>c.classList.remove('on')); };
  const parseSets=f=>(f.dataset.sets||'').split(',').filter(Boolean).map(x=>{ const [a,b]=x.split('-'); return {start:+a, end:b?+b:null}; });
  const paintCues=(f,i)=>$$('.yt-cue',f).forEach(c=>c.classList.toggle('on',+c.dataset.set===i));
  const ytLoad=(f,setIdx)=>{
    scPause(); if(audioRef.a&&!audioRef.a.paused) audioRef.a.pause();
    $$('.yt').forEach(o=>{ if(o!==f) ytUnload(o); }); ytUnload(f);
    ytFig=f;   // claim it now, not in onReady, so a fast second click can't orphan a player
    const sets=parseSets(f); ytWin=setIdx||0; const start=sets.length?sets[ytWin].start:(+f.dataset.start||0);
    const host=document.createElement('div'); host.className='yt-host';
    f.insertBefore(host,f.querySelector('img')); f.classList.add('on'); f.style.cursor='default';
    // swallows every pointer event so YouTube's hover UI never surfaces; also our play/pause
    const shield=document.createElement('div'); shield.className='yt-shield';
    shield.addEventListener('click',()=>{ if(!ytPlayer||ytFig!==f) return;
      if(f.classList.contains('playing')) ytPlayer.pauseVideo(); else ytPlayer.playVideo(); });
    f.appendChild(shield);

    // our own scrubber, because controls:0 leaves the viewer no way to move.
    // It spans the CURRENT SET, not the whole two-hour stream, so dragging can never
    // land him in another DJ's hour. Falls back to set-start → end-of-video while the
    // end times are still missing.
    const bar=document.createElement('div'); bar.className='yt-bar';
    const yseek=document.createElement('div'); yseek.className='yt-seek';
    yseek.tabIndex=0; yseek.setAttribute('role','slider'); yseek.setAttribute('aria-label','Seek within this set');
    const yfill=document.createElement('b'); yseek.appendChild(yfill);
    const ytime=document.createElement('div'); ytime.className='yt-time'; ytime.textContent='0:00 / --:--';
    bar.append(yseek,ytime);
    f.insertBefore(bar,f.querySelector('figcaption'));

    const fmtS=s=>{ s=Math.max(0,Math.floor(s)); const h=Math.floor(s/3600),m=Math.floor(s%3600/60),x=s%60;
      return (h?h+':'+String(m).padStart(2,'0'):m)+':'+String(x).padStart(2,'0'); };
    const bounds=()=>{ const cw=sets[ytWin];
      const dur=(ytPlayer&&ytPlayer.getDuration&&ytPlayer.getDuration())||0;
      const a=cw?cw.start:0, b=(cw&&cw.end!=null)?cw.end:(dur||a+1);
      return [a,Math.max(b,a+1)]; };
    let ydrag=false;
    const ratioAtX=x=>{ const r=yseek.getBoundingClientRect(); return Math.min(1,Math.max(0,(x-r.left)/r.width)); };
    const paintBar=()=>{ if(!ytPlayer||!ytPlayer.getCurrentTime||ydrag) return;
      const t=ytPlayer.getCurrentTime(), [a,b]=bounds();
      yfill.style.width=(Math.min(1,Math.max(0,(t-a)/(b-a)))*100)+'%';
      ytime.textContent=fmtS(t-a)+' / '+fmtS(b-a); };
    ytTick=setInterval(paintBar,250); paintBar();

    yseek.addEventListener('pointerdown',e=>{ if(!ytPlayer) return; ydrag=true; yseek.classList.add('drag');
      try{yseek.setPointerCapture(e.pointerId);}catch(_){ } yfill.style.width=(ratioAtX(e.clientX)*100)+'%'; e.preventDefault(); });
    yseek.addEventListener('pointermove',e=>{ if(ydrag) yfill.style.width=(ratioAtX(e.clientX)*100)+'%'; });
    const yEnd=e=>{ if(!ydrag) return; ydrag=false; yseek.classList.remove('drag');
      const [a,b]=bounds(); ytPlayer.seekTo(a+ratioAtX(e.clientX)*(b-a),true); paintBar(); };
    yseek.addEventListener('pointerup',yEnd);
    yseek.addEventListener('pointercancel',()=>{ ydrag=false; yseek.classList.remove('drag'); });
    yseek.addEventListener('keydown',e=>{ const step={ArrowRight:15,ArrowLeft:-15,PageUp:60,PageDown:-60}[e.key];
      if(step===undefined||!ytPlayer) return; e.preventDefault();
      const [a,b]=bounds(); ytPlayer.seekTo(Math.min(b,Math.max(a,ytPlayer.getCurrentTime()+step)),true); paintBar(); });

    paintCues(f,ytWin);
    const boot=()=>{
      // controls:0 + the shield below = no YouTube chrome at all: no title, no logo,
      // no red bar, no share, no "More videos". His footage, nothing else.
      ytPlayer=new YT.Player(host,{videoId:f.dataset.id,
        playerVars:{autoplay:1,start:start,rel:0,modestbranding:1,playsinline:1,controls:0,disablekb:1,fs:0,iv_load_policy:3},
        host:'https://www.youtube-nocookie.com',
        events:{onReady:e=>{ ytFig=f; e.target.playVideo(); },
          onStateChange:e=>{
            // 1 playing, 2 paused, 0 ended — our poster covers every non-playing state
            f.classList.toggle('playing',e.data===1);
            if(e.data===0||e.data===2) f.classList.remove('playing');
            if(!sets.length) return;
            if(e.data===YT.PlayerState.PLAYING && !ytPoll){
              // Track the active window by index instead of re-deriving it from the clock every tick:
              // re-deriving skipped the hand-off whenever a seek or a buffer stall stepped past the boundary.
              ytPoll=setInterval(()=>{ if(!ytPlayer||!ytPlayer.getCurrentTime) return; const t=ytPlayer.getCurrentTime();
                const cw=sets[ytWin]; if(!cw) return;
                // he scrubbed the YouTube bar himself: follow him to whatever window he landed in, don't yank him back
                if(t<cw.start-4||(cw.end!=null&&t>cw.end+4)){
                  const k=sets.findIndex(s=>t>=s.start-1&&(s.end==null||t<s.end));
                  if(k>-1&&k!==ytWin){ ytWin=k; paintCues(f,k); }
                  return;
                }
                if(cw.end!=null&&t>=cw.end){ const nx=sets[ytWin+1];
                  if(nx){ ytWin++; ytPlayer.seekTo(nx.start,true); paintCues(f,ytWin); }
                  else { ytPlayer.pauseVideo(); clearInterval(ytPoll); ytPoll=null; } }
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
    // Jumping between his two sets must SEEK the running player. Reloading the iframe meant a black
    // frame, a re-buffer and sometimes a pre-roll every time he tapped the other set.
    $$('.yt-cue',f).forEach(c=>c.addEventListener('click',e=>{ e.stopPropagation(); const i=+c.dataset.set;
      if(ytFig===f&&ytPlayer&&ytPlayer.seekTo){ const s=parseSets(f)[i]; if(s){ ytWin=i; ytPlayer.seekTo(s.start,true); ytPlayer.playVideo(); paintCues(f,i); return; } }
      ytLoad(f,i); }));
  });
  // photo strip under the room video: free horizontal scroll, no pages, no autoplay. Click still opens the lightbox.
  $$('.slideshow').forEach(blk=>{
    const g=$('.gallery',blk); if(!g||!$$('figure',g).length) return;
    g.addEventListener('keydown',e=>{ const s={ArrowRight:200,ArrowLeft:-200}[e.key];
      if(s){ e.preventDefault(); g.scrollBy({left:s,behavior:'smooth'}); } });
    // a vertical wheel/trackpad gesture over the strip scrolls it sideways instead of the page
    g.addEventListener('wheel',e=>{ if(Math.abs(e.deltaY)<=Math.abs(e.deltaX)) return;
      const max=g.scrollWidth-g.clientWidth; if(max<=0) return;
      if((e.deltaY<0&&g.scrollLeft<=0)||(e.deltaY>0&&g.scrollLeft>=max-1)) return;  // let the page take over at the ends
      e.preventDefault(); g.scrollLeft+=e.deltaY; },{passive:false});
    let down=null;
    g.addEventListener('mousedown',e=>{ down={x:e.clientX,l:g.scrollLeft}; g.classList.add('drag'); });
    addEventListener('mousemove',e=>{ if(down) g.scrollLeft=down.l-(e.clientX-down.x); });
    addEventListener('mouseup',()=>{ if(down){ down=null; g.classList.remove('drag'); } });
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
