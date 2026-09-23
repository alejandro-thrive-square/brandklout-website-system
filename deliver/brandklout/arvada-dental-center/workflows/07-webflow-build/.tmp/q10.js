(function(){
  var el=document.querySelector('.imp-ch .imp-stage')||document.querySelector('.ch .stage');
  var out={vw:innerWidth, htmlFS:getComputedStyle(document.documentElement).fontSize};
  if(el){var cs=getComputedStyle(el);
    out.stage={padTop:cs.paddingTop,padBottom:cs.paddingBottom,
      wzroot:cs.getPropertyValue('--wz-root').trim().slice(0,60)};
    // what does 3.5 * --wz-root actually come to?
    var p=document.createElement('div');p.style.width='calc(3.5 * var(--wz-root, 16px))';el.appendChild(p);
    out.calc35=getComputedStyle(p).width;p.remove();
  }
  return out;
})()
