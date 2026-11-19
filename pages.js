/* Benjamin Toh — inner pages (About, Features)
   Header + mobile menu, scroll reveals, certificate lightbox (About), media list with year filter (Features). */
(function(){
  const $=id=>document.getElementById(id);
  const header=$('header'), menuBtn=$('menuBtn');
  header.classList.add('in');
  menuBtn.addEventListener('click',()=>{const open=header.classList.toggle('open');menuBtn.setAttribute('aria-expanded',String(open));});
  document.querySelectorAll('.site-nav a').forEach(a=>a.addEventListener('click',()=>header.classList.remove('open')));

  /* reveals */
  const io=new IntersectionObserver(es=>{es.forEach(e=>{if(e.isIntersecting){e.target.classList.add('in');io.unobserve(e.target);}});},{threshold:0.15,rootMargin:'0px 0px -6% 0px'});
  document.querySelectorAll('.rv').forEach(el=>io.observe(el));

  /* certificates lightbox (About) */
  const lb=$('lightbox');
  if(lb){
    const certs=[...document.querySelectorAll('.cert__btn')];
    const fig=lb.querySelector('.lightbox__media'), cap=lb.querySelector('.lightbox__cap');
    let cur=0, lastFocus=null;
    const show=i=>{
      cur=(i+certs.length)%certs.length;
      const src=certs[cur].querySelector('.cert__media');
      fig.innerHTML=src.innerHTML; fig.className='lightbox__media cert__media '+(src.classList.contains('ph')?'ph':'');
      cap.textContent=certs[cur].querySelector('.cert__title').textContent;
    };
    const open=i=>{lastFocus=document.activeElement;show(i);lb.classList.add('open');lb.setAttribute('aria-hidden','false');lb.querySelector('.lightbox__close').focus();};
    const close=()=>{lb.classList.remove('open');lb.setAttribute('aria-hidden','true');if(lastFocus)lastFocus.focus();};
    certs.forEach((b,i)=>b.addEventListener('click',()=>open(i)));
    lb.querySelector('.lightbox__close').addEventListener('click',close);
    lb.querySelector('.lightbox__nav--prev').addEventListener('click',()=>show(cur-1));
    lb.querySelector('.lightbox__nav--next').addEventListener('click',()=>show(cur+1));
    lb.addEventListener('click',e=>{if(e.target===lb)close();});
    addEventListener('keydown',e=>{if(!lb.classList.contains('open'))return; if(e.key==='Escape')close(); if(e.key==='ArrowLeft')show(cur-1); if(e.key==='ArrowRight')show(cur+1);});
  }

  /* media features: render from data/features.json, filter by year with a live count (Features) */
  const list=$('pressList');
  if(list){
    const count=$('pressCount'), btns=[...document.querySelectorAll('.filters button')];
    let items=[];
    const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
    const render=year=>{
      const rows=items.filter(f=>year==='all'||String(f.year)===year);
      list.innerHTML=rows.map(f=>`<li>
        <time class="pl-date" datetime="${esc(f.date)}">${esc(f.label)}</time>
        <span class="pl-outlet">${esc(f.outlet)}</span>
        <span class="pl-title">${esc(f.title)}</span>
        <span class="pl-role">${esc(f.role)}</span>
        ${f.url?`<a class="pl-link" href="${esc(f.url)}" target="_blank" rel="noopener">${esc(f.cta||'Read')} →</a>`:'<span></span>'}
      </li>`).join('');
      count.textContent=`Showing ${rows.length} of ${items.length}.`;
      btns.forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.year===year)));
    };
    btns.forEach(b=>b.addEventListener('click',()=>render(b.dataset.year)));
    fetch('data/features.json').then(r=>r.json()).then(d=>{items=d.features;render('all');list.hidden=false;})
      .catch(()=>{count.textContent='The feature list could not be loaded.';});
  }
})();
