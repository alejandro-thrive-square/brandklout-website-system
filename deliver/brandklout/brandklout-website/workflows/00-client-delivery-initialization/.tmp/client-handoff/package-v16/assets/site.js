/* Configure a public, validated server endpoint. Never put a private CRM API key here. */
window.BK_CONFIG = Object.assign({
  formEndpoint: '',
  calendly: 'https://calendly.com/mrhuynher/30min'
}, window.BK_CONFIG || {});

(function () {
  'use strict';
  const reduceMotion = () => document.documentElement.classList.contains('reduce-motion') || window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  function init() {
    document.querySelectorAll('[data-menu]:not([data-bk-bound])').forEach(button => {
      button.dataset.bkBound = 'true';
      button.addEventListener('click', () => {
        const links = document.getElementById(button.getAttribute('aria-controls'));
        if (!links) return;
        const open = links.classList.toggle('open');
        button.setAttribute('aria-expanded', String(open));
        button.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
      });
    });
    document.querySelectorAll('.nav-links a:not([data-bk-bound])').forEach(link => {
      link.dataset.bkBound = 'true';
      link.addEventListener('click', () => {
        document.querySelector('.nav-links')?.classList.remove('open');
        document.querySelector('[data-menu]')?.setAttribute('aria-expanded', 'false');
      });
    });
    document.querySelectorAll('.faq-btn:not([data-bk-bound])').forEach(button => {
      button.dataset.bkBound = 'true';
      button.addEventListener('click', () => {
        const item = button.closest('.faq-item');
        const open = item.classList.toggle('open');
        button.setAttribute('aria-expanded', String(open));
        const answer = item.querySelector('.faq-answer');
        if (answer) answer.style.maxHeight = open ? answer.scrollHeight + 'px' : '0px';
      });
    });
    document.querySelectorAll('form[data-lead-form]:not([data-bk-bound])').forEach(form => {
      form.dataset.bkBound = 'true';
      form.addEventListener('submit', async event => {
        event.preventDefault();
        if (!form.reportValidity() || form.dataset.submitting === 'true') return;
        const status = form.querySelector('[data-form-status]');
        const submit = form.querySelector('button[type="submit"]');
        const success = form.querySelector('.success');
        const endpoint = window.BK_CONFIG.formEndpoint;
        if (!endpoint) {
          if (status) {
            status.classList.remove('error');
            status.replaceChildren(document.createTextNode('Preview mode: your information has not been sent. The CRM connection is not configured yet. '));
            const link = document.createElement('a');
            link.href = window.BK_CONFIG.calendly;
            link.target = '_blank';
            link.rel = 'noopener';
            link.textContent = 'Book directly using the calendar.';
            status.append(link);
          }
          return;
        }
        form.dataset.submitting = 'true';
        const originalText = submit?.textContent;
        if (submit) { submit.disabled = true; submit.textContent = 'Sending your request...'; }
        if (status) { status.textContent = ''; status.classList.remove('error'); }
        try {
          const data = Object.fromEntries(new FormData(form).entries());
          data.page = location.pathname + location.hash;
          data.submitted_at = new Date().toISOString();
          const controller = new AbortController();
          const timeout = setTimeout(() => controller.abort(), 15000);
          let response;
          try {
            response = await fetch(endpoint, {
              method: 'POST', headers: {'Content-Type': 'application/json'},
              body: JSON.stringify(data), mode: 'cors', signal: controller.signal
            });
          } finally { clearTimeout(timeout); }
          if (!response.ok) throw new Error('Request not accepted (' + response.status + ').');
          if (success) {
            success.classList.add('show');
            success.scrollIntoView({behavior: reduceMotion() ? 'auto' : 'smooth', block: 'nearest'});
          }
          if (submit) submit.textContent = 'Request sent';
          form.dataset.submitted = 'true';
          document.dispatchEvent(new CustomEvent('bk:lead-sent', {detail: {page: location.pathname}}));
        } catch (error) {
          if (status) {
            status.classList.add('error');
            status.textContent = 'Your request could not be confirmed. Please try again or use the booking link. Your entries have been kept.';
          }
          if (submit) { submit.disabled = false; submit.textContent = originalText; }
        } finally { form.dataset.submitting = 'false'; }
      });
    });
    const quiz = document.querySelector('[data-authority-quiz]');
    if (quiz && !quiz.dataset.bkBound) {
      quiz.dataset.bkBound = 'true';
      const questions = [...quiz.querySelectorAll('.question[data-category]')];
      const groups = [...quiz.querySelectorAll('[data-assessment-category]')];
      const form = quiz.querySelector('form[data-lead-form]');
      let frame;
      let previous = 0;
      function setHidden(name, value) {
        const field = form?.querySelector('[name="' + name + '"]');
        if (field) field.value = String(value);
      }
      const calculate = () => {
        const categories = {};
        groups.forEach(group => {
          categories[group.dataset.assessmentCategory] = {
            name: group.dataset.categoryName, total: 0, answered: 0, yes: 0, no: 0, percentage: 0
          };
        });
        let answered = 0, yes = 0, no = 0;
        const answers = questions.map(question => {
          const checked = question.querySelector('input[type="radio"]:checked');
          const category = categories[question.dataset.category];
          category.total++;
          if (checked) {
            answered++; category.answered++;
            if (checked.value === '1') { yes++; category.yes++; }
            else { no++; category.no++; }
          }
          return {
            id: question.dataset.questionId,
            category: question.dataset.category,
            question: question.querySelector('h3').textContent.trim(),
            answer: checked ? (checked.value === '1' ? 'yes' : 'no') : null
          };
        });
        const count = questions.length;
        const total = Math.round(yes / count * 100);
        const complete = answered === count;
        quiz.querySelector('[data-score]').textContent = total;
        quiz.querySelector('[data-yes-count]').textContent = yes;
        quiz.querySelector('[data-no-count]').textContent = no;
        quiz.querySelector('[data-score-state]').textContent = complete ? 'Assessment complete' : (answered ? 'In progress' : 'Not started');
        cancelAnimationFrame(frame);
        if (reduceMotion()) document.documentElement.style.setProperty('--score', total + '%');
        else {
          const start = performance.now(), from = previous;
          const update = now => {
            const progress = Math.min((now - start) / 450, 1);
            document.documentElement.style.setProperty('--score', (from + (total - from) * (1 - Math.pow(1 - progress, 3))) + '%');
            if (progress < 1 && quiz.isConnected) frame = requestAnimationFrame(update);
          };
          frame = requestAnimationFrame(update);
        }
        previous = total;
        Object.entries(categories).forEach(([key, category]) => {
          category.percentage = Math.round(category.yes / category.total * 100);
          const label = quiz.querySelector('[data-cat-score="' + key + '"]');
          const bar = quiz.querySelector('[data-category-bar="' + key + '"]');
          const progress = quiz.querySelector('[data-category-progress="' + key + '"]');
          if (label) label.textContent = category.yes + '/' + category.total + ' Yes';
          if (bar) bar.style.width = category.percentage + '%';
          if (progress) progress.textContent = category.answered + '/' + category.total;
        });
        quiz.querySelector('[data-quiz-progress]').textContent = answered + ' of ' + count;
        quiz.querySelector('[data-quiz-progress-bar]').style.width = answered / count * 100 + '%';
        quiz.querySelector('[data-progress-track]').setAttribute('aria-valuenow', answered);
        const minimum = Math.min(...Object.values(categories).map(category => category.yes));
        const weakestNames = Object.values(categories).filter(category => category.yes === minimum).map(category => category.name);
        let gap = 'Complete all ' + count + ' questions';
        if (complete) gap = yes === count ? 'No gaps self-reported' : weakestNames.join(' / ');
        quiz.querySelector('[data-weakest]').textContent = gap;
        const resultNote = quiz.querySelector('[data-result-note]');
        resultNote.classList.toggle('is-complete', complete);
        if (complete) {
          resultNote.textContent = 'Assessment complete. You answered Yes to ' + yes + ' of ' + count + ' questions. Your self-reported score is ' + total + '/100. ' + (yes === count ? 'Use your market conversation to validate your answers against actual performance.' : 'Area' + (weakestNames.length > 1 ? 's' : '') + ' with the most No answers: ' + weakestNames.join(', ') + '.');
        } else {
          resultNote.textContent = answered ? (count - answered) + ' questions remaining. Your score is provisional until all questions are answered.' : 'Answer all ' + count + ' questions to complete your assessment. Your score updates as you go.';
        }
        const result = {
          assessment_version: quiz.dataset.assessmentVersion,
          assessment_completed: complete,
          assessment_answered: answered,
          assessment_total: count,
          yes_answers: yes,
          no_answers: no,
          authority_score: total,
          biggest_gap: complete ? gap : 'Assessment incomplete',
          category_scores: categories,
          assessment_answers: answers
        };
        Object.entries(result).forEach(([key, value]) => setHidden(key, typeof value === 'object' ? JSON.stringify(value) : value));
        // Read-only snapshot for validated backend integrations and QA. No browser storage of contact details.
        window.BKAssessment = {getResult: () => JSON.parse(JSON.stringify(result))};
      };
      function clearSubmissionState() {
        if (!form || form.dataset.submitting === 'true') return;
        form.querySelector('.success')?.classList.remove('show');
        const status = form.querySelector('[data-form-status]');
        if (status) status.textContent = '';
        if (form.dataset.submitted === 'true') {
          const button = form.querySelector('button[type="submit"]');
          if (button) {
            button.disabled = false;
            button.textContent = 'Send My Assessment + Check My Market \u2197';
          }
          delete form.dataset.submitted;
        }
      }
      quiz.addEventListener('change', () => { clearSubmissionState(); calculate(); });
      quiz.querySelector('[data-reset-assessment]')?.addEventListener('click', () => {
        if (form?.dataset.submitting === 'true') return;
        clearSubmissionState();
        questions.forEach(question => question.querySelectorAll('input[type="radio"]').forEach(input => { input.checked = false; }));
        calculate();
      });
      calculate();
    }
  }
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape') {
      document.querySelector('.nav-links')?.classList.remove('open');
      document.querySelector('[data-menu]')?.setAttribute('aria-expanded', 'false');
    }
  });
  window.BKSite = {init};
  init();
})();
