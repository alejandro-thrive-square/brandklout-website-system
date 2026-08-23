(function(){
  var p=document.querySelector('.nxd-offer__price')||document.querySelector('.offer__price');
  var sup=p.querySelector('sup');
  var cs=getComputedStyle(sup);
  return {display:cs.display, verticalAlign:cs.verticalAlign, fontSize:cs.fontSize,
    position:cs.position, float:cs.float, width:cs.width, lineHeight:cs.lineHeight,
    priceDisplay:getComputedStyle(p).display, priceFS:getComputedStyle(p).fontSize};
})()
