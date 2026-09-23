(function(){
  var pre = document.querySelector('#dnm-pracTrack') ? 'dnm-' : '';
  var trackSel = '#'+pre+'pracTrack', cardCls='.'+pre+'path-card';
  var track=document.querySelector(trackSel);
  var root=document.querySelector('.dnm-practice')||document.querySelector('section#practice');
  var all=root.querySelectorAll(cardCls);
  return {
    trackFound: !!track,
    inTrack: track?track.querySelectorAll(cardCls).length:0,
    inSection: all.length,
    trackChildren: track?[].map.call(track.children,function(c){return c.tagName+'.'+String(c.className||'').slice(0,24)}):[],
    cardParents: [].map.call(all,function(c){return c.parentElement.tagName+'#'+(c.parentElement.id||'')+'.'+String(c.parentElement.className||'').slice(0,20)})
  };
})()
