(function(){
  var cards=document.querySelectorAll('.nxd-path-card,.path-card');
  var bq=cards[2].querySelector('blockquote');
  var cs=getComputedStyle(bq);
  var probe=document.createElement('span');
  probe.style.cssText='position:absolute;white-space:nowrap;visibility:hidden;font:'+cs.font;
  probe.textContent=bq.textContent;
  document.body.appendChild(probe);
  var w=probe.getBoundingClientRect().width; probe.remove();
  return {font:cs.font, fontFamily:cs.fontFamily, fontStyle:cs.fontStyle, fontWeight:cs.fontWeight,
    letterSpacing:cs.letterSpacing, wordSpacing:cs.wordSpacing, textWrap:cs.textWrap||cs.textWrapStyle,
    hyphens:cs.hyphens, width:Math.round(bq.getBoundingClientRect().width),
    singleLineTextWidth:Math.round(w),
    openSansLoaded: document.fonts?document.fonts.check('16px "Open Sans"'):null};
})()
