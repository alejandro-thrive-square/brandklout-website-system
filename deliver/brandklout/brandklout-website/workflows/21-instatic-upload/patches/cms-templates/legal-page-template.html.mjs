/* Sang's Legal Pages CMS template (v18, 2026-09-15). Built as the page `legal-template` and bound to
   the `legal` collection by push-site.mjs (cms-collections.mjs). One edit before the class system
   sees it: the placeholder text inside `.legal-richtext` goes. If it stayed, `.legal h2` / `.legal p`
   would match static markup at build time and be resolved onto those elements' own classes; empty,
   nothing matches them and class-system.mjs carries them AS WRITTEN (ambient), which is what the
   entry body needs — its headings, paragraphs and lists are rendered from markdown at request time
   and carry no classes at all. */
export default [
  {
    why: 'legal template: empty the rich-text placeholder so the .legal element rules stay ambient for the CMS body',
    find: /(<div class="legal-richtext" data-cms-field="body_richtext">)[\s\S]*?(<\/div>\n<\/div><\/section>)/,
    replace: (_, open, close) => open + close,
  },
]
