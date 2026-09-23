(function(){
  var pre = document.querySelector('#dnm-pracTrack') ? 'dnm-' : '';
  var track=document.querySelector('#'+pre+'pracTrack');
  var W=window.WZ||{};
  var cards=track.querySelectorAll('.'+pre+'path-card');
  return {
    reduced: W.reduced, canPin: W.canPin,
    innerWidth: window.innerWidth,
    trackScrollWidth: track.scrollWidth, trackClientWidth: track.clientWidth,
    trackOverflowX: getComputedStyle(track).overflowX,
    trackScrollLeft: track.scrollLeft,
    cardWidths: [].map.call(cards,function(c){return Math.round(c.getBoundingClientRect().width)}),
    cardLefts: [].map.call(cards,function(c){return Math.round(c.getBoundingClientRect().left)}),
    distance: Math.max(0, track.scrollWidth - window.innerWidth + 40)
  };
})()
