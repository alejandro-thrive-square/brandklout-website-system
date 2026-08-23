(function(){
  var root=document.querySelector('.imp-arrival')||document.querySelector('section#arrival');
  function invisible(c){return c.tagName==='STYLE'||c.tagName==='SCRIPT'}
  function isBr(c){return c.classList&&[].some.call(c.classList,function(n){return /(^|-)br-line$/.test(n)})}
  function kids(el){var o=[];[].forEach.call(el.children,function(c){
    if(invisible(c))return;
    if(c.classList&&c.classList.contains('w-embed')){
      var inner=[].filter.call(c.children,function(g){return !invisible(g)});
      if(!inner.length)return; o.push.apply(o,kids(c)); return;}
    o.push(c); if(isBr(c)) o.push.apply(o,kids(c));});return o;}
  var n=root, idx=[1,1,1,6,1,0];
  for(var i=0;i<idx.length;i++){ n=kids(n)[idx[i]]; if(!n) return {err:'broke at '+i}; }
  var cs=getComputedStyle(n);
  return {tag:n.tagName, type:n.getAttribute('type'), name:n.getAttribute('name'),
    display:cs.display, visibility:cs.visibility,
    rect:n.getBoundingClientRect().width+'x'+n.getBoundingClientRect().height};
})()
