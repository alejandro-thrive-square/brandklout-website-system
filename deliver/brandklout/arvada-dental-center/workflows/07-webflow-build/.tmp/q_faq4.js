(async function(){
  var out={};
  var els=document.querySelectorAll('[class*="-faq__q"]');
  var chev=0;
  els.forEach(function(el){ var a=getComputedStyle(el,'::after');
    if(a.content!=='none' && parseFloat(a.width)>2) chev++; });
  out.questions=[].filter.call(els,function(e){return e.tagName==='BUTTON'}).length;
  out.chevrons=chev;
  var btn=[].filter.call(els,function(e){return e.tagName==='BUTTON'})[0];
  var panel=document.getElementById(btn.getAttribute('aria-controls'));
  var h=function(){return Math.round(panel.getBoundingClientRect().height)};
  var rot=function(){return getComputedStyle(btn,'::after').transform;};
  var b={h:h(),exp:btn.getAttribute('aria-expanded'),t:rot()};
  btn.click(); await new Promise(r=>setTimeout(r,900));
  var o={h:h(),exp:btn.getAttribute('aria-expanded'),t:rot()};
  btn.click(); await new Promise(r=>setTimeout(r,900));
  var c={h:h(),exp:btn.getAttribute('exp')||btn.getAttribute('aria-expanded'),t:rot()};
  out.cycle={closed:b,opened:o,reclosed:c};
  out.WORKS = out.chevrons===out.questions && o.exp==='true' && o.h>b.h+20 && c.exp==='false' && o.t!==b.t;
  return out;
})()
