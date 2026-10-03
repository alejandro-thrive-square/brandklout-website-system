!function(o,c){var n=c.documentElement,t=" w-mod-";n.className+=t+"js",("ontouchstart"in o||o.DocumentTouch&&c instanceof DocumentTouch)&&(n.className+=t+"touch")}(window,document);
/*----*/

(()=>{
 const root=document.querySelector('.hcdi-page,.hcdi-clinical-full,.hcdi-dark-full,.hcdi-human-full,.hcdi-editorial-full,[class*="hcdi-"]');
 if(!root)return;
 const back=document.createElement('a');back.className='hcdi-client-back';back.href='https://hackensack-dental-implants.webflow.io/';back.innerHTML='← All 5 concepts';document.body.appendChild(back);
 const label=document.createElement('div');label.className='hcdi-client-label';label.textContent='Interactive full view';document.body.appendChild(label);
 const progress=document.createElement('div');progress.className='hcdi-client-progress';progress.innerHTML='<span></span>';document.body.appendChild(progress);const bar=progress.firstElementChild;
 const blocks=[...root.querySelectorAll('section, footer, .proofbar, .hcdi-proofbar, .hcdi-trustbar, .hcdi-proof-strip, .results, .hcdi-results')];
 blocks.forEach((el,i)=>{if(i>0)el.classList.add('hcdi-motion-reveal')});
 const items=[...root.querySelectorAll('article, .solution, .step, .result, .hcdi-card, .hcdi-result, .benefit, .treat, .num-card')];
 items.forEach((el,i)=>{el.classList.add('hcdi-motion-stagger');el.style.transitionDelay=((i%4)*70)+'ms'});
 const imageWraps=[...root.querySelectorAll('.hero-visual,.hero-media,.hero-img,.feature-visual,.feature-image,.story-image,.story-img,.tech-image,.final-photo,.final-image,.hcdi-hero-media,.hcdi-story-media,.hcdi-tech-media,.hcdi-final-media')];
 imageWraps.forEach(el=>el.classList.add('hcdi-motion-image'));
 const io=new IntersectionObserver(entries=>entries.forEach(e=>{if(e.isIntersecting){e.target.classList.add('is-visible');io.unobserve(e.target)}}),{threshold:.08,rootMargin:'0px 0px -6% 0px'});
 root.querySelectorAll('.hcdi-motion-reveal,.hcdi-motion-stagger').forEach(el=>io.observe(el));
 let ticking=false;
 const update=()=>{const max=document.documentElement.scrollHeight-innerHeight;bar.style.width=(max>0?(scrollY/max*100):0)+'%'; if(matchMedia('(prefers-reduced-motion: no-preference)').matches){imageWraps.forEach(w=>{const img=w.querySelector('img');if(!img)return;const r=w.getBoundingClientRect();if(r.bottom>0&&r.top<innerHeight){const off=((r.top+r.height/2)-innerHeight/2)*-.018;img.style.transform=`translate3d(0,${off}px,0) scale(1.035)`}})} ticking=false};
 addEventListener('scroll',()=>{if(!ticking){requestAnimationFrame(update);ticking=true}},{passive:true});update();
})();
