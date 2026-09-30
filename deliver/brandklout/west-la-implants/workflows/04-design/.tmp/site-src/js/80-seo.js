/* ==========================================================================
   80 — THE PUBLISHED <head>. Instatic emits four tags (title, description,
   icon, lang) and strips everything else on import, so canonical, Open Graph
   and JSON-LD travel on <main data-seo> as base64 JSON and are written here at
   runtime. Search engines execute this; it is the same road the consent kit
   takes. Runs before the GSAP gate in 90-boot.js and never depends on it.
   ========================================================================== */
(function () {
  var main = document.querySelector('main[data-seo]');
  if (!main) return;
  var seo;
  try { seo = JSON.parse(decodeURIComponent(escape(atob(main.getAttribute('data-seo'))))); } catch (e) { return; }
  var head = document.head;
  function put(tag, attrs) {
    var el = document.createElement(tag);
    Object.keys(attrs).forEach(function (k) { el.setAttribute(k, attrs[k]); });
    head.appendChild(el);
    return el;
  }
  if (seo.canonical && !head.querySelector('link[rel="canonical"]')) put('link', { rel: 'canonical', href: seo.canonical });
  var og = {
    'og:type': seo.type || 'website', 'og:site_name': 'West LA Implants', 'og:title': seo.title, 'og:description': seo.description,
    'og:url': seo.canonical, 'og:image': seo.image, 'og:locale': 'en_US',
  };
  Object.keys(og).forEach(function (p) { if (og[p] && !head.querySelector('meta[property="' + p + '"]')) put('meta', { property: p, content: og[p] }); });
  var tw = { 'twitter:card': 'summary_large_image', 'twitter:title': seo.title, 'twitter:description': seo.description, 'twitter:image': seo.image };
  Object.keys(tw).forEach(function (n) { if (tw[n] && !head.querySelector('meta[name="' + n + '"]')) put('meta', { name: n, content: tw[n] }); });
  if (seo.noindex && !head.querySelector('meta[name="robots"]')) put('meta', { name: 'robots', content: seo.robots || 'noindex, nofollow' });
  if (seo.jsonld && seo.jsonld.length && !head.querySelector('script[type="application/ld+json"]')) {
    var s = document.createElement('script');
    s.type = 'application/ld+json';
    s.text = JSON.stringify(seo.jsonld.length === 1 ? seo.jsonld[0] : { '@context': 'https://schema.org', '@graph': seo.jsonld });
    head.appendChild(s);
  }
})();
