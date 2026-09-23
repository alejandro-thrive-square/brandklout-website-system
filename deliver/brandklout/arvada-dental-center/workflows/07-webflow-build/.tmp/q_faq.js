(async function(){
  var pre = document.querySelector('[class*="imp-faq"]') ? 'imp-' : '';
  var qs = document.querySelectorAll('.'+pre+'faq__q');
  var out = {prefix:pre, faqQ:qs.length, tags:[], results:[]};
  [].forEach.call(qs,function(q){ out.tags.push(q.tagName+'.'+String(q.className||'').slice(0,34)); });
  // click the first BUTTON-tagged .faq__q and watch its panel
  var btn = [].filter.call(qs,function(q){return q.tagName==='BUTTON';})[0];
  if(!btn){ out.error='no BUTTON .faq__q'; return out; }
  var panelId = btn.getAttribute('aria-controls');
  var panel = panelId ? document.getElementById(panelId) : null;
  out.panelId = panelId; out.panelFound = !!panel;
  if(!panel) return out;
  var h = function(){ return Math.round(panel.getBoundingClientRect().height); };
  out.results.push({stage:'before', h:h(), expanded:btn.getAttribute('aria-expanded')});
  btn.click();
  await new Promise(function(r){setTimeout(r,900)});
  out.results.push({stage:'afterClick', h:h(), expanded:btn.getAttribute('aria-expanded')});
  btn.click();
  await new Promise(function(r){setTimeout(r,900)});
  out.results.push({stage:'afterSecond', h:h(), expanded:btn.getAttribute('aria-expanded')});
  return out;
})()
