(function(){
  var sel = document.querySelector('.imp-path .imp-pin') ? '.imp-path .imp-pin' : '#path .pin';
  var els = document.querySelectorAll(sel);
  var out={sel:sel, n:els.length, htmlFS:getComputedStyle(document.documentElement).fontSize, vw:innerWidth, items:[]};
  [].forEach.call(els,function(e){
    var cs=getComputedStyle(e);
    out.items.push({cls:String(e.className&&e.className.baseVal!==undefined?e.className.baseVal:e.className).slice(0,40),
      padTop:cs.paddingTop, parent:String(e.parentElement.className||'').slice(0,30)});
  });
  return out;
})()
