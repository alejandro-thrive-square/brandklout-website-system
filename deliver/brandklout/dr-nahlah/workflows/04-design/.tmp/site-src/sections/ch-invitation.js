/* =============================================================================
   SECTION: ch-invitation
   Registered against .ch-invitation; runs only when that is on the page, so
   this file can travel with the markup between pages without being edited.
   ============================================================================= */
WZ.section("ch-invitation", function (W) {
  if(W.reduced) return;
  /* The bespoke `#locs .iv-loc` stagger that used to sit here is gone with the
     markup it animated. On 2026-08-24 the standalone locations strip was folded
     into the CTA band as `.cta-offices`, which carries `data-rv="stagger"` and
     is therefore revealed by the kit like every other staggered block. Leaving
     the old call in place would not have thrown — it would simply have matched
     nothing, which is the kind of dead animation nobody notices for months. */
  W.splitLines(document.getElementById('ctaTitle'), function(self){
    return gsap.from(self.lines,{yPercent:110,duration:1,stagger:.09,ease:'power4.out',
      scrollTrigger:{trigger:'#ctaTitle',start:'top 85%'}});
  });
});
