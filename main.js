/* Benjamin Toh — hero
   Layers (bottom → top): walk video · photo train · Ben cutout (PNG) · overlay
   Flow: loader → walk-in (header arrives as he settles) → he stops → cutout on →
         photo train drops in behind him, left → right → overlay (eyebrow, headline, CTAs, as featured in).
   The spin video and the BENJAMIN letters are parked for now (markup kept, never triggered). */

const q = new URLSearchParams(location.search);
const $ = id => document.getElementById(id);
const walk=$('walk'), spin=$('spin'), ben=$('ben');
const nameEl=$('name'), loader=$('loader'), header=$('header');
const works=$('works'), ring=$('ring'), stage=$('stage'), hero=$('hero'), about=$('heroOverlay');
const root=document.documentElement;
const clamp=(x,a,b)=>Math.min(b,Math.max(a,x));
const smooth=(a,b,x)=>{const t=clamp((x-a)/(b-a),0,1);return t*t*(3-2*t);};

/* ---------- phases ---------- */
let phase=0;            // 0 loading · 1 walking · 2 still (intro) · 3 spinning · 4 still (work)
const still=on=>stage.classList.toggle('still',on);

/* ---------- intro timing ----------
   Header arrives as he settles. The letters of BENJAMIN fall in one after another; the first two
   (B and E, far left of him) start just before he stops, the rest once the cutout is on so no letter
   ever lands in front of the moving video. */
const HEADER_AT=0.68;        // fraction of the walk
const STAG=90;               // ms between letters (matches the CSS delay)
const LEAD_LETTERS=2;        // letters allowed to start before he stops
const nameText=$('nameText');
const letters=[...nameText.textContent].map((ch,i)=>{const s=document.createElement('span');s.className='l';s.textContent=ch;s.style.setProperty('--i',i);return s;});
nameText.textContent=''; letters.forEach(s=>nameText.appendChild(s));
function layoutLetters(){
  const r=nameText.getBoundingClientRect();
  letters.forEach(s=>{const q=s.getBoundingClientRect();s.style.backgroundSize=r.width+'px 100%';s.style.backgroundPosition=(r.left-q.left)+'px 0';});
}
function introTick(){
  if(phase<1||phase>2) return;
  const D=walk.duration||6.04, t=walk.currentTime;
  if(!header.classList.contains('in') && t>=D*HEADER_AT) header.classList.add('in');
  if(phase===2) return;
  requestAnimationFrame(introTick);
}

function startWalk(){
  if(phase>=1) return; phase=1;
  walk.currentTime=0; walk.play().catch(()=>{});
  requestAnimationFrame(introTick);
}
const OVERLAY_DELAY=550;                        // ms after he stops before the overlay rises
function revealIntro(){
  if(phase>=4) return; phase=4;
  still(true);                                  // cutout over the final frame: identical pixels
  header.classList.add('in');
  behindStart=performance.now();                // cutout is on, so photos may pass behind him
  queueWorks();                                 // the train drops in, left → right
  setTimeout(()=>about.classList.add('in'),OVERLAY_DELAY);
}
walk.addEventListener('ended',revealIntro);

/* ---------- spin timing ----------
   Write-up fades in early (it sits beside him). The photo train starts halfway through the spin, but
   only where it is clear of his body; once he stops and the cutout is back, the photos behind him fade in. */
const ABOUT_AT=0.30;                    // fraction of the spin at which the write-up fades in
const BODY_ZONE=[0.36,0.65];            // his widest extent during the spin (measured 39–62%) plus margin
let behindStart=null;                   // when the photos behind him may start fading in
function startSpin(){
  if(phase!==2) return; phase=3;
  nameEl.classList.add('out');          // letters lift away first, behind the cutout
  const go=()=>{
    spin.currentTime=0;
    stage.classList.add('spinning');    // spin's first frame == the cutout pose
    spin.play().catch(()=>{});
    requestAnimationFrame(()=>requestAnimationFrame(()=>still(false)));
    requestAnimationFrame(spinTick);
  };
  setTimeout(()=>{ if(spin.readyState>=3) go(); else { spin.addEventListener('canplay',go,{once:true}); spin.load(); } }, 720);   // letters over him are gone by ~730ms
}
function spinTick(){
  if(phase!==3) return;
  const D=spin.duration||6.04, t=spin.currentTime;
  if(t>=D*ABOUT_AT) about.classList.add('in');
  requestAnimationFrame(spinTick);
}
function afterSpin(){
  if(phase>=4) return; phase=4;
  still(true);                          // back to the cutout: photos can now pass behind him
  about.classList.add('in'); queueWorks();
  behindStart=performance.now();
}
/* once he has stopped, the photos drop in as one smooth train, left → right */
const STAGGER=110;
function queueWorks(){
  if(works.classList.contains('in')) return;
  works.classList.add('in','live');
  const now=performance.now(), rot=ringBase+dragOffset;
  const vis=[];
  items.forEach((el,i)=>{
    const a=((i*STEP+rot)%360+360)%360, d=Math.min(a,360-a);
    if(1-smooth(86,92,d)<=0.02){ el._enterAt=now; return; }         // behind the viewer: hidden anyway
    vis.push([el,el.getBoundingClientRect().left]);
  });
  vis.sort((p,q)=>p[1]-q[1]).forEach(([el],k)=>{el._enterAt=now+120+k*STAGGER;});
}
const easeOut=u=>1-Math.pow(1-u,3);
spin.addEventListener('ended',afterSpin);

/* ---------- loader choreography ---------- */
const ready={video:false,fonts:false};
const t0=performance.now();
let loaderDone=false;
function tryFinishLoader(){
  if(loaderDone) return;
  const elapsed=performance.now()-t0;
  if(!(ready.video&&ready.fonts)||elapsed<1900){ setTimeout(tryFinishLoader,80); return; }
  loaderDone=true;
  loader.classList.add('p4');                   // logo out, panels part from the middle
  document.body.classList.add('ready');
  if(WALK_IN) setTimeout(startWalk,250);        // he starts walking as the panels open
  else setTimeout(revealIntro,250);             // 2026-11-13: no walk-in, Ben is simply there as the panels open
  setTimeout(()=>loader.classList.add('loader--gone'),1500);
}
function bootLoader(){
  setTimeout(()=>loader.classList.add('p1'),250);   // M
  setTimeout(()=>loader.classList.add('p2'),600);   // 2
  setTimeout(()=>loader.classList.add('p3'),950);   // D
  tryFinishLoader();
}
const WALK_IN=false;                            // set true to bring back the walk-in video
if(WALK_IN) walk.addEventListener('canplaythrough',()=>{ready.video=true;},{once:true});
else{ walk.removeAttribute('src'); walk.load(); const b=document.getElementById('ben'); if(b.complete) ready.video=true; else b.addEventListener('load',()=>{ready.video=true;},{once:true}); }
(document.fonts?document.fonts.ready:Promise.resolve()).then(()=>{ready.fonts=true;});
setTimeout(()=>{ready.video=true;ready.fonts=true;},7000);

/* ---------- scroll ---------- */
let progress=0;
function onScroll(){
  const track=hero.offsetHeight-innerHeight;
  progress=track>0?clamp(scrollY/track,0,1):0;
  root.style.setProperty('--p',progress.toFixed(4));
}
addEventListener('scroll',onScroll,{passive:true});

/* ---------- photo train (concave arc; the viewer stands at its centre) ---------- */
const items=[...ring.querySelectorAll('.works__item')];
const N=items.length, STEP=360/N;
let ringBase=+(q.get('rot')||0), dragOffset=0, dragVel=0, dragging=false, lastX=0;
items.forEach((el,i)=>el.style.setProperty('--a',(i*STEP)+'deg'));
function bodyZoneX(){
  const W=stage.clientWidth,H=stage.clientHeight,iw=ben.naturalWidth||1672,ih=ben.naturalHeight||941;
  const s=Math.max(W/iw,H/ih),ox=(W-iw*s)/2;
  return [ox+BODY_ZONE[0]*iw*s, ox+BODY_ZONE[1]*iw*s];
}
function tickRing(){
  requestAnimationFrame(tickRing);
  const now=performance.now();
  if(!works.classList.contains('in') && !dragging) return;
  if(!dragging){ ringBase+=0.04; dragOffset+=dragVel; dragVel*=0.94; }
  const rot=ringBase+dragOffset;                // wheel, swipe and drag all feed dragOffset/dragVel
  root.style.setProperty('--ring-rot',rot.toFixed(3)+'deg');
  const behind=behindStart===null?0:smooth(0,250,now-behindStart);   // 0 while he moves, 1 once the cutout is on
  const [bx0,bx1]=behind<1?bodyZoneX():[0,0];
  items.forEach((el,i)=>{
    const a=((i*STEP+rot)%360+360)%360;         // 0 = straight behind him
    const d=Math.min(a,360-a);
    let v=1-smooth(86,92,d);
    const ent=el._enterAt===undefined?0:smooth(0,620,now-el._enterAt);
    el.style.setProperty('--dy',((1-easeOut(ent))*-44).toFixed(1)+'px');
    v*=ent;
    if(behind<1 && v>0){
      const r=el.getBoundingClientRect();
      const gap=Math.max(bx0-r.right, r.left-bx1);                    // <0 when overlapping his body
      v*=Math.max(smooth(0,48,gap),behind);
    }
    el.style.setProperty('--vis',v.toFixed(3));
  });
}
requestAnimationFrame(tickRing);
const onDown=e=>{dragging=true;works.classList.add('dragging');lastX=(e.touches?e.touches[0].clientX:e.clientX);dragVel=0;};
const onMove=e=>{if(!dragging)return;const x=(e.touches?e.touches[0].clientX:e.clientX);const dx=x-lastX;dragOffset+=dx*0.25;dragVel=dx*0.125;lastX=x;};
const onUp=()=>{dragging=false;works.classList.remove('dragging');};
works.addEventListener('mousedown',onDown);addEventListener('mousemove',onMove);addEventListener('mouseup',onUp);
works.addEventListener('touchstart',onDown,{passive:true});addEventListener('touchmove',onMove,{passive:true});addEventListener('touchend',onUp);

/* scrolling turns the train: read the gesture itself, so it still works once the page has hit the bottom */
const MAXV=7;
const nudge=d=>{ if(phase<4||document.body.classList.contains('lifting')) return; dragVel=clamp(dragVel+d,-MAXV,MAXV); };
addEventListener('wheel',e=>{
  const d=Math.abs(e.deltaY)>=Math.abs(e.deltaX)?e.deltaY:e.deltaX;
  nudge(-d*(e.deltaMode===1?0.4:0.012));
},{passive:true});
let swipeY=null;
addEventListener('touchstart',e=>{swipeY=e.touches[0].clientY;},{passive:true});
addEventListener('touchmove',e=>{ if(swipeY===null||dragging) return; const y=e.touches[0].clientY; nudge((y-swipeY)*0.06); swipeY=y; },{passive:true});
addEventListener('touchend',()=>{swipeY=null;},{passive:true});
addEventListener('keydown',e=>{ const k={ArrowDown:-1.5,PageDown:-3,' ':-3,ArrowUp:1.5,PageUp:3,ArrowRight:-1.5,ArrowLeft:1.5}[e.key]; if(k) nudge(k); });

/* ---------- name fit ---------- */
function fitName(){
  nameText.style.setProperty('--fit',1);
  const w=nameText.getBoundingClientRect().width,max=innerWidth*0.96;
  if(w>max) nameText.style.setProperty('--fit',(max/w).toFixed(4));
  layoutLetters();
}
addEventListener('resize',fitName);
(document.fonts?document.fonts.ready:Promise.resolve()).then(fitName);
fitName();

/* ---------- mobile menu ---------- */
const menuBtn=$('menuBtn');
menuBtn.addEventListener('click',()=>{const open=header.classList.toggle('open');menuBtn.setAttribute('aria-expanded',String(open));});
document.querySelectorAll('.site-nav a').forEach(a=>a.addEventListener('click',()=>header.classList.remove('open')));

/* ---------- boot ---------- */
walk.load();
if(q.get('skip')){
  /* dev: ?skip=1 (or 2) → the settled hero: cutout, photo train and overlay already in */
  loader.classList.add('loader--gone'); document.body.classList.add('ready');
  const seekEnd=v=>{const f=()=>{v.currentTime=Math.max(0,v.duration-0.05);}; if(v.readyState>=1) f(); else v.addEventListener('loadedmetadata',f,{once:true});};
  seekEnd(walk);
  phase=4; still(true); header.classList.add('in');
  works.classList.add('in','live'); about.classList.add('in'); behindStart=-1e6; items.forEach(el=>el._enterAt=-1e6);
}else{
  scrollTo(0,0);
  bootLoader();
}
onScroll();

/* ---------- page sections: scroll reveals, header backdrop, testimonial rotation ---------- */
(function(){
  const io=new IntersectionObserver(es=>{es.forEach(e=>{if(e.isIntersecting && !document.body.classList.contains('lifting')){e.target.classList.add('in');io.unobserve(e.target);}});},{threshold:0.18,rootMargin:'0px 0px -6% 0px'});
  document.querySelectorAll('.rv').forEach(el=>io.observe(el));

  const heroEl=$('hero');
  const onHdr=()=>{header.classList.toggle('scrolled',scrollY>heroEl.offsetHeight-innerHeight*0.6);};
  addEventListener('scroll',onHdr,{passive:true}); onHdr();

  const stageEl=$('reviewsStage'); if(!stageEl) return;
  const quotes=[...stageEl.querySelectorAll('.review')], dots=$('reviewsDots');
  let cur=0, timer=null;
  quotes.forEach((q,i)=>{const b=document.createElement('button');b.type='button';b.setAttribute('role','tab');b.setAttribute('aria-label','Testimonial '+(i+1));b.addEventListener('click',()=>{show(i);restart();});dots.appendChild(b);});
  function show(i){cur=i;quotes.forEach((q,k)=>q.classList.toggle('is-on',k===i));[...dots.children].forEach((d,k)=>d.setAttribute('aria-selected',String(k===i)));}
  function restart(){clearInterval(timer);timer=setInterval(()=>show((cur+1)%quotes.length),6500);}
  show(0);
  const vis=new IntersectionObserver(es=>{es.forEach(e=>{if(e.isIntersecting) restart(); else clearInterval(timer);});},{threshold:0.3});
  vis.observe(stageEl);
})();

/* ---------- purpose statement: split into letters, stagger left → right, line by line ---------- */
(function(){
  const sec=document.getElementById('purpose'); if(!sec) return;
  const STEP=0.032, LINE_GAP=0.28;               // seconds between letters / extra lead between lines
  let t=0.25;                                    // the eyebrow shows first
  sec.querySelectorAll('.ps-line').forEach((line,li)=>{
    const lineStart=t;
    let k=0;
    [...line.childNodes].forEach(node=>{
      if(node.nodeType===3){                       // text → words (never break inside) → one span per character
        const frag=document.createDocumentFragment();
        node.textContent.replace(/\s+/g,' ').split(/( )/).forEach(part=>{
          if(part===' '){ frag.appendChild(document.createTextNode(' ')); k++; return; }
          if(!part) return;
          const w=document.createElement('span'); w.className='ps-word'; w.setAttribute('aria-hidden','true');
          for(const ch of part){
            const s=document.createElement('span'); s.className='ch'; s.textContent=ch;
            s.style.setProperty('--d',(lineStart+k*STEP).toFixed(3)+'s'); k++; w.appendChild(s);
          }
          frag.appendChild(w);
        });
        line.replaceChild(frag,node);
      }else if(node.classList&&node.classList.contains('ps-img')){
        node.style.setProperty('--d',(lineStart+k*STEP).toFixed(3)+'s'); k+=3;   // the photo grows as the line reaches it
      }
    });
    t=lineStart+k*STEP*0.55+LINE_GAP;              // next line starts before this one finishes
  });
  const mark=sec.querySelector('.purpose__mark'); if(mark) mark.style.setProperty('--d',(t+0.1).toFixed(2)+'s');
  /* fit: the widest line must sit inside the page (desktop keeps one line per row) */
  const st=sec.querySelector('.purpose__statement');
  function fit(){
    st.style.fontSize='';
    const base=parseFloat(getComputedStyle(st).fontSize), max=sec.querySelector('.purpose__inner').clientWidth*0.96;
    let widest=0; st.querySelectorAll('.ps-line').forEach(l=>{ if(getComputedStyle(l).whiteSpace==='nowrap') widest=Math.max(widest,l.scrollWidth); });
    if(widest>max) st.style.fontSize=(base*max/widest).toFixed(2)+'px';
  }
  addEventListener('resize',fit); (document.fonts?document.fonts.ready:Promise.resolve()).then(fit); fit();

  /* play once: after the hero has lifted away, or when reached by normal scrolling */
  window.startPurpose=()=>sec.classList.add('in');
  const io=new IntersectionObserver(es=>{es.forEach(e=>{
    if(e.isIntersecting && !document.body.classList.contains('lifting')){sec.classList.add('in');io.disconnect();}
  });},{threshold:0.35});
  io.observe(sec);
})();

/* ---------- hero lift: the first scroll from the top lifts the whole hero away, revealing the next section
   underneath (reference: motionsites "Tana Elephant Sections"); scrolling up at the very top brings it back ---------- */
(function(){
  const HERO_LIFT=false;                               // 2026-11-13: user wants plain scrolling after the hero, so the lift is off
  const heroEl=document.getElementById('hero'), next=document.getElementById('ventures');   // the section revealed underneath
  if(!HERO_LIFT||!heroEl||!next) return;
  const reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
  const DUR=1000;
  let state='down', busy=false, touchY=null;           // 'down' = hero on screen · 'up' = lifted away
  const ready=()=>document.body.classList.contains('ready') && phase>=4;
  function lift(){
    if(busy||state!=='down'||scrollY>8||!ready()) return false;
    busy=true; document.body.classList.add('lifting');
    heroEl.classList.add('is-fixed');                  // hero leaves the flow → the next section is now at the top, underneath
    scrollTo(0,0);
    void heroEl.offsetHeight;
    heroEl.classList.add('is-up');                     // ease-in slide up, fading and blurring at the end
    setTimeout(()=>{
      heroEl.classList.add('is-gone'); state='up'; busy=false;
      document.body.classList.remove('lifting');
      header.classList.add('scrolled');
      setTimeout(()=>{                              // now let the revealed section assemble
        next.querySelectorAll('.rv').forEach((el,i)=>setTimeout(()=>el.classList.add('in'),i*110));
      },120);
    }, reduce?0:DUR);
    return true;
  }
  function drop(){
    if(busy||state!=='up'||scrollY>2) return false;
    busy=true; document.body.classList.add('lifting');
    heroEl.classList.remove('is-gone');
    heroEl.classList.add('is-dropping');               // decelerating curve on the way back
    void heroEl.offsetHeight;
    heroEl.classList.remove('is-up');                  // slide back down
    setTimeout(()=>{
      heroEl.classList.remove('is-fixed','is-dropping'); scrollTo(0,0);   // back in the flow, page at the top
      state='down'; busy=false; document.body.classList.remove('lifting');
      header.classList.remove('scrolled');
    }, reduce?0:DUR+60);
    return true;
  }
  addEventListener('wheel',e=>{
    if(busy){ e.preventDefault(); return; }
    if(e.deltaY>2 && state==='down' && scrollY<=8 && ready()){ e.preventDefault(); lift(); }
    else if(e.deltaY<-2 && state==='up' && scrollY<=2){ e.preventDefault(); drop(); }
  },{passive:false});
  addEventListener('touchstart',e=>{touchY=e.touches[0].clientY;},{passive:true});
  addEventListener('touchmove',e=>{
    if(touchY===null) return;
    const dy=touchY-e.touches[0].clientY;
    if(busy){ e.preventDefault(); return; }
    if(dy>24 && state==='down' && scrollY<=8 && ready()){ e.preventDefault(); touchY=null; lift(); }
    else if(dy<-24 && state==='up' && scrollY<=2){ e.preventDefault(); touchY=null; drop(); }
  },{passive:false});
  addEventListener('keydown',e=>{
    const down=['ArrowDown','PageDown',' ','Spacebar'].includes(e.key), up=['ArrowUp','PageUp'].includes(e.key);
    if(busy&&(down||up)){ e.preventDefault(); return; }
    if(down && lift()) e.preventDefault();
    else if(up && drop()) e.preventDefault();
  });
  window.liftHero=lift; window.dropHero=drop;          // for testing
})();

/* ---------- shop: product row arrows ---------- */
(function(){
  const track=document.getElementById('productsTrack'); if(!track) return;
  const prev=document.getElementById('shopPrev'), next=document.getElementById('shopNext');
  const step=()=>{const c=track.querySelector('.pcard'); return c? c.getBoundingClientRect().width+parseFloat(getComputedStyle(track).columnGap||14):300;};
  const sync=()=>{ prev.disabled=track.scrollLeft<4; next.disabled=track.scrollLeft+track.clientWidth>=track.scrollWidth-4; };
  prev.addEventListener('click',()=>track.scrollBy({left:-step(),behavior:'smooth'}));
  next.addEventListener('click',()=>track.scrollBy({left:step(),behavior:'smooth'}));
  track.addEventListener('scroll',sync,{passive:true}); addEventListener('resize',sync); sync();
})();

/* ---------- services: one card per scroll (left, top, right), smoothed ---------- */
(function(){
  const track=document.getElementById('svcTrack'); if(!track) return;
  const cards=[...track.querySelectorAll('.svc')];
  const seg=(a,b,x)=>Math.min(1,Math.max(0,(x-a)/(b-a)));
  const ease=u=>1-Math.pow(1-u,3);
  const RANGES=[[0.03,0.31],[0.34,0.62],[0.65,0.93]];
  const cur=cards.map(()=>0);
  const reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
  function targets(){
    const vh=innerHeight;
    if(innerWidth<=900){                                   // stacked: each card comes in as it reaches the viewport
      const base=track.closest('section').getBoundingClientRect().top;   // cards' offsetParent is the section
      return cards.map(c=>seg(vh*0.98, vh*0.6, base+c.offsetTop));
    }
    const r=track.getBoundingClientRect(), span=r.height-vh;
    const p=span>0?seg(0,span,-r.top):1;
    return RANGES.map(([a,b])=>seg(a,b,p));
  }
  function tick(){
    requestAnimationFrame(tick);
    if(reduce) return;
    if(document.body.classList.contains('lifting')) return;
    const t=targets();
    cards.forEach((c,i)=>{
      cur[i]+=(t[i]-cur[i])*0.12;
      if(Math.abs(t[i]-cur[i])<0.0005) cur[i]=t[i];
      c.style.setProperty('--t',ease(cur[i]).toFixed(4));
    });
  }
  requestAnimationFrame(tick);
})();

/* ---------- ebook signup ---------- */
(function(){
  const form=document.getElementById('ebookForm'); if(!form) return;
  const msg=document.getElementById('ebookMsg');
  form.addEventListener('submit',async e=>{
    e.preventDefault();
    const f=form.elements, bad=[];
    const mark=(el,ok)=>{el.closest('.field').classList.toggle('is-bad',!ok); if(!ok) bad.push(el);};
    mark(f.name, f.name.value.trim().length>1);
    mark(f.house, !!f.house.value);
    mark(f.email, /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(f.email.value.trim()));
    if(bad.length){ msg.className='ebook__msg is-bad'; msg.textContent='Please fill in the highlighted fields.'; bad[0].focus(); return; }
    if(f.company.value) return;                               // honeypot: bots fill hidden fields
    const data={name:f.name.value.trim(),house:f.house.value,email:f.email.value.trim()};
    const endpoint=form.dataset.endpoint;                     // set this to the mailing-list / form service URL
    try{
      if(endpoint){ const r=await fetch(endpoint,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(data)}); if(!r.ok) throw new Error(r.status); }
      msg.className='ebook__msg is-ok';
      msg.textContent=endpoint
        ? 'Thank you, '+data.name.split(' ')[0]+'. The ebook is on its way to '+data.email+'.'
        : 'Thank you, '+data.name.split(' ')[0]+'. Ebook delivery will be switched on once the mailing service is connected.';
      form.reset();
    }catch(err){ msg.className='ebook__msg is-bad'; msg.textContent='Sorry, that did not go through. Please try again or email bentohjj@gmail.com.'; }
  });
})();

/* ---------- inside the piece: scroll takes the console apart; each label sits beside its part with a straight leader ---------- */
(function(){
  const track=document.getElementById('exTrack'); if(!track) return;
  const stage=document.getElementById('exStage'), svg=document.getElementById('exLeaders');
  const copyEl=stage.querySelector('.ex__copy');
  const labels=[...document.querySelectorAll('#exLabels li')];
  const parts={}; document.querySelectorAll('.ex__part').forEach(p=>parts[p.dataset.part]=p);
  const seg=(a,b,x)=>Math.min(1,Math.max(0,(x-a)/(b-a)));
  const io=u=>u<.5?4*u*u*u:1-Math.pow(-2*u+2,3)/2;
  const NS='http://www.w3.org/2000/svg';
  const lines=labels.map(()=>{const p=document.createElementNS(NS,'path'),c=document.createElementNS(NS,'circle');c.setAttribute('r','4.5');svg.appendChild(p);svg.appendChild(c);return {p,c};});
  let cur=0, last=-1, lastW=0;
  function tick(){
    requestAnimationFrame(tick);
    const r=track.getBoundingClientRect(), span=r.height-innerHeight;
    if(r.bottom<-50||r.top>innerHeight+50) return;                   // off screen
    const target=span>0?seg(0,span,-r.top):0;
    cur+=(target-cur)*0.1; if(Math.abs(target-cur)<0.0004) cur=target;
    if(Math.abs(cur-last)<0.0002&&lastW===innerWidth) return; last=cur; lastW=innerWidth;
    const copy=io(seg(0.12,0.3,cur)), move=io(seg(0.16,0.4,cur)), e=io(seg(0.32,0.7,cur));
    stage.style.setProperty('--copy',copy.toFixed(4));
    stage.style.setProperty('--move',move.toFixed(4));
    stage.style.setProperty('--e',e.toFixed(4));
    copyEl.style.pointerEvents=copy>0.6?'none':'auto';
    const desktop=innerWidth>900, sr=stage.getBoundingClientRect();
    const rects=labels.map(li=>parts[li.dataset.for].getBoundingClientRect());
    const gap=Math.max(34,Math.min(64,innerWidth*0.04));
    const L=Math.min(...rects.map(q=>q.left))-sr.left, R=Math.max(...rects.map(q=>q.right))-sr.left;
    labels.forEach((li,i)=>{
      const l=io(seg(0.5+i*0.07,0.66+i*0.07,cur));
      li.style.setProperty('--l',l.toFixed(3));
      const {p,c}=lines[i];
      if(!desktop){ li.style.left=''; li.style.top=''; p.style.opacity=0; c.style.opacity=0; return; }
      const pr=rects[i], left=li.dataset.side==='left', w=li.offsetWidth;
      const cy=pr.top-sr.top+pr.height/2;
      const x=left?Math.max(16,L-gap-w):Math.min(sr.width-w-16,R+gap);
      li.style.left=x.toFixed(1)+'px'; li.style.top=(cy-14).toFixed(1)+'px';
      const ax=left?pr.left-sr.left+pr.width*0.07:pr.right-sr.left-pr.width*0.07;
      const bx=left?x+w+12:x-12;
      p.setAttribute('d',`M${ax.toFixed(1)} ${cy.toFixed(1)} L${bx.toFixed(1)} ${cy.toFixed(1)}`);
      c.setAttribute('cx',ax.toFixed(1)); c.setAttribute('cy',cy.toFixed(1));
      p.style.opacity=(l*0.75).toFixed(2); c.style.opacity=l.toFixed(2);
    });
  }
  requestAnimationFrame(tick);
})();

/* ---------- achievements: framed award photos land on the quote one per scroll, then fan into a row ---------- */
(function(){
  const track=document.getElementById('winsTrack'); if(!track) return;
  const stage=track.querySelector('.wins__stage'), wrap=document.getElementById('winsCards');
  const cards=[...track.querySelectorAll('.win')];
  const seg=(a,b,x)=>Math.min(1,Math.max(0,(x-a)/(b-a)));
  const out=u=>1-Math.pow(1-u,3), io=u=>u<.5?4*u*u*u:1-Math.pow(-2*u+2,3)/2;
  const IN=[[0.08,0.28],[0.27,0.47],[0.46,0.66]], FAN=[0.71,0.93];
  const cur=cards.map(()=>0); let fan=0;
  if(matchMedia('(prefers-reduced-motion: reduce)').matches) return;        // CSS shows the finished row
  function tick(){
    requestAnimationFrame(tick);
    if(document.body.classList.contains('lifting')) return;
    const r=track.getBoundingClientRect(), vh=innerHeight;
    if(r.bottom<-80||r.top>vh+80) return;                                  // off screen
    let tIn, tFan;
    if(innerWidth<=900){
      const base=wrap.getBoundingClientRect().top;                         // cards are laid out in a column here
      tIn=cards.map(c=>seg(vh*0.98,vh*0.62,base+c.offsetTop)); tFan=0;
    }else{
      const span=r.height-vh, p=span>0?seg(0,span,-r.top):1;
      tIn=IN.map(([a,b])=>seg(a,b,p)); tFan=seg(FAN[0],FAN[1],p);
    }
    cards.forEach((c,i)=>{ cur[i]+=(tIn[i]-cur[i])*0.11; if(Math.abs(tIn[i]-cur[i])<0.0005) cur[i]=tIn[i]; c.style.setProperty('--in',out(cur[i]).toFixed(4)); });
    fan+=(tFan-fan)*0.11; if(Math.abs(tFan-fan)<0.0005) fan=tFan;
    stage.style.setProperty('--fan',io(fan).toFixed(4));
  }
  requestAnimationFrame(tick);
})();

/* ---------- coffee table set: scroll scrubs the curved walk-in to the table, then labels and the spec sheet ---------- */
(function(){
  const track=document.getElementById('ctTrack'); if(!track) return;
  const stage=document.getElementById('ctStage'), video=document.getElementById('ctVideo'), frame=document.getElementById('ctFrame');
  const svg=document.getElementById('ctLeaders'), copyEl=stage.querySelector('.ct__copy');
  const labels=[...document.querySelectorAll('#ctLabels li')];
  const SW=1912, SH=1080;                               // label points are in source-video pixels
  const seg=(a,b,x)=>Math.min(1,Math.max(0,(x-a)/(b-a)));
  const io=u=>u<.5?4*u*u*u:1-Math.pow(-2*u+2,3)/2;
  const back=u=>{const c1=1.6,c3=c1+1;return 1+c3*Math.pow(u-1,3)+c1*Math.pow(u-1,2);};   // ease out with a small overshoot
  const cards=[...document.querySelectorAll('#ctShop .ct__card')];
  const reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
  const NS='http://www.w3.org/2000/svg';
  const lines=labels.map(()=>{const p=document.createElementNS(NS,'path'),c=document.createElementNS(NS,'circle');c.setAttribute('r','5');svg.appendChild(p);svg.appendChild(c);return {p,c};});
  let cur=0, last=-1, lastW=0, unlocked=false, loading=false;
  function tick(){
    requestAnimationFrame(tick);
    if(document.body.classList.contains('lifting')) return;
    const r=track.getBoundingClientRect(), span=r.height-innerHeight;
    if(!loading&&r.top<innerHeight*2.5){                              // fetch the whole clip once so it can be scrubbed on any server
      loading=true;
      const big=innerWidth*(devicePixelRatio||1)>2200&&innerWidth>900;          // 4K for large / retina screens, 1080p for phones
      const url=big&&video.dataset.srcBig?video.dataset.srcBig:video.dataset.src;
      fetch(url).then(x=>x.blob()).then(b=>{ video.src=URL.createObjectURL(b); video.load(); }).catch(()=>{ video.preload='auto'; video.src=url; video.load(); });   // file:// pages can't fetch; load it directly
    }
    if(r.bottom<-50||r.top>innerHeight+50) return;                    // off screen
    if(!unlocked&&video.readyState>=1){ unlocked=true; const pr=video.play(); if(pr&&pr.then) pr.then(()=>video.pause()).catch(()=>{}); else video.pause(); }
    const target=span>0?seg(0,span,-r.top)*0.88:0;                   // the scene now ends on the pieces (spec sheet removed)
    cur=reduce?target:cur+(target-cur)*0.12; if(Math.abs(target-cur)<0.0004) cur=target;
    // scrub the video toward where the scroll says it should be (one seek at a time)
    const D=video.duration;
    if(D&&!video.seeking){ const want=seg(0.05,0.46,cur)*(D-0.04); if(Math.abs(video.currentTime-want)>0.02){ video.pause(); video.currentTime=want; } }
    if(Math.abs(cur-last)<0.0002&&lastW===innerWidth) return; last=cur; lastW=innerWidth;
    const copy=innerWidth>900?io(seg(0.04,0.13,cur)):io(seg(0.38,0.46,cur)), hide=io(seg(0.62,0.66,cur)), sheet=io(seg(0.88,0.97,cur));
    const prodOut=0, prod=io(seg(0.64,0.69,cur))*(1-prodOut);
    stage.style.setProperty('--copy',copy.toFixed(4));
    stage.style.setProperty('--dimsv',(io(seg(0.54,0.6,cur))*(1-hide)).toFixed(4));
    stage.style.setProperty('--prod',prod.toFixed(4));
    stage.classList.toggle('prod-on',prod>0.5);
    stage.style.setProperty('--sheet',sheet.toFixed(4));
    stage.classList.toggle('sheet-on',sheet>0.001);
    copyEl.style.pointerEvents=copy>0.6?'none':'auto';
    const desktop=innerWidth>900, fr=frame.getBoundingClientRect(), sr=stage.getBoundingClientRect();
    const s=Math.max(fr.width/SW,fr.height/SH), ox=fr.left-sr.left+(fr.width-SW*s)/2, oy=fr.top-sr.top+(fr.height-SH*s)/2;
    const pts=labels.map(li=>({x:ox+(+li.dataset.x)*s, y:oy+(+li.dataset.y)*s}));
    const gap=Math.max(40,Math.min(90,innerWidth*0.055));
    const L=Math.min(...pts.filter((p,i)=>labels[i].dataset.side==='left').map(p=>p.x));
    const R=Math.max(...pts.filter((p,i)=>labels[i].dataset.side==='right').map(p=>p.x));
    labels.forEach((li,i)=>{
      const u=seg(0.47+i*0.03,0.54+i*0.03,cur), l=Math.min(1,u*1.6)*(1-hide);
      li.style.setProperty('--l',l.toFixed(3)); li.style.setProperty('--ls',(back(u)*(1-hide*0.3)).toFixed(4));
      const {p,c}=lines[i];
      if(!desktop){ li.style.left=''; li.style.top=''; p.style.opacity=0; c.style.opacity=0; return; }
      const pt=pts[i], left=li.dataset.side==='left', w=li.offsetWidth, h=li.offsetHeight;
      const x=left?Math.max(16,L-gap-w):Math.min(sr.width-w-16,R+gap);
      li.style.left=x.toFixed(1)+'px'; li.style.top=(pt.y-h/2).toFixed(1)+'px';
      const bx=left?x+w:x;
      p.setAttribute('d',`M${pt.x.toFixed(1)} ${pt.y.toFixed(1)} L${bx.toFixed(1)} ${pt.y.toFixed(1)}`);
      c.setAttribute('cx',pt.x.toFixed(1)); c.setAttribute('cy',pt.y.toFixed(1));
      p.style.opacity=(l*0.8).toFixed(2); c.style.opacity=l.toFixed(2);
    });
    // the other pieces pop out of the table, one after another (offsets ignore transforms, so the start point stays put)
    const tx=ox+1000*s, ty=oy+700*s;                                     // centre of the table in the last frame
    cards.forEach((c,i)=>{
      const u=seg(0.66+i*0.035,0.75+i*0.035,cur), pv=back(u)*(1-prodOut);
      let x=0,y=0,el=c; while(el&&el!==stage){ x+=el.offsetLeft; y+=el.offsetTop; el=el.offsetParent; }
      c.style.setProperty('--dx',(tx-(x+c.offsetWidth/2)).toFixed(1)+'px');
      c.style.setProperty('--dy',(ty-(y+c.offsetHeight/2)).toFixed(1)+'px');
      c.style.setProperty('--p',pv.toFixed(4));
      c.style.setProperty('--o',(Math.min(1,u*2.2)*(1-prodOut)).toFixed(3));
    });
  }
  requestAnimationFrame(tick);
})();

/* ---------- say + instagram: copy the frames once so the strip loops with no gap; speed follows its width ---------- */
(function(){
  const row=document.getElementById('sayRow'); if(!row) return;
  [...row.children].forEach(a=>{const c=a.cloneNode(true); c.setAttribute('aria-hidden','true'); c.tabIndex=-1; row.appendChild(c);});
  const set=()=>row.style.setProperty('--dur',Math.max(30,(row.scrollWidth/2)/45).toFixed(1)+'s');   // about 45 px a second
  set(); addEventListener('resize',set);
})();

/* ---------- say + instagram sequence (no pinning):
   1) the quote's words light up one by one as it scrolls up the screen, then the name and the button
   2) the frames stay out until the giant handle at the bottom is on screen, then sweep in
   3) only after they land does "Follow @bentohinteriors on Instagram" appear ---------- */
(function(){
  const sec=document.getElementById('say'); if(!sec) return;
  const quote=sec.querySelector('#sayQuote'), ig=sec.querySelector('.say__ig'), bg=sec.querySelector('.say__bg');
  if(matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  // wrap every word (keeping the bronze <em> words) in a span
  const words=[];
  const split=(node,into)=>{
    [...node.childNodes].forEach(n=>{
      if(n.nodeType===3){ n.textContent.split(/(\s+)/).forEach(t=>{ if(!t) return; if(/^\s+$/.test(t)){ into.appendChild(document.createTextNode(t)); return; }
        const w=document.createElement('span'); w.className='say__w'; w.textContent=t; into.appendChild(w); words.push(w); }); }
      else{ const c=n.cloneNode(false); into.appendChild(c); split(n,c); }
    });
  };
  const frag=document.createDocumentFragment(); split(quote,frag); quote.textContent=''; quote.appendChild(frag);
  sec.classList.add('say--seq','say--wait');
  let cur=0, last=-1;
  function tick(){
    requestAnimationFrame(tick);
    const r=quote.getBoundingClientRect(), vh=innerHeight;
    if(r.bottom<-200||r.top>vh+200) return;
    const target=Math.min(1,Math.max(0,(vh*0.9-r.top)/(vh*0.9-vh*0.32)));   // all words lit by the time the quote is about a third down the screen
    cur+=(target-cur)*0.14; if(Math.abs(target-cur)<0.0005) cur=target;
    if(Math.abs(cur-last)<0.0003) return; last=cur;
    const n=words.length, x=cur*(n+1.5);
    words.forEach((w,i)=>w.style.setProperty('--w',Math.min(1,Math.max(0,x-i)).toFixed(3)));
    sec.style.setProperty('--after',Math.min(1,Math.max(0,(x-n)/1.5)).toFixed(3));   // name, then button, once the last word is in
  }
  requestAnimationFrame(tick);
  if(!('IntersectionObserver' in window)){ sec.classList.add('say--in','say--follow'); return; }
  const io=new IntersectionObserver(es=>{ es.forEach(e=>{ if(e.isIntersecting){
    sec.classList.add('say--in'); io.disconnect();
    setTimeout(()=>sec.classList.add('say--follow'),1500);              // after the frames have landed
  } }); },{threshold:0.4});
  io.observe(bg);
})();

/* ---------- ebook book (v6, 2026-11-13): slides down onto the table when the section comes in,
   then each press opens the cover / turns the page / closes it again. No scroll driving. ---------- */
(function(){
  const book=document.getElementById('book'); if(!book) return;
  const sec=document.getElementById('ebook'), btn=document.getElementById('bookNext');
  const leaves=[...book.querySelectorAll('.book__leaf')], n=leaves.length;
  const vid=document.getElementById('bookVideo');
  const seg=(a,b,x)=>Math.min(1,Math.max(0,(x-a)/(b-a)));
  const io=u=>u<.5?4*u*u*u:1-Math.pow(-2*u+2,3)/2;
  const reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
  const LABELS=['Open the book','Next page','Close the book'];
  let state=0, cur=0, vidOn=false;
  // slide down onto the table once
  if('IntersectionObserver' in window && !reduce){
    sec.classList.add('ebook--wait');
    const ob=new IntersectionObserver(es=>{ if(es.some(e=>e.isIntersecting)){ sec.classList.add('ebook--in'); ob.disconnect(); } },{threshold:0.25});
    ob.observe(sec);                                                         // watch the section: the book itself starts off-screen
  }
  function next(){
    state=(state+1)%(n+1);
    if(btn) btn.querySelector('span').textContent=LABELS[state];
  }
  book.addEventListener('click',next);
  book.tabIndex=0; book.addEventListener('keydown',e=>{ if(e.key==='Enter'||e.key===' '){ e.preventDefault(); next(); } });
  if(btn) btn.addEventListener('click',next);
  function paint(){
    leaves.forEach((lf,i)=>{
      const f=io(seg(i/n,(i+1)/n,cur));
      lf.style.setProperty('--f',f.toFixed(4));
      lf.style.setProperty('--lift',(Math.sin(f*Math.PI)*24).toFixed(2));
      lf.style.zIndex=f<0.5?10+(n-i):10+i;
    });
    book.style.setProperty('--open',io(seg(0,1/n*0.85,cur)).toFixed(4));
    if(vid){
      const f0=+leaves[0].style.getPropertyValue('--f'), f1=leaves[1]?+leaves[1].style.getPropertyValue('--f'):0;
      const show=f0>0.5&&f1<0.5;
      if(show!==vidOn){ vidOn=show; if(show){ const p=vid.play(); if(p&&p.catch) p.catch(()=>{}); } else vid.pause(); }
    }
  }
  function tick(){
    requestAnimationFrame(tick);
    const target=state/n;
    if(Math.abs(target-cur)<0.0005){ if(cur!==target){ cur=target; paint(); } return; }
    cur+=(target-cur)*(reduce?1:0.075); paint();
  }
  paint(); requestAnimationFrame(tick);
})();

/* ---------- ebook sign-up pop-up ---------- */
(function(){
  const dlg=document.getElementById('ebookModal'), open=document.getElementById('ebookOpen'); if(!dlg||!open) return;
  const show=()=>{ if(dlg.showModal) dlg.showModal(); else dlg.setAttribute('open',''); const f=dlg.querySelector('input[name=name]'); if(f) setTimeout(()=>f.focus(),60); };
  const hide=()=>{ if(dlg.close) dlg.close(); else dlg.removeAttribute('open'); };
  open.addEventListener('click',show);
  document.getElementById('ebookClose').addEventListener('click',hide);
  dlg.addEventListener('click',e=>{ const r=dlg.getBoundingClientRect(); if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom) hide(); });   // click outside closes
  document.querySelectorAll('a[href="#ebook"]').forEach(a=>a.addEventListener('click',e=>{ e.preventDefault(); show(); }));   // "Get the free ebook" links open it too
})();
