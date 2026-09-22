/* Brandklout: Termly "Cookie Preferences" footer control (v1.2.0)
 *
 * WHY A SCRIPT AND NOT HTML IN THE FOOTER. The kit's static
 * kit/consent-preferences-link.html is still the right answer wherever a human
 * is editing one footer. It does not scale to this rollout:
 *   - Instatic inlines the footer into EVERY page (57 of them on dr-nahlah), and
 *     a page write through PUT /site-document drops seoTitle/seoDescription and
 *     needs a PATCH to restore them -- which flattens every `a/b` slug's route.
 *   - Webflow's footer is a Designer layout. The Data API can write site-wide
 *     freeform head/footer CODE, but cannot place a link inside the footer nav;
 *     only the Designer can, and that needs a human with the browser open.
 * So the control is inserted at runtime, from a file that is already site-wide
 * on both platforms. The link does nothing without JavaScript anyway.
 *
 * HOW IT PLACES ITSELF. It finds the footer's Privacy Policy and Terms links,
 * works out the REPEATING UNIT those two share -- the `<a>` itself, or the
 * `<li>`/`<span>` each is wrapped in -- and clones it. Cloning is what makes one
 * file work on 29 unrelated designs: the control inherits that site's exact
 * typography, colour, spacing and hover without a line of CSS from us. Any
 * separator between the two units (a "|", a bullet, a styled span) is cloned
 * with it, so the new item is punctuated like its neighbours.
 *
 * SIZE. Webflow caps a registered inline script at 2,000 characters and the
 * minified build must stay under it -- `node consent-kit.mjs minify` fails the
 * run otherwise. That is why this file has no defensive extras.
 */
(function () {
  if (window.BrandkloutConsentPreferences) return
  window.BrandkloutConsentPreferences = '1.2.0'

  var LABEL = (window.BrandkloutConsentConfig || {}).preferencesLabel || 'Cookie Preferences'
  // Plain substrings, not regexes, and deliberately so: this file is transcribed
  // into Webflow's register_inline_script through a tool call, and an escape
  // sequence such as \s can lose a backslash layer on the way. No backslash in
  // the source means nothing to lose. `minify` fails the run if one appears.
  var PRIVACY = ['privacy', 'private-policy', 'private policy']
  var SECOND = ['terms', 'cookie', 'accessib', 'disclaim', 'hipaa', 'conditions']

  function matches(el, words) {
    var t = (el.textContent + ' ' + el.getAttribute('href')).toLowerCase()
    for (var i = 0; i < words.length; i++) if (t.indexOf(words[i]) > -1) return true
    return false
  }

  function openModal(e) {
    e.preventDefault()
    // Termly's own API. The .termly-display-preferences class alone is enough
    // once Termly has loaded, but binding here means the control also works if
    // Termly attached its delegated listener before this node existed.
    if (typeof window.displayPreferenceModal === 'function') window.displayPreferenceModal()
  }

  /** Raise a and b until they are siblings; null if they never meet. */
  function align(a, b) {
    while (a.parentElement && !a.parentElement.contains(b)) a = a.parentElement
    if (!a.parentElement) return null
    while (b.parentElement && b.parentElement !== a.parentElement) b = b.parentElement
    return b.parentElement && a !== b ? [a, b] : null
  }

  function build(unit) {
    var copy = unit.cloneNode(true)
    var link = copy.matches('a[href]') ? copy : copy.querySelector('a[href]')
    if (!link) return null
    copy.removeAttribute('id')
    // Relabel the deepest element that actually held the text, so a link built
    // as <a><span>Privacy Policy</span></a> keeps its span.
    var holder = link
    while (holder.children.length === 1 && !(holder.childNodes[0] || {}).nodeValue) holder = holder.children[0]
    holder.textContent = LABEL
    link.setAttribute('href', '#')
    link.className += ' termly-display-preferences'
    link.addEventListener('click', openModal)
    return copy
  }

  function insert() {
    if (document.querySelector('.termly-display-preferences')) return
    var all = document.querySelectorAll('footer a[href], [class*="foot"] a[href], [id*="foot"] a[href]')
    var privacy = null
    var other = null
    for (var i = 0; i < all.length; i++) {
      if (!privacy && matches(all[i], PRIVACY)) privacy = all[i]
      else if (privacy && !other && matches(all[i], SECOND)) other = all[i]
    }
    if (!privacy) return
    var pair = other && align(privacy, other)
    if (!pair) {
      var solo = build(privacy)
      if (solo) privacy.parentNode.insertBefore(solo, privacy.nextSibling)
      return
    }
    // Append after the LAST of the two, reading "Privacy Policy | Terms | Cookie
    // Preferences" rather than wedging the new item into the middle.
    var first = pair[0].compareDocumentPosition(pair[1]) & 4 ? pair[0] : pair[1]
    var last = first === pair[0] ? pair[1] : pair[0]
    var unit = build(last)
    if (!unit) return
    var at = last.nextSibling
    // Clone the separator, if this design has one between its legal items.
    for (var n = first.nextSibling; n && n !== last; n = n.nextSibling) {
      if (n.nodeType !== 3 || n.nodeValue.trim().length <= 3) last.parentNode.insertBefore(n.cloneNode(true), at)
    }
    last.parentNode.insertBefore(unit, at)
  }

  // Two shots: the footer is server-rendered HTML on both platforms, so
  // DOMContentLoaded is enough, and `load` covers a footer built by a script.
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', insert)
  else insert()
  window.addEventListener('load', insert)
})()
