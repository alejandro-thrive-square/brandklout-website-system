(async function(){
  var root=document.querySelector('.dnm-practice')||document.querySelector('section#practice');
  var cards=root.querySelectorAll('.dnm-path-card,.path-card');
  // scroll the section into view and let any scrubbed state settle
  cards[0].scrollIntoView({block:'center'});
  await new Promise(function(r){setTimeout(r,2500)});
  var read=function(){return [].map.call(cards,function(c){
    var s=getComputedStyle(c);
    return s.borderTopColor+' | shadow:'+(s.boxShadow||'').slice(0,28);
  })};
  var a=read();
  // scroll a little further and back, then settle again
  window.scrollBy(0,300); await new Promise(function(r){setTimeout(r,1200)});
  window.scrollBy(0,-300); await new Promise(function(r){setTimeout(r,2500)});
  return {afterScrollIntoView:a, afterNudge:read()};
})()
