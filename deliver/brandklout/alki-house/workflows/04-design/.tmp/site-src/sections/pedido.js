/* TU PEDIDO (pedido.html) — the cart's checkout. Lists the saved lines (the
   same steppers as the drawer), asks for a name and how to receive the order,
   then turns the send button into a wa.me link carrying the whole order as one
   message. The shop confirms stock, condition and the final total in the chat;
   nothing is charged here. The cart is NOT emptied on send, because the site
   cannot know the message went; the customer clears it when it has. */
WZ.dom('pedido', '#coForm', function(W){
  var C = window.ALKI_CART; if(!C) return;
  var form = document.getElementById('coForm'), f = form.elements,
      list = document.getElementById('coLines'), emptyEl = document.getElementById('coEmpty'), full = document.getElementById('coFull'),
      countEl = document.getElementById('coCount'), totalEl = document.getElementById('coTotal'), askEl = document.getElementById('coAsk'),
      send = document.getElementById('coSend'), after = document.getElementById('coAfter'), err = document.getElementById('coErr'),
      addr = form.querySelector('.co-addr');
  var DRAFT = 'alki-cliente-v1';

  function delivery(){ var r = form.querySelector('[name="entrega"]:checked'); return r ? r.value : 'recoger'; }
  function sync(){ addr.hidden = delivery() !== 'envio'; }
  function keep(){ try{ localStorage.setItem(DRAFT, JSON.stringify({nombre:f.nombre.value, entrega:delivery(), direccion:f.direccion.value})); }catch(e){} }
  /* The name and delivery choice come back next time. */
  try{
    var d = JSON.parse(localStorage.getItem(DRAFT) || 'null');
    if(d){
      f.nombre.value = d.nombre || ''; f.direccion.value = d.direccion || '';
      var r = form.querySelector('[name="entrega"][value="' + (d.entrega === 'envio' ? 'envio' : 'recoger') + '"]'); if(r) r.checked = true;
    }
  }catch(e){}

  C.onChange(function(t){
    var items = C.items();
    list.innerHTML = items.map(C.lineHtml).join('');
    emptyEl.hidden = items.length > 0; full.hidden = !items.length;
    countEl.textContent = t.count;
    totalEl.textContent = t.sum ? C.money(t.sum) : (t.ask ? 'A consultar' : '$0');
    askEl.hidden = !t.ask;
    if(t.ask) askEl.textContent = t.ask + (t.ask === 1 ? ' artículo' : ' artículos') + ' con precio a consultar; te lo confirmamos en el chat.';
    if(window.ScrollTrigger) ScrollTrigger.refresh();
  });

  form.addEventListener('change', function(){ sync(); keep(); });
  form.addEventListener('input', function(){ keep(); if(f.nombre.value.trim()){ err.hidden = true; f.nombre.removeAttribute('aria-invalid'); } });
  form.addEventListener('submit', function(e){ e.preventDefault(); send.click(); });

  /* The href is written at click time, so the message is always the cart as it is now. */
  send.addEventListener('click', function(e){
    if(!C.items().length){ e.preventDefault(); return; }
    var name = f.nombre.value.trim();
    if(!name){ e.preventDefault(); err.hidden = false; f.nombre.setAttribute('aria-invalid', 'true'); f.nombre.focus(); return; }
    var where = f.direccion.value.trim();
    var extra = ['', 'Nombre: ' + name, 'Entrega: ' + (delivery() === 'envio' ? 'Envío a domicilio' + (where ? ' — ' + where : '') : 'Recoger en Alki House')];
    if(f.nota.value.trim()) extra.push('Nota: ' + f.nota.value.trim());
    var text = C.message(extra);
    if(encodeURIComponent(text).length > 7000) text = C.message(extra, true);
    send.href = C.waUrl(text);
    after.hidden = false;
  });
  document.getElementById('coClear').addEventListener('click', function(){ C.clear(); after.hidden = true; });
  sync();
});

WZ.section('co-arrival', function(W){
  var root = document.getElementById('coArrival');
  W.arrive(root);
  if(W.reduced) return;
  gsap.to(root.querySelector('.co-film img'), {yPercent:12, ease:'none', scrollTrigger:{trigger:root, start:'top top', end:'bottom top', scrub:.5}});
});

WZ.section('co-way', function(W){
  var root = document.getElementById('coWay');
  W.arrive(root);
  if(W.reduced) return;
  gsap.from(root.querySelectorAll('.co-steps li'), {opacity:0, y:36, duration:.9, stagger:.12, ease:'power3.out',
    scrollTrigger:{trigger:root.querySelector('.co-steps'), start:'top 85%', once:true}});
});
