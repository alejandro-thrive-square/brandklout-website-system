(function(){
  var root=document.querySelector('.imp-arrival')||document.querySelector('section#arrival');
  if(!root) return null;
  var c=root.cloneNode(true);
  c.querySelectorAll('style,script').forEach(function(n){n.remove()});
  var out=[], w=document.createTreeWalker(c, NodeFilter.SHOW_TEXT, null), n;
  while((n=w.nextNode())){ var t=n.textContent.replace(/\s+/g,' ').trim(); if(t) out.push(t); }
  return {count:out.length, head:out.slice(0,3)};
})()
