(function(){
  var W=window.WZ;
  return {hasWZ: !!W, wzKeys: W?Object.keys(W).slice(0,20):null,
    reduced: W?W.reduced:null, canPin: W?W.canPin:null,
    matchReduced: matchMedia('(prefers-reduced-motion: reduce)').matches};
})()
