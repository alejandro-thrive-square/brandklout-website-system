/* THE CART — kept in this browser (localStorage), so it survives a closed tab
   and is shared by every page and every open tab. Any element carrying
   data-item (one product) or data-kit (several) adds to it; the drawer lists
   the lines; pedido.html reviews them and sends the whole order to the shop's
   WhatsApp as one message (sections/pedido.js).

   Plain DOM, so it works with GSAP absent; the piece flying to the bag and the
   badge bump are extras when it is present. The payload is found with
   closest('[data-item]'), so it may sit on a wrapper rather than the button —
   Instatic strips data-* from form controls. */
WZ.dom('cart', '#cart', function(W){
  /* v2: the WhatsApp catalogue (2026-10-09) changed every id and priced in Bs. */
  var KEY = 'alki-carrito-v2';
  var body = document.body, ROOT = body.getAttribute('data-root') || '', WA = body.getAttribute('data-wa') || '';
  var el = document.getElementById('cart'), panel = el.querySelector('.cart-panel'),
      lines = document.getElementById('cartLines'), empty = document.getElementById('cartEmpty'),
      foot = document.getElementById('cartFoot'), totalEl = document.getElementById('cartTotal'), note = document.getElementById('cartNote'),
      toast = document.getElementById('toast'), toastText = document.getElementById('toastText'),
      inCart = document.getElementById('pdInCart'), pdSlug = (document.querySelector('main.pd') || {}).dataset;
  var items = load(), listeners = [], lastFocus = null, toastT = 0;

  /* ---- store ---- */
  function load(){
    try{
      var d = JSON.parse(localStorage.getItem(KEY) || 'null');
      return d && Array.isArray(d.items) ? d.items.filter(function(it){ return it && typeof it.id === 'string' && it.qty > 0; }) : [];
    }catch(e){ return []; }
  }
  function save(){
    try{ localStorage.setItem(KEY, JSON.stringify({v:1, updated:new Date().toISOString(), items:items})); }catch(e){}
    render();
  }
  function find(id){ for(var i = 0; i < items.length; i++) if(items[i].id === id) return items[i]; return null; }
  /* Never more than the sheet says is on hand. */
  function cap(it){ return it.stock > 0 ? it.stock : 99; }
  function add(p){
    var it = find(p.id);
    if(it){ if(it.qty >= cap(it)) return false; it.qty++; return true; }
    items.push({id:p.id, slug:p.slug, name:p.name, price:p.price == null ? null : Number(p.price), stock:p.stock | 0, img:p.img || '', qty:1});
    return true;
  }
  function setQty(id, q){
    var it = find(id); if(!it) return;
    if(q <= 0) items = items.filter(function(x){ return x.id !== id; }); else it.qty = Math.min(cap(it), q);
    save();
  }
  function totals(){
    var t = {count:0, sum:0, ask:0};
    items.forEach(function(it){ t.count += it.qty; if(it.price == null) t.ask += it.qty; else t.sum += it.price * it.qty; });
    return t;
  }

  /* ---- text ---- */
  /* Bolívares, the way the shop writes them: 48.850 Bs (build-site.mjs fmt). */
  function money(n){
    var p = String(Math.round(n * 100) / 100).split('.');
    return p[0].replace(/\B(?=(\d{3})+(?!\d))/g, '.') + (p[1] ? ',' + (p[1] + '0').slice(0, 2) : '') + ' Bs';
  }
  function esc(s){ return String(s == null ? '' : s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }
  function plural(n, one, many){ return n + ' ' + (n === 1 ? one : many); }
  function parse(s){ try{ return JSON.parse(s); }catch(e){ return null; } }

  /* The WhatsApp message: one numbered line per product, quantities and
     prices, the estimated total, then whatever the order page adds (name,
     delivery, note). Product links only when the site is served over http,
     and dropped if the message would be too long for a wa.me link. */
  function message(extra, noLinks){
    var t = totals(), base = !noLinks && /^https?:$/.test(location.protocol) ? new URL(ROOT || './', location.href).href : '';
    var out = ['¡Hola, Alki House! Quiero hacer este pedido:', ''];
    items.forEach(function(it, i){
      out.push((i + 1) + '. ' + it.name);
      out.push('   ' + it.qty + ' x ' + (it.price == null ? 'precio a consultar' : money(it.price) + ' = ' + money(it.price * it.qty)));
      if(base) out.push('   ' + base + 'productos/' + it.slug + '.html');
    });
    out.push('', 'Artículos: ' + t.count);
    if(t.sum) out.push('Total estimado: ' + money(t.sum) + (t.ask ? ' (+ ' + plural(t.ask, 'artículo', 'artículos') + ' con precio a consultar)' : ''));
    else if(t.ask) out.push('Precios: a consultar');
    return out.concat(extra || []).join('\n');
  }
  function waUrl(text){ return 'https://wa.me/' + WA + '?text=' + encodeURIComponent(text); }

  /* ---- render ---- */
  function lineHtml(it){
    var href = ROOT + 'productos/' + it.slug + '.html', full = it.qty >= cap(it);
    return '<li class="cl" data-id="' + esc(it.id) + '">' +
      '<a class="cl-img" href="' + esc(href) + '" tabindex="-1" aria-hidden="true">' + (it.img ? '<img src="' + esc(ROOT + it.img) + '" alt="" loading="lazy">' : '') + '</a>' +
      '<div class="cl-main"><a class="cl-name" href="' + esc(href) + '">' + esc(it.name) + '</a>' +
        '<p class="cl-price mono">' + (it.price == null ? 'Precio a consultar' : money(it.price) + (it.qty > 1 ? ' c/u' : '')) + '</p>' +
        '<div class="cl-row"><div class="qty" role="group" aria-label="Cantidad de ' + esc(it.name) + '">' +
          '<button type="button" data-q="-1" aria-label="Quitar una unidad">&minus;</button><output>' + it.qty + '</output>' +
          '<button type="button" data-q="1" aria-label="Añadir una unidad"' + (full ? ' disabled' : '') + '>+</button></div>' +
          '<button type="button" class="cl-rm" data-rm>Quitar</button></div>' +
        (full && it.stock > 0 ? '<p class="cl-max mono">Son todas las que hay en stock</p>' : '') +
      '</div><b class="cl-sub">' + (it.price == null ? '&mdash;' : money(it.price * it.qty)) + '</b></li>';
  }
  function render(){
    var t = totals();
    lines.innerHTML = items.map(lineHtml).join('');
    empty.hidden = items.length > 0; foot.hidden = !items.length;
    totalEl.textContent = t.sum ? money(t.sum) : (t.ask ? 'A consultar' : money(0));
    note.hidden = !t.ask;
    if(t.ask) note.textContent = plural(t.ask, 'artículo', 'artículos') + ' con precio a consultar: te lo confirmamos por WhatsApp.';
    document.querySelectorAll('[data-cart-count]').forEach(function(n){ n.textContent = t.count; });
    document.querySelectorAll('.nav-cart').forEach(function(a){
      a.classList.toggle('has-items', t.count > 0);
      a.setAttribute('aria-label', 'Tu carrito, ' + plural(t.count, 'artículo', 'artículos'));
    });
    if(inCart && pdSlug){
      var mine = items.filter(function(it){ return it.slug === pdSlug.slug; })[0];
      inCart.hidden = !mine;
      if(mine) inCart.innerHTML = 'Ya tienes ' + mine.qty + ' en tu carrito · <button type="button" data-cart-open>Ver carrito</button>';
    }
    listeners.forEach(function(fn){ fn(t); });
  }

  /* ---- drawer ---- */
  function open(){
    if(el.classList.contains('is-open')) return;
    lastFocus = document.activeElement;
    el.classList.add('is-open'); el.setAttribute('aria-hidden', 'false');
    body.classList.add('is-locked'); if(W.smoother) W.smoother.paused(true);
    hideToast();
    setTimeout(function(){ panel.focus(); }, 60);
  }
  function close(){
    if(!el.classList.contains('is-open')) return;
    el.classList.remove('is-open'); el.setAttribute('aria-hidden', 'true');
    body.classList.remove('is-locked'); if(W.smoother) W.smoother.paused(false);
    if(lastFocus && lastFocus.focus) lastFocus.focus();
  }

  /* ---- feedback ---- */
  function showToast(html){
    if(!toast) return;
    toastText.innerHTML = html; toast.classList.add('is-on');
    clearTimeout(toastT); toastT = setTimeout(hideToast, 3600);
  }
  function hideToast(){ if(toast) toast.classList.remove('is-on'); }
  function flash(btn, ok){
    var label = btn.querySelector('span');
    btn.classList.add('is-added');
    if(label){ if(!btn.hasAttribute('data-label')) btn.setAttribute('data-label', label.textContent); label.textContent = ok ? 'Añadido' : 'Sin más stock'; }
    clearTimeout(btn._alkiT);
    btn._alkiT = setTimeout(function(){ btn.classList.remove('is-added'); if(label) label.textContent = btn.getAttribute('data-label'); }, 1600);
  }
  function bag(){
    var c = document.querySelectorAll('.nav-cart');
    for(var i = 0; i < c.length; i++) if(c[i].offsetParent) return c[i];
    return null;
  }
  /* A copy of the product shot drops into the bag. */
  function fly(src){
    var target = bag();
    if(!window.gsap || W.reduced || !src || !target) return;
    var a = src.getBoundingClientRect(), b = target.getBoundingClientRect();
    if(!a.width || a.bottom < 0 || a.top > window.innerHeight) return bump();
    var ghost = document.createElement('img');
    ghost.src = src.currentSrc || src.src; ghost.alt = ''; ghost.className = 'cart-ghost';
    ghost.style.left = a.left + 'px'; ghost.style.top = a.top + 'px'; ghost.style.width = a.width + 'px'; ghost.style.height = a.height + 'px';
    body.appendChild(ghost);
    gsap.to(ghost, {x: b.left + b.width / 2 - (a.left + a.width / 2), y: b.top + b.height / 2 - (a.top + a.height / 2),
      scale: Math.max(.06, 30 / a.width), opacity: .35, duration: .75, ease: 'power3.in',
      onComplete: function(){ ghost.remove(); bump(); }});
  }
  function bump(){
    if(window.gsap && !W.reduced) gsap.fromTo('.nav-cart', {scale:1}, {scale:1.2, duration:.16, yoyo:true, repeat:1, ease:'power2.out', overwrite:true});
  }
  function sourceImg(btn){
    var scope = btn.closest('.pcard, .stage-slide, .set-card');
    if(scope) return scope.querySelector('.pcard-main, .stage-fig img, .set-media img');
    return document.querySelector('.pd-shot.is-on img');
  }

  /* ---- one listener for every cart control on the page ---- */
  document.addEventListener('click', function(e){
    if(e.defaultPrevented) return; /* a drag on the product rail cancels its own click */
    var t = e.target;
    if(t.closest('[data-cart-open]')){ e.preventDefault(); open(); return; }
    if(t.closest('[data-cart-close]')){ close(); return; }
    var a = t.closest('[data-item]');
    if(a){
      e.preventDefault();
      var p = parse(a.getAttribute('data-item')); if(!p) return;
      var ok = add(p); save(); flash(a.tagName === 'BUTTON' ? a : (a.querySelector('button') || a), ok);
      if(ok){ fly(sourceImg(a)); showToast('<b>' + esc(p.name) + '</b> en tu carrito'); }
      else showToast('Ya tienes todas las unidades en stock de <b>' + esc(p.name) + '</b>');
      return;
    }
    var k = t.closest('[data-kit]');
    if(k){
      e.preventDefault();
      var list = parse(k.getAttribute('data-kit')) || [], n = 0;
      list.forEach(function(p){ if(add(p)) n++; });
      save(); flash(k, n > 0);
      if(n){ fly(sourceImg(k)); showToast(plural(n, 'pieza', 'piezas') + ' del kit en tu carrito'); }
      else showToast('Ya tienes todo el kit en tu carrito');
      return;
    }
    var line = t.closest('.cl');
    if(line){
      var id = line.getAttribute('data-id'), it = find(id), host = line.parentNode.id; if(!it) return;
      var q = t.closest('[data-q]');
      if(q){
        var dir = q.getAttribute('data-q');
        setQty(id, it.qty + parseInt(dir, 10));
        /* The list was re-rendered; keep focus on the same stepper. */
        var again = document.querySelector('#' + host + ' .cl[data-id="' + id + '"] [data-q="' + dir + '"]');
        if(again && !again.disabled) again.focus();
        return;
      }
      if(t.closest('[data-rm]')){ setQty(id, 0); return; }
    }
  });

  document.addEventListener('keydown', function(e){
    if(!el.classList.contains('is-open')) return;
    if(e.key === 'Escape'){ close(); return; }
    if(e.key !== 'Tab') return;
    /* Keep focus inside the open drawer. */
    var f = panel.querySelectorAll('a[href]:not([tabindex="-1"]),button:not([disabled])');
    if(!f.length) return;
    var first = f[0], last = f[f.length - 1];
    if(e.shiftKey && (document.activeElement === first || document.activeElement === panel)){ e.preventDefault(); last.focus(); }
    else if(!e.shiftKey && document.activeElement === last){ e.preventDefault(); first.focus(); }
  });

  /* Another tab changed the cart. */
  window.addEventListener('storage', function(e){ if(e.key === KEY){ items = load(); render(); } });

  render();
  window.ALKI_CART = {
    items: function(){ return items.slice(); }, totals: totals, money: money, message: message, waUrl: waUrl, lineHtml: lineHtml,
    clear: function(){ items = []; save(); }, onChange: function(fn){ listeners.push(fn); fn(totals()); }, open: open, close: close
  };
});
