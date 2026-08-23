(async function(){
  var form=document.querySelector('form');
  if(!form) return {err:'no form'};
  var parent=form.parentElement;          // capture BEFORE replaceWith detaches it
  var thanks=form.getAttribute('data-thanks')||'';
  form.querySelectorAll('input,select,textarea').forEach(function(el){
    if(el.type==='hidden') return;
    if(el.tagName==='SELECT'){ if(el.options.length>1) el.selectedIndex=1; return; }
    el.value = el.type==='email' ? 'qa.probe@example.com'
             : el.type==='tel' ? '3035550147' : 'QA Probe';
    el.dispatchEvent(new Event('input',{bubbles:true}));
  });
  form.querySelector('button[type="submit"]').click();
  await new Promise(function(r){setTimeout(r,1200)});
  var ok=parent.querySelector('.form-ok');
  if(!ok) return {thanksShown:false, parentText:parent.textContent.replace(/\s+/g,' ').trim().slice(0,80)};
  var cs=getComputedStyle(ok);
  return {thanksShown: ok.textContent.trim()===thanks.trim(),
    text:ok.textContent.trim().slice(0,50),
    background:cs.backgroundColor, color:cs.color, border:cs.borderTopWidth+' '+cs.borderTopColor,
    radius:cs.borderRadius, fontWeight:cs.fontWeight, padding:cs.paddingTop,
    STYLED: cs.backgroundColor!=='rgba(0, 0, 0, 0)' && parseFloat(cs.borderTopWidth)>0};
})()
