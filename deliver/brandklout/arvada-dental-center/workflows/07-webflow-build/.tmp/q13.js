(function(){
  var root=document.querySelector('.nxd-voices')||document.querySelector('section#voices');
  if(!root) return {err:'no voices'};
  function inv(c){return c.tagName==='STYLE'||c.tagName==='SCRIPT'}
  function isBr(c){return c.classList&&[].some.call(c.classList,function(n){return /(^|-)br-line$/.test(n)})}
  function kids(el){var o=[];[].forEach.call(el.children,function(c){
    if(inv(c))return;
    if(c.classList&&c.classList.contains('w-embed')){var i2=[].filter.call(c.children,function(g){return !inv(g)});
      if(!i2.length)return;o.push.apply(o,kids(c));return;}
    o.push(c); if(isBr(c))o.push.apply(o,kids(c));});return o;}
  var n=root, idx=[0,1,2,1];
  for(var i=0;i<idx.length;i++){ n=kids(n)[idx[i]]; if(!n) return {err:'broke at '+i}; }
  var cs=getComputedStyle(n);
  return {tag:n.tagName, cls:String(n.className||''), marginTop:cs.marginTop,
    parentCls:String(n.parentElement.className||''), prevTag:n.previousElementSibling&&n.previousElementSibling.tagName,
    prevCls:n.previousElementSibling&&String(n.previousElementSibling.className||''), vw:innerWidth};
})()
