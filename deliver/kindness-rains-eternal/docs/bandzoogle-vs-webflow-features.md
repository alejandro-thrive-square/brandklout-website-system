# Bandzoogle vs Webflow — Musician Feature Parity

**Researched 2026-07-30.** Every claim below comes from a vendor page, linked inline. Where I could not confirm something, it is marked **UNVERIFIED** rather than guessed.

## 1. The headline finding

Bandzoogle's exclusivity is **not technical — it's economic.** Almost every individual feature can be rebuilt in Webflow. What cannot be rebuilt cheaply is the *bundle*: musician commerce at 0% commission for roughly $220/year.

### Cost to match 0% commission selling

| Stack | Monthly (billed yearly) | Annual | Commission |
| :--- | :--- | :--- | :--- |
| **Bandzoogle Pro** | $18.33 | **~$220** | **0%** on music, merch, tickets, subscriptions, crowdfunding |
| Webflow Premium + Ecommerce Standard | $25 + $29 = $54 | ~$648 | **2%** transaction fee |
| **Webflow Premium + Ecommerce Plus** | $25 + $74 = $99 | **~$1,188** | **0%** |
| Webflow Premium, no store | $25 | ~$300 | n/a — no store |

Sources: [Bandzoogle pricing](https://bandzoogle.com/pricing) · [Webflow pricing](https://webflow.com/pricing)

Stripe/PayPal processing fees (~2.9% + 30¢) apply on **both** platforms and are not included above.

**So: matching Bandzoogle's 0% commission on Webflow costs about 5× more per year ($1,188 vs $220).** If Andrew sells meaningfully, Bandzoogle is dramatically cheaper and that is a serious argument for staying. If he does not sell at all, the comparison is $300 vs $220 and the difference stops mattering.

This is why "is the store in use?" was flagged as the deciding question. It is now quantified.

> [!NOTE]
> Bandzoogle pricing was read from the Spanish-locale page and shows Lite $9.16 / Standard $14.16 / Pro $18.33 per month billed yearly. A separate English source showed slightly lower figures ($8.29 / $12.46 / $16.63). **Confirm against Andrew's actual invoice** rather than trusting either.

## 2. Bandzoogle plan gating

From [bandzoogle.com/pricing](https://bandzoogle.com/pricing):

| | Lite $9.16/mo | Standard $14.16/mo | Pro $18.33/mo |
| :--- | :--- | :--- | :--- |
| Pages | 10 | 20 | Unlimited |
| Songs | 10 | 50 | Unlimited |
| Photos | 100 | 500 | Unlimited |
| Selling | Music downloads only | Music + merch | Music, merch, tickets **and more** |
| Design tools | Customizable | Customizable | Advanced |
| Fan stats | Visitor stats | Visitor stats | Advanced |

**Relevant to Andrew:** the current site has 8 pages and 6–7 songs, so it fits inside even the Lite plan. Tickets, subscriptions and crowdfunding require **Pro**. Custom fonts and video headers appear in the comparison table as gated — worth checking which plan he's actually on.

The live site still shows a "Powered by Bandzoogle" footer, and "no Bandzoogle branding" appears as a gated line item in their comparison table. That hints he may be on a lower plan than Pro — **UNVERIFIED**, needs account access.

## 3. Feature-by-feature

### Genuinely exclusive — cannot be recreated in Webflow

| Feature | Why it can't be rebuilt |
| :--- | :--- |
| **Luminate / Nielsen SoundScan reporting** | Bandzoogle automatically reports music sales to Luminate (SoundScan), which is what makes sales chart-eligible. There is no Webflow equivalent and no third-party bolt-on that replicates it from a Webflow store. Source: [crowdfunding](https://bandzoogle.com/features/crowdfunding) |
| **Integrated fan database** | Per-song plays, **skips**, and downloads, tied to identified individual fans and plotted on a map — plus purchase and mailing-list activity in the same view. Webflow Analyze is page analytics. Approximating this means GA4 plus custom events on a custom player, and even then you don't get identity-linked activity. Source: [fan data](https://bandzoogle.com/features/fan-data) |
| **Geo-targeted email from fan location** | Bandzoogle auto-detects fan location and lets you email specific regions — useful for tour planning. Depends on the same fan database. Source: [mailing list](https://bandzoogle.com/features/mailinglist) |
| **The 0% commission bundle at $220/yr** | See §1. Replicable in function, ~5× the cost. |

### Recreatable in Webflow, roughly equivalent or better

| Bandzoogle feature | Webflow replacement | Assessment |
| :--- | :--- | :--- |
| [EPK / press kit](https://bandzoogle.com/features/epk) + Onesheets | A Webflow page | **Better.** Bandzoogle's advantage is templates and speed; a designed EPK on brand beats a template. |
| [Smart links / link-in-bio](https://bandzoogle.com/features/smart-links) | A Webflow page, or free Linktree/Feature.fm | **Equivalent.** Trivial to build. |
| [Music landing pages / funnels](https://bandzoogle.com/features/music-landing-pages) | Webflow pages + an email provider for the automation | **Equivalent.** Pages are easy; the automated-email half comes from the ESP. |
| [Mailing list](https://bandzoogle.com/features/mailinglist) | Kit / Mailchimp / Beehiiv | **Better, and likely free at his list size.** Also removes lock-in — the list lives somewhere portable instead of inside the website vendor. Loses geo-targeting (above). |
| Music player + track hosting | Custom player, or Spotify/Bandcamp/SoundCloud embeds | **Equivalent.** The site already uses embeds. |
| Blog | Webflow CMS | **Better.** |
| Free custom domain included | Buy separately, ~$12–15/yr | Marginal. |
| Password protection / member pages | Webflow Premium has password protection; gated tiers need Memberstack/Outseta | **Equivalent, at extra cost.** |

### Recreatable, but with real friction

| Bandzoogle feature | Webflow reality |
| :--- | :--- |
| [Sell music downloads](https://bandzoogle.com/features/sell-music) | Webflow Ecommerce **does** support digital downloads natively, but limited to **a single externally-hosted file per product variant** — so MP3s live on external storage you manage. No native equivalent of Bandzoogle's custom preview clips, printable download codes, or preorder-with-release-day-delivery. Source: [Webflow digital downloads](https://help.webflow.com/hc/en-us/articles/33961269277203-Digital-downloads) |
| [Merch](https://bandzoogle.com/features/sell-band-merch) | Webflow Ecommerce + Printful is workable, but Bandzoogle bundles EasyPost shipping, printed shipping labels, inventory, bundles and discount codes into the base price. |
| [Subscriptions](https://bandzoogle.com/features/subscriptions) | Needs Memberstack/Outseta/Memberful — extra monthly cost and a second system to maintain. |
| [Ticket sales](https://bandzoogle.com/features/event-ticket-sales) | No native Webflow equivalent; needs a third-party ticketing service, which will take a cut. Bandzoogle's is 0% with printable tickets and guest lists. |
| [Crowdfunding](https://bandzoogle.com/features/crowdfunding) | No native equivalent; third party, which will take a cut. |

## 4. The option that dissolves most of this

Bandzoogle sells **standalone merch-store plans, separate from website plans**:

| Plan | Price | Notes |
| :--- | :--- | :--- |
| Merch Store Lite | $6.37/mo billed yearly | 0% commission, up to 5 products, print-on-demand, physical + digital |
| Merch Store Pro | $20.79/mo billed yearly | Detailed sales reports, bundles, preorders, discounts, custom fonts |

Source: [bandzoogle.com/pricing](https://bandzoogle.com/pricing)

**This suggests a hybrid: build the site in Webflow, keep commerce on a standalone Bandzoogle merch store at 0% commission, and link between them.** You keep the best of both — a bespoke site with a real content model, and commission-free selling for ~$76/yr instead of ~$888/yr of Webflow Ecommerce Plus.

> [!WARNING]
> **UNVERIFIED:** I could not confirm from the pricing page whether a merch-store plan can be held *without* an accompanying website plan. They are presented as a separate plan family, which implies yes, but this must be confirmed with Bandzoogle support before relying on it. It is the single cheapest way to resolve the commerce objection, so it is worth one support ticket.

The same logic applies to **Bandcamp**, which most independent musicians already use: no monthly fee, revenue share on sales only, and fans trust the checkout. That is a zero-fixed-cost alternative if the Bandzoogle merch-store route doesn't hold up.

## 5. Bottom line

**What you'd actually lose by moving to Webflow:** Luminate/SoundScan chart reporting, the identity-linked fan analytics (per-song plays and skips on a map), and geo-targeted emailing. Everything else is replaceable, and several things get better.

**What it costs:** nothing extra if he isn't selling. If he is selling and wants to keep 0% commission entirely inside Webflow, roughly $970/year more — which is why the hybrid in §4 matters.

**Whether the losses matter** depends entirely on whether Andrew uses those features. A songwriter releasing on Spotify/Apple who doesn't chart, doesn't tour on data, and doesn't sell direct loses nothing real. One who does any of those loses something specific. **This is answerable in one session with account access and is not answerable without it.**

## Version Control

- All changes to this document follow the version control rules in [SYSTEM_RULES.md — Section 4](../../../SYSTEM_RULES.md).
- **Branch naming**: `deliver/kre-<description>`.

## Infrastructure

- **Hosting**: Hostinger VPS
- **OS**: Ubuntu 24.04 LTS
