import { posts } from './blog-data.mjs';
import fs from 'node:fs';
// Dimensions from the existing media manifest avoid a second media pipeline.
const media = JSON.parse(fs.readFileSync(new URL('../../../../21-instatic-upload/.tmp/media-map.json', import.meta.url), 'utf8')).map;
const esc = s => String(s).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');
const minutes = p => Math.max(1, Math.ceil([p.intro, ...p.sections.flatMap(s => [s.title, ...s.paragraphs])].join(' ').split(/\s+/).length / 200));
const photo = (p, eager = false) => `<img class="journal_image${p.image === 'gen-surgical-loupes.webp' ? ' is-instruments' : ''}" src="assets/${p.image}" alt="${esc(p.alt)}" width="${media[p.image]?.width || 1200}" height="${media[p.image]?.height || 1600}" ${eager ? 'fetchpriority="high"' : 'loading="lazy"'}>`;
const meta = p => `<p class="journal_meta"><span>${esc(p.category)}</span><span>${minutes(p)} min read</span></p>`;
const card = p => `<article class="journal_card"><a class="journal_card-link" href="${p.slug}.html"><div class="journal_card-media">${photo(p)}</div><div class="journal_card-copy">${meta(p)}<h3 class="journal_card-title">${esc(p.title)}</h3><p class="journal_excerpt">${esc(p.excerpt)}</p><span class="journal_read">Read article <span aria-hidden="true">↗</span></span></div></a></article>`;
export const BLOG_PAGES = [{slug:'blog',src:'blog',photoHero:false,motion:true}, ...posts.map(p=>({slug:p.slug,src:p.slug,photoHero:false,motion:true}))];
export function blogBody(slug) {
  if(slug === 'blog') {
    const p = posts[0];
    return `<div class="journal_page">
      <section class="journal_hero padding-global"><div class="container-large">
        <p class="chapter_mark">The Stone journal</p>
        <div class="journal_heading-row"><h1 class="journal_title">A little clarity.<br><em>A considered choice.</em></h1><p class="journal_intro">Perspectives on facial aesthetics, the questions worth asking and the decisions that are yours to make.</p></div>
        <div class="journal_edition"><span>Perspective &amp; patient education</span><span>Stone Surgical Arts · Westlake, Texas</span></div>
      </div></section>
      <section class="journal_feature padding-global" aria-label="Featured article"><div class="container-large journal_feature-grid">
        <a class="journal_feature-media" href="${p.slug}.html" aria-label="Read ${esc(p.title)}">${photo(p,true)}</a>
        <div class="journal_feature-copy"><p class="chapter_mark">The considered read</p>${meta(p)}<h2 class="journal_feature-title"><a href="${p.slug}.html">${esc(p.title)}</a></h2><p class="journal_excerpt">${esc(p.excerpt)}</p><a class="journal_read" href="${p.slug}.html">Read the story <span aria-hidden="true">↗</span></a><p class="journal_date">Originally published ${p.dateLabel}</p></div>
      </div></section>
      <section class="journal_latest padding-global" id="articles"><div class="container-large"><div class="journal_section-heading"><h2>More to explore</h2><p>Start with a question. Read at your own pace.</p></div><div class="journal_grid">${posts.slice(1).map(card).join('')}</div></div></section>
    </div>`;
  }
  const p = posts.find(p=>p.slug===slug); if(!p) return null;
  return `<article class="journal_page journal_article">
    <header class="journal_article-head padding-global"><div class="container-large">
      <a class="journal_back" href="blog.html">← Back to the journal</a>${meta(p)}<h1 class="journal_article-title">${esc(p.title)}</h1><p class="journal_deck">${esc(p.excerpt)}</p>
      <div class="journal_byline"><span>Stone Surgical Arts</span><span>Originally published ${p.dateLabel}</span><span>Updated September 8, 2026</span></div>
    </div></header>
    <div class="padding-global"><div class="container-large journal_article-cover">${photo(p,true)}<p class="journal_caption">Perspective from Stone Surgical Arts</p></div></div>
    <div class="journal_reading padding-global"><div class="container-large journal_reading-grid">
      <aside class="journal_sidebar"><nav class="journal_toc" aria-label="In this article"><p class="chapter_mark">In this article</p>${p.sections.map((s,i)=>`<a class="journal_toc-link" href="#${s.id}"><span class="journal_toc-number">0${i+1}</span><span>${esc(s.title)}</span></a>`).join('')}<a class="journal_back journal_toc-back" href="blog.html">← All articles</a></nav></aside>
      <div class="journal_prose"><p class="journal_lead">${esc(p.intro)}</p><div class="journal_takeaway"><p class="chapter_mark">A thought to keep</p><p>${esc(p.takeaway)}</p></div>
        ${p.sections.map((s,i)=>`<section class="journal_section" id="${s.id}"><p class="journal_section-number">0${i+1}</p><h2>${esc(s.title)}</h2>${s.paragraphs.map(t=>`<p>${esc(t)}</p>`).join('')}</section>`).join('')}
        <div class="journal_article-note"><p>Adapted from the Stone Surgical Arts archive and updated for clarity. This article offers general information; an individual consultation is needed for treatment advice.</p><p class="journal_sources-label">Further reading</p>${p.references.map(r=>`<a class="journal_source" href="${esc(r.url)}">${esc(r.label)} <span aria-hidden="true">↗</span></a>`).join('')}</div>
        <a class="journal_read" href="${p.relatedTreatment.href}">${esc(p.relatedTreatment.label)} <span aria-hidden="true">↗</span></a>
      </div>
    </div></div>
    <section class="journal_related padding-global"><div class="container-large"><div class="journal_section-heading"><h2>Keep reading</h2><a class="journal_back" href="blog.html">View all articles ↗</a></div><div class="journal_grid">${posts.filter(r=>r.slug!==p.slug).map(card).join('')}</div></div></section>
  </article>`;
}
export function addBlogSeo(seo) {
  seo.pages.blog = {title:'The Journal | Stone Surgical Arts',description:'Thoughtful guides to facial aesthetics, cosmetic surgery and the questions to bring to a consultation at Stone Surgical Arts.',schema:{'@type':'Blog',name:'The Stone journal',url:seo.site.origin+'/blog'}};
  for(const p of posts) seo.pages[p.slug] = {title:({'types-of-plastic-surgery':'Types of Plastic Surgery','dermal-fillers-vs-botox':'Dermal Fillers vs. Botox'}[p.slug] || p.title)+' | Stone Surgical Arts',description:p.excerpt,ogType:'article',schema:{'@type':'BlogPosting',headline:p.title,description:p.excerpt,datePublished:p.date,dateModified:'2026-09-08',author:{'@type':'Organization',name:'Stone Surgical Arts'},publisher:{'@id':seo.site.origin+'/#practice'},mainEntityOfPage:seo.site.origin+'/'+p.slug,image:seo.site.origin+'/assets/'+p.image}};
}
