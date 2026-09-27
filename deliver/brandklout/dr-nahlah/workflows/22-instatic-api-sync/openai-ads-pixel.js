/* OpenAI Ads (ChatGPT Ads) pixel — the ChatGPT All-on-4 landing page only,
   /ads-landing-pages/alexandria-all-on-4-chatgpt. It was on the six Google
   All-on-4 ads pages until Brandklout asked for this dedicated page and for the
   pixel to come off the Google ones (2026-09-23).
   Source of the live code asset src/scripts/openai-ads-pixel.js; push with
   set-openai-pixel.mjs. The SDK itself (bzrcdn.openai.com/sdk/oaiq.min.js) is
   an embed-origins site-script line (no consent hold, client 2026-09-23), so
   this file only queues calls: the SDK drains window.oaiq.q whenever it arrives,
   before or after this runs. No lead_created here: the page keeps Alexandria's
   Google All-on-4 GHL form, whose submit redirects to the Google thank-you page.
   Production host only: the staging clone carries this same page, and a
   reviewer opening it must not reach the real pixel. */
(function (w) {
  if (w.location.hostname !== 'www.drnahlah.com') return;
  var path = w.location.pathname.replace(/\/+$/, '');
  if (path !== '/ads-landing-pages/alexandria-all-on-4-chatgpt') return;
  if (!w.oaiq) {
    var q = function () { q.q.push(arguments); };
    q.q = [];
    w.oaiq = q;
  }
  w.oaiq('init', { pixelId: '2EKUEqMZC1in13nT8T8eb5', debug: true });
})(window);
