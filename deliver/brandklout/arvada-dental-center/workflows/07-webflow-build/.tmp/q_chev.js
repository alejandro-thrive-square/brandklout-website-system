(function(){
  var out=[];
  document.querySelectorAll('[class*="-faq__q"]').forEach(function(el){
    var a=getComputedStyle(el,'::after');
    var cs=getComputedStyle(el);
    out.push({tag:el.tagName, cls:String(el.className||'').slice(0,30),
      display:cs.display,
      afterContent:a.content, afterW:a.width, afterH:a.height,
      afterBorder:a.borderRightWidth+' '+a.borderBottomWidth,
      rendersChevron: a.content!=='none' && parseFloat(a.width)>2});
  });
  return {total:out.length, chevrons:out.filter(function(o){return o.rendersChevron}).length, items:out.slice(0,4)};
})()
