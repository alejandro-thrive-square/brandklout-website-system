/* THE CATALOGUE — the filter rail pins under the nav while the grid scrolls,
   the film drifts in the arrival, cards rise in batches, and every filter
   change re-sorts the grid with a stagger. State lives in the URL
   (?cat=&brand=&stock=1&q=&sort=) so a category link from any page lands
   filtered, and the back button works. */
WZ.section('ct-arrival', function(W){
  var root = document.getElementById('ctArrival');
  gsap.set(root.querySelectorAll('[data-anim="hide"]'),{visibility:'visible'});
  if(W.reduced) return;
  var tl = gsap.timeline({delay:.1});
  var split = W.splitLines(root.querySelector('h1'));
  if(split && split.lines.length){ gsap.set(split.lines,{yPercent:110}); tl.to(split.lines,{yPercent:0,duration:1.1,stagger:.09,ease:'power4.out'},.1); }
  tl.from(root.querySelector('.chapter-tag'),{opacity:0,x:-24,duration:.9,ease:'power3.out'},0)
    .from(root.querySelectorAll('[data-arrive]'),{opacity:0,y:24,duration:.9,stagger:.12,ease:'power3.out'},.5)
    .from(root.querySelectorAll('.ct-jump .pill'),{opacity:0,y:14,duration:.6,stagger:.04,ease:'power3.out'},.7)
    .from(root.querySelector('.ct-film'),{opacity:0,scale:1.15,duration:1.8,ease:'power3.out'},0);
  gsap.to(root.querySelector('.ct-film img'),{yPercent:14,scale:1.02,ease:'none',scrollTrigger:{trigger:root,start:'top top',end:'bottom top',scrub:.5}});
  gsap.to(root.querySelector('.ct-in'),{yPercent:-12,opacity:.2,ease:'none',scrollTrigger:{trigger:root,start:'top top',end:'bottom top',scrub:.5}});
});

WZ.section('ct-aisles', function(W){
  var rail = document.getElementById('ctRail'), floor = document.getElementById('ctFloor');
  if(W.reduced) return;
  ScrollTrigger.create({trigger:rail, start:'top 64px', endTrigger:floor, end:'bottom 60%', pin:true, pinSpacing:false, anticipatePin:1,
    onToggle:function(self){ rail.classList.toggle('is-pinned', self.isActive); }});
});

WZ.section('ct-floor', function(W){
  var root = document.getElementById('ctFloor');
  if(W.reduced) return;
  var cards = gsap.utils.toArray('.ct-grid .pcard');
  gsap.set(cards,{y:40,opacity:0});
  ScrollTrigger.batch(cards,{start:'top 94%',once:true,batchMax:8,
    onEnter:function(batch){ gsap.to(batch,{y:0,opacity:1,duration:.8,stagger:.06,ease:'power3.out',overwrite:true}); }});
});

WZ.section('ct-invite', function(W){ W.arrive(document.querySelector('.ct-invite')); });

/* Filtering is plain DOM work and must survive GSAP being absent. */
WZ.dom('ct-filter', '#ctFilters', function(W){
  var data = JSON.parse(document.getElementById('catalogueData').textContent);
  var form = document.getElementById('ctFilters'), grid = document.getElementById('ctGrid'), status = document.getElementById('ctStatus'),
      empty = document.getElementById('ctEmpty'), clear = document.getElementById('ctClear'), count = document.getElementById('ctCount');
  var chips = document.querySelectorAll('.ct-jump .pill');
  var cards = {}; grid.querySelectorAll('.pcard').forEach(function(c){ cards[c.dataset.slug] = c; });
  var state = {cat:'', brand:'', stock:false, q:'', sort:'featured'};

  function fromUrl(){
    var u = new URLSearchParams(location.search);
    state.cat = u.get('cat')||''; state.brand = u.get('brand')||''; state.stock = u.get('stock')==='1'; state.q = u.get('q')||''; state.sort = u.get('sort')||'featured';
    form.brand.value = state.brand; form.stock.checked = state.stock; form.q.value = state.q; form.sort.value = state.sort;
  }
  function toUrl(){
    var u = new URLSearchParams();
    if(state.cat) u.set('cat',state.cat); if(state.brand) u.set('brand',state.brand); if(state.stock) u.set('stock','1'); if(state.q) u.set('q',state.q); if(state.sort!=='featured') u.set('sort',state.sort);
    var qs = u.toString(); history.replaceState(null,'',location.pathname + (qs?'?'+qs:''));
  }
  function apply(animate){
    var q = state.q.trim().toLowerCase();
    var list = data.filter(function(p){
      if(state.cat && p.category!==state.cat) return false;
      if(state.brand && p.brand!==state.brand) return false;
      if(state.stock && !(p.stock>0)) return false;
      if(q && (p.name+' '+p.brand).toLowerCase().indexOf(q)===-1) return false;
      return true;
    });
    list.sort(function(a,b){
      if(state.sort==='price-asc') return (a.price==null)-(b.price==null) || (a.price||0)-(b.price||0);
      if(state.sort==='price-desc') return (a.price==null)-(b.price==null) || (b.price||0)-(a.price||0);
      if(state.sort==='name') return a.name.localeCompare(b.name);
      return (b.featured-a.featured) || ((b.stock>0)-(a.stock>0)) || 0;
    });
    var shown = {};
    list.forEach(function(p,i){ var c = cards[p.slug]; if(!c) return; shown[p.slug]=1; c.classList.remove('is-hidden'); grid.appendChild(c); });
    Object.keys(cards).forEach(function(s){ if(!shown[s]) cards[s].classList.add('is-hidden'); });
    if(status) status.innerHTML = 'Showing <b>'+list.length+'</b> of '+data.length;
    if(count) count.textContent = list.length;
    empty.hidden = list.length>0;
    chips.forEach(function(ch){ ch.classList.toggle('is-on', (ch.dataset.cat||'')===state.cat); });
    var dirty = state.cat||state.brand||state.stock||state.q||state.sort!=='featured';
    clear.classList.toggle('is-on', !!dirty);
    toUrl();
    if(animate && window.gsap && !W.reduced){
      var vis = list.map(function(p){ return cards[p.slug]; }).filter(Boolean).slice(0,24);
      gsap.fromTo(vis,{y:18,opacity:0},{y:0,opacity:1,duration:.55,stagger:.03,ease:'power3.out',overwrite:true,clearProps:'transform'});
      gsap.set(list.map(function(p){ return cards[p.slug]; }).slice(24),{opacity:1,y:0});
    }
    if(window.ScrollTrigger) ScrollTrigger.refresh();
  }
  chips.forEach(function(ch){ ch.addEventListener('click',function(){ state.cat = (state.cat===ch.dataset.cat)?'':(ch.dataset.cat||''); apply(true);
    var aisles = document.getElementById('aisles'); if(aisles && W.smoother) W.smoother.scrollTo(aisles,true,'top 64px'); }); });
  form.brand.addEventListener('change',function(){ state.brand = form.brand.value; apply(true); });
  form.sort.addEventListener('change',function(){ state.sort = form.sort.value; apply(true); });
  form.stock.addEventListener('change',function(){ state.stock = form.stock.checked; apply(true); });
  var t; form.q.addEventListener('input',function(){ clearTimeout(t); t = setTimeout(function(){ state.q = form.q.value; apply(false); },160); });
  clear.addEventListener('click',function(){ state = {cat:'',brand:'',stock:false,q:'',sort:'featured'}; form.reset(); apply(true); });
  fromUrl(); apply(false);
});
