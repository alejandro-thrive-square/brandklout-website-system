(function(){
  var p=document.querySelector('.nxd-offer__price');
  if(!p) return {err:'no price'};
  var out={priceTag:p.tagName, priceDisplay:getComputedStyle(p).display, children:[]};
  [].forEach.call(p.children,function(c){
    var cs=getComputedStyle(c);
    out.children.push({tag:c.tagName, cls:String(c.className||''), display:cs.display, float:cs.float});
  });
  var emb=p.querySelector('.w-embed');
  if(emb) out.embed={display:getComputedStyle(emb).display, parentTag:emb.parentElement.tagName,
    matches:emb.matches('span > div.w-embed')};
  return out;
})()
