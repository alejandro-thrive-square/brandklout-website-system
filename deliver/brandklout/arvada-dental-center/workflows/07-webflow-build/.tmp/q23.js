(function(){
  var p=document.querySelector('.nxd-offer__price')||document.querySelector('.offer__price');
  var out={html:p.outerHTML.slice(0,400), nodes:[], lines:0};
  var r=document.createRange(); r.selectNodeContents(p);
  out.lines=r.getClientRects().length;
  out.lineRects=[].map.call(r.getClientRects(),function(b){return Math.round(b.top)+','+Math.round(b.left)+' '+Math.round(b.width)+'x'+Math.round(b.height)});
  var walk=function(n,d){
    [].forEach.call(n.childNodes,function(c){
      if(c.nodeType===3){ if(c.textContent.trim()||c.textContent.length) out.nodes.push({d:d,type:'text',v:JSON.stringify(c.textContent).slice(0,25)}); return; }
      if(c.nodeType!==1) return;
      var cs=getComputedStyle(c), b=c.getBoundingClientRect();
      out.nodes.push({d:d,tag:c.tagName,cls:String(c.className||'').slice(0,20),display:cs.display,
        rect:Math.round(b.top)+','+Math.round(b.left)+' '+Math.round(b.width)+'x'+Math.round(b.height)});
      walk(c,d+1);
    });
  };
  walk(p,0);
  return out;
})()
