/* =============================================================================
   SECTION: ch-difference
   Registered against .ch-difference; runs only when that is on the page, so
   this file can travel with the markup between pages without being edited.
   ============================================================================= */
WZ.section("ch-difference", function (W) {
  var root = document.getElementById('difference');

  /* Counters */
  root.querySelectorAll('[data-count]').forEach(function(el){
    var target = parseFloat(el.getAttribute('data-count')),
        dec    = parseInt(el.getAttribute('data-decimals')||'0',10),
        suf    = el.getAttribute('data-suffix')||'';
    function paint(v){
      el.textContent = (dec ? v.toFixed(dec) : Math.floor(v).toLocaleString('en-US')) + suf;
    }
    if(W.reduced){ paint(target); return; }
    var o = {v:0};
    gsap.to(o,{v:target,duration:1.9,ease:'power2.out',onUpdate:function(){ paint(o.v); },
      scrollTrigger:{trigger:el,start:'top 88%'}});
  });

  if(W.reduced) return;

  gsap.fromTo(root.querySelectorAll('.df-stat'),
    {opacity:0,y:26},
    {opacity:1,y:0,duration:.9,stagger:.1,ease:'power3.out',
     scrollTrigger:{trigger:'#diffStats',start:'top 85%'}});

  /* Marquee: loops continuously, and scroll velocity bends its speed and
     direction — the page feels physically connected to the wheel. */
  var row = document.getElementById('mqRow');
  row.innerHTML += row.innerHTML;                       // seamless loop needs a duplicate
  var half = row.scrollWidth / 2;
  var loop = gsap.to(row,{x:-half,duration:26,ease:'none',repeat:-1,
    modifiers:{x:function(x){ return (parseFloat(x) % half) + 'px'; }}});

  var vt = gsap.quickTo(loop,'timeScale',{duration:.5,ease:'power2'});
  ScrollTrigger.create({
    onUpdate:function(self){
      var v = self.getVelocity()/380;
      vt(gsap.utils.clamp(-7, 7, v === 0 ? 1 : (v < 0 ? Math.min(-1,v) : Math.max(1,v))));
    }
  });
  /* Settle back to a gentle drift when scrolling stops. */
  ScrollTrigger.addEventListener('scrollEnd', function(){ vt(1); });

  /* Comparison table: header first, then rows deal in from the left. */
  gsap.from('#versus .vs-head > *',{opacity:0,y:24,duration:.9,stagger:.12,ease:'power3.out',
    scrollTrigger:{trigger:'#versus',start:'top 78%'}});
  gsap.from('#versus .vs-row',{opacity:0,x:-34,duration:.85,stagger:.1,ease:'power3.out',
    scrollTrigger:{trigger:'#versus .vs-table',start:'top 82%'}});
});
