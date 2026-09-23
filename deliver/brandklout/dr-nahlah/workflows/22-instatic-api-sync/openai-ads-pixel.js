/* OpenAI Ads (ChatGPT Ads) pixel — the six All-on-4 ads landing pages only.
   Source of the live code asset src/scripts/openai-ads-pixel.js; push with
   set-openai-pixel.mjs. The SDK itself (bzrcdn.openai.com/sdk/oaiq.min.js) is
   an embed-origins site-script line (no consent hold, client 2026-09-23), so
   this file only queues calls: the SDK drains window.oaiq.q whenever it arrives, before
   or after this runs. The conversion is the thank-you page view: both All-on-4
   LeadConnector forms redirect there on submit. */
(function (w) {
  var path = w.location.pathname.replace(/\/+$/, '');
  if (!/^\/ads-landing-pages\/[a-z-]+-all-on-4(-consultation|-thank-you)?$/.test(path)) return;
  if (!w.oaiq) {
    var q = function () { q.q.push(arguments); };
    q.q = [];
    w.oaiq = q;
  }
  w.oaiq('init', { pixelId: '2EKUEqMZC1in13nT8T8eb5', debug: true });
  if (/-thank-you$/.test(path)) w.oaiq('measure', 'lead_created', { type: 'customer_action' });
})(window);
