(function(){
  var p=document.querySelector('.nxd-offer__price')||document.querySelector('.offer__price');
  if(!p) return {err:'no price'};
  var sup=p.querySelector('sup'), num=p.querySelector('span:not(.w-embed)');
  var R=function(e){var b=e.getBoundingClientRect();return {t:Math.round(b.top),l:Math.round(b.left),w:Math.round(b.width),h:Math.round(b.height)};};
  return {price:R(p), sup:R(sup), num:num?R(num):null,
    sameLine: sup && num ? Math.abs(sup.getBoundingClientRect().top-num.getBoundingClientRect().top)<40 : null,
    text:p.textContent.trim()};
})()
