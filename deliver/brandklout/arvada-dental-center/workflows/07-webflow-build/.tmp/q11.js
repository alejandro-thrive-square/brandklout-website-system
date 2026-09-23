(function(){
  var root=document.querySelector('.imp-path')||document.querySelector('section#path');
  if(!root) return {err:'no path section'};
  function inv(c){return c.tagName==='STYLE'||c.tagName==='SCRIPT'}
  function isBr(c){return c.classList&&[].some.call(c.classList,function(n){return /(^|-)br-line$/.test(n)})}
  function kids(el){var o=[];[].forEach.call(el.children,function(c){
    if(inv(c))return;
    if(c.classList&&c.classList.contains('w-embed')){var i2=[].filter.call(c.children,function(g){return !inv(g)});
      if(!i2.length)return;o.push.apply(o,kids(c));return;}
    o.push(c); if(isBr(c))o.push.apply(o,kids(c));});return o;}
  var el=kids(root)[0];
  var cs=getComputedStyle(el);
  return {tag:el.tagName, cls:String(el.className&&el.className.baseVal!==undefined?el.className.baseVal:el.className),
    padTop:cs.paddingTop, padBottom:cs.paddingBottom, htmlFS:getComputedStyle(document.documentElement).fontSize};
})()
