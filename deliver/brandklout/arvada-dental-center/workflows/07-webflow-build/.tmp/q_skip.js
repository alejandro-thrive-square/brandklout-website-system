(function(){
  var a=document.getElementById('skip');
  if(!a) return {err:'no #skip'};
  var r=a.getBoundingClientRect();
  var cs=getComputedStyle(a);
  var before={left:Math.round(r.left), visible:r.left>-500, text:a.textContent.trim(), href:a.getAttribute('href')};
  a.focus();
  var r2=a.getBoundingClientRect();
  return {before:before, afterFocus:{left:Math.round(r2.left), visible:r2.left>-500},
    target:!!document.getElementById((a.getAttribute('href')||'').slice(1)),
    zIndex:cs.zIndex, bg:cs.backgroundColor,
    WORKS: before.left<-500 && r2.left>-10 && before.text==='Skip to content'};
})()
