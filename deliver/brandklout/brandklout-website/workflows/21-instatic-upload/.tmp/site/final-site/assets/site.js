    document.querySelectorAll('.faq-q').forEach(btn=>btn.addEventListener('click',()=>btn.parentElement.classList.toggle('open')));
    document.getElementById('leadForm').addEventListener('submit',function(e){e.preventDefault();document.getElementById('success').style.display='block';});
  