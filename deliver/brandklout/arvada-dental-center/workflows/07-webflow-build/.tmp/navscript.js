<script data-embed="section-js">(function () {
if (window.WZSR) return;
var CDN = window.WZSR_CDN || 'https://cdn.jsdelivr.net/npm/gsap@3.13.0/dist/';
var FILES = ['gsap.min.js', 'ScrollTrigger.min.js', 'SplitText.min.js'];
var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
var pending = [];
var ready = null;
function load(src) {
return new Promise(function (res, rej) {
var existing = document.querySelector('script[data-wzsr="' + src + '"]');
if (existing) {
if (existing.getAttribute('data-loaded') === '1') return res();
existing.addEventListener('load', function () { res(); });
existing.addEventListener('error', rej);
return;
}
var s = document.createElement('script');
s.src = src;
s.async = false;                 // order matters: plugins need the core
s.setAttribute('data-wzsr', src);
s.onload = function () { s.setAttribute('data-loaded', '1'); res(); };
s.onerror = rej;
document.head.appendChild(s);
});
}
function ensure() {
if (ready) return ready;
ready = (window.gsap && window.ScrollTrigger)
? Promise.resolve()
: FILES.reduce(function (p, f) { return p.then(function () { return load(CDN + f); }); }, Promise.resolve());
return ready.then(function () {
if (!window.gsap || !window.ScrollTrigger) throw new Error('GSAP unavailable');
if (!WZSR._registered) {
gsap.registerPlugin(ScrollTrigger);
if (window.SplitText) gsap.registerPlugin(SplitText);
WZSR._registered = true;
}
});
}
function splitLines(el, build) {
if (!el || !window.SplitText) return null;
try {
var opts = { type: 'lines', mask: 'lines', linesClass: 'wz-line', autoSplit: true };
if (build) opts.onSplit = function (self) { return build(self); };
return (SplitText.create ? SplitText.create(el, opts) : new SplitText(el, opts));
} catch (e) {
try { return new SplitText(el, { type: 'lines', linesClass: 'wz-line' }); }
catch (e2) { return null; }
}
}
function splitWords(el) {
if (!el || !window.SplitText) return null;
try {
var opts = { type: 'words', wordsClass: 'wz-word' };
return (SplitText.create ? SplitText.create(el, opts) : new SplitText(el, opts));
} catch (e) { return null; }
}
function sweepWords(tl, el, vars) {
vars = vars || {};
var accent = vars.accent || '#03c5ec';
var tailN = vars.tail == null ? 5 : vars.tail;
var step = vars.step || .3;
var dur = vars.duration || step * 2.4;
var at = vars.at || 0;
var sp = splitWords(el);
var words = (sp && sp.words && sp.words.length) ? sp.words : null;
if (!words) {
var fb = Math.max(2, dur);
tl.from(el, { opacity: .2, ease: 'none', duration: fb }, at);
return { end: at + fb, tail: at + fb * .6 };
}
var cut = Math.max(0, words.length - tailN);
var body = words.slice(0, cut), tail = words.slice(cut);
var tailAt = at + cut * step;
if (body.length) tl.to(body, { color: '#ffffff', stagger: step, duration: dur, ease: 'none' }, at);
if (tail.length) tl.to(tail, { color: accent, stagger: step, duration: dur, ease: 'none' }, tailAt);
return { end: at + (words.length - 1) * step + dur, tail: tailAt };
}
function headline(el, vars) {
vars = vars || {};
if (!el) return null;
var start = vars.start || 'top 84%';
var split = splitLines(el, function (self) {
return gsap.from(self.lines, {
yPercent: 108, duration: 1.05, stagger: .085, ease: 'power4.out',
scrollTrigger: vars.trigger === false ? null : { trigger: el, start: start }
});
});
if (!split) {
gsap.from(el, {
opacity: 0, y: 30, duration: .9, ease: 'power3.out',
scrollTrigger: vars.trigger === false ? null : { trigger: el, start: start }
});
}
return split;
}
var canPin = window.matchMedia('(min-width: 900px)').matches;
function scene(trigger, vars) {
vars = vars || {};
if (canPin) {
return {
trigger: trigger, start: 'top top',
end: '+=' + Math.round(window.innerHeight * (vars.run || 2.4)),
pin: true, scrub: vars.scrub == null ? .3 : vars.scrub,
anticipatePin: 1, invalidateOnRefresh: true, onUpdate: vars.onUpdate
};
}
return {
trigger: trigger, start: vars.startFlow || 'top 78%',
end: vars.endFlow || 'bottom 35%',
scrub: vars.scrub == null ? .45 : vars.scrub,
invalidateOnRefresh: true, onUpdate: vars.onUpdate
};
}
function rail(pin, track, bar, light) {
if (pin) { pin.style.height = 'auto'; pin.style.minHeight = '0'; pin.style.paddingBlock = 'clamp(3rem,6vw,5rem)'; }
if (!track) return;
track.setAttribute('data-rail', 'on');
if (bar) {
var paint = function () {
var max = track.scrollWidth - track.clientWidth;
bar.style.transform = 'scaleX(' + (max > 0 ? track.scrollLeft / max : 0).toFixed(4) + ')';
};
track.addEventListener('scroll', paint, { passive: true });
window.addEventListener('resize', paint);
paint();
}
if (typeof light === 'function' && window.IntersectionObserver) {
var io = new IntersectionObserver(function (es) {
es.forEach(function (e) { light(e.target, e.target.querySelector('.shot img, img'), e.isIntersecting); });
}, { root: track, threshold: .55 });
Array.prototype.forEach.call(track.children, function (c) { io.observe(c); });
}
}
function behaviours(root) {
var stat = root.querySelectorAll('[data-status]');
var swap = root.querySelectorAll('[data-status-swap]');
if (stat.length || swap.length) {
var open = false;
try {
var parts = new Intl.DateTimeFormat('en-US', {
timeZone: 'America/Denver', weekday: 'short', hour: 'numeric', minute: 'numeric', hour12: false
}).formatToParts(new Date());
var get = function (t) { var p = parts.find(function (x) { return x.type === t; }); return p ? p.value : ''; };
var mins = parseInt(get('hour'), 10) * 60 + parseInt(get('minute'), 10);
open = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'].indexOf(get('weekday')) > -1 && mins >= 480 && mins < 1020;
} catch (e) { open = false; }
stat.forEach(function (n) {
n.setAttribute('data-open', String(open));
var t = n.querySelector('[data-status-text]');
if (t) t.textContent = open ? 'Open now' : 'Closed · Mon–Fri 8–5';
});
swap.forEach(function (n) {
var msg = n.getAttribute(open ? 'data-open-text' : 'data-closed-text');
if (msg) n.textContent = msg;
});
}
root.querySelectorAll('.faq__q').forEach(function (btn) {
btn.addEventListener('click', function () {
var item = btn.closest('.faq__item');
btn.setAttribute('aria-expanded', String(item.classList.toggle('is-open')));
});
});
root.querySelectorAll('[data-quiz]').forEach(function (host) {
var box = host.querySelector('.quiz');
if (!box) return;
var steps = Array.prototype.slice.call(box.querySelectorAll('.quiz__step'));
var live = box.querySelector('[data-quiz-live]');
var fill = box.querySelector('.quiz__progress i');
var out = box.querySelector('[data-quiz-answers]');
var answers = {}, idx = 0;
function show(n) {
idx = Math.max(0, Math.min(steps.length, n));
steps.forEach(function (s, i) { s.setAttribute('data-active', String(i === idx)); });
box.classList.toggle('is-done', idx >= steps.length);
if (fill) fill.style.width = Math.round((idx / steps.length) * 100) + '%';
if (live) live.textContent = idx >= steps.length
? 'All questions answered. Please leave your details.'
: 'Question ' + (idx + 1) + ' of ' + steps.length;
}
steps.forEach(function (step) {
var name = step.getAttribute('data-name');
step.querySelectorAll('.quiz__opt').forEach(function (opt) {
opt.addEventListener('click', function () {
step.querySelectorAll('.quiz__opt').forEach(function (o) { o.setAttribute('aria-pressed', 'false'); });
opt.setAttribute('aria-pressed', 'true');
answers[name] = opt.getAttribute('data-value');
if (out) out.value = JSON.stringify(answers);
setTimeout(function () { show(idx + 1); }, 190);
});
});
var back = step.querySelector('.quiz__back');
if (back) back.addEventListener('click', function () { show(idx - 1); });
});
show(0);
});
root.querySelectorAll('form[data-lead]').forEach(function (form) {
form.addEventListener('submit', function (e) {
e.preventDefault();
var ok = true;
form.querySelectorAll('[required]').forEach(function (input) {
var field = input.closest('.field');
var err = field ? field.querySelector('.field__err') : null;
var bad = !input.value.trim() ||
(input.type === 'email' && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(input.value)) ||
(input.type === 'tel' && input.value.replace(/\D/g, '').length < 10);
if (field) field.classList.toggle('is-bad', bad);
if (err) err.textContent = bad
? (input.type === 'tel' ? 'Please enter a phone number we can reach you on.' : 'This field is required.')
: '';
if (bad) ok = false;
});
if (!ok) { var f = form.querySelector('.is-bad input'); if (f) f.focus(); return; }
var payload = { form: form.getAttribute('data-lead'), page: location.pathname, at: new Date().toISOString() };
new FormData(form).forEach(function (v, k) { payload[k] = v; });
(window.__arvadaLeads = window.__arvadaLeads || []).push(payload);
var done = document.createElement('div');
done.className = 'form-ok';
done.setAttribute('role', 'status');
done.textContent = form.getAttribute('data-thanks') || 'Thank you — we will be in touch.';
form.replaceWith(done);
});
});
var y = String(new Date().getFullYear());
root.querySelectorAll('[data-year]').forEach(function (n) { n.textContent = y; });
root.querySelectorAll('a[href^="#"]').forEach(function (a) {
a.addEventListener('click', function (e) {
var id = a.getAttribute('href');
if (!id || id.length < 2) return;
var t = document.querySelector(id);
if (!t) return;
e.preventDefault();
var top = t.getBoundingClientRect().top + window.scrollY - 80;
window.scrollTo({ top: top, behavior: reduced ? 'auto' : 'smooth' });
});
});
}
function generic(root, W) {
root.querySelectorAll('[data-rv]').forEach(function (el) {
if (el.parentElement && el.parentElement.closest('[data-rv]')) return;
var mode = el.getAttribute('data-rv');
var targets = mode === 'stagger' ? el.children : el;
gsap.set(el, { opacity: 1 });
if (W.reduced) { gsap.set(targets, { opacity: 1, y: 0 }); return; }
gsap.from(targets, {
opacity: 0, y: 32, duration: .95, ease: 'power3.out',
stagger: mode === 'stagger' ? parseFloat(el.getAttribute('data-stagger') || .09) : 0,
scrollTrigger: { trigger: el, start: 'top 88%' }
});
});
root.querySelectorAll('[data-count]').forEach(function (el) {
var target = parseFloat(String(el.getAttribute('data-count')).replace(/[^0-9.]/g, ''));
var prefix = el.getAttribute('data-prefix') || '';
var suffix = el.getAttribute('data-suffix') || '';
var dec = parseInt(el.getAttribute('data-decimals') || '0', 10);
var paint = function (v) {
el.textContent = prefix + v.toLocaleString('en-US',
{ minimumFractionDigits: dec, maximumFractionDigits: dec }) + suffix;
};
if (W.reduced) { paint(target); return; }
var o = { v: 0 };
gsap.to(o, {
v: target, duration: 1.8, ease: 'power2.out',
onUpdate: function () { paint(o.v); },
scrollTrigger: { trigger: el, start: 'top 90%' }
});
});
if (!W.reduced && window.matchMedia('(hover:hover) and (pointer:fine)').matches) {
root.querySelectorAll('.magnetic').forEach(function (el) {
var xTo = gsap.quickTo(el, 'x', { duration: .5, ease: 'power3' }),
yTo = gsap.quickTo(el, 'y', { duration: .5, ease: 'power3' });
el.addEventListener('pointermove', function (e) {
var r = el.getBoundingClientRect();
xTo((e.clientX - r.left - r.width / 2) * .2);
yTo((e.clientY - r.top - r.height / 2) * .34);
});
el.addEventListener('pointerleave', function () { xTo(0); yTo(0); });
});
}
}
function chrome(root, opts) {
opts = opts || {};
if (opts.nav) {
var nav = root;
var onScroll = function () { nav.classList.toggle('solid', window.scrollY > 40); };
window.addEventListener('scroll', onScroll, { passive: true });
onScroll();
var prog = root.querySelector(opts.progress || '[data-wz-progress]');
if (prog) {
var paintProg = function () {
var max = document.documentElement.scrollHeight - window.innerHeight;
prog.style.transform = 'scaleX(' + (max > 0 ? Math.min(1, window.scrollY / max) : 0).toFixed(4) + ')';
};
window.addEventListener('scroll', paintProg, { passive: true });
window.addEventListener('resize', paintProg);
paintProg();
}
var chName = root.querySelector(opts.chapterName || '[data-wz-chapter-name]');
var chBar = root.querySelector(opts.chapterBar || '[data-wz-chapter-bar]');
var chapters = Array.prototype.slice.call(document.querySelectorAll('[data-chapter-name]'));
if ((chName || chBar) && chapters.length && window.IntersectionObserver) {
var last = chapters.length - 1;
var io = new IntersectionObserver(function (entries) {
entries.forEach(function (e) {
if (!e.isIntersecting) return;
var i = chapters.indexOf(e.target);
if (chName) chName.textContent = e.target.getAttribute('data-chapter-name') || '';
if (chBar) chBar.style.setProperty('--p', (last ? i / last : 0).toFixed(3));
});
}, { rootMargin: '-45% 0px -45% 0px' });
chapters.forEach(function (c) { io.observe(c); });
}
}
if (opts.actionbar) {
var bar = root;
var tick = function () { bar.classList.toggle('is-on', window.scrollY > window.innerHeight * 0.6); };
window.addEventListener('scroll', tick, { passive: true });
window.addEventListener('resize', tick);
tick();
}
}
var refreshTimer = null;
function refresh() {
if (refreshTimer) return;
refreshTimer = setTimeout(function () {
refreshTimer = null;
if (window.ScrollTrigger) ScrollTrigger.refresh();
}, 60);
}
var WZSR = window.WZSR = {
_registered: false,
chrome: chrome,
refresh: refresh,
section: function (rootSel, setup) {
pending.push({ sel: rootSel, setup: setup });
if (document.readyState === 'loading') {
document.addEventListener('DOMContentLoaded', WZSR._go, { once: true });
} else {
WZSR._go();
}
},
_go: function () {
var batch = pending.splice(0, pending.length);
if (!batch.length) return;
batch.forEach(function (job) {
document.querySelectorAll(job.sel).forEach(function (root) {
if (root.getAttribute('data-wzsr') === 'on') return;
root.setAttribute('data-wzsr', 'on');
try { behaviours(root); } catch (e) { console.error('[WZSR behaviours]', e); }
job._roots = (job._roots || []).concat([root]);
});
});
ensure().then(function () {
var W = {
reduced: reduced, ok: true, canPin: canPin,
scene: scene, rail: rail, headline: headline,
splitLines: splitLines, splitWords: splitWords, sweepWords: sweepWords
};
batch.forEach(function (job) {
(job._roots || []).forEach(function (root) {
root.setAttribute('data-wzsr', 'motion');
try { generic(root, W); } catch (e) { console.error('[WZSR generic]', e); }
try { job.setup(W, root); } catch (e) { console.error('[WZSR section]', e); }
});
});
refresh();
requestAnimationFrame(refresh);
if (document.fonts && document.fonts.ready) document.fonts.ready.then(refresh);
window.addEventListener('load', refresh);
batch.forEach(function (job) {
(job._roots || []).forEach(function (root) {
root.querySelectorAll('img').forEach(function (img) {
if (img.complete) return;
img.addEventListener('load', refresh, { once: true });
img.addEventListener('error', refresh, { once: true });
});
if (window.ResizeObserver) {
var last = 0;
new ResizeObserver(function (es) {
var h = Math.round(es[0].contentRect.height);
if (Math.abs(h - last) < 4) return;
last = h; refresh();
}).observe(root);
}
});
});
}).catch(function (e) {
console.warn('[WZSR] motion unavailable', e);
batch.forEach(function (job) {
(job._roots || []).forEach(function (root) {
root.setAttribute('data-wzsr', 'static');
root.querySelectorAll('[data-rv],[data-anim="hide"]').forEach(function (el) {
el.style.opacity = '1'; el.style.visibility = 'visible';
});
});
});
});
}
};
})();
(function () {
  var go = function () {
    document.querySelectorAll('.imp-sec-nav').forEach(function (r) {
      if (r.getAttribute('data-wz-chrome') === 'on') return;
      r.setAttribute('data-wz-chrome', 'on');
      WZSR.chrome(r, { nav: true, progress: '#imp-navProgress', chapterName: '#imp-navChName', chapterBar: '#imp-navChBar' });
    });
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', go, { once: true });
  else go();
})();

WZSR.section('.imp-sec-nav', function (W, __r) {
  var __q = function (s) { return (__r.matches && __r.matches(s)) ? __r : __r.querySelector(s); };
  var __qa = function (s) {
    var out = Array.prototype.slice.call(__r.querySelectorAll(s));
    if (__r.matches && __r.matches(s)) out.unshift(__r);
    return out;
  };

});
