/* Benjamin Toh — v2 (2026-11-19): black and white revamp. No pinned scrolling anywhere. */
(function(){
  const $=id=>document.getElementById(id), $$=(s,r=document)=>[...r.querySelectorAll(s)];
  const reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
  const clamp=(x,a,b)=>Math.min(b,Math.max(a,x));
  const body=document.body;

  /* ---------- giant words sized to the screen width (measured on an inline wrapper, so transforms don't matter) ---------- */
  function wrapFit(el){
    let w=el.querySelector(':scope > .fitw');
    if(!w){ w=document.createElement('span'); w.className='fitw'; while(el.firstChild) w.appendChild(el.firstChild); el.appendChild(w); }
    return w;
  }
  function fit(){
    $$('[data-fit]').forEach(el=>{
      const w=wrapFit(el);
      el.style.fontSize='100px';
      const tw=w.offsetWidth||1, target=document.documentElement.clientWidth*(+el.dataset.fit||1);
      el.style.fontSize=(100*target/tw).toFixed(2)+'px';
    });
    if(typeof layoutHero==='function'&&hero) layoutHero();
  }

  /* ---------- hero: split the giant word into letters and the headline into characters ---------- */
  const hero=$('hero'), board=$('heroBoard'), hw=$('heroWord'), h1=$('heroTitle');
  const letters=[], chars=[];
  if(hw){
    const t=hw.textContent.trim(); hw.textContent='';
    const wrap=document.createElement('span'); wrap.className='fitw'; hw.appendChild(wrap);
    [...t].forEach(ch=>{ const s=document.createElement('span'); s.className='ch'; s.textContent=ch; wrap.appendChild(s); letters.push(s); });
  }
  if(h1){
    const t=h1.textContent.trim().split(/\s+/), br=+h1.dataset.br||t.length; h1.textContent='';
    let line=null;
    t.forEach((word,i)=>{
      if(i===0||i===br){ if(i) h1.appendChild(document.createTextNode(' ')); line=document.createElement('span'); line.className='tl'; h1.appendChild(line); }
      const w=document.createElement('span'); w.className='tw';
      [...word].forEach(ch=>{ const s=document.createElement('span'); s.className='tc'; s.textContent=ch; w.appendChild(s); chars.push(s); });
      if(line.childNodes.length) line.appendChild(document.createTextNode(' '));
      line.appendChild(w);
    });
  }
  /* desktop hero layout: the headline block and the logo row live in the free space either side of Ben,
     so words never touch him; the headline is sized to fit that space in two lines */
  function layoutHero(){
    const left=$('heroLeft'), right=$('heroRight'), benEl=$('heroBen');
    if(!left||!right||!benEl||!h1) return;
    if(innerWidth<=900){
      left.style.maxWidth=''; left.style.top=''; left.style.bottom=''; right.style.width=''; right.style.top=''; right.style.bottom=''; right.style.left=''; right.style.right=''; h1.style.fontSize='';
      hero.classList.remove('hero--tight','hero--nolead'); return;
    }
    const pad=parseFloat(getComputedStyle(left).left)||40;
    const ratio=(benEl.naturalWidth&&benEl.naturalHeight)?benEl.naturalWidth/benEl.naturalHeight:0.8;
    const bw=benEl.offsetHeight*ratio;                                    // width of the cut-out as drawn
    // Ben stands on the right; the words and the logos share the space to his left (user, 2026-11-19)
    const benL=benEl.offsetLeft||(innerWidth-bw-pad);                        // where Ben actually starts (he is set in from the right edge)
    const colW=Math.round(Math.min(560,Math.max(240,benL-pad-40)));
    left.style.maxWidth=colW+'px'; right.style.width=colW+'px';
    hero.classList.toggle('hero--tight',colW<400);
    h1.style.fontSize='100px';
    const lineW=Math.max(...[...h1.querySelectorAll('.tl')].map(l=>l.offsetWidth),1);
    h1.style.fontSize=Math.min(50,Math.max(16,100*colW/lineW)).toFixed(1)+'px';
    // the words and logos stack on the left and sit in the middle of the screen height,
    // over the left of the faint giant name when needed, so the logos never fall off the bottom (user, 2026-11-19)
    left.style.bottom='auto'; right.style.left=pad+'px'; right.style.right='auto'; right.style.bottom='auto';
    const gap=Math.round(clamp(innerHeight*0.05,22,52));
    const hdH=(document.getElementById('hd')||{offsetHeight:70}).offsetHeight;
    const place=()=>{
      const total=left.offsetHeight+gap+right.offsetHeight, H=hero.offsetHeight;
      const top=Math.round(Math.max(hdH+20,(H-total)/2+H*0.04));
      left.style.top=top+'px'; right.style.top=(top+left.offsetHeight+gap)+'px';
      return top+total<=H-24;
    };
    hero.classList.remove('hero--nolead');
    if(!place()){ hero.classList.add('hero--nolead'); place(); }
  }
  fit(); addEventListener('resize',fit);
  if($('heroBen')&&!$('heroBen').complete) $('heroBen').addEventListener('load',fit);

  /* ---------- hero entrance: the page is "designed" in front of you (reference: user's second reel).
     Dark canvas with cursors → the artboard appears → the name is typed inside a selection box →
     the photo sharpens as it is dragged into place → the headline is typed → everything locks in. ---------- */
  const skip=new URLSearchParams(location.search).get('skip')||window.__shut||location.hash.length>1;
  function showAll(){
    letters.forEach(s=>s.classList.add('on')); chars.forEach(s=>s.classList.add('on'));
    hero.classList.add('s-ben','s-left','s-lead','s-right');
    body.classList.remove('loading','building','b0'); body.classList.add('ready');
  }
  function intro(){
    // Build on a white, full-size screen (user): 1 the name BENJAMIN types in first, with one cursor.
    // 2 Then every cursor comes out at once and they build the rest together: header, portrait, headline, featured logos.
    // 3 Guides fade and the cursors leave.
    const canvas=$('heroCanvas'), curs=$$('.hc',canvas), ben=$('heroBen'), hdEl=$('hd');
    const later=(ms,fn)=>setTimeout(fn,ms);
    const sels=[];
    function box(parent,x,y,w,h,name,fixed,mini){
      const d=document.createElement('div'); d.className='sel'+(fixed?' sel--fixed':'')+(mini?' sel--mini':'');
      d.style.left=x+'px'; d.style.top=y+'px'; d.style.width=w+'px'; d.style.height=h+'px';
      d.innerHTML='<i></i><i></i><i></i><i></i><b>'+(mini?name:name+' · '+Math.round(w)+' × '+Math.round(h))+'</b>';
      parent.appendChild(d); sels.push(d); requestAnimationFrame(()=>d.classList.add('on'));
    }
    function sel(el,name){
      const b=board.getBoundingClientRect(), r=el.getBoundingClientRect();
      box(board,r.left-b.left,r.top-b.top,r.width,r.height,name);
      return r;
    }
    const moveCur=(i,x,y)=>{ const c=curs[i]; if(c){ c.style.left=x+'px'; c.style.top=y+'px'; } };
    function type(list,step,done){
      let i=0;
      const t=setInterval(()=>{
        if(i>0) list[i-1].classList.remove('caret');
        if(i>=list.length){ clearInterval(t); if(done) done(); return; }
        list[i].classList.add('on','caret'); i++;
      },step);
    }
    const W=innerWidth, H=innerHeight;
    canvas.classList.add('on');
    later(250,()=>{ const r=sel(hw.querySelector('.fitw'),'Name'); moveCur(0,r.left+r.width*0.5,r.bottom+10); type(letters,95); });     // 1 the name
    later(1400,()=>{                                                                                                                      // 2 everyone builds at once
      hero.classList.add('s-ben','s-left','s-right'); body.classList.add('hd-on');
      const hh=hdEl.offsetHeight, items=[[hdEl.querySelector('.hd__logo'),'Logo']];
      if(getComputedStyle($('hdMenu')).display!=='none') items.push([$('hdMenu'),'Menu']);
      else{ $$('.hd__nav a:not(.hd__navcta)',hdEl).forEach(l=>items.push([l,l.textContent.trim()])); items.push([hdEl.querySelector('.hd__cta'),'Contact']); }
      later(380,()=>{ const hy=hdEl.getBoundingClientRect().top;                       // the header has slid in by now
        items.forEach(([el,name],i)=>{ if(!el) return; const r=el.getBoundingClientRect(), px=el.classList.contains('b')?4:7;
          later(i*70,()=>box(body,r.left-px,r.top-hy-px+1,r.width+px*2,r.height+px*2-2,name,true,true)); }); });
      moveCur(4,W*0.62,hh+10);
      const rp=sel(ben,'Portrait'); moveCur(1,rp.right+8,rp.top+rp.height*0.3);
      const rh=sel($('heroLeft'),'Headline'); moveCur(2,rh.right+10,rh.top+rh.height*0.3);
      const rt=$('heroRight'); if(rt.offsetParent){ const rf=sel(rt,'Featured'); moveCur(3,rf.left-26,rf.top+rf.height*0.5); }
      type(chars,16,()=>hero.classList.add('s-lead'));
    });
    later(3300,()=>{                                                                                                                      // 3 lock in
      sels.forEach(d=>d.classList.remove('on')); canvas.classList.add('out');
      moveCur(0,-90,H*0.3); moveCur(1,W+90,H*0.2); moveCur(2,-90,H*0.85); moveCur(3,W+90,H*0.8); moveCur(4,W*0.5,-90);
      hero.classList.add('s-lead'); letters.forEach(s=>s.classList.remove('caret')); chars.forEach(s=>s.classList.remove('caret'));
      body.classList.remove('building','loading','hd-on'); body.classList.add('ready');
    });
    later(4500,()=>{ sels.forEach(d=>d.remove()); canvas.style.display='none'; });
  }
  if(skip||reduce||!hero) showAll();
  else{
    body.classList.add('loading','building');
    const go=()=>{ fit(); if(scrollY>60){ showAll(); return; } requestAnimationFrame(intro); };   // refreshed part-way down: no entrance
    let started=false; const once=()=>{ if(!started){ started=true; go(); } };
    if(document.fonts&&document.fonts.ready) document.fonts.ready.then(once);
    setTimeout(once,1400);                                                                // don't wait for fonts for ever
  }
  if(document.fonts&&document.fonts.ready) document.fonts.ready.then(fit);

  /* ---------- reveal on enter ---------- */
  if('IntersectionObserver' in window&&!reduce){
    const io=new IntersectionObserver(es=>es.forEach(e=>{ if(e.isIntersecting){ e.target.classList.add('in'); io.unobserve(e.target); } }),{threshold:0.14,rootMargin:'0px 0px -6% 0px'});
    $$('[data-rv]').forEach(el=>{
      const sib=[...el.parentElement.children].filter(c=>c.hasAttribute('data-rv')).indexOf(el);
      el.style.transitionDelay=(Math.max(0,sib)*0.07)+'s'; io.observe(el);
    });
  }else $$('[data-rv]').forEach(el=>el.classList.add('in'));

  /* ---------- statement: split into words ---------- */
  const st=$('stateText'); const words=[];
  if(st){
    const t=st.textContent.trim().split(/\s+/); st.textContent='';
    t.forEach((w,i)=>{
      const s=document.createElement('span'); s.className='w'; s.textContent=w; st.appendChild(s);
      if(i<t.length-1) st.appendChild(document.createTextNode(' '));
      words.push(s);
    });
  }

  /* ---------- header: hide going down, show going up; phone menu ---------- */
  const hd=$('hd'), menu=$('hdMenu'); let lastY=scrollY;
  const closeMenu=()=>{ hd.classList.remove('open'); menu.setAttribute('aria-expanded','false'); body.style.overflow=''; };
  menu.addEventListener('click',()=>{
    if(hd.classList.contains('open')) closeMenu();
    else{ hd.classList.add('open'); menu.setAttribute('aria-expanded','true'); body.style.overflow='hidden'; }
  });
  $$('#hdNav a').forEach(a=>a.addEventListener('click',closeMenu));

  /* ---------- one scroll loop: hero drift, statement words, works drift ---------- */
  const ben=$('heroBen'), wkStage=$('wkStage'), wkItems=$$('.wk__item,.wk__d');
  function frame(){
    requestAnimationFrame(frame);
    const y=scrollY, vh=innerHeight;
    if(Math.abs(y-lastY)>6){
      if(!hd.classList.contains('open')) hd.classList.toggle('hide',y>lastY&&y>vh*0.6);
      lastY=y;
    }
    if(reduce) return;
    if(y<vh*1.2&&hw){
      hw.style.setProperty('--py',(y*0.22).toFixed(1)+'px');
      ben.style.setProperty('--py',(y*0.07).toFixed(1)+'px');
    }
    if(st){
      const r=st.getBoundingClientRect();
      if(r.bottom>0&&r.top<vh){
        const p=clamp((vh*0.86-r.top)/(r.height+vh*0.36),0,1), n=Math.round(p*words.length);
        words.forEach((w,i)=>w.classList.toggle('on',i<n));
      }
    }
    if(wkStage&&innerWidth>900){
      const r=wkStage.getBoundingClientRect();
      if(r.bottom>-200&&r.top<vh+200){
        const c=r.top+r.height/2-vh/2;
        wkItems.forEach(it=>it.style.setProperty('--py',(c*(+it.dataset.speed)).toFixed(1)+'px'));
      }
    }
  }
  requestAnimationFrame(frame);

  /* ---------- recognition: photo follows the cursor ---------- */
  const fl=$('recFloat');
  if(fl&&matchMedia('(hover:hover)').matches){
    const flImg=fl.querySelector('img'); let fx=0, fy=0, tx=0, ty=0;
    $$('.rec__row').forEach(row=>{
      row.addEventListener('mouseenter',()=>{
        const src=row.dataset.img;
        if(!src){ fl.classList.remove('on'); return; }
        flImg.src=src; fl.style.aspectRatio=row.dataset.ar||''; fl.style.width=row.dataset.w?row.dataset.w+'px':(row.dataset.ar?'300px':''); fl.classList.add('on');
      });
      row.addEventListener('mouseleave',()=>fl.classList.remove('on'));
    });
    addEventListener('mousemove',e=>{ tx=e.clientX+150; ty=e.clientY; });
    const follow=()=>{
      requestAnimationFrame(follow);
      fx+=(tx-fx)*0.12; fy+=(ty-fy)*0.12;
      fl.style.left=fx.toFixed(1)+'px'; fl.style.top=fy.toFixed(1)+'px';
    };
    requestAnimationFrame(follow);
  }

  /* ---------- cursor dot ---------- */
  const cur=$('cur');
  if(cur&&matchMedia('(hover:hover) and (pointer:fine)').matches){
    let cx=0, cy=0, mx=0, my=0;
    addEventListener('mousemove',e=>{ mx=e.clientX; my=e.clientY; cur.classList.add('on'); });
    document.addEventListener('mouseleave',()=>cur.classList.remove('on'));
    const move=()=>{
      requestAnimationFrame(move);
      cx+=(mx-cx)*0.22; cy+=(my-cy)*0.22;
      cur.style.transform='translate('+cx.toFixed(1)+'px,'+cy.toFixed(1)+'px)';
    };
    requestAnimationFrame(move);
    const hot='a,button,.vc,.wk__item,.tst__card,.book,.rec__row';
    document.addEventListener('mouseover',e=>{ cur.classList.toggle('big',!!e.target.closest(hot)); });
  }

  /* ---------- reviews: copy each column's cards so the roll loops without a gap ---------- */
  $$('.rvw__track').forEach(t=>{ [...t.children].forEach(li=>{ const c=li.cloneNode(true); c.setAttribute('aria-hidden','true'); t.appendChild(c); }); });

  /* ---------- instagram strip: copy the frames so the loop has no gap ---------- */
  const ig=$('igsRow');
  if(ig){
    [...ig.children].forEach(a=>{ const c=a.cloneNode(true); c.setAttribute('aria-hidden','true'); c.tabIndex=-1; ig.appendChild(c); });
    const set=()=>ig.style.setProperty('--dur',Math.max(30,(ig.scrollWidth/2)/45).toFixed(1)+'s');
    set(); addEventListener('resize',set);
  }
})();

/* ===== kept from v1: the ebook form, the book and the pop-up ===== */
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

/* ---------- hero: three "as featured in" logos; one slot at a time rolls up to another outlet, picked at random ---------- */
(function(){
  const box=document.getElementById('featSlots'); if(!box) return;
  const LOGOS=[['straits-times.svg','The Straits Times',0],['cna.svg','CNA',1],['squarerooms.png','SquareRooms',0],['cna938.png','CNA938',1],['sunday-times.svg','The Sunday Times',0],
    ['sixides.png','SIXiDES',0],['sph-media.png','SPH Media',0],['st-life.svg','ST Life',0],['capital958.svg','Capital 958',0],['uchify.svg','Uchify',0]];
  const slots=[...box.querySelectorAll('.feat__slot')], shown=[0,2,4];
  const make=i=>{ const im=document.createElement('img'); im.src='assets/press/'+LOGOS[i][0]; im.alt=LOGOS[i][1]; if(LOGOS[i][2]) im.className='tall'; return im; };
  slots.forEach((s,k)=>s.appendChild(make(shown[k])));
  LOGOS.forEach(l=>{ const p=new Image(); p.src='assets/press/'+l[0]; });                 // warm the cache so rolls never flash
  if(matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  let lastSlot=-1;
  setInterval(()=>{
    if(document.hidden||!document.body.classList.contains('ready')) return;
    let k; do{ k=Math.floor(Math.random()*slots.length); }while(k===lastSlot); lastSlot=k;
    const cna=i=>/cna/.test(LOGOS[i][0]), others=shown.filter((_,s)=>s!==k);     // CNA and CNA938 never show together (user)
    const free=LOGOS.map((_,i)=>i).filter(i=>!shown.includes(i)&&!(cna(i)&&others.some(cna)));
    const next=free[Math.floor(Math.random()*free.length)];
    const slot=slots[k], old=slot.querySelector('img:last-child'), neu=make(next);
    neu.classList.add('below'); slot.appendChild(neu);
    requestAnimationFrame(()=>requestAnimationFrame(()=>{ old.classList.add('above'); neu.classList.remove('below'); }));
    shown[k]=next;
    setTimeout(()=>old.remove(),750);
  },1900);
})();

/* ---------- awards band: copy the photos once so the strip loops with no gap ---------- */
(function(){
  const row=document.getElementById('awdRow'); if(!row) return;
  [...row.children].forEach(f=>{ const c=f.cloneNode(true); c.setAttribute('aria-hidden','true'); row.appendChild(c); });
  const set=()=>row.style.setProperty('--dur',Math.max(28,(row.scrollWidth/2)/55).toFixed(1)+'s');
  set(); addEventListener('resize',set); addEventListener('load',set);
})();


/* ---------- venture cards: the photo behind shows on hover; a card with a video plays it while hovered ---------- */
(function(){
  document.querySelectorAll('.vc').forEach(c=>{
    const v=c.querySelector('video'); if(!v) return;
    c.addEventListener('mouseenter',()=>{ if(v.ended||(v.duration&&v.currentTime>=v.duration-0.05)) v.currentTime=0; const p=v.play(); if(p&&p.catch) p.catch(()=>{}); });   // plays once per hover, then holds its last frame (no loop)
    c.addEventListener('mouseleave',()=>v.pause());
  });
})();

/* ---------- Meet Ben photo: builds up from tiles, top left first (user, 2026-11-20) ---------- */
(function(){
  const pic=document.querySelector('.abt__pic'), fig=pic&&pic.querySelector('.abt__photo'), img=fig&&fig.querySelector('img');
  if(!img||matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const C=4, R=5, grid=document.createElement('div');
  grid.className='abt__tiles'; grid.setAttribute('aria-hidden','true');
  for(let r=0;r<R;r++) for(let c=0;c<C;c++){
    const t=document.createElement('i'), p=document.createElement('img');
    p.alt=''; p.src=img.currentSrc||img.src;
    t.style.setProperty('--d',((r+c)*0.075).toFixed(3)+'s');
    p.style.setProperty('--x',(-c*100)+'%'); p.style.setProperty('--y',(-r*100)+'%');
    t.appendChild(p); grid.appendChild(t);
  }
  fig.appendChild(grid); pic.classList.add('has-tiles');
  const go=()=>{ requestAnimationFrame(()=>pic.classList.add('tiles-go')); setTimeout(()=>pic.classList.add('tiles-done'),1500); };
  if(pic.classList.contains('in')) go();
  else new MutationObserver((m,o)=>{ if(pic.classList.contains('in')){ o.disconnect(); go(); } }).observe(pic,{attributes:true,attributeFilter:['class']});
})();
