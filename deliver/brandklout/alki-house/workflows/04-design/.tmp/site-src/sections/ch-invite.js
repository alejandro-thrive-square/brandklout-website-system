/* 07 INVITACIÓN — the glow breathes; the question goes to WhatsApp. */
WZ.section('ch-invite', function(W){
  var root = document.querySelector('.ch-invite');
  W.arrive(root);
  if(!W.reduced){
    gsap.to(root.querySelector('.in-glow'),{scale:1.15,opacity:.8,duration:4,repeat:-1,yoyo:true,ease:'sine.inOut'});
    gsap.fromTo(root.querySelector('.in-glow'),{yPercent:-20},{yPercent:10,ease:'none',scrollTrigger:{trigger:root,start:'top bottom',end:'bottom top',scrub:true}});
  }
});
/* Without script the form GETs wa.me with the textarea as ?text=. With it, the
   name and camera are folded into one readable message first. */
WZ.dom('invite-form', '#askForm', function(W){
  var form = document.getElementById('askForm'), WA = document.body.getAttribute('data-wa') || '';
  form.addEventListener('submit',function(e){
    e.preventDefault();
    var f = form.elements, name = f.nombre.value.trim(), cam = f.camara.value.trim(), about = f.text.value.trim();
    if(!name || !about){ (name ? f.text : f.nombre).focus(); return; }
    var text = '¡Hola, Alki House! Soy ' + name + '.' + (cam ? ' Grabo con ' + cam + '.' : '') + '\n\n' + about;
    var url = 'https://wa.me/' + WA + '?text=' + encodeURIComponent(text);
    if(!window.open(url, '_blank', 'noopener')) location.href = url;
    var btn = form.querySelector('button'), note = form.querySelector('.in-note');
    btn.querySelector('span').textContent = 'Abriendo WhatsApp…';
    if(note) note.textContent = 'Si no se abrió, revisa que tu navegador permita ventanas nuevas.';
    if(window.gsap && !W.reduced) gsap.from(btn,{scale:.96,duration:.5,ease:'back.out(2)'});
    setTimeout(function(){ btn.querySelector('span').textContent = 'Preguntar por WhatsApp'; }, 4000);
  });
});
