# FR Update v2 — open items and client questions

Everything below is deliberately **not done**. Nothing here is a failure to apply the checklist —
each item either needs client copy we must not invent, or needs a decision that is theirs.

---

## A · Blocked by the checklist itself

1. **Sustainability Part 2 — Gender Equality (05) deletion.** Nathan marked a sentence for removal
   but the mark was not tied to a specific one. The checklist parks it. Untouched.

2. **Contact form field key.** The visible label is now `Message` and the line above the form is
   `Contactez-nous`, as asked. The underlying input is still `inputName: "The Tone 2"`,
   `id: "the-tone-2"`. Renaming it changes the form submission key and would break the client's
   notification templates. **Needs explicit client approval before we touch it.**

---

## B · Defects found that need client copy

These are real content bugs. We can fix the mechanics but cannot write the missing copy — inventing
statements for a real business is not something we do.

3. **Sustainability goal 12 duplicates goal 11.** `12. Consommation & Production Responsables` shows
   the exact text of `11. Villes & Communautés Durables`
   ("Tous les membres de l'équipe utilisent les transports en commun…"). Present on the canvas *and*
   on the live published site. **Needs the real goal-12 paragraph.**
   Element: `5a4b6ea8-1e19-4310-ceda-2cda81a81e02`

4. **Sustainability goal 13 carries supplier/wages copy, not climate copy.**
   `13. Action pour le Climat` holds a second translation of goal 01's supplier paragraph. This is
   the element checklist item Sustainability #3 targets, so #3's rewrite has been applied to it as
   written — but the entry still is not about climate action. **Needs the real goal-13 paragraph.**
   Element: `5a4b6ea8-1e19-4310-ceda-2cda81a81e0b`

5. **About — a second team member's popup shows Deepak Sheth's bio.** The popup keyed `modal-2`
   contains Deepak's bio verbatim, duplicating the `modal` popup. Same class of v1-build copy-paste
   error as the 1984 collision we fixed. **Needs the correct person's name, role and bio.**
   Element: `f30b591b-8040-c999-a60a-b2240443ffd1`

---

## C · Decisions for the client

6. **Fancy Color Melee — the "Note qualité" block.** Part 2 asked to leave a single instance of the
   repeated quality paragraph. We applied #3 to the hero paragraph but **did not delete** the
   `trusted_wrap` block, because we found something the plan did not anticipate: on the **published**
   site that same block holds richer, different content —

   > **Notre Engagement Qualité** — Tri strict sous microscope, calibrage rigoureux · Origine tracée
   > via iTraceiT · Aucune pierre synthétique, politique tolérance zéro assurée par 5 machines de
   > détection · *Pour les maisons souhaitant rehausser chaque millimètre de création avec des
   > couleurs naturelles, notre mêlé fancy est une référence mondiale.*

   On the canvas that content has been overwritten with a copy of the hero paragraph. Deleting the
   block would destroy a designed section; restoring the published copy is probably what is actually
   wanted. **Ask the client: restore the published "Notre Engagement Qualité" content, or delete the
   block?** Full structure archived in `RESTORE-deleted-blocks.json`.
   Section: `b7f914c6-84ec-360d-43be-7d2c123ffaaa`

7. **Synthetic Free #2 / #3 scope.** Applied to `/fr/synthetic-free` only, as the checklist scopes
   them. The same two texts also exist as per-page prop overrides on the shared Synthetic block on
   the remaining FR pages, which therefore still show the **old** wording. Item #4 explicitly said
   the *heading* must change on "TODAS las instancias" — it is not stated for #2/#3.
   **Confirm whether the paragraph and caption should be updated everywhere too.**

8. **Sustainability tab-card label wording.** We renumbered the accordion entries so clean energy is
   07 and decent work is 08, matching the cards. The accordion entry still reads
   `08. Travail décent` while its tab card reads `Travail Décent & Croissance Économique`.
   We changed the number only, not the wording. **Confirm whether to align the label wording.**

---

## D · Important context for the publish conversation

9. **The canvas and the live site are different content generations.** The published French pages
   still carry the older machine-translation-era copy; the canvas carries a newer French rewrite
   that has never been published. This predates our work — see `FINDINGS.md` §F1 for the evidence.

   Nathan reviewed the **canvas** version (his "TEXTO ACTUAL" quotes match it exactly), so our edits
   are on the correct content. But **publishing will ship our FR Update v2 changes *plus* that whole
   pre-existing unpublished rewrite.** The client needs to know that before anyone presses Publish;
   it is a much larger release than "the French text update".

   Note also that Nathan reported the Part 3 display bugs from the *published* pages, so his three
   Sustainability reports describe the older build. We diagnosed and fixed them against the canvas,
   which is what will actually go live.

---

## Version Control

Follows [SYSTEM_RULES.md - Section 4](../../../../../SYSTEM_RULES.md).
