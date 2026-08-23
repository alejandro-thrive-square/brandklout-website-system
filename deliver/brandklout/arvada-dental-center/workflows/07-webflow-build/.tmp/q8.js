(function(){
  var root=document.querySelector('.imp-sec-footer')||document.querySelector('footer.ftr');
  if(!root) return {err:'no footer'};
  function kids(el){var o=[];[].forEach.call(el.children,function(c){
    if(c.tagName==='STYLE'||c.tagName==='SCRIPT')return;
    if(c.classList&&c.classList.contains('w-embed')){var inner=[].filter.call(c.children,function(g){return g.tagName!=='STYLE'&&g.tagName!=='SCRIPT'});
      if(!inner.length)return; o.push.apply(o,kids(c)); return;}
    o.push(c);});return o;}
  // walk to path /0/0/0/1
  var n=root; var idx=[0,0,0,1];
  for(var i=0;i<idx.length;i++){ n=kids(n)[idx[i]]; if(!n) return {err:'path broke at '+i}; }
  var chain=[];
  var e=n;
  while(e && e!==document.documentElement.parentElement){
    var cs=getComputedStyle(e);
    chain.push({tag:e.tagName,cls:String(e.className&&e.className.baseVal!==undefined?e.className.baseVal:(e.className||'')).slice(0,40),
      fs:cs.fontSize, lh:cs.lineHeight});
    e=e.parentElement;
  }
  return chain;
})()
