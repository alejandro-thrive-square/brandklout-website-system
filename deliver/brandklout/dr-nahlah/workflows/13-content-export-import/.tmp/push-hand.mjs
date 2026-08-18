#!/usr/bin/env node
/**
 * push-hand.mjs — the em dashes the mechanical planner cannot take.
 *
 * Three kinds live here:
 *   - sentences RESTRUCTURED rather than repunctuated, so there is no
 *     word-for-word local line to align against
 *   - a dash inside a `placeholder` ATTRIBUTE, which a text-only planner never
 *     sees at all
 *   - two decorative card numerals that are a bare dash standing in for a
 *     number, replaced with "+" to keep the "outside the numbered sequence"
 *     meaning without an em dash on the page
 *
 * Every `to` below matches the local build exactly. Apostrophes stay as the
 * &#x27; entity Instatic already stores, so the payload is pure ASCII.
 */
import { callJson } from './instatic-mcp.mjs';

const EDITS = [
  { slug: 'about', uid: 'mmAIOPDA8fMeng4sMyokw',
    to: 'The practice makes it a priority to build a real relationship with every patient it sees. That is not only how care gets personalized; it is the single most effective thing anyone has found for the fear and the anxiety that keep people out of a dental chair for years at a time.' },

  // the dash is in the textarea's placeholder, so the patch goes on the
  // textarea node itself, not on the <label> that holds it
  { slug: 'contact', uid: '7q2r5rorcvTCeVs5tGy-F', prop: 'placeholder',
    to: 'Existing treatment plan, another quote, anxiety about the chair: all useful.' },

  { slug: 'dental-conditions', uid: 'NP4r3eiih_2FD9AntoPjr',
    to: 'A general practice treats each of them as it arrives. A prosthodontist&#x27;s training is specifically in seeing the whole mouth as one system, which is why the useful question at the first visit is not <em>what do I do about this tooth</em> but <em>what is actually going on here</em>.' },

  { slug: 'emergency-dentistry', uid: '4xGxtoQ_5giIwIwFqPh-F',
    to: 'For everything below, whether a tooth, a filling, an abscess or a socket, call the practice.' },
  { slug: 'emergency-dentistry', uid: 'OP_zvyl0rcVmJQQJrvYqh',
    to: 'The treatment rooms are equipped to work out what is wrong fast and accurately, which in an emergency is most of the job; the wrong diagnosis costs more time than the treatment does.' },

  { slug: 'implant-cost', uid: 'Z7oZQWNPGwH9zZC701FUL', to: '+' },
  { slug: 'smile-makeover', uid: 'z5Dl83NCDASywSIcRsP2F', to: '+' },

  { slug: 'our-facility', uid: 'LKMNUPUooYdcXGQNgfWIU',
    to: 'Any one of these machines can be rented time on. What is unusual is holding the entire chain, from scan and plan through surgery, design, milling, firing and fit, inside a single practice, under one person&#x27;s responsibility.' },
  { slug: 'our-facility', uid: 'iTlOmbJV1RZViS92Qmq6f',
    to: 'Nitrous, oral and IV, and who is credentialed to give them.' },

  { slug: 'our-team', uid: 'S9HhBMabfw-yMwLTVsKSQ',
    to: 'Dr. Nahlah does the surgery. Everything around it belongs to the people on this page: the scheduling, the insurance, the scanning, the lab work, the cleanings.' },

  { slug: 'teeth-whitening', uid: '0o-OP5Q7fm8h1cSBcSdfj',
    to: 'That is the actual case for doing it professionally. It is not only faster; it is the version that does not cost you enamel to get there.' },
];

let ok = 0;
const problems = [];

for (const e of EDITS) {
  try {
    if (e.prop) {
      const r = await callJson('site_update_node_props', { nodeId: e.uid, patch: { [e.prop]: e.to } });
      if (!r || r.ok !== true) throw new Error(`prop patch rejected: ${JSON.stringify(r).slice(0, 140)}`);
    } else {
      const r = await callJson('site_replace_node_html', { nodeId: e.uid, html: e.to });
      if (r && typeof r.text === 'string') {
        if (!/does not accept children/i.test(r.text)) throw new Error(r.text.slice(0, 140));
        const r2 = await callJson('site_update_node_props', { nodeId: e.uid, patch: { text: e.to } });
        if (!r2 || r2.ok !== true) throw new Error(`props patch rejected: ${JSON.stringify(r2).slice(0, 140)}`);
      }
    }
    const back = (await callJson('site_get_node_html', { nodeId: e.uid })).html ?? '';
    if (back.includes('—') || back.includes('&mdash;')) throw new Error('dash still present after write');
    ok++;
    console.log(`  ${e.slug.padEnd(22)} ${e.uid} ok`);
  } catch (err) {
    problems.push(`${e.slug} ${e.uid}: ${err.message.slice(0, 160)}`);
  }
}

console.log(`\n${ok}/${EDITS.length} applied`);
if (problems.length) { console.log('\nproblems:'); for (const p of problems) console.log('  ' + p); }
