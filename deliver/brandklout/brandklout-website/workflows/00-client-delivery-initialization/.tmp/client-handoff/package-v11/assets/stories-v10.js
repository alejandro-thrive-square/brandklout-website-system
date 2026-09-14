/* Embedded in-place YouTube players. Delegation also works in the single-file preview.
   No player loads or plays until the visitor presses Play. */
(function(){
  'use strict';
  if(window.BKStories) return;
  function stop(player){
    player.querySelector('iframe')?.remove();
    player.querySelector('[data-story-stop]')?.remove();
    const play=player.querySelector('[data-story-play]');
    if(play) play.hidden=false;
    delete player.dataset.playing;
  }
  function playVideo(player){
    const id=player.dataset.storyPlayer;
    if(!/^[A-Za-z0-9_-]{11}$/.test(id)) return;
    const notice=player.querySelector('.cs-player-notice');
    if(navigator.onLine===false){
      notice.textContent='Connect to the internet to watch, or use the YouTube link below.';
      notice.hidden=false;
      return;
    }
    document.querySelectorAll('[data-story-player][data-playing]').forEach(stop);
    if(notice) notice.hidden=true;
    const iframe=document.createElement('iframe');
    const src=new URL('https://www.youtube-nocookie.com/embed/'+id);
    src.searchParams.set('autoplay','1');
    src.searchParams.set('rel','0');
    src.searchParams.set('playsinline','1');
    if(/^https?:$/.test(location.protocol)) src.searchParams.set('origin',location.origin);
    iframe.src=src.toString();
    iframe.title=player.dataset.storyVideoTitle || 'BrandKlout customer story';
    iframe.setAttribute('allow','accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share');
    iframe.setAttribute('allowfullscreen','');
    iframe.referrerPolicy='strict-origin-when-cross-origin';
    const stopButton=document.createElement('button');
    stopButton.type='button';
    stopButton.className='cs-stop-video';
    stopButton.dataset.storyStop='';
    stopButton.textContent='Close video';
    stopButton.setAttribute('aria-label','Close '+iframe.title);
    player.querySelector('[data-story-play]').hidden=true;
    player.dataset.playing='true';
    player.append(iframe,stopButton);
    iframe.focus({preventScroll:true});
  }
  document.addEventListener('click',function(e){
    const play=e.target.closest('[data-story-play]');
    if(play){e.preventDefault();playVideo(play.closest('[data-story-player]'));return;}
    const close=e.target.closest('[data-story-stop]');
    if(close){
      const player=close.closest('[data-story-player]');
      stop(player);player.querySelector('[data-story-play]')?.focus({preventScroll:true});
    }
  });
  document.addEventListener('keydown',function(e){
    if(e.key!=='Escape')return;
    const playing=document.querySelector('[data-story-player][data-playing]');
    if(playing){stop(playing);playing.querySelector('[data-story-play]')?.focus({preventScroll:true});}
  });
  window.BKStories={stopAll:function(){document.querySelectorAll('[data-story-player][data-playing]').forEach(stop);}};
})();
