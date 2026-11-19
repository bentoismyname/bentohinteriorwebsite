/* Shutter page transition (all pages): black slats close from the bottom of the screen to the top,
   the next page loads behind them, then they open in the same direction. */
(function(){
  var root=document.documentElement, s=document.querySelector('.shut'), N=6, i;
  if(!s){
    s=document.createElement('div'); s.className='shut'; s.setAttribute('aria-hidden','true'); s.style.setProperty('--n',N);
    for(i=0;i<N;i++){ var b=document.createElement('i'); b.style.setProperty('--i',i); s.appendChild(b); }
    document.body.appendChild(s);
  }
  N=s.children.length;
  var reduce=matchMedia('(prefers-reduced-motion: reduce)').matches, total=N*55+560;
  var norm=function(p){ return p.replace(/\/index\.html$/,'/'); };

  /* arriving: the page starts covered (class set in the head), now open it */
  function open(){
    try{ sessionStorage.removeItem('shut'); }catch(e){}
    if(!root.classList.contains('shut-in')) return;
    requestAnimationFrame(function(){ requestAnimationFrame(function(){
      s.classList.add('open'); root.classList.remove('shut-in');
      setTimeout(function(){ s.classList.remove('open'); },total+100);
    }); });
  }
  open();

  /* leaving: close the slats, then go */
  document.addEventListener('click',function(e){
    if(e.defaultPrevented||e.button||e.metaKey||e.ctrlKey||e.shiftKey||e.altKey) return;
    var a=e.target.closest&&e.target.closest('a[href]');
    if(!a||a.target==='_blank'||a.hasAttribute('download')) return;
    var u; try{ u=new URL(a.href,location.href); }catch(x){ return; }
    if(u.protocol!==location.protocol||u.host!==location.host) return;                       // other sites, mailto
    if(norm(u.pathname)===norm(location.pathname)&&u.search===location.search) return;       // same page (section links)
    e.preventDefault();
    if(reduce){ location.href=u.href; return; }
    try{ sessionStorage.setItem('shut','1'); }catch(x){}
    s.classList.add('close');
    setTimeout(function(){ location.href=u.href; },total);
  });
  /* coming back with the browser's back button: never leave the slats shut */
  addEventListener('pageshow',function(e){ if(e.persisted){ s.classList.remove('close','open'); root.classList.remove('shut-in'); } });
})();

/* Shared on every page: button labels roll upward on hover. Each label is wrapped and copied once;
   the copy waits below and slides in as the first one leaves through the top. */
(function(){
  document.querySelectorAll('.b, .btn').forEach(function(b){
    if(b.querySelector('.b__roll')||b.getAttribute('aria-disabled')==='true') return;
    var roll=document.createElement('span'), a=document.createElement('span');
    roll.className='b__roll'; a.className='b__a';
    while(b.firstChild) a.appendChild(b.firstChild);
    var c=a.cloneNode(true); c.className='b__b'; c.setAttribute('aria-hidden','true');
    roll.appendChild(a); roll.appendChild(c); b.appendChild(roll);
  });
})();
