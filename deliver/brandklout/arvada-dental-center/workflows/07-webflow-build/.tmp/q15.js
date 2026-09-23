(function(){
  var cards=document.querySelectorAll('.nxd-path-card,.path-card');
  return [].map.call(cards,function(c,i){
    var who=c.querySelector('.nxd-who')||c.querySelector('.who');
    var bq=c.querySelector('blockquote');
    var R=function(e){var b=e.getBoundingClientRect();return Math.round(b.height)};
    return {i:i, cardH:R(c), bqH:R(bq), whoH:R(who),
      whoMT:getComputedStyle(who).marginTop,
      whoTop:Math.round(who.getBoundingClientRect().top - c.getBoundingClientRect().top)};
  });
})()
