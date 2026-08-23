(function(){
  var root=document.querySelector('.dnm-practice')||document.querySelector('section#practice');
  if(!root) return {err:'no practice'};
  function inv(c){return c.tagName==='STYLE'||c.tagName==='SCRIPT'}
  function isBr(c){return c.classList&&[].some.call(c.classList,function(n){return /(^|-)br-line$/.test(n)})}
  function kids(el){var o=[];[].forEach.call(el.children,function(c){
    if(inv(c))return;
    if(c.classList&&c.classList.contains('w-embed')){var i2=[].filter.call(c.children,function(g){return !inv(g)});
      if(!i2.length)return;o.push.apply(o,kids(c));return;}
    o.push(c); if(isBr(c))o.push.apply(o,kids(c));});return o;}
  var n=root, idx=[0,1,3];
  for(var i=0;i<idx.length;i++){ n=kids(n)[idx[i]]; if(!n) return {err:'broke at '+i}; }
  var cs=getComputedStyle(n);
  var attrs={}; [].forEach.call(n.attributes,function(a){attrs[a.name]=a.value.slice(0,40)});
  // all siblings, to see which one is "active"
  var sibs=[].map.call(n.parentElement.children,function(c){
    var s=getComputedStyle(c);
    return {tag:c.tagName,cls:String(c.className||'').slice(0,26),btw:s.borderTopWidth,btc:s.borderTopColor};
  });
  return {tag:n.tagName, cls:String(n.className||''), attrs:attrs,
    borderTopWidth:cs.borderTopWidth, borderTopColor:cs.borderTopColor,
    borderTopStyle:cs.borderTopStyle, siblings:sibs};
})()
