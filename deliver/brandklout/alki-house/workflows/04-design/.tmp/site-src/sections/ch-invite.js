/* 07 INVITATION — the glow breathes; the form thanks you without a backend (yet). */
WZ.section('ch-invite', function(W){
  var root = document.querySelector('.ch-invite');
  W.arrive(root);
  if(!W.reduced){
    gsap.to(root.querySelector('.in-glow'),{scale:1.15,opacity:.8,duration:4,repeat:-1,yoyo:true,ease:'sine.inOut'});
    gsap.fromTo(root.querySelector('.in-glow'),{yPercent:-20},{yPercent:10,ease:'none',scrollTrigger:{trigger:root,start:'top bottom',end:'bottom top',scrub:true}});
  }
});
WZ.dom('invite-form', '.in-form', function(W){
  var form = document.querySelector('.in-form');
  form.addEventListener('submit',function(e){
    e.preventDefault();
    var btn = form.querySelector('button'), note = form.querySelector('.in-note');
    btn.disabled = true; btn.querySelector('span').textContent = 'Sent — thank you';
    if(note) note.textContent = 'We reply within a working day.';
    if(window.gsap && !W.reduced) gsap.from(btn,{scale:.96,duration:.5,ease:'back.out(2)'});
  });
});
