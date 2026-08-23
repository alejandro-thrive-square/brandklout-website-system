(function(){
  var card=document.querySelector('.nxd-path-card')||document.querySelector('.path-card');
  if(!card) return {err:'no card'};
  var bq=card.querySelector('blockquote');
  var who=card.querySelector('.nxd-who')||card.querySelector('.who');
  var r=function(e){var b=e.getBoundingClientRect();return Math.round(b.width)+'x'+Math.round(b.height)};
  return {card:r(card), blockquote:r(bq), who:r(who),
    bqFS:getComputedStyle(bq).fontSize, bqLH:getComputedStyle(bq).lineHeight,
    cards:document.querySelectorAll('.nxd-path-card,.path-card').length, vw:innerWidth};
})()
