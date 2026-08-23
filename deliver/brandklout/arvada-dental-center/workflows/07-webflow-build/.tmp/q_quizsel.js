(async function(){
  var opt=[].filter.call(document.querySelectorAll('[class*="-quiz__opt"]'),function(e){return e.tagName==='BUTTON'})[0];
  if(!opt) return {quiz:'none on this page'};
  var before={bg:getComputedStyle(opt).backgroundColor, border:getComputedStyle(opt).borderTopColor, pressed:opt.getAttribute('aria-pressed')};
  opt.click(); await new Promise(r=>setTimeout(r,300));
  var after={bg:getComputedStyle(opt).backgroundColor, border:getComputedStyle(opt).borderTopColor, pressed:opt.getAttribute('aria-pressed')};
  return {before:before, after:after, pressedFlips:before.pressed!==after.pressed,
    visualFeedback: before.bg!==after.bg || before.border!==after.border};
})()
