(async function(){
  var out={};
  var btn=[].filter.call(document.querySelectorAll('[class*="-faq__q"]'),function(q){return q.tagName==='BUTTON';})[0];
  if(btn){
    var panel=document.getElementById(btn.getAttribute('aria-controls'));
    var h=function(){return Math.round(panel.getBoundingClientRect().height)};
    var b={h:h(),e:btn.getAttribute('aria-expanded')};
    btn.click(); await new Promise(r=>setTimeout(r,900));
    var o={h:h(),e:btn.getAttribute('aria-expanded')};
    btn.click(); await new Promise(r=>setTimeout(r,900));
    var c={h:h(),e:btn.getAttribute('aria-expanded')};
    out.faq={closed:b,opened:o,reclosed:c,
      WORKS:(o.e==='true'&&o.h>b.h+20&&c.e==='false'&&c.h<o.h)};
  } else out.faq='no faq button';
  var opt=[].filter.call(document.querySelectorAll('[class*="-quiz__opt"]'),function(q){return q.tagName==='BUTTON';})[0];
  if(opt){
    var steps=function(){return [].map.call(document.querySelectorAll('[class*="-quiz__step"]'),function(s){return s.getAttribute('data-active')})};
    var before=steps();
    opt.click(); await new Promise(r=>setTimeout(r,1000));
    var after=steps();
    out.quiz={before:before,after:after,pressed:opt.getAttribute('aria-pressed'),
      WORKS:(before[0]==='true'&&after[0]!=='true'&&after.indexOf('true')>0)};
  } else out.quiz='no quiz button';
  return out;
})()
