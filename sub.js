/* Benjamin Toh v2: inner pages (About, Features).
   Header and phone menu, giant words sized to the screen, reveals, certificate viewer, media list, swapping logo grid. */
(function(){
  const $=id=>document.getElementById(id), $$=(s,r=document)=>[...r.querySelectorAll(s)];
  const reduce=matchMedia('(prefers-reduced-motion: reduce)').matches, body=document.body;

  /* giant words sized to the screen width */
  function fit(){
    $$('[data-fit]').forEach(el=>{
      let w=el.querySelector(':scope > .fitw');
      if(!w){ w=document.createElement('span'); w.className='fitw'; while(el.firstChild) w.appendChild(el.firstChild); el.appendChild(w); }
      el.style.fontSize='100px';
      const tw=w.offsetWidth||1, target=document.documentElement.clientWidth*(+el.dataset.fit||1);
      el.style.fontSize=(100*target/tw).toFixed(2)+'px';
    });
  }
  fit(); addEventListener('resize',fit);
  if(document.fonts&&document.fonts.ready) document.fonts.ready.then(fit);

  /* reveals */
  if('IntersectionObserver' in window&&!reduce){
    const io=new IntersectionObserver(es=>es.forEach(e=>{ if(e.isIntersecting){ e.target.classList.add('in'); io.unobserve(e.target); } }),{threshold:0.12,rootMargin:'0px 0px -6% 0px'});
    $$('[data-rv]').forEach(el=>{
      const sib=[...el.parentElement.children].filter(c=>c.hasAttribute('data-rv')).indexOf(el);
      el.style.transitionDelay=Math.min(sib,5)*70+'ms'; io.observe(el);
    });
  }else $$('[data-rv]').forEach(el=>el.classList.add('in'));

  /* full-screen hero: its words come in straight away (they sit at the very bottom of the screen) */
  $$('.sp-hero--full [data-rv]').forEach((el,i)=>setTimeout(()=>el.classList.add('in'),250+i*90));

  /* pull quote: the words light up one by one as it scrolls through the screen (no pinning) */
  const q=$('spQuote');
  if(q){
    const t=q.textContent.trim().split(/\s+/); q.textContent='';
    const ws=t.map((w,i)=>{ const s=document.createElement('span'); s.className='w'; s.textContent=w; q.appendChild(s); if(i<t.length-1) q.appendChild(document.createTextNode(' ')); return s; });
    if(reduce) ws.forEach(s=>s.classList.add('on'));
    else{
      const upd=()=>{
        const r=q.getBoundingClientRect(), p=Math.min(1,Math.max(0,(innerHeight*0.86-r.top)/(innerHeight*0.5+r.height*0.6))), n=Math.round(p*ws.length);
        ws.forEach((s,i)=>s.classList.toggle('on',i<n));
      };
      addEventListener('scroll',upd,{passive:true}); addEventListener('resize',upd); upd();
    }
  }

  /* lined rows with a photo: same as the home page list, the photo follows the mouse while a row is hovered */
  const fl=$('spFloat');
  if(fl&&matchMedia('(hover:hover)').matches){
    const flImg=fl.querySelector('img'); let fx=0, fy=0, tx=0, ty=0, cur=null;
    $$('.sp-row[data-img]').forEach(r=>{ const p=new Image(); p.src=r.dataset.img; });
    document.addEventListener('mouseover',e=>{
      const row=e.target.closest?e.target.closest('.sp-row[data-img]'):null;
      if(row===cur) return; cur=row;
      if(!row){ fl.classList.remove('on'); return; }
      flImg.src=row.dataset.img; fl.style.aspectRatio=row.dataset.ar||''; fl.style.width=row.dataset.w?row.dataset.w+'px':(row.dataset.ar?'300px':''); fl.classList.add('on');
    });
    addEventListener('mousemove',e=>{ tx=e.clientX+150; ty=e.clientY; });
    const follow=()=>{
      requestAnimationFrame(follow);
      fx+=(tx-fx)*0.12; fy+=(ty-fy)*0.12;
      fl.style.left=fx.toFixed(1)+'px'; fl.style.top=fy.toFixed(1)+'px';
    };
    requestAnimationFrame(follow);
  }

  /* contact form: there is no server behind this site, so the form writes the email for the visitor
     and opens it in their own mail app, addressed to Benjamin */
  const cf=$('contactForm');
  if(cf){
    const note=$('contactNote'), TO='hello@bentohinteriors.com';
    cf.addEventListener('submit',e=>{
      e.preventDefault();
      const f=n=>(cf.elements[n].value||'').trim();
      let bad=null;
      ['name','email','message'].forEach(n=>{
        const el=cf.elements[n], ok=n==='email'?/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(f(n)):f(n).length>1;
        el.closest('.sp-field').classList.toggle('err',!ok); if(!ok&&!bad) bad=el;
      });
      if(bad){ note.textContent='Please fill in your name, a valid email and a short message.'; note.className='sp-form__note err'; bad.focus(); return; }
      const subject='Enquiry: '+f('topic')+' ('+f('name')+')';
      const body=['Name: '+f('name'),'Email: '+f('email'),f('phone')?'Phone: '+f('phone'):'','About: '+f('topic'),'',f('message')].filter((l,i)=>l!==''||i===4).join('\n');
      location.href='mailto:'+TO+'?subject='+encodeURIComponent(subject)+'&body='+encodeURIComponent(body);
      note.className='sp-form__note ok';
      note.textContent='Your email app should now be open with the message ready to send. If nothing opened, write to '+TO+'.';
    });
  }

  /* press carousel (Features): drifts slowly, drag it with the mouse or swipe it on a phone; tap a card to open it */
  const pcT=$('pcTrack');
  if(pcT){
    const cards=$$('.pc__card',pcT);
    cards.forEach(c=>{ const d=c.cloneNode(true); d.setAttribute('aria-hidden','true'); d.tabIndex=-1; pcT.appendChild(d); });   // a copy so the loop has no end
    let paused=false, drag=null, moved=0, idle=0;
    const half=()=>pcT.scrollWidth/2;
    const wrap=()=>{ const h=half(); if(pcT.scrollLeft>=h) pcT.scrollLeft-=h; else if(pcT.scrollLeft<=0) pcT.scrollLeft+=h; };
    pcT.addEventListener('mouseenter',()=>paused=true);
    pcT.addEventListener('mouseleave',()=>{ paused=false; if(drag){ drag=null; pcT.classList.remove('drag'); } });
    pcT.addEventListener('touchstart',()=>{ idle=Date.now()+2500; },{passive:true});
    pcT.addEventListener('scroll',wrap,{passive:true});
    pcT.addEventListener('pointerdown',e=>{ if(e.pointerType!=='mouse') return; drag={x:e.clientX,s:pcT.scrollLeft}; moved=0; });
    addEventListener('pointermove',e=>{ if(!drag) return; const dx=e.clientX-drag.x; moved=Math.max(moved,Math.abs(dx)); if(moved>4) pcT.classList.add('drag'); pcT.scrollLeft=drag.s-dx; });
    addEventListener('pointerup',()=>{ if(drag){ drag=null; setTimeout(()=>pcT.classList.remove('drag'),0); } });
    pcT.addEventListener('dragstart',e=>e.preventDefault());
    if(!reduce){
      const tick=()=>{ requestAnimationFrame(tick); if(!paused&&!drag&&Date.now()>idle&&!document.hidden){ pcT.scrollLeft+=0.5; wrap(); } };
      requestAnimationFrame(tick);
    }

    /* pop-up: the whole article (every page), the photo, or the video with sound */
    const lb=$('pcLb'), body=$('pcBody'), meta=$('pcMeta');
    let at=0, last=null;
    const show=i=>{
      at=(i+cards.length)%cards.length; const c=cards[at], d=c.dataset;
      meta.innerHTML='<b>'+c.querySelector('.pc__o').textContent+'</b><span>'+c.querySelector('.pc__t').textContent+'</span>';
      let html='';
      if(d.video) html='<video src="'+d.video+'" poster="'+(d.poster||'')+'" controls autoplay playsinline></video>';
      else html=d.pages.split('|').map((p,k)=>'<img src="'+p+'" alt="'+c.querySelector('.pc__t').textContent+(d.pages.includes('|')?', page '+(k+1):'')+'">').join('');
      if(d.url) html+='<p class="pc-lb__link"><a class="b b--white" href="'+d.url+'" target="_blank" rel="noopener">'+(d.cta||'Read online')+' <i aria-hidden="true">→</i></a></p>';
      body.innerHTML=html; body.scrollTop=0;
    };
    const open=i=>{ last=document.activeElement; show(i); lb.hidden=false; requestAnimationFrame(()=>lb.classList.add('on')); document.body.style.overflow='hidden'; $('pcClose').focus(); };
    const close=()=>{ lb.classList.remove('on'); document.body.style.overflow=''; setTimeout(()=>{ lb.hidden=true; body.innerHTML=''; },300); if(last) last.focus(); };
    pcT.addEventListener('click',e=>{
      const c=e.target.closest('.pc__card'); if(!c) return;
      if(moved>4){ e.preventDefault(); moved=0; return; }
      open(+c.dataset.i);
    });
    $('pcClose').addEventListener('click',close);
    $('pcPrev').addEventListener('click',()=>show(at-1));
    $('pcNext').addEventListener('click',()=>show(at+1));
    lb.addEventListener('click',e=>{ if(e.target===lb||e.target===body) close(); });
    addEventListener('keydown',e=>{ if(lb.hidden) return; if(e.key==='Escape') close(); if(e.key==='ArrowLeft') show(at-1); if(e.key==='ArrowRight') show(at+1); });
  }

  /* header: hides on the way down, returns on the way up; phone menu */
  const hd=$('hd'), menu=$('hdMenu'); let lastY=scrollY;
  const closeMenu=()=>{ hd.classList.remove('open'); menu.setAttribute('aria-expanded','false'); body.style.overflow=''; };
  menu.addEventListener('click',()=>{
    if(hd.classList.contains('open')) closeMenu();
    else{ hd.classList.add('open'); menu.setAttribute('aria-expanded','true'); body.style.overflow='hidden'; }
  });
  $$('.hd__nav a').forEach(a=>a.addEventListener('click',closeMenu));
  addEventListener('scroll',()=>{
    const y=scrollY;
    if(Math.abs(y-lastY)>6){ if(!hd.classList.contains('open')) hd.classList.toggle('hide',y>lastY&&y>innerHeight*0.6); lastY=y; }
  },{passive:true});

  /* certificates viewer (About) */
  const lb=$('lightbox');
  if(lb){
    const certs=$$('.sp-cert'), fig=lb.querySelector('.cert__media'), cap=lb.querySelector('figcaption');
    let cur=0, lastFocus=null;
    const show=i=>{ cur=(i+certs.length)%certs.length; fig.innerHTML=certs[cur].querySelector('.cert__media').innerHTML; cap.textContent=certs[cur].querySelector('.cert__title').textContent; };
    const open=i=>{ lastFocus=document.activeElement; show(i); lb.classList.add('open'); lb.setAttribute('aria-hidden','false'); lb.querySelector('.sp-lb__close').focus(); };
    const close=()=>{ lb.classList.remove('open'); lb.setAttribute('aria-hidden','true'); if(lastFocus) lastFocus.focus(); };
    certs.forEach((b,i)=>b.addEventListener('click',()=>open(i)));
    lb.querySelector('.sp-lb__close').addEventListener('click',close);
    lb.querySelector('.sp-lb__prev').addEventListener('click',()=>show(cur-1));
    lb.querySelector('.sp-lb__next').addEventListener('click',()=>show(cur+1));
    lb.addEventListener('click',e=>{ if(e.target===lb) close(); });
    addEventListener('keydown',e=>{ if(!lb.classList.contains('open')) return; if(e.key==='Escape') close(); if(e.key==='ArrowLeft') show(cur-1); if(e.key==='ArrowRight') show(cur+1); });
  }

  /* media features from data/features.json, with a year filter and a live count (Features) */
  const list=$('pressList');
  if(list){
    const count=$('pressCount'), btns=$$('.sp-filter button');
    let items=[];
    const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
    const render=year=>{
      const rows=items.filter(f=>year==='all'||String(f.year)===year);
      rows.forEach(f=>{ if(f.img){ const p=new Image(); p.src=f.img; } });
      list.innerHTML=rows.map(f=>'<li class="sp-row sp-row--media"'+(f.img?' data-img="'+esc(f.img)+'"'+(f.ar?' data-ar="'+esc(f.ar)+'"':'')+(f.w?' data-w="'+esc(f.w)+'"':''):'')+'><time class="sp-row__y" datetime="'+esc(f.date)+'">'+esc(f.label)+'</time><span class="sp-row__o">'+esc(f.outlet)+'</span><span class="sp-row__t">'+esc(f.title)+'</span><span class="sp-row__s">'+esc(f.role)+'</span>'
        +(f.url?'<a class="sp-row__l" href="'+esc(f.url)+'" target="_blank" rel="noopener">'+esc(f.cta||'Read')+' →</a>':'<span></span>')+'</li>').join('');
      count.textContent='Showing '+rows.length+' of '+items.length+'.';
      btns.forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.year===year)));
    };
    btns.forEach(b=>b.addEventListener('click',()=>render(b.dataset.year)));
    fetch('data/features.json').then(r=>r.json()).then(d=>{ items=d.features; render('all'); list.hidden=false; })
      .catch(()=>{ count.textContent='The feature list could not be loaded.'; });
  }

  /* featured-in grid: 8 cells, 10 outlets. Every couple of seconds one random cell rolls to an outlet
     that is not showing. CNA and CNA938 are never on screen together. */
  const g=$('pressGrid');
  if(g&&!reduce){
    const L=[['straits-times.svg','The Straits Times'],['cna.svg','CNA',1],['sunday-times.svg','The Sunday Times'],['squarerooms.png','SquareRooms'],
             ['sph-media.png','SPH Media'],['sixides.png','SIXiDES'],['st-life.svg','ST Life'],['capital958.svg','Capital 958'],
             ['cna938.png','CNA938',1],['uchify.svg','Uchify']];
    const cells=$$('.pgrid__in',g), shown=[0,1,2,3,4,5,6,7], cna=i=>/cna/.test(L[i][0]); let last=-1;
    L.forEach(l=>{ const p=new Image(); p.src='assets/press/'+l[0]; });
    setInterval(()=>{
      if(document.hidden) return;
      const hidden=L.map((_,i)=>i).filter(i=>!shown.includes(i)), moves=[];
      hidden.forEach(h=>cells.forEach((_,k)=>{ if(k!==last&&!(cna(h)&&shown.some((s,i)=>i!==k&&cna(s)))) moves.push([h,k]); }));
      if(!moves.length) return;
      const [h,k]=moves[Math.floor(Math.random()*moves.length)], cell=cells[k], old=cell.querySelector('img:not(.above)');
      const img=document.createElement('img'); img.src='assets/press/'+L[h][0]; img.alt=L[h][1]; img.className='below'+(L[h][2]?' tall':'');
      cell.appendChild(img); void img.offsetWidth; img.classList.remove('below');
      if(old){ old.classList.add('above'); setTimeout(()=>old.remove(),800); }
      shown[k]=h; last=k;
    },1900);
  }
})();
