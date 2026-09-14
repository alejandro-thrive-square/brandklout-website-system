/* v11 assets/site.js — every `form[data-lead-form]` (home, /market-opportunity, /authority-score)
   emails sales@brandklout.com. 2026-09-14, Alejandro: "meanwhile just point those forms and the
   survey to sales@brandklout.com" (GoHighLevel later).

   Sang's handler already POSTs the form as JSON to `BK_CONFIG.formEndpoint` and shows his success
   panel on a 2xx; with the endpoint empty it only shows "Preview mode: … not sent". The relay is
   FormSubmit (https://formsubmit.co), as on v2: it emails every POST to the address in its URL, and
   `https://formsubmit.co` is already in the embed-origins plugin's connectOrigins. FormSubmit sends a
   ONE-TIME activation email to sales@ on the first submission and delivers nothing until it is
   clicked. It answers that first POST with HTTP 200 and `success: "false"`, so a 2xx alone is not a
   delivery: patch 4 reads the reply. See ../../patches.mjs for how patches apply. */
export default [
  {
    why: 'Forms (2026-09-14): the endpoint is FormSubmit -> sales@brandklout.com',
    find: "  formEndpoint: '',",
    replace: "  formEndpoint: 'https://formsubmit.co/ajax/sales@brandklout.com',",
  },
  {
    why: 'Forms (2026-09-14): email subject, table layout, and the assessment answers as one row each',
    find: '          data.submitted_at = new Date().toISOString();',
    replace:
      '          data.submitted_at = new Date().toISOString();\n' +
      "          data._subject = 'New website lead: ' + document.title;\n" +
      "          data._template = 'table';\n" +
      // The quiz puts its answers in a hidden field as a JSON array; in an email that is one
      // unreadable cell. One row per question instead, and the category scores as one line.
      "          try { JSON.parse(data.assessment_answers || '[]').forEach((a, i) => { data['Q' + String(i + 1).padStart(2, '0')] = a.question + ' — ' + (a.answer ? a.answer.toUpperCase() : 'not answered'); }); if (data.assessment_answers) delete data.assessment_answers; } catch (_) {}\n" +
      "          try { if (data.category_scores) data.category_scores = Object.values(JSON.parse(data.category_scores)).map(c => c.name + ': ' + c.yes + '/' + c.total + ' Yes').join('; '); } catch (_) {}",
  },
  {
    why: 'Forms (2026-09-14): ask FormSubmit for a JSON reply',
    find: "              method: 'POST', headers: {'Content-Type': 'application/json'},",
    replace: "              method: 'POST', headers: {'Content-Type': 'application/json', Accept: 'application/json'},",
  },
  {
    why: 'Forms (2026-09-14): a 200 from FormSubmit is only a delivery when it says success',
    find: "          if (!response.ok) throw new Error('Request not accepted (' + response.status + ').');",
    replace:
      "          if (!response.ok) throw new Error('Request not accepted (' + response.status + ').');\n" +
      "          const reply = await response.json().catch(() => ({}));\n" +
      "          if (String(reply.success) !== 'true') throw new Error(reply.message || 'Request not accepted.');",
  },
]
