(function(){
  var cards=document.querySelectorAll('.nxd-path-card,.path-card');
  return [2].map(function(i){
    var c=cards[i], bq=c.querySelector('blockquote');
    var cs=getComputedStyle(bq), cc=getComputedStyle(c);
    return {rectH:Math.round(bq.getBoundingClientRect().height), scrollH:bq.scrollHeight,
      offsetH:bq.offsetHeight, cssHeight:cs.height, maxH:cs.maxHeight, overflow:cs.overflow,
      lineClamp:cs.webkitLineClamp, display:cs.display, transform:cs.transform,
      cardDisplay:cc.display, cardRows:cc.gridTemplateRows, cardTransform:cc.transform,
      inlineStyle:bq.getAttribute('style')};
  });
})()
