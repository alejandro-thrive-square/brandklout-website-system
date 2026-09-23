(async function(){
  var root=document.querySelector('.dnm-practice')||document.querySelector('section#practice');
  var cards=root.querySelectorAll('.dnm-path-card,.path-card');
  var top=root.getBoundingClientRect().top + (window.scrollY||document.documentElement.scrollTop);
  var h=root.offsetHeight;
  var lit=function(){return [].map.call(cards,function(c){
    return getComputedStyle(c).borderTopColor.indexOf('2, 153, 182')>=0?1:0;}).join('');};
  var out={sectionTop:Math.round(top), sectionH:h, steps:[], everLit:[0,0,0,0]};
  for(var f=0; f<=1.001; f+=0.1){
    window.scrollTo(0, Math.round(top + h*f));
    await new Promise(function(r){setTimeout(r,700)});
    var s=lit();
    out.steps.push(f.toFixed(1)+':'+s);
    for(var i=0;i<4;i++) if(s[i]==='1') out.everLit[i]=1;
  }
  return out;
})()
