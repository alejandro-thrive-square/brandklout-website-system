(function(){
  var out={vw:innerWidth, htmlFS:getComputedStyle(document.documentElement).fontSize, h1:[]};
  document.querySelectorAll('h1').forEach(function(h){
    var cs=getComputedStyle(h);
    out.h1.push({cls:String(h.className||'').slice(0,30), fs:cs.fontSize, lh:cs.lineHeight,
      text:(h.textContent||'').replace(/\s+/g,' ').trim().slice(0,40)});
  });
  var q=document.querySelector('[data-quiz]');
  out.quiz = q ? {found:true, steps:q.querySelectorAll('[class*="quiz__step"]').length,
    activeAttr:(q.querySelector('[class*="quiz__step"]')||{}).getAttribute ? q.querySelector('[class*="quiz__step"]').getAttribute('data-active') : null} : {found:false};
  return out;
})()
