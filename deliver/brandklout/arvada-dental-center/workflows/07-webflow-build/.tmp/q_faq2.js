(async function(){
  var out={faq:null, quiz:null};
  var btn=[].filter.call(document.querySelectorAll('[class*="-faq__q"]'),function(q){return q.tagName==='BUTTON';})[0];
  if(btn){
    var panel=document.getElementById(btn.getAttribute('aria-controls'));
    var h=function(){return Math.round(panel.getBoundingClientRect().height)};
    var before={h:h(),exp:btn.getAttribute('aria-expanded')};
    btn.click(); await new Promise(r=>setTimeout(r,900));
    var open={h:h(),exp:btn.getAttribute('aria-expanded')};
    btn.click(); await new Promise(r=>setTimeout(r,900));
    var shut={h:h(),exp:btn.getAttribute('aria-expanded')};
    out.faq={before:before, afterClick:open, afterSecond:shut,
      WORKS: open.exp==='true' && open.h>before.h && shut.exp==='false'};
  }
  var opt=document.querySelector('[class*="-quiz__opt"]');
  if(opt){
    var step=opt.closest('[class*="-quiz__step"]');
    var beforeActive=step?step.getAttribute('data-active'):null;
    opt.click(); await new Promise(r=>setTimeout(r,900));
    var steps=[].map.call(document.querySelectorAll('[class*="-quiz__step"]'),function(s){return s.getAttribute('data-active')});
    out.quiz={beforeActive:beforeActive, stepStatesAfterClick:steps,
      pressed:opt.getAttribute('aria-pressed'),
      WORKS: steps.filter(function(x){return x==='true'}).length===1 && steps[0]!=='true'};
  }
  return out;
})()
