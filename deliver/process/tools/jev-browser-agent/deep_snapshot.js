(() => {
  // Jev's snapshot.js, widened for vendor dashboards (Elfsight, GHL, Termly):
  //  * walks open shadow roots and same-origin iframes, not just `document`
  //  * offers role-less click targets: divs with a click cursor or tabindex (template cards)
  //  * names icon-only buttons from their class / icon words and the nearest short text
  //  * reports whether a text field has focus, so an Enter key can be offered
  // Cross-origin iframes are separate CDP targets; jev_deep.py runs this script in each one.
  if (!document.body) return null;
  const cache = window.__jevDeep ||= {ids:new WeakMap(), nodes:new Map(), next:1};
  const identity = e => {
    if (!cache.ids.has(e)) cache.ids.set(e,cache.next++);
    const id=cache.ids.get(e); cache.nodes.set(id,e); return id;
  };
  for (const [id,e] of cache.nodes) if (!e.isConnected) cache.nodes.delete(id);

  // ── roots: document, open shadow roots, same-origin iframe documents (with offsets) ──
  const roots=[];
  const walk=(root,ox,oy,depth)=>{
    if (depth>6) return;
    roots.push({root,ox,oy});
    for (const e of root.querySelectorAll('*')) {
      if (e.shadowRoot) walk(e.shadowRoot,ox,oy,depth+1);
      if (e.tagName==='IFRAME') {
        let doc=null; try { doc=e.contentDocument; } catch {}
        if (doc?.body) {
          const r=e.getBoundingClientRect();
          walk(doc,ox+r.x+e.clientLeft,oy+r.y+e.clientTop,depth+1);
        }
      }
    }
  };
  walk(document,0,0,0);
  cache.roots=roots;

  const up = e => e.parentElement || (e.parentNode instanceof ShadowRoot ? e.parentNode.host : null);
  const closest = (e,sel) => { for (let p=e; p; p=up(p)) if (p.matches?.(sel)) return p; return null; };
  const safe = e => !['password','file','hidden'].includes(e.type);
  const visible = e => !closest(e,'[aria-hidden="true"],[inert]') &&
    e.checkVisibility({checkOpacity:true,checkVisibilityCSS:true});
  const byId = (e,id) => e.getRootNode().getElementById?.(id) || null;
  const name = (e,seen=new Set()) => {
    if (!e || seen.has(e)) return '';
    seen.add(e);
    const referenced=(e.getAttribute('aria-labelledby')||'').split(/\s+/).filter(Boolean)
      .map(id=>name(byId(e,id),seen)).filter(Boolean).join(' ');
    return referenced || e.getAttribute('aria-label') ||
      [...(e.labels||[])].map(l=>name(l,seen)).filter(Boolean).join(' ') ||
      (['button','submit','reset'].includes(e.type) ? e.value : '') || e.getAttribute('alt') ||
      (e.tagName==='INPUT' ? '' : [...e.childNodes].map(n=>n.nodeType===3 ? n.textContent :
        n.nodeType===1 && n.getAttribute('aria-hidden')!=='true' && n.tagName!=='STYLE' ? name(n,seen) : '')
        .join(' ').replace(/\s+/g,' ').trim()) ||
      e.getAttribute('title') || e.getAttribute('placeholder') || '';
  };
  const roles=['button','link','checkbox','radio','switch','tab','menuitem','menuitemradio',
    'option','gridcell','combobox','textbox','searchbox','spinbutton'];
  const selector='a[href],button,input,textarea,select,summary,[contenteditable="true"],'+
    roles.map(role=>'[role="'+role+'"]').join(',');
  const role = e => {
    const explicit=e.getAttribute('role');
    if (roles.includes(explicit)) return explicit;
    if (e.tagName==='BUTTON' || e.tagName==='SUMMARY') return 'button';
    if (e.tagName==='A') return 'link';
    if (e.tagName==='SELECT') return 'combobox';
    if (e.tagName==='TEXTAREA' || e.isContentEditable) return 'textbox';
    if (e.tagName==='INPUT') {
      if (['checkbox','radio'].includes(e.type)) return e.type;
      if (['button','submit','reset','image'].includes(e.type)) return 'button';
      if (e.type==='search') return 'searchbox';
      if (e.type==='number') return 'spinbutton';
      if (['text','email','url','tel',''].includes(e.type)) return 'textbox';
    }
    return null;
  };
  // A role-less element that still takes clicks: the outermost element with a click cursor,
  // an onclick attribute, or a tabindex. Its children inherit the cursor, so only the outermost counts.
  const pointer = e => {
    if (e.matches(selector) || e.tagName==='HTML' || e.tagName==='BODY') return false;
    if (e.hasAttribute('onclick') || (e.hasAttribute('tabindex') && e.getAttribute('tabindex')!=='-1')) return true;
    if (getComputedStyle(e).cursor!=='pointer') return false;
    const p=up(e);
    return !p || getComputedStyle(p).cursor!=='pointer';
  };
  const WORDS=new RegExp(['search|magnif|filter|sort|close|cross|delete|trash|remove|edit|pencil|add',
    'plus|more|dots|menu|kebab|back|arrow|prev|next|settings|gear|drag|copy|duplicate|upload',
    'download|expand|collapse|chevron|check|info|help|refresh|reload|eye|hide|show'].join('|'),'gi');
  const hint = e => {
    const attrs=['class','data-testid','data-icon','name','href','xlink:href'];
    const bag=[e,...e.querySelectorAll('*')].slice(0,12).map(n=>
      [...attrs.map(a=>n.getAttribute(a)||''), n.querySelector?.('title')?.textContent||''].join(' ')).join(' ');
    let hits=[...new Set((bag.match(WORDS)||[]).map(w=>w.toLowerCase()))].slice(0,3);
    // No icon word: fall back to a component name in the class (styled-components / BEM), e.g.
    // Elfsight's "ViewportSelector__ItemContainer-sc-…" → "viewport selector".
    if (!hits.length) {
      const comp=(e.getAttribute('class')||'').match(/\b([A-Z][a-z]+(?:[A-Z][a-z]+)+)__/g)
        ?.map(c=>c.slice(0,-2)).find(c=>!/^(Interactable|Container|Wrapper|Button|Root)/.test(c));
      if (comp) hits=[comp.replace(/([a-z])([A-Z])/g,'$1 $2').toLowerCase()];
    }
    let ctx='', p=e;
    for (let i=0; i<4 && p && !ctx; i++) {
      p=up(p);
      const t=[...(p?.children||[])].filter(c=>c!==e && !c.contains(e)).map(c=>c.innerText?.trim()||'')
        .find(t=>t && t.length<40);
      if (t) ctx=t.split('\n')[0];
    }
    return [hits.join('/'), ctx].filter(Boolean).join(' · ');
  };
  const fields = () => roots.flatMap(({root})=>[...root.querySelectorAll('input,textarea,select')]).filter(safe);
  cache.pageKey=()=>[performance.timeOrigin,location.href,scrollX,scrollY,innerWidth,innerHeight,
    fields().map(e=>[identity(e),e.value,e.checked,e.selectedIndex,e.disabled,e.readOnly])];
  cache.guard=e=>{
    if (!e?.isConnected || !visible(e)) return null;
    const scope=closest(e,'form,dialog,[role="dialog"],article,li,tr,[role="row"]') || up(e);
    return [identity(e),role(e)||'button',name(e),e.value??null,e.checked??null,e.selectedIndex??null,
      e.readOnly??null,e.matches(':disabled'),e.getAttribute('aria-disabled'),
      e.getAttribute('aria-expanded'),e.getAttribute('aria-checked'),e.getAttribute('aria-selected'),
      e.getAttribute('href'),scope?.innerText?.slice(0,6000)||''];
  };
  // Deepest element at a point, through shadow roots and same-origin iframes.
  cache.hit=(x,y)=>{
    let doc=document, h=doc.elementFromPoint(x,y);
    for (let i=0; h && i<12; i++) {
      if (h.shadowRoot) { const n=h.shadowRoot.elementFromPoint(x,y); if (n && n!==h) { h=n; continue; } }
      if (h.tagName==='IFRAME') {
        let d=null; try { d=h.contentDocument; } catch {}
        if (d) { const r=h.getBoundingClientRect(); x-=r.x+h.clientLeft; y-=r.y+h.clientTop; doc=d; h=d.elementFromPoint(x,y); continue; }
      }
      break;
    }
    return h;
  };
  cache.contains=(e,h)=>{ for (let p=h; p; p=up(p) || (p.ownerDocument?.defaultView?.frameElement ?? null)) if (p===e) return true; return false; };
  cache.offset=e=>{ const r=cache.roots.find(r=>r.root===e.getRootNode()); return r ? [r.ox,r.oy] : [0,0]; };

  const actions=[];
  for (const {root,ox,oy} of roots) {
    const vw=root.defaultView?.innerWidth ?? innerWidth, vh=root.defaultView?.innerHeight ?? innerHeight;
    for (const e of root.querySelectorAll('*')) {
      const matched=e.matches(selector);
      if (!matched && !pointer(e)) continue;
      if (!safe(e) || !visible(e) || e.matches(':disabled') || closest(e,'[aria-disabled="true"]')) continue;
      const r=e.getBoundingClientRect(), cx=r.x+r.width/2, cy=r.y+r.height/2;
      if (r.width<=0 || r.height<=0 || cx<0 || cy<0 || cx>=vw || cy>=vh) continue;
      const rname=role(e) || 'button';
      if (rname==='gridcell' && e.querySelector('button,[role="button"]')) continue;
      // A clickable card that holds a real visible control is represented by that control.
      if (!matched && [...e.querySelectorAll(selector)].some(c=>c.checkVisibility())) continue;
      let label=name(e).slice(0,160);
      if (!label || label===rname) { const h=hint(e); label=h ? rname+' ['+h+']' : rname; }
      const base={node:identity(e),role:rname,label,rect:{x:r.x+ox,y:r.y+oy,w:r.width,h:r.height}};
      for (const key of ['checked','selected','expanded']) {
        const value=e.getAttribute('aria-'+key);
        if (value!==null) base[key]=value;
      }
      if (['checkbox','radio'].includes(e.type)) base.checked=String(e.checked);
      if (e.tagName==='SELECT') {
        for (const o of e.options) if (!o.selected && !o.disabled && !o.closest('optgroup[disabled]'))
          actions.push({...base,kind:'select',value:o.value,
            current_value:[...e.selectedOptions].map(o=>o.label).join(', '),label:base.label+' → '+o.label});
      } else {
        const editable=!e.readOnly && e.getAttribute('aria-readonly')!=='true' &&
          (['textbox','searchbox','spinbutton'].includes(rname) ||
            (rname==='combobox' && ['INPUT','TEXTAREA'].includes(e.tagName)));
        const value='value' in e ? String(e.value) :
          e.isContentEditable || rname==='combobox' ? e.innerText.trim() : '';
        actions.push({...base,kind:editable?'fill':'click',value});
        if (editable) actions.push({...base,kind:'click',value,label:'Open '+base.label});
      }
    }
  }
  // Visible text from every root. aria-live regions are skipped: they repeat what is already shown.
  // Overlays first (modals, dialogs, dropdowns, popovers): they hold what the user just asked for,
  // and they sit at the end of the DOM, where the 6000-character budget has already run out.
  // Elfsight's search results live in a ModalNest after a long review preview (2026-10-01).
  const OVERLAY='[role="dialog"],[aria-modal="true"],[role="listbox"],[role="menu"],[class*="Modal"],[class*="modal"],'+
    '[class*="Popover"],[class*="popover"],[class*="Dropdown"],[class*="dropdown"],[class*="Popup"],[class*="popup"]';
  const overlays=[];
  for (const {root} of roots) for (const e of root.querySelectorAll(OVERLAY)) {
    if (overlays.some(o=>o.contains(e)) || !e.checkVisibility()) continue;
    const r=e.getBoundingClientRect();
    if (r.width>1 && r.height>1 && e.innerText?.trim()) overlays.push(e);
  }
  const words=[]; let length=0;
  const seenText=new Set();
  for (const {root} of [...overlays.map(root=>({root})), ...roots]) {
    const view=root.ownerDocument?.defaultView || root.defaultView || window;
    const walker=(root.ownerDocument||root).createTreeWalker(root,NodeFilter.SHOW_TEXT);
    const range=(root.ownerDocument||root).createRange(); let node;
    while ((node=walker.nextNode()) && length<6000) {
      const value=node.textContent.trim(), parent=node.parentElement;
      if (!value || !parent || seenText.has(node) || parent.closest('script,style,noscript,template,[aria-live]') || !visible(parent)) continue;
      seenText.add(node);
      range.selectNodeContents(node); const r=range.getBoundingClientRect();
      if (r.width>1 && r.height>1 && r.bottom>0 && r.top<view.innerHeight && r.right>0 && r.left<view.innerWidth) {
        words.push(value); length+=value.length;
      }
    }
  }
  let focus=document.activeElement;
  for (let i=0; focus && i<12; i++) {
    const inner=focus.shadowRoot?.activeElement || (()=>{ try { return focus.contentDocument?.activeElement; } catch { return null; } })();
    if (!inner || inner===focus) break; focus=inner;
  }
  const focus_editable=!!focus && (focus.isContentEditable || ['INPUT','TEXTAREA'].includes(focus.tagName));
  const text=words.join('\n').slice(0,6000), height=document.documentElement.scrollHeight;
  const page_key=cache.pageKey(), guards={};
  for (const a of actions) if (!(a.node in guards)) guards[a.node]=cache.guard(cache.nodes.get(a.node));
  const semantics=actions.map(({rect,...action})=>action);
  const marker=[performance.timeOrigin,location.href,scrollX,scrollY,innerWidth,innerHeight,
    document.title,text,semantics,page_key[6],focus_editable];
  const omitted_actions=Math.max(0,actions.length-250);
  actions.splice(250);
  actions.forEach((a,i)=>a.id='e'+(i+1));
  if (scrollY+innerHeight<height-2) actions.push({id:'scroll_down',kind:'scroll',label:'Scroll down',delta:560});
  if (scrollY>0) actions.push({id:'scroll_up',kind:'scroll',label:'Scroll up',delta:-560});
  actions.push({id:'wait',kind:'wait',label:'Wait for the page to update'});
  return {url:location.href,title:document.title,w:innerWidth,h:innerHeight,text,focus_editable,
    scroll:{y:scrollY,height},actions,marker,page_key,guards,omitted_actions};
})()
