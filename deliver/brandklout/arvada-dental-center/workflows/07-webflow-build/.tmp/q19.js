(function(){
  var cards=document.querySelectorAll('.nxd-path-card,.path-card');
  var bq=cards[2].querySelector('blockquote');
  var cs=getComputedStyle(bq);
  var r=document.createRange(); r.selectNodeContents(bq);
  var rects=r.getClientRects();
  return {boxSizing:cs.boxSizing, width:cs.width, padL:cs.paddingLeft, padR:cs.paddingRight,
    bordL:cs.borderLeftWidth, bordR:cs.borderRightWidth, rectW:bq.getBoundingClientRect().width,
    clientW:bq.clientWidth, textIndent:cs.textIndent, whiteSpace:cs.whiteSpace,
    lineBoxes:rects.length, firstLineW:rects.length?Math.round(rects[0].width):null,
    fontSizePx:cs.fontSize, lineHeightPx:cs.lineHeight};
})()
