// styles-def.mjs — the complete campaign class system, transcribed from
// docs/grand-mission-campaigns/assets/styles.css into Webflow-safe per-breakpoint
// values. clamp()/min() resolved at representative widths: base 1440, xl >=1440
// upper band, medium 991, small 767, tiny 478 (design breakpoints 1020/780/420).
// {v:'name'} values bind to site variables (see V below).

export const V = {
  navy: 'variable-082430ef-54c6-da46-1df1-6f43416b97f8',      // #002241
  blue: 'variable-0d6deade-46b8-3c60-cdab-5dddc296d8eb',      // #04669c
  sky: 'variable-45699325-3755-4277-cdab-268a35ea5fb5',       // #abd6ff
  brown: 'variable-34c4d170-3b4c-2b35-833b-3e8d95b4962e',     // #403830
  warm: 'variable-2d33d461-6540-146a-5aa1-005ca2f0dd4b',      // #8c6946
  navy950: 'variable-b5e7287a-3179-a6ad-b927-06669b61d509',   // #041a34
  gold: 'variable-11d58b0c-4d08-c821-68ee-75e20c2733a1',      // #c98b46
  sand: 'variable-d07b149c-b2e2-18f9-d17d-449d32c03452',      // #fdf8ee
  mist: 'variable-a30d6549-3163-2836-bdc5-43b169a4671f',      // #f3f8fb
  ink: 'variable-058568cf-4037-0a08-1d1e-5dc036485f16',       // #20272b
  muted: 'variable-f0446101-4749-4db8-98ee-ec3eb265b8a9',     // #5d6c7b
  line: 'variable-e7f197cc-4f3c-1899-c719-5a85903fe7ea',      // #dbe5ec
  danger: 'variable-d1e8664f-4491-d79c-6292-9766ab80fb66',    // #a9332c
  white: 'relume-variable--neutral-white',
  fontBody: 'relume-variable--font-style-body',
};

const SHADOW = '0 24px 70px rgba(0,34,65,0.14)';
const bTop = (w, c) => ({ 'border-top-style': 'solid', 'border-top-width': w, 'border-top-color': c });
const bBot = (w, c) => ({ 'border-bottom-style': 'solid', 'border-bottom-width': w, 'border-bottom-color': c });
const bLeft = (w, c) => ({ 'border-left-style': 'solid', 'border-left-width': w, 'border-left-color': c });
const bRight = (w, c) => ({ 'border-right-style': 'solid', 'border-right-width': w, 'border-right-color': c });
const bAll = (w, c) => ({ ...bTop(w, c), ...bBot(w, c), ...bLeft(w, c), ...bRight(w, c) });
const radius = (r) => ({ 'border-top-left-radius': r, 'border-top-right-radius': r, 'border-bottom-left-radius': r, 'border-bottom-right-radius': r });

export const STYLES = [
  // ---------- page scaffold ----------
  {
    n: 'campaign-page',
    p: { 'font-family': { v: 'fontBody' }, 'font-size': '16px', 'line-height': '1.65', color: { v: 'ink' }, 'background-color': { v: 'white' }, '-webkit-font-smoothing': 'antialiased' },
    bp: { small: { 'padding-bottom': '64px' } },
  },
  {
    n: 'campaign-container',
    p: { width: '100%', 'max-width': '76.25rem', 'margin-left': 'auto', 'margin-right': 'auto', 'padding-left': '1.25rem', 'padding-right': '1.25rem' },
    bp: { small: { 'max-width': '41.75rem', 'padding-left': '0.875rem', 'padding-right': '0.875rem' } },
  },
  {
    n: 'campaign-section',
    p: { 'padding-top': '7.2rem', 'padding-bottom': '7.2rem' },
    bp: { xl: { 'padding-top': '8.5rem', 'padding-bottom': '8.5rem' }, medium: { 'padding-top': '4.95rem', 'padding-bottom': '4.95rem' }, small: { 'padding-top': '4.6rem', 'padding-bottom': '4.6rem' } },
  },
  { n: 'is-navy', parents: ['campaign-section'], p: { color: 'rgba(255,255,255,0.82)', 'background-color': { v: 'navy' } } },
  { n: 'is-blue', parents: ['campaign-section'], p: { color: 'rgba(255,255,255,0.84)', 'background-color': { v: 'blue' } } },
  { n: 'is-sand', parents: ['campaign-section'], p: { 'background-color': { v: 'sand' } } },
  { n: 'is-mist', parents: ['campaign-section'], p: { 'background-color': { v: 'mist' } } },
  { n: 'campaign-center', p: { 'text-align': 'center', 'margin-top': '2.25rem' } },
  {
    n: 'campaign-skip',
    p: { position: 'fixed', left: '1rem', top: '-100px', 'z-index': '999', 'background-color': { v: 'white' }, color: { v: 'navy' }, 'padding-top': '0.75rem', 'padding-bottom': '0.75rem', 'padding-left': '1rem', 'padding-right': '1rem', 'box-shadow': SHADOW, 'text-decoration': 'none' },
    focus: { top: '1rem' },
  },

  // ---------- type ----------
  {
    n: 'campaign-h1',
    p: { color: { v: 'white' }, 'font-size': '4.5rem', 'line-height': '1.12', 'letter-spacing': '-0.035em', 'font-weight': '700', 'margin-top': '0px', 'margin-bottom': '1.25rem' },
    bp: { xl: { 'font-size': '4.9rem' }, medium: { 'font-size': '2.9rem' }, small: { 'font-size': '3.4rem' }, tiny: { 'font-size': '2.6rem' } },
  },
  {
    n: 'campaign-h2',
    p: { color: { v: 'navy' }, 'font-size': '3.15rem', 'line-height': '1.12', 'letter-spacing': '-0.035em', 'font-weight': '700', 'margin-top': '0px', 'margin-bottom': '1rem' },
    bp: { xl: { 'font-size': '3.55rem' }, medium: { 'font-size': '2.05rem' }, small: { 'font-size': '2.6rem' }, tiny: { 'font-size': '2.05rem' } },
  },
  { n: 'is-light', parents: ['campaign-h2'], p: { color: { v: 'white' } } },
  { n: 'campaign-h3', p: { color: { v: 'navy' }, 'font-size': '1.22rem', 'line-height': '1.12', 'letter-spacing': '-0.035em', 'font-weight': '700', 'margin-top': '0px', 'margin-bottom': '0.75rem' } },
  { n: 'is-light', parents: ['campaign-h3'], p: { color: { v: 'white' } } },
  { n: 'campaign-text', p: { 'margin-top': '0px', 'margin-bottom': '1.25rem' } },
  { n: 'is-muted', parents: ['campaign-text'], p: { color: { v: 'muted' } } },
  { n: 'is-sub', parents: ['campaign-text'], p: { color: { v: 'muted' }, 'font-size': '1.04rem' } },
  { n: 'is-sub-light', parents: ['campaign-text'], p: { color: 'rgba(255,255,255,0.78)', 'font-size': '1.04rem' } },
  {
    n: 'campaign-eyebrow',
    p: { display: 'inline-block', 'margin-bottom': '0.75rem', color: { v: 'blue' }, 'font-size': '0.74rem', 'font-weight': '800', 'letter-spacing': '0.16em', 'text-transform': 'uppercase' },
  },
  { n: 'is-light', parents: ['campaign-eyebrow'], p: { color: { v: 'sky' } } },
  { n: 'campaign-heading', p: { 'max-width': '680px' } },
  { n: 'is-center', parents: ['campaign-heading'], p: { 'margin-left': 'auto', 'margin-right': 'auto', 'text-align': 'center' } },
  { n: 'campaign-fine-print', p: { 'margin-top': '1.3rem', 'margin-bottom': '0px', color: { v: 'muted' }, 'font-size': '0.7rem', 'line-height': '1.5' } },

  // ---------- buttons & links ----------
  {
    n: 'campaign-button',
    p: {
      'min-height': '52px', display: 'inline-flex', 'align-items': 'center', 'justify-content': 'center', gap: '0.7rem',
      'padding-top': '0.85rem', 'padding-bottom': '0.85rem', 'padding-left': '1.35rem', 'padding-right': '1.35rem',
      ...bAll('1px', 'transparent'), ...radius('2px'), 'text-decoration': 'none', 'text-align': 'center',
      'font-weight': '700', 'line-height': '1.2', cursor: 'pointer', transition: 'transform .2s ease, background-color .2s ease, border-color .2s ease, color .2s ease, box-shadow .2s ease',
    },
    hover: { transform: 'translateY(-2px)' },
    bp: { tiny: { width: '100%' } },
  },
  {
    n: 'is-gold', parents: ['campaign-button'],
    p: { color: { v: 'white' }, 'background-image': 'linear-gradient(110deg, #8c6946, #c98b46 55%, #a36f36)', ...bAll('1px', 'rgba(255,255,255,0.45)'), 'box-shadow': '0 12px 30px rgba(0,0,0,0.18)' },
    hover: { 'background-image': 'none', 'background-color': { v: 'warm' } },
  },
  { n: 'is-navy', parents: ['campaign-button'], p: { color: { v: 'white' }, 'background-color': { v: 'navy' }, ...bAll('1px', '#002241') }, hover: { 'background-color': { v: 'blue' }, ...bAll('1px', '#04669c') } },
  { n: 'is-white', parents: ['campaign-button'], p: { color: { v: 'navy' }, 'background-color': { v: 'white' }, ...bAll('1px', '#ffffff') }, hover: { 'background-color': { v: 'sky' }, ...bAll('1px', '#abd6ff') } },
  { n: 'is-outline-light', parents: ['campaign-button'], p: { color: { v: 'white' }, 'background-color': 'rgba(255,255,255,0.07)', ...bAll('1px', 'rgba(255,255,255,0.7)') }, hover: { 'background-color': 'rgba(255,255,255,0.16)' } },
  { n: 'is-small', parents: ['campaign-button'], p: { 'min-height': '42px', 'padding-top': '0.65rem', 'padding-bottom': '0.65rem', 'padding-left': '1rem', 'padding-right': '1rem', 'font-size': '0.78rem' } },
  { n: 'is-full', parents: ['campaign-button'], p: { width: '100%' } },
  { n: 'is-grow', parents: ['campaign-button'], p: { flex: '1' } },
  {
    n: 'campaign-button-row',
    p: { display: 'flex', 'flex-wrap': 'wrap', 'align-items': 'center', gap: '0.9rem', 'margin-top': '1.65rem' },
    bp: { tiny: { 'align-items': 'stretch' } },
  },
  { n: 'is-center', parents: ['campaign-button-row'], p: { 'justify-content': 'center' } },
  {
    n: 'campaign-text-link',
    p: { display: 'inline-flex', 'align-items': 'center', gap: '0.4rem', color: { v: 'blue' }, 'font-weight': '700', 'text-decoration': 'underline', 'text-decoration-thickness': '1px', 'text-underline-offset': '4px' },
  },
  { n: 'is-light', parents: ['campaign-text-link'], p: { color: { v: 'sky' } } },
  { n: 'campaign-icon', p: { width: '1.15em', height: '1.15em', flex: '0 0 auto' } },
  { n: 'is-lg', parents: ['campaign-icon'], p: { width: '1.45em', height: '1.45em' } },
  { n: 'campaign-strong', p: { 'font-weight': '700' } },

  // ---------- announcement ----------
  { n: 'campaign-announce', p: { 'background-color': { v: 'navy950' }, color: { v: 'white' }, 'font-size': '0.78rem', 'letter-spacing': '0.02em' }, bp: { small: { 'font-size': '0.68rem' } } },
  {
    n: 'campaign-announce_inner',
    p: { 'min-height': '36px', display: 'flex', 'align-items': 'center', 'justify-content': 'space-between', gap: '1rem' },
    bp: { tiny: { 'justify-content': 'center' } },
  },
  { n: 'campaign-announce_link', p: { display: 'inline-flex', 'align-items': 'center', gap: '0.45rem', 'text-decoration': 'none', 'font-weight': '700', color: { v: 'white' } }, hover: { color: { v: 'sky' } }, bp: { tiny: { display: 'none' } } },
  { n: 'campaign-announce_note', bp: { small: { display: 'none' } }, p: {} },

  // ---------- header ----------
  {
    n: 'campaign-header',
    p: { position: 'sticky', top: '0px', 'z-index': '90', 'background-color': 'rgba(4,102,156,0.96)', color: { v: 'white' }, ...bBot('1px', 'rgba(255,255,255,0.22)'), 'backdrop-filter': 'blur(14px)' },
  },
  { n: 'campaign-header_inner', p: { 'min-height': '76px', display: 'flex', 'align-items': 'center', 'justify-content': 'space-between', gap: '1.5rem' }, bp: { small: { 'min-height': '64px' } } },
  { n: 'campaign-header_brand', p: { display: 'inline-flex', 'align-items': 'center' } },
  { n: 'campaign-header_logo', p: { width: '252px', height: '43px', 'object-fit': 'contain' }, bp: { small: { width: '190px', height: 'auto' }, tiny: { width: '176px' } } },
  { n: 'campaign-header_actions', p: { display: 'flex', 'align-items': 'center', gap: '1.2rem' } },
  { n: 'campaign-header_status', p: { display: 'flex', 'align-items': 'center', gap: '0.45rem', 'font-size': '0.76rem', color: 'rgba(255,255,255,0.86)', 'max-width': '210px' }, bp: { medium: { display: 'none' } } },
  {
    n: 'campaign-header_phone',
    p: { display: 'inline-flex', 'align-items': 'center', gap: '0.5rem', 'font-weight': '700', 'text-decoration': 'none', 'white-space': 'nowrap', color: { v: 'white' } },
    bp: { small: { width: '40px', height: '40px', 'justify-content': 'center', ...bAll('1px', 'rgba(255,255,255,0.55)') } },
  },
  { n: 'campaign-header_phone-text', bp: { small: { display: 'none' } }, p: {} },
  { n: 'campaign-header_cta', bp: { small: { display: 'none' } }, p: {} }, // wrapper util on the header button

  // ---------- hero ----------
  {
    n: 'campaign-hero',
    p: { position: 'relative', overflow: 'hidden', color: 'rgba(255,255,255,0.84)', 'background-image': 'radial-gradient(circle at 80% 10%, rgba(171,214,255,0.2), transparent 32%), linear-gradient(135deg, #002241 0%, #023b61 58%, #04669c 100%)' },
  },
  { n: 'is-urgent', parents: ['campaign-hero'], p: { 'background-image': 'radial-gradient(circle at 78% 8%, rgba(201,139,70,0.28), transparent 32%), linear-gradient(135deg, #311d1b 0%, #6d2927 52%, #a13b35 100%)' } },
  { n: 'campaign-hero_ring', p: { position: 'absolute', right: '-10vw', bottom: '-260px', width: '600px', height: '600px', ...bAll('1px', 'rgba(171,214,255,0.22)'), ...radius('50%'), 'pointer-events': 'none' } },
  {
    n: 'campaign-hero_grid',
    p: { 'min-height': '710px', display: 'grid', 'grid-template-columns': 'minmax(0, 1.08fr) minmax(380px, 0.92fr)', 'align-items': 'center', gap: '4.5rem', 'padding-top': '7.2rem', 'padding-bottom': '7.2rem' },
    bp: {
      xl: { gap: '5.5rem', 'padding-top': '7.5rem', 'padding-bottom': '7.5rem' },
      medium: { 'grid-template-columns': '1fr 1fr', gap: '2.5rem', 'min-height': '650px', 'padding-top': '4.95rem', 'padding-bottom': '4.95rem' },
      small: { 'grid-template-columns': '1fr', 'min-height': '0px', 'padding-top': '3.5rem', 'padding-bottom': '4.5rem' },
    },
  },
  { n: 'campaign-hero_content', p: { position: 'relative', 'z-index': '2' } },
  { n: 'campaign-hero_lead', p: { 'max-width': '720px', color: 'rgba(255,255,255,0.84)', 'font-size': '1.3rem', 'margin-top': '0px', 'margin-bottom': '1.25rem' }, bp: { medium: { 'font-size': '1.05rem' } } },
  { n: 'campaign-hero_microproof', p: { display: 'flex', 'flex-wrap': 'wrap', 'align-items': 'center', gap: '0.55rem', 'margin-top': '1.4rem', 'font-size': '0.76rem' }, bp: { small: { 'font-size': '0.68rem' } } },
  { n: 'campaign-hero_stars', p: { color: '#f8c45f', 'letter-spacing': '0.08em' } },
  { n: 'campaign-hero_visual', p: { position: 'relative', 'z-index': '2' }, bp: { small: { 'margin-top': '0.5rem' } } },
  {
    n: 'campaign-hero_media',
    p: { position: 'relative', 'aspect-ratio': '0.9', overflow: 'hidden', ...bAll('1px', 'rgba(255,255,255,0.46)'), 'box-shadow': '0 28px 70px rgba(0,0,0,0.32)' },
    bp: { small: { 'aspect-ratio': '1.12' } },
  },
  { n: 'is-wide', parents: ['campaign-hero_media'], p: { 'aspect-ratio': '1.2' } },
  { n: 'campaign-hero_img', p: { width: '100%', height: '100%', 'object-fit': 'cover', 'object-position': 'center' } },
  { n: 'campaign-hero_badge', p: { position: 'absolute', left: '1rem', right: '1rem', bottom: '1rem', 'padding-top': '1rem', 'padding-bottom': '1rem', 'padding-left': '1.1rem', 'padding-right': '1.1rem', color: { v: 'navy' }, 'background-color': 'rgba(255,255,255,0.94)', 'box-shadow': '0 12px 34px rgba(0,0,0,0.2)' } },
  { n: 'campaign-hero_badge-title', p: { display: 'block', 'font-size': '1.02rem', 'font-weight': '700' } },
  { n: 'campaign-hero_badge-sub', p: { display: 'block', color: { v: 'muted' }, 'font-size': '0.76rem' } },
  {
    n: 'campaign-hero_promise',
    p: { position: 'absolute', right: '-1.5rem', top: '-1.5rem', display: 'flex', 'align-items': 'center', gap: '0.65rem', 'max-width': '245px', 'padding-top': '0.8rem', 'padding-bottom': '0.8rem', 'padding-left': '1rem', 'padding-right': '1rem', color: { v: 'navy' }, 'background-color': { v: 'sky' }, 'box-shadow': SHADOW },
    bp: { small: { right: '0.6rem', top: '-0.8rem' } },
  },
  { n: 'campaign-hero_promise-icon', p: { display: 'inline-flex', 'font-size': '1.45rem' } },
  { n: 'campaign-hero_promise-text', p: { margin: '0px', 'font-size': '0.72rem', 'line-height': '1.4' } },
  { n: 'campaign-urgent-note', p: { 'margin-top': '1.35rem', 'padding-top': '0.85rem', 'padding-bottom': '0.85rem', 'padding-left': '1rem', 'padding-right': '1rem', ...bLeft('3px', '#ffc8c3'), 'background-color': 'rgba(0,0,0,0.18)', 'font-size': '0.76rem' } },

  // ---------- proof strip ----------
  { n: 'campaign-proof', p: { position: 'relative', 'z-index': '5', 'background-color': { v: 'white' }, ...bBot('1px', '#dbe5ec'), 'box-shadow': '0 14px 35px rgba(0,34,65,0.06)' } },
  { n: 'campaign-proof_grid', p: { display: 'grid', 'grid-template-columns': 'repeat(4, 1fr)' }, bp: { medium: { 'grid-template-columns': 'repeat(2, 1fr)' } } },
  {
    n: 'campaign-proof_item',
    p: { 'min-height': '112px', display: 'flex', 'align-items': 'center', gap: '0.8rem', padding: '1.2rem', ...bRight('1px', '#dbe5ec'), 'text-decoration': 'none', color: { v: 'ink' } },
    bp: { small: { 'min-height': '92px', 'padding-top': '0.85rem', 'padding-bottom': '0.85rem', 'padding-left': '0.75rem', 'padding-right': '0.75rem', gap: '0.55rem' } },
  },
  { n: 'is-1', parents: ['campaign-proof_item'], p: {}, bp: { medium: { ...bBot('1px', '#dbe5ec') } } },
  { n: 'is-2', parents: ['campaign-proof_item'], p: {}, bp: { medium: { 'border-right-width': '0px', ...bBot('1px', '#dbe5ec') } } },
  { n: 'is-last', parents: ['campaign-proof_item'], p: { 'border-right-width': '0px' } },
  { n: 'campaign-proof_stars', p: { color: '#e9a92e', 'font-size': '0.68rem', 'letter-spacing': '-0.03em', display: 'inline-flex' } },
  { n: 'campaign-proof_icon', p: { display: 'inline-flex', color: { v: 'blue' }, 'font-size': '1.7rem' }, bp: { small: { 'font-size': '1.35rem' } } },
  { n: 'campaign-proof_year', p: { 'min-width': '35px', color: { v: 'blue' }, 'font-size': '1.55rem', 'font-weight': '800', 'letter-spacing': '-0.05em' }, bp: { small: { 'min-width': '29px', 'font-size': '1.2rem' } } },
  { n: 'campaign-proof_title', p: { display: 'block', color: { v: 'navy' }, 'font-size': '0.86rem', 'line-height': '1.25', 'font-weight': '700' }, bp: { small: { 'font-size': '0.7rem' } } },
  { n: 'campaign-proof_sub', p: { display: 'block', 'margin-top': '0.25rem', color: { v: 'muted' }, 'font-size': '0.66rem', 'line-height': '1.35' }, bp: { small: { 'font-size': '0.57rem' } } },

  // ---------- shared grids ----------
  {
    n: 'campaign-split',
    p: { display: 'grid', 'grid-template-columns': 'repeat(2, minmax(0, 1fr))', 'align-items': 'center', gap: '6.3rem' },
    bp: { xl: { gap: '7rem' }, medium: { gap: '2.5rem' }, small: { 'grid-template-columns': '1fr' } },
  },
  { n: 'is-stretch', parents: ['campaign-split'], p: { 'align-items': 'stretch' } },
  { n: 'is-offer', parents: ['campaign-split'], p: { 'align-items': 'stretch' } },
  { n: 'is-result', parents: ['campaign-split'], p: { 'grid-template-columns': '0.82fr 1.18fr' }, bp: { small: { 'grid-template-columns': '1fr' } } },
  { n: 'is-provider', parents: ['campaign-split'], p: { 'grid-template-columns': '0.78fr 1.22fr' }, bp: { small: { 'grid-template-columns': '1fr' } } },
  { n: 'is-video', parents: ['campaign-split'], p: { 'grid-template-columns': '0.72fr 1.28fr' }, bp: { small: { 'grid-template-columns': '1fr' } } },
  { n: 'is-video-reverse', parents: ['campaign-split'], p: { 'grid-template-columns': '1.28fr 0.72fr' }, bp: { small: { 'grid-template-columns': '1fr' } } },
  { n: 'is-faq', parents: ['campaign-split'], p: { 'grid-template-columns': '0.8fr 1.2fr', 'align-items': 'start' }, bp: { small: { 'grid-template-columns': '1fr' } } },

  // ---------- offer card ----------
  {
    n: 'campaign-offer-card',
    p: { padding: '3rem', ...bAll('1px', '#dbe5ec'), 'background-color': { v: 'mist' }, 'box-shadow': SHADOW },
    bp: { medium: { padding: '2rem' }, small: { padding: '1.6rem' } },
  },
  { n: 'campaign-offer-card_top', p: { display: 'flex', 'align-items': 'flex-start', 'justify-content': 'space-between', gap: '1rem', 'padding-bottom': '1.25rem', ...bBot('1px', '#dbe5ec') } },
  { n: 'campaign-offer-card_kicker', p: { color: { v: 'blue' }, 'font-size': '0.72rem', 'font-weight': '800', 'letter-spacing': '0.13em', 'text-transform': 'uppercase' } },
  { n: 'campaign-offer-card_price', p: { color: { v: 'navy' }, 'text-align': 'right', 'font-weight': '700' } },
  { n: 'campaign-check-list', p: { 'margin-top': '1.5rem', 'margin-bottom': '1.5rem' } },
  { n: 'campaign-check-item', p: { display: 'flex', 'align-items': 'flex-start', gap: '0.75rem', 'margin-top': '0.85rem', 'margin-bottom': '0.85rem' } },
  { n: 'campaign-check-icon', p: { width: '1.15rem', height: '1.15rem', 'margin-top': '0.15rem', flex: '0 0 auto' } },

  // ---------- story ----------
  { n: 'campaign-story_media', p: { position: 'relative' } },
  { n: 'campaign-story_img', p: { width: '100%', 'aspect-ratio': '1.2', 'object-fit': 'cover', 'box-shadow': '28px 28px 0 rgba(171,214,255,0.14)' } },
  { n: 'campaign-story_caption', p: { position: 'absolute', left: '0px', bottom: '0px', 'padding-top': '0.65rem', 'padding-bottom': '0.65rem', 'padding-left': '1rem', 'padding-right': '1rem', color: { v: 'navy' }, 'background-color': { v: 'sky' }, 'font-size': '0.72rem', 'font-weight': '700' } },

  // ---------- benefits ----------
  {
    n: 'campaign-benefits_grid',
    p: { display: 'grid', 'grid-template-columns': 'repeat(4, 1fr)', 'margin-top': '3.2rem', ...bTop('1px', '#dbe5ec'), ...bLeft('1px', '#dbe5ec') },
    bp: { medium: { 'grid-template-columns': 'repeat(2, 1fr)' }, small: { 'grid-template-columns': '1fr' } },
  },
  {
    n: 'campaign-benefit',
    p: { 'min-height': '300px', 'padding-top': '2rem', 'padding-bottom': '2rem', 'padding-left': '1.5rem', 'padding-right': '1.5rem', ...bRight('1px', '#dbe5ec'), ...bBot('1px', '#dbe5ec') },
    bp: { small: { 'min-height': 'auto' } },
  },
  { n: 'campaign-benefit_number', p: { display: 'block', 'margin-bottom': '2.8rem', color: { v: 'sky' }, 'font-size': '2.3rem', 'font-weight': '800', 'letter-spacing': '-0.08em' }, bp: { small: { 'margin-bottom': '1.5rem' } } },
  { n: 'campaign-benefit_text', p: { color: { v: 'muted' }, 'font-size': '0.88rem', 'margin-top': '0px', 'margin-bottom': '0px' } },

  // ---------- before/after ----------
  { n: 'campaign-authenticity', p: { display: 'flex', 'align-items': 'flex-start', gap: '0.6rem', 'margin-top': '1.4rem', 'margin-bottom': '0px', color: { v: 'blue' }, 'font-size': '0.74rem', 'font-weight': '600' } },
  { n: 'campaign-ba', p: { position: 'relative', margin: '0px', overflow: 'hidden', 'background-color': '#d4d4d4', 'box-shadow': SHADOW, 'aspect-ratio': '1.63' } },
  { n: 'campaign-ba_before', p: { position: 'absolute', left: '0px', top: '0px', width: '100%', height: '100%', 'object-fit': 'cover' } },
  { n: 'campaign-ba_after-wrap', p: { position: 'absolute', left: '0px', top: '0px', width: '50%', height: '100%', overflow: 'hidden' } },
  { n: 'campaign-ba_after', p: { position: 'absolute', left: '0px', top: '0px', width: '200%', 'max-width': 'none', height: '100%', 'object-fit': 'cover' } },
  { n: 'campaign-ba_label', p: { position: 'absolute', top: '1rem', 'z-index': '2', 'padding-top': '0.35rem', 'padding-bottom': '0.35rem', 'padding-left': '0.6rem', 'padding-right': '0.6rem', color: { v: 'white' }, 'background-color': 'rgba(0,34,65,0.8)', 'font-size': '0.65rem', 'font-weight': '800', 'text-transform': 'uppercase' } },
  { n: 'is-before', parents: ['campaign-ba_label'], p: { right: '1rem' } },
  { n: 'is-after', parents: ['campaign-ba_label'], p: { left: '1rem' } },
  { n: 'campaign-ba_handle', p: { position: 'absolute', 'z-index': '2', left: '50%', top: '50%', width: '42px', height: '42px', transform: 'translate(-50%, -50%)', ...bAll('3px', '#ffffff'), ...radius('50%'), 'background-color': { v: 'blue' }, 'box-shadow': '0 5px 18px rgba(0,0,0,0.28)', 'pointer-events': 'none' } },
  { n: 'campaign-ba_caption', p: { position: 'absolute', 'z-index': '3', left: '1rem', right: '1rem', bottom: '1rem', 'padding-top': '0.5rem', 'padding-bottom': '0.5rem', 'padding-left': '0.65rem', 'padding-right': '0.65rem', color: { v: 'white' }, 'background-color': 'rgba(0,34,65,0.82)', 'font-size': '0.65rem' }, bp: { tiny: { 'font-size': '0.55rem' } } },

  // ---------- journey ----------
  {
    n: 'campaign-journey_grid',
    p: { display: 'grid', 'grid-template-columns': 'repeat(5, 1fr)', 'margin-top': '3.2rem', ...bTop('1px', '#dbe5ec') },
    bp: { medium: { 'grid-template-columns': 'repeat(3, 1fr)' }, small: { 'grid-template-columns': '1fr' } },
  },
  { n: 'is-3', parents: ['campaign-journey_grid'], p: { 'grid-template-columns': 'repeat(3, 1fr)' }, bp: { small: { 'grid-template-columns': '1fr' } } },
  { n: 'is-4', parents: ['campaign-journey_grid'], p: { 'grid-template-columns': 'repeat(4, 1fr)' }, bp: { medium: { 'grid-template-columns': 'repeat(3, 1fr)' }, small: { 'grid-template-columns': '1fr' } } },
  {
    n: 'campaign-journey_step',
    p: { position: 'relative', 'padding-top': '2rem', 'padding-bottom': '2rem', 'padding-left': '1.3rem', 'padding-right': '1.3rem', ...bRight('1px', '#dbe5ec') },
    bp: { medium: { ...bBot('1px', '#dbe5ec') }, small: { 'border-right-width': '0px' } },
  },
  { n: 'is-last', parents: ['campaign-journey_step'], p: { 'border-right-width': '0px' } },
  { n: 'campaign-journey_num', p: { display: 'block', 'margin-bottom': '2rem', color: { v: 'blue' }, 'font-weight': '800' } },
  { n: 'campaign-journey_text', p: { color: { v: 'muted' }, 'font-size': '0.82rem', 'margin-top': '0px', 'margin-bottom': '0px' } },

  // ---------- provider ----------
  { n: 'campaign-provider_photo', p: { position: 'relative', 'max-width': '480px' }, bp: { small: { 'max-width': 'none' } } },
  { n: 'campaign-provider_img', p: { width: '100%', 'aspect-ratio': '0.88', 'object-fit': 'cover', 'object-position': 'top', 'background-color': { v: 'mist' } }, bp: { small: { 'aspect-ratio': '1' } } },
  { n: 'campaign-provider_caption', p: { position: 'absolute', left: '1rem', right: '-1.5rem', bottom: '1rem', 'padding-top': '1rem', 'padding-bottom': '1rem', 'padding-left': '1.15rem', 'padding-right': '1.15rem', color: { v: 'white' }, 'background-color': { v: 'blue' }, 'box-shadow': SHADOW }, bp: { small: { right: '0.8rem' } } },
  { n: 'campaign-provider_caption-name', p: { display: 'block', 'font-weight': '700' } },
  { n: 'campaign-provider_caption-role', p: { display: 'block', color: 'rgba(255,255,255,0.75)', 'font-size': '0.72rem' } },
  { n: 'campaign-credential-list', p: { display: 'grid', 'grid-template-columns': 'repeat(2, 1fr)', gap: '0rem 1.2rem', 'margin-top': '1.5rem', 'margin-bottom': '1.5rem' }, bp: { small: { 'grid-template-columns': '1fr' } } },
  { n: 'campaign-credential-text', p: { color: { v: 'navy' }, 'font-size': '0.82rem', 'font-weight': '600' } },

  // ---------- video ----------
  { n: 'campaign-video_card', p: { overflow: 'hidden', ...bAll('1px', 'rgba(255,255,255,0.38)'), 'box-shadow': SHADOW } },
  { n: 'campaign-video_button', p: { position: 'relative', width: '100%', 'aspect-ratio': '1.7777', display: 'block', padding: '0px', color: { v: 'white' }, 'background-color': { v: 'navy' }, cursor: 'pointer', 'text-decoration': 'none' } },
  { n: 'campaign-video_poster', p: { width: '100%', height: '100%', 'object-fit': 'cover' } },
  { n: 'campaign-video_scrim', p: { position: 'absolute', left: '0px', top: '0px', right: '0px', bottom: '0px', 'background-image': 'linear-gradient(90deg, rgba(0,34,65,0.82), rgba(0,34,65,0.15))' } },
  { n: 'campaign-video_overlay', p: { position: 'absolute', 'z-index': '2', left: '2rem', bottom: '2rem', display: 'grid', 'grid-template-columns': 'auto 1fr', gap: '0.1rem 0.85rem', 'text-align': 'left' }, bp: { small: { left: '1rem', bottom: '1rem' } } },
  { n: 'campaign-video_play', p: { 'grid-row': 'span 2', width: '50px', height: '50px', display: 'grid', 'place-items': 'center', ...radius('50%'), color: { v: 'navy' }, 'background-color': { v: 'white' } }, bp: { small: { width: '42px', height: '42px' } } },
  { n: 'campaign-video_title', p: { 'align-self': 'end', 'font-size': '0.9rem', 'font-weight': '700', color: { v: 'white' } } },
  { n: 'campaign-video_meta', p: { color: 'rgba(255,255,255,0.76)', 'font-size': '0.8rem' } },

  // ---------- reviews ----------
  { n: 'campaign-reviews_grid', p: { display: 'grid', 'grid-template-columns': 'repeat(3, 1fr)', gap: '1.2rem', 'margin-top': '3rem' }, bp: { small: { 'grid-template-columns': '1fr' } } },
  { n: 'campaign-review', p: { display: 'flex', 'flex-direction': 'column', 'min-height': '270px', padding: '1.6rem', 'background-color': { v: 'white' }, ...bAll('1px', '#dbe5ec'), 'box-shadow': '0 16px 35px rgba(0,34,65,0.06)' } },
  { n: 'campaign-review_stars', p: { color: '#e9a92e', 'letter-spacing': '0.1em', 'font-size': '0.8rem' } },
  { n: 'campaign-review_quote', p: { flex: '1', 'margin-top': '1.2rem', 'margin-bottom': '1.25rem', color: { v: 'brown' }, 'font-size': '0.92rem' } },
  { n: 'campaign-review_name', p: { display: 'block', color: { v: 'navy' }, 'font-weight': '700' } },
  { n: 'campaign-review_meta', p: { display: 'block', color: { v: 'muted' }, 'font-size': '0.68rem' } },

  // ---------- FAQ (native Dropdown) ----------
  { n: 'campaign-faq_list', p: { ...bTop('1px', '#dbe5ec') } },
  { n: 'campaign-faq_item', p: { display: 'block', width: '100%', ...bBot('1px', '#dbe5ec') } },
  {
    n: 'campaign-faq_toggle',
    p: { width: '100%', display: 'flex', 'align-items': 'center', 'justify-content': 'space-between', gap: '1.5rem', 'padding-top': '1.4rem', 'padding-bottom': '1.4rem', 'padding-left': '0px', 'padding-right': '0px', color: { v: 'navy' }, 'background-color': 'transparent', 'text-align': 'left', 'font-size': '1rem', 'font-weight': '700', cursor: 'pointer', 'list-style': 'none' },
  },
  { n: 'campaign-faq_plus', p: { color: { v: 'blue' }, 'font-size': '1.6rem', 'font-weight': '400', 'line-height': '1' } },
  { n: 'campaign-faq_panel', p: { 'background-color': 'transparent', position: 'static' } },
  { n: 'campaign-faq_answer', p: { color: { v: 'muted' }, 'font-size': '0.88rem', 'margin-top': '0px', 'margin-bottom': '1.25rem', 'padding-right': '2.5rem' } },

  // ---------- closing CTA ----------
  {
    n: 'campaign-cta',
    p: { 'padding-top': '9rem', 'padding-bottom': '9rem', color: 'rgba(255,255,255,0.82)', 'background-color': { v: 'navy' }, 'background-image': 'radial-gradient(circle at 85% 10%, rgba(171,214,255,0.22), transparent 30%)', 'text-align': 'center' },
    bp: { medium: { 'padding-top': '6.5rem', 'padding-bottom': '6.5rem' }, small: { 'padding-top': '5rem', 'padding-bottom': '5rem' } },
  },
  { n: 'is-compact', parents: ['campaign-cta'], p: { 'padding-top': '5.5rem', 'padding-bottom': '5.5rem' } },
  { n: 'campaign-cta_inner', p: { 'max-width': '820px', 'margin-left': 'auto', 'margin-right': 'auto' } },
  { n: 'campaign-cta_text', p: { 'max-width': '690px', 'margin-left': 'auto', 'margin-right': 'auto', 'margin-top': '0px', 'margin-bottom': '1.25rem' } },

  // ---------- footer ----------
  { n: 'campaign-footer', p: { 'padding-top': '4.5rem', 'padding-bottom': '1.5rem', color: 'rgba(255,255,255,0.7)', 'background-color': { v: 'navy950' } } },
  {
    n: 'campaign-footer_grid',
    p: { display: 'grid', 'grid-template-columns': '1.6fr 1fr 1fr 0.8fr', gap: '2.5rem' },
    bp: { medium: { 'grid-template-columns': '1.5fr 1fr 1fr' }, small: { 'grid-template-columns': '1fr' } },
  },
  { n: 'campaign-footer_cta-col', p: {}, bp: { medium: { display: 'none' }, small: { display: 'block' } } },
  { n: 'campaign-footer_logo', p: { width: '235px', 'margin-bottom': '1.25rem' } },
  { n: 'campaign-footer_heading', p: { color: { v: 'white' }, 'font-size': '0.78rem', 'letter-spacing': '0.13em', 'text-transform': 'uppercase', 'font-weight': '700', 'margin-top': '0px', 'margin-bottom': '1rem' } },
  { n: 'campaign-footer_text', p: { display: 'block', color: 'rgba(255,255,255,0.68)', 'font-size': '0.75rem', 'margin-top': '0px', 'margin-bottom': '0px' } },
  { n: 'campaign-footer_link', p: { display: 'block', color: 'rgba(255,255,255,0.68)', 'font-size': '0.75rem', 'text-decoration': 'none', 'margin-bottom': '0.55rem' } },
  {
    n: 'campaign-footer_bottom',
    p: { display: 'flex', 'justify-content': 'space-between', gap: '1rem', 'margin-top': '3rem', 'padding-top': '1.2rem', ...bTop('1px', 'rgba(255,255,255,0.15)'), 'font-size': '0.64rem' },
    bp: { small: { 'flex-direction': 'column' } },
  },

  // ---------- mobile action bar ----------
  {
    n: 'campaign-mobile-bar',
    p: { display: 'none' },
    bp: { small: { position: 'fixed', left: '0px', right: '0px', bottom: '0px', top: 'auto', 'z-index': '100', display: 'grid', 'grid-template-columns': '0.8fr 1.2fr', 'min-height': '64px', 'box-shadow': '0 -10px 30px rgba(0,34,65,0.18)' } },
  },
  { n: 'campaign-mobile-bar_link', p: { display: 'flex', 'align-items': 'center', 'justify-content': 'center', gap: '0.45rem', padding: '0.65rem', color: { v: 'white' }, 'background-color': { v: 'blue' }, 'text-align': 'center', 'text-decoration': 'none', 'font-size': '0.72rem', 'font-weight': '800' } },
  { n: 'is-gold', parents: ['campaign-mobile-bar_link'], p: { 'background-image': 'linear-gradient(110deg, #8c6946, #c98b46)' } },

  // ---------- consult page ----------
  { n: 'campaign-consult-hero', p: { color: 'rgba(255,255,255,0.82)', 'background-color': { v: 'navy' }, 'background-image': 'radial-gradient(circle at 12% 80%, rgba(171,214,255,0.18), transparent 34%)' } },
  {
    n: 'campaign-consult-hero_grid',
    p: { 'min-height': '760px', display: 'grid', 'grid-template-columns': 'minmax(0, 0.88fr) minmax(480px, 1.12fr)', 'align-items': 'center', gap: '5rem', 'padding-top': '7rem', 'padding-bottom': '7rem' },
    bp: { medium: { 'grid-template-columns': '1fr 1fr', gap: '2.5rem' }, small: { 'grid-template-columns': '1fr', 'min-height': '0px', 'padding-top': '3.5rem', 'padding-bottom': '4.5rem' } },
  },
  { n: 'campaign-back-link', p: { display: 'inline-block', 'margin-bottom': '2rem', color: { v: 'sky' }, 'font-size': '0.72rem', 'font-weight': '700', 'text-decoration': 'none' } },
  { n: 'campaign-trust-list', p: { 'margin-top': '1.8rem', 'margin-bottom': '1.8rem' } },
  { n: 'campaign-call-card', p: { display: 'inline-flex', 'align-items': 'center', gap: '0.85rem', 'padding-top': '0.85rem', 'padding-bottom': '0.85rem', 'padding-left': '1rem', 'padding-right': '1rem', ...bAll('1px', 'rgba(255,255,255,0.25)'), 'background-color': 'rgba(255,255,255,0.07)' } },
  { n: 'campaign-call-card_icon', p: { display: 'inline-flex', color: { v: 'sky' }, 'font-size': '1.5rem' } },
  { n: 'campaign-call-card_label', p: { display: 'block', color: 'rgba(255,255,255,0.6)', 'font-size': '0.66rem' } },
  { n: 'campaign-call-card_phone', p: { display: 'block', color: { v: 'white' }, 'font-size': '1.15rem', 'font-weight': '800', 'text-decoration': 'none' } },
  { n: 'campaign-consult-review', p: { 'margin-top': '2.2rem', 'padding-top': '1.4rem', ...bTop('1px', 'rgba(255,255,255,0.17)') } },
  { n: 'campaign-consult-review_stars', p: { color: '#f8c45f', 'font-size': '0.75rem', 'letter-spacing': '0.08em' } },
  { n: 'campaign-consult-review_quote', p: { 'margin-top': '0.65rem', 'margin-bottom': '0.65rem', 'font-size': '0.8rem' } },
  { n: 'campaign-consult-review_meta', p: { color: 'rgba(255,255,255,0.55)', 'font-size': '0.8rem' } },
  { n: 'campaign-form-shell', p: { color: { v: 'ink' }, 'background-color': { v: 'white' }, 'box-shadow': '0 28px 80px rgba(0,0,0,0.3)' } },
  { n: 'campaign-form-shell_heading', p: { 'padding-top': '1.7rem', 'padding-bottom': '1.25rem', 'padding-left': '2rem', 'padding-right': '2rem', ...bBot('1px', '#dbe5ec') }, bp: { small: { 'padding-left': '1.2rem', 'padding-right': '1.2rem' } } },
  { n: 'campaign-form-shell_kicker', p: { color: { v: 'blue' }, 'font-size': '0.68rem', 'font-weight': '800', 'letter-spacing': '0.1em', 'text-transform': 'uppercase' } },
  { n: 'campaign-form-shell_title', p: { 'margin-top': '0.4rem', 'margin-bottom': '0.35rem', 'font-size': '1.7rem', color: { v: 'navy' }, 'line-height': '1.12', 'letter-spacing': '-0.035em', 'font-weight': '700' } },
  { n: 'campaign-form-shell_sub', p: { margin: '0px', color: { v: 'muted' }, 'font-size': '0.78rem' } },
  { n: 'campaign-form', p: { 'padding-top': '1.5rem', 'padding-bottom': '2rem', 'padding-left': '2rem', 'padding-right': '2rem' }, bp: { small: { 'padding-left': '1.2rem', 'padding-right': '1.2rem' } } },
  { n: 'campaign-form_legend', p: { color: { v: 'navy' }, 'font-size': '1.05rem', 'font-weight': '800', 'margin-top': '0px', 'margin-bottom': '0.25rem' } },
  { n: 'campaign-form_hint', p: { 'margin-top': '0.25rem', 'margin-bottom': '1rem', color: { v: 'muted' }, 'font-size': '0.7rem' } },
  { n: 'campaign-choice-grid', p: { display: 'grid', gap: '0.65rem', 'margin-bottom': '1.25rem' } },
  {
    n: 'campaign-choice',
    p: { display: 'flex', 'align-items': 'center', 'min-height': '50px', 'padding-top': '0.75rem', 'padding-bottom': '0.75rem', 'padding-left': '0.9rem', 'padding-right': '0.9rem', ...bAll('1px', '#dbe5ec'), color: { v: 'navy' }, 'background-color': { v: 'white' }, 'font-size': '0.78rem', 'font-weight': '600', cursor: 'pointer', 'margin-bottom': '0px' },
  },
  { n: 'campaign-field-label', p: { display: 'block', 'margin-bottom': '0.35rem', color: { v: 'navy' }, 'font-size': '0.68rem', 'font-weight': '700' } },
  {
    n: 'campaign-input',
    p: { width: '100%', 'min-height': '48px', 'margin-bottom': '0.9rem', 'padding-top': '0.7rem', 'padding-bottom': '0.7rem', 'padding-left': '0.8rem', 'padding-right': '0.8rem', ...bAll('1px', '#b8c6cf'), ...radius('0px'), color: { v: 'ink' }, 'background-color': { v: 'white' }, 'font-size': '0.82rem' },
    focus: { ...bAll('1px', '#04669c') },
  },
  { n: 'campaign-field-row', p: { display: 'grid', 'grid-template-columns': '1fr 1fr', gap: '0.8rem' }, bp: { small: { 'grid-template-columns': '1fr', gap: '0rem' } } },
  { n: 'campaign-checkbox-row', p: { display: 'flex', 'align-items': 'flex-start', gap: '0.65rem', 'margin-top': '0.55rem', 'margin-bottom': '0.55rem' } },
  { n: 'campaign-checkbox-text', p: { margin: '0px', color: { v: 'muted' }, 'font-size': '0.61rem', 'font-weight': '500', 'line-height': '1.5' } },
  { n: 'campaign-privacy-note', p: { 'margin-top': '0.65rem', 'margin-bottom': '1rem', color: { v: 'muted' }, 'font-size': '0.58rem' } },
  { n: 'campaign-form_callout', p: { 'margin-top': '0.8rem', 'margin-bottom': '0px', color: { v: 'muted' }, 'text-align': 'center', 'font-size': '0.68rem' } },
  { n: 'campaign-form_callout-link', p: { color: { v: 'blue' }, 'font-weight': '700' } },
  { n: 'campaign-next-grid', p: { display: 'grid', 'grid-template-columns': 'repeat(3, 1fr)', gap: '1.2rem', 'margin-top': '3rem' }, bp: { small: { 'grid-template-columns': '1fr' } } },
  { n: 'campaign-next-card', p: { padding: '1.7rem', ...bAll('1px', '#dbe5ec'), 'background-color': { v: 'white' } } },
  { n: 'campaign-next-card_num', p: { display: 'block', 'margin-bottom': '2.5rem', color: { v: 'sky' }, 'font-size': '2.2rem', 'font-weight': '800', 'letter-spacing': '-0.08em' } },
  { n: 'campaign-next-card_text', p: { color: { v: 'muted' }, 'font-size': '0.84rem', 'margin-top': '0px', 'margin-bottom': '0px' } },

  // ---------- thank-you page ----------
  { n: 'campaign-thank-hero', p: { color: 'rgba(255,255,255,0.82)', 'background-color': { v: 'navy' }, 'background-image': 'radial-gradient(circle at 78% 15%, rgba(171,214,255,0.2), transparent 35%)' } },
  {
    n: 'campaign-thank-hero_grid',
    p: { 'min-height': '690px', display: 'grid', 'grid-template-columns': '1.05fr 0.95fr', 'align-items': 'center', gap: '6.3rem', 'padding-top': '7.2rem', 'padding-bottom': '7.2rem' },
    bp: { medium: { 'grid-template-columns': '1fr 1fr', gap: '2.5rem' }, small: { 'grid-template-columns': '1fr', 'min-height': '0px', 'padding-top': '3.5rem', 'padding-bottom': '4.5rem' } },
  },
  { n: 'campaign-success-mark', p: { width: '58px', height: '58px', display: 'grid', 'place-items': 'center', 'margin-bottom': '1.4rem', ...radius('50%'), color: { v: 'navy' }, 'background-color': { v: 'sky' }, 'font-size': '1.7rem' } },
  { n: 'campaign-call-now', p: { display: 'inline-flex', 'align-items': 'center', gap: '1rem', 'margin-top': '1rem', 'padding-top': '1rem', 'padding-bottom': '1rem', 'padding-left': '1.2rem', 'padding-right': '1.2rem', color: { v: 'navy' }, 'background-color': { v: 'white' }, 'box-shadow': SHADOW } },
  { n: 'campaign-call-now_icon', p: { width: '44px', height: '44px', display: 'grid', 'place-items': 'center', color: { v: 'white' }, 'background-color': { v: 'blue' }, ...radius('50%'), 'font-size': '1.25rem' } },
  { n: 'campaign-call-now_label', p: { display: 'block', color: { v: 'muted' }, 'font-size': '0.65rem' } },
  { n: 'campaign-call-now_phone', p: { display: 'block', color: { v: 'navy' }, 'font-size': '1.3rem', 'font-weight': '800', 'text-decoration': 'none' } },
  { n: 'campaign-call-now_hours', p: { display: 'block', color: { v: 'blue' }, 'font-size': '0.62rem', 'font-weight': '600' } },
  { n: 'campaign-thank-note', p: { 'margin-top': '1rem', 'margin-bottom': '0px', color: 'rgba(255,255,255,0.6)', 'font-size': '0.68rem' } },
  { n: 'campaign-thank-urgent', p: { 'margin-top': '1rem', padding: '0.8rem', ...bLeft('3px', '#ffc8c3'), 'background-color': 'rgba(0,0,0,0.18)', 'font-size': '0.7rem' } },
  { n: 'campaign-thank-hero_photo', p: { position: 'relative' }, bp: { small: { display: 'none' } } },
  { n: 'campaign-thank-hero_img', p: { width: '100%', 'aspect-ratio': '0.9', 'object-fit': 'cover', ...bAll('1px', 'rgba(255,255,255,0.38)') } },
  { n: 'campaign-thank-hero_caption', p: { position: 'absolute', left: '-1.2rem', right: '1rem', bottom: '1rem', padding: '1rem', color: { v: 'navy' }, 'background-color': { v: 'sky' } } },
  { n: 'campaign-thank-hero_caption-title', p: { display: 'block', 'font-weight': '700' } },
  { n: 'campaign-thank-hero_caption-sub', p: { display: 'block', 'font-size': '0.7rem' } },
  { n: 'campaign-prepare-list', p: { 'margin-top': '1.5rem', 'margin-bottom': '1.5rem' } },
  { n: 'campaign-visit-card', p: { overflow: 'hidden', color: { v: 'ink' }, 'background-color': { v: 'white' }, 'box-shadow': SHADOW } },
  { n: 'campaign-visit-card_img', p: { width: '100%', 'aspect-ratio': '1.9', 'object-fit': 'cover' } },
  { n: 'campaign-visit-card_body', p: { padding: '1.5rem' } },
  { n: 'campaign-visit-card_title', p: { 'font-size': '1.05rem', color: { v: 'navy' }, 'font-weight': '700', 'margin-top': '0px', 'margin-bottom': '0.5rem', 'letter-spacing': '-0.035em' } },
  { n: 'campaign-visit-card_text', p: { color: { v: 'muted' }, 'font-size': '0.75rem', 'margin-top': '0px', 'margin-bottom': '0px' } },
];
