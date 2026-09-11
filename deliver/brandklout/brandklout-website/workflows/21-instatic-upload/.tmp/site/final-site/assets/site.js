/* ---- the inline <script> of index.html, verbatim. Guarded by the body class: Instatic has
   one script asset for every page (trap 17), and this code throws on a page without its elements. ---- */
if (document.body.classList.contains('pg-home')) {
    document.querySelectorAll('.faq-q').forEach(btn=>btn.addEventListener('click',()=>btn.parentElement.classList.toggle('open')));
    (()=>{const m=document.getElementById('legalModal');if(!m)return;const title=document.getElementById('legalTitle');const tabs=[...m.querySelectorAll('.modal-tab')];const panels=[...m.querySelectorAll('.modal-body')];const show=id=>{tabs.forEach(t=>t.classList.toggle('active',t.dataset.tab===id));panels.forEach(p=>{p.hidden=p.dataset.panel!==id;if(!p.hidden)title.textContent=p.dataset.title})};const open=id=>{show(id);m.hidden=false;document.body.style.overflow='hidden'};const close=()=>{m.hidden=true;document.body.style.overflow='unset'};document.querySelectorAll('[data-legal]').forEach(a=>a.addEventListener('click',e=>{e.preventDefault();open(a.dataset.legal)}));tabs.forEach(t=>t.addEventListener('click',()=>show(t.dataset.tab)));m.addEventListener('click',e=>{if(e.target===m)close()});m.querySelector('.modal-close').addEventListener('click',close);document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!m.hidden)close()});})();
    document.getElementById('leadForm').addEventListener('submit',async function(e){e.preventDefault();const form=this,btn=form.querySelector('[type="submit"]'),label=btn.textContent;const data=Object.fromEntries(new FormData(form).entries());data._subject='New "Check my market" lead from brandklout.com';data._template='table';btn.disabled=true;btn.textContent='Sending...';try{const res=await fetch('https://formsubmit.co/ajax/sales@brandklout.com',{method:'POST',headers:{'Content-Type':'application/json',Accept:'application/json'},body:JSON.stringify(data)});const out=await res.json().catch(()=>({}));if(!res.ok||String(out.success)!=='true')throw new Error(out.message||'Submission failed');form.reset();document.getElementById('success').style.display='block';}catch(err){console.error('Lead form:',err);alert('Sorry, your request could not be sent. Please try again, or email sales@brandklout.com.');}finally{btn.disabled=false;btn.textContent=label;}});
}

/* ---- the inline <script> of survey/index.html, verbatim. Guarded by the body class: Instatic has
   one script asset for every page (trap 17), and this code throws on a page without its elements. ---- */
if (document.body.classList.contains('pg-survey')) {
    (() => {
      /* Same endpoint and payload as the Netlify app: Sang's Google Sheet via SheetDB, whose columns are
         submittedAt, fullName, email, phone, question_1..question_21. An unanswered question would be sent
         as "not answered", as there; validation makes that impossible. */
      const ENDPOINT = 'https://sheetdb.io/api/v1/w8136dpdrs4st'
      const TOTAL = 21
      const answers = {}
      const questions = [...document.querySelectorAll('.q')]
      const bar = document.getElementById('progressBar')
      const count = document.getElementById('progressCount')
      const modal = document.getElementById('resultsModal')
      const ask = document.getElementById('askContact')
      const done = document.getElementById('assessmentDone')
      const contact = document.getElementById('contactForm')
      const submit = contact.querySelector('button[type="submit"]')
      const fields = ['fullName', 'email', 'phone'].map((id) => document.getElementById(id))

      const progress = () => {
        const n = Object.keys(answers).length
        bar.style.width = Math.round((n / TOTAL) * 100) + '%'
        count.textContent = n
      }
      const answersForm = document.getElementById('assessmentAnswers')
      answersForm.addEventListener('submit', (e) => e.preventDefault())
      answersForm.addEventListener('change', (e) => {
        const input = e.target
        if (input.type !== 'radio') return
        answers[input.name] = input.value
        input.closest('.q')?.classList.remove('invalid')
        progress()
      })

      document.getElementById('getResults').addEventListener('click', () => {
        let first = null
        for (const q of questions) {
          const missing = !answers['question_' + q.dataset.q]
          q.classList.toggle('invalid', missing)
          if (missing && !first) first = q
        }
        if (first) {
          setTimeout(() => window.scrollTo({ top: first.getBoundingClientRect().top + window.pageYOffset - 150, behavior: 'smooth' }), 10)
          return
        }
        modal.hidden = false
        document.body.style.overflow = 'hidden'
        fields[0].focus()
      })

      modal.addEventListener('click', (e) => {
        if (e.target !== modal || submit.disabled) return
        modal.hidden = true
        document.body.style.overflow = ''
      })

      contact.addEventListener('submit', async (e) => {
        e.preventDefault()
        if (fields.some((f) => !f.value.trim())) {
          alert('Please fill in all required fields')
          return
        }
        const payload = { fullName: fields[0].value, email: fields[1].value, phone: fields[2].value }
        for (let n = 1; n <= TOTAL; n++) payload['question_' + n] = answers['question_' + n] || 'not answered'
        payload.submittedAt = new Date().toISOString()
        const label = submit.textContent
        submit.disabled = true
        submit.textContent = 'Submitting...'
        fields.forEach((f) => (f.disabled = true))
        try {
          const res = await fetch(ENDPOINT, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
            body: JSON.stringify(payload),
          })
          if (!res.ok) {
            const body = await res.json().catch(() => ({}))
            throw new Error(body.message || 'Submission failed')
          }
          await res.json()
          ask.hidden = true
          done.hidden = false
        } catch (err) {
          console.error('Submission error:', err)
          alert('There was an error submitting your assessment. Please check your internet connection and try again.')
          submit.disabled = false
          submit.textContent = label
          fields.forEach((f) => (f.disabled = false))
        }
      })

      progress()
    })()
}
