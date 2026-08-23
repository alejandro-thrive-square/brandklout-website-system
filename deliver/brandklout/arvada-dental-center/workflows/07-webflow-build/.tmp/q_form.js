(async function(){
  var out={};
  var form=document.querySelector('form');
  if(!form) return {err:'no form'};
  var input=form.querySelector('input[type="text"],input[name="name"]');
  var field=input?input.closest('[class*="-field"]'):null;
  out.field = field ? String(field.className).slice(0,30) : 'none';
  // submit empty -> validation should mark the field bad
  var btn=form.querySelector('button[type="submit"],button:not([type])');
  out.submitBtn = btn ? btn.textContent.trim().slice(0,30) : 'none';
  if(btn){
    btn.click();
    await new Promise(r=>setTimeout(r,800));
    out.afterSubmit={
      fieldClass: field?String(field.className).slice(0,40):null,
      isBad: field?field.classList.contains('is-bad'):null,
      errText: field?(field.querySelector('[class*="-field__err"]')||{}).textContent:null
    };
  }
  // magnetic hover effect bound?
  var mag=document.querySelector('[class*="-magnetic"]');
  out.magneticFound = !!mag;
  if(mag){
    var before=getComputedStyle(mag).transform;
    mag.dispatchEvent(new MouseEvent('mousemove',{bubbles:true,clientX:mag.getBoundingClientRect().left+10,clientY:mag.getBoundingClientRect().top+5}));
    await new Promise(r=>setTimeout(r,400));
    out.magnetic={before:before, after:getComputedStyle(mag).transform, changed:before!==getComputedStyle(mag).transform};
  }
  return out;
})()
