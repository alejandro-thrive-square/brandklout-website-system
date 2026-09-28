## 2026-09-28: Phoenix office removed, message types labelled in both policies

### Done

- **The Phoenix office (3443 N. Central Avenue, Suite 700, Phoenix, AZ 85012) closed.** A scan of every
  production page node, SEO cell and shell file (`21-instatic-upload/phoenix/scan-phoenix.mjs`)
  found it in exactly two places: the Contact Us address blocks of `/privacy-policy` and
  `/terms-of-service`. Both blocks are gone, and so is the "Peoria" sub-heading, since one address
  needs no heading. The schema in `site.js` only ever named Peoria. Every other "Phoenix" on the site
  is the Phoenix Magazine Top Dentist award or "Peoria, Phoenix, and the surrounding Valley" as a
  service area, and **those stay**. Staging and the home redesign never carried the Phoenix address.
- **The Types of Messages list in both policies now names each type with the word A2P vetting
  looks for**: Appointment messages (transactional), Conversational messages (customer care),
  Promotional messages (marketing). The wording is otherwise unchanged. Effective date on both is now
  September 28, 2026.
- `legal/push-legal.mjs` now loads the worktree `.env` and the main checkout's `insta-api.mjs`,
  the same way `tags/push-tags.mjs` does. The old `process/22-instatic-api-sync` import no longer exists.
- Written at seq 20 and published at 2026-09-28T23:43:41Z. `draftMatchesPublished` was true before
  the write, so nothing unrelated shipped. The live pages have no Phoenix address, the Peoria block
  is present, and the three type labels show. Other checks: `verify-wp-urls` 61/61 with 0 failures,
  and `tags/verify-tags` passed every check.

### Open

- **The failing "Message type disclosure" check is on the GoHighLevel form, not on this site.** The
  consent line on form `cxtQ5q29TfUr3cYlMmDB` reads "non-marketing text messages ... such as special
  offers, discounts, newsletters". That labels the messages non-marketing and then lists marketing
  ones, so no message type is disclosed consistently. It was read keyless from
  `api.leadconnectorhq.com/widget/form/<id>` on 2026-09-28. Replace it in GoHighLevel with wording
  that names the types the policies name, for example:
  "By checking this box, I consent to receive transactional text messages (appointment
  confirmations and reminders), customer care messages, and promotional/marketing messages (special
  offers and practice updates) from Institute for Advanced Dentistry PLLC. Message frequency varies.
  Message and data rates may apply. Reply HELP for help or STOP to opt out. Consent is not a
  condition of purchase." If the campaign is registered as non-marketing only, drop the promotional
  clause instead. The wording has to match the campaign type.
- Google Business Profile and directory listings for the Phoenix office are outside this repo.

### Gotchas

- **A scan for "Phoenix" is mostly noise here.** Awards, the service area, and libphonenumber data
  in `site.js` (`85012345`) all match. Match on the street address and the ZIP code, not on the city.

## Version Control

Follows [SYSTEM_RULES.md §4](../../../../../SYSTEM_RULES.md).
