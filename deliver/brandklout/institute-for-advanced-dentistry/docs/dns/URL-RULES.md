# ifadentistry.com — keeping the WordPress URLs on Instatic

Instatic cannot serve a nested page URL. Its public router looks a page up by one slug
(`server/publish/publicRouter.ts`, `publicSlugFromPath`), and the pages table stores that slug
with every `/` turned into `-` (trap 39 in `workflows/21-instatic-upload/21-instatic-upload.md`).
Only CMS collection rows get `/parent/child` routes. The clone therefore publishes
`/dental-services/dental-implants/` at `/dental-services-dental-implants`.

These Cloudflare rules make every WordPress URL answer on the domain, **unchanged in the address
bar**. They are rewrites, not redirects. Checked 2026-09-11: 61 WordPress URLs, 29 need a rewrite,
2 are WordPress's own 301s, and **0 fail** (`workflows/21-instatic-upload/verify-wp-urls.mjs`).

Set them up in the new zone before the nameserver switch. Rules can be added while the zone is
pending.

## URL rewrites

Go to Rules → **URL Rewrite Rules** → Create rule. Choose *Custom filter expression* and click
**Edit expression** to paste the filter. Under *Path*, choose **Rewrite to… → Dynamic**, and under
*Query*, choose **Preserve**. Create them in this order. The filters do not overlap, so the order is
only for readability.

| # | Name | Filter expression | Path → Dynamic |
| :--- | :--- | :--- | :--- |
| 1 | Articles pages | `(http.request.uri.path wildcard "/about-our-practice/articles/page/*")` | `wildcard_replace(http.request.uri.path, "/about-our-practice/articles/page/*", "/about-our-practice-articles-page-${1}")` |
| 2 | Category pages | `(http.request.uri.path wildcard "/category/*/page/*")` | `wildcard_replace(http.request.uri.path, "/category/*/page/*", "/category-${1}-page-${2}")` |
| 3 | Dental services | `(http.request.uri.path wildcard "/dental-services/*" and http.request.uri.path ne "/dental-services/")` | `wildcard_replace(http.request.uri.path, "/dental-services/*", "/dental-services-${1}")` |
| 4 | About our practice | `(http.request.uri.path wildcard "/about-our-practice/*" and http.request.uri.path ne "/about-our-practice/" and not http.request.uri.path wildcard "/about-our-practice/articles/page/*")` | `wildcard_replace(http.request.uri.path, "/about-our-practice/*", "/about-our-practice-${1}")` |
| 5 | Contact us | `(http.request.uri.path wildcard "/contact-us/*" and http.request.uri.path ne "/contact-us/")` | `wildcard_replace(http.request.uri.path, "/contact-us/*", "/contact-us-${1}")` |
| 6 | Categories | `(http.request.uri.path wildcard "/category/*" and http.request.uri.path ne "/category/" and not http.request.uri.path wildcard "/category/*/page/*")` | `wildcard_replace(http.request.uri.path, "/category/*", "/category-${1}")` |

The `ne "/…/"` guards matter. Without them the section page itself, `/dental-services/`, would be
rewritten to `/dental-services-`, which is a 404.

## Redirects

Go to Rules → **Redirect Rules** → Create rule. Choose *Custom filter expression*, status **301**,
and **Preserve query string**.

| # | Name | Filter expression | Target |
| :--- | :--- | :--- | :--- |
| 1 | Root to www | `(http.host eq "ifadentistry.com")` | Dynamic: `concat("https://www.ifadentistry.com", http.request.uri.path)` |
| 2 | Old about | `(http.request.uri.path in {"/about" "/about/"})` | Static: `https://www.ifadentistry.com/about-our-practice/` |
| 3 | Old contact | `(http.request.uri.path in {"/contact" "/contact/"})` | Static: `https://www.ifadentistry.com/contact-us/` |

Also turn on SSL/TLS → Edge Certificates → **Always Use HTTPS**, which is what WordPress did for
`http://`.

## Check after the switch

```bash
cd workflows/21-instatic-upload
node verify-wp-urls.mjs https://www.ifadentistry.com > .tmp/verify-wp-urls.log 2>&1
```

Every line must read `ok`. Run against the Railway host (the default), the same script applies these
rules itself and checks the flat targets.

## Still flat: the site's own links

The menus and body links on the clone point at the flat slugs. After the switch they still work,
but clicking one shows `/dental-services-dental-implants` in the address bar. For the address bar to
match WordPress everywhere, the links must go back to the nested URLs in `prepare-wp.mjs` and the
site must be republished. That has to happen **at the switch**, because on the Railway host the
nested links 404.

## Version Control

Follows [SYSTEM_RULES.md §4](../../../../../SYSTEM_RULES.md).
