(function(){
  var cards=document.querySelectorAll('.nxd-path-card,.path-card');
  var bq=cards[2].querySelector('blockquote');
  return {text:bq.textContent, len:bq.textContent.length, html:bq.innerHTML.slice(0,300)};
})()
