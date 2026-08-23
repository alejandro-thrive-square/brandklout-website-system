(async function(){
  var form=document.querySelector('form');
  if(!form) return {err:'no form'};
  var out={lead:form.getAttribute('data-lead'), thanks:form.getAttribute('data-thanks')};
  // fill every required field
  form.querySelectorAll('input,select,textarea').forEach(function(el){
    if(el.type==='hidden') return;
    if(el.tagName==='SELECT'){ if(el.options.length>1) el.selectedIndex=1; return; }
    if(el.type==='email') el.value='qa.probe@example.com';
    else if(el.type==='tel') el.value='3035550147';
    else el.value='QA Probe';
    el.dispatchEvent(new Event('input',{bubbles:true}));
    el.dispatchEvent(new Event('change',{bubbles:true}));
  });
  var before={url:location.href, formVisible:form.getBoundingClientRect().height>0,
    leads:(window.__arvadaLeads||[]).length};
  var btn=form.querySelector('button[type="submit"]');
  out.submitBtn=btn?btn.textContent.trim().slice(0,40):'none';
  if(btn) btn.click(); else form.requestSubmit ? form.requestSubmit() : form.submit();
  await new Promise(function(r){setTimeout(r,1500)});
  var host=form.parentElement;
  out.after={url:location.href, navigated:location.href!==before.url,
    formVisible:form.isConnected && form.getBoundingClientRect().height>0,
    leadsBefore:before.leads, leadsAfter:(window.__arvadaLeads||[]).length,
    payload:(window.__arvadaLeads||[]).slice(-1)[0]||null,
    hostText:(host?host.textContent:'').replace(/\s+/g,' ').trim().slice(-120)};
  out.thanksShown = out.after.hostText.indexOf((out.thanks||'').slice(0,25))>=0;
  return out;
})()
