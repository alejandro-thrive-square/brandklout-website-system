"""BugHerd round five (2026-09-26): one reply per open note, #174-#433.
    python replies-0926.py   -> writes replies-0926.json and replies.json
Notes that need something from the practice stay open (OPEN below); every other one closes.
"""
import json, re

tasks = {t["local_task_id"]: t for t in json.load(open("tasks.json", encoding="utf-8"))}
S = " It is live now; please hard-refresh (Ctrl+Shift+R) to see it."
BADGES = "Removed. The \"Credentialed by\" strip now appears on the homepage only; we took it off every other page, as your note on the Preventive page asked."
CAPTION = "Removed. We took out every caption of this kind (\"... Suite 104B ...\") across the whole site, not only on this page."

T = {
    174: "Step 1 now has IMG_7693 as well, so every step in this section has a photo.",
    176: "Done. Step 1 now shows IMG_7693 (the front desk).",
    228: "Done. Step 1 now shows IMG_7693 (the front desk), the photo from your note #176.",
    182: "Replaced with IMG_7695 (the waiting and play area).",
    188: "Added the Parks Youth Ranch logo at the top of the card. We used the whole logo; it is small enough that it did not need cropping.",
    189: "Changed the caption to your text.",
    226: "Removed.",
    371: "Removed.",
    190: "Replaced with AdobeStock_1126345278. This image had no caption; if you want \"A practice dedicated to yours and your child's needs\" shown under it, tell us and we will add it.",
    191: "Changed the heading to \"A personalized experience.\"",
    192: "Made darker. This applies to every one of these grey notes on the page.",
    193: "Changed to \"from the first tooth to high school\".",
    194: "Added: \"As they grow, they can also see our sister practice Mason Park Dental down the hall.\" \"Mason Park Dental\" links to bestdentistinkatytx.com.",
    197: "Changed the caption to your text.",
    200: "Changed the heading to \"Testimonials from parents like you.\"",
    201: "Added a \"Read them on Google\" link beside \"All reviews\". It opens the practice's Google listing, where every review is. There is no Google reviews widget connected for the kids practice; if you want an embedded one, tell us which service to use.",
    205: "Done. The row of names now stops while the mouse is over it, and starts again when the mouse leaves. The same fix applies to the moving row on the Reviews page.",
    206: "Added \"See all our reviews on Google\" to this section's note. It opens the practice's Google listing.",
    207: "Changed to a lighter color. It now reads clearly on the dark background. This applies to every small label on a dark background across the site.",
    210: "Changed the heading to your text.",
    213: "Changed the caption to your text.",
    215: "Changed the caption to your text.",
    216: "Removed the section.",
    217: "Removed the heading. A hidden version of it is still in the page for Google and screen readers, so the page keeps its main title for search.",
    218: "Added AdobeStock_417786010 to the empty space beside card 4.",
    219: "Changed the button to \"A personalized experience\".",
    220: "Removed.",
    221: "Changed the heading to \"Services dedicated for your growing child.\"",
    222: "Changed to \"At Mason Park Dental for Kids,\".",
    224: "Removed that paragraph. We kept the three cards below it; if you want those gone too, tell us.",
    227: "Changed to your text.",
    230: "Moved the photo up in its frame so his head is no longer cut off.",
    231: "Changed the heading to your text.",
    232: "Changed to \"Mason Park Dental for Kids\".",
    233: "Removed.", 234: "Removed.",
    237: "Removed the heading. A hidden version of it is still in the page for Google and screen readers.",
    238: "Removed.",
    240: "Removed the question and its answer.",
    246: "Removed.",
    247: "Changed so the whole mouth guard shows: the image is no longer cropped, and it is mirrored so the guard sits in the open part of the frame, clear of the text card.",
    253: "Added a sixth card, \"Silver Diamine Fluoride (SDF)\". It links to the Fillings page, which now has a full SDF section (your note #261). We did not use the price from Grand Mission's page; tell us if you want one shown.",
    257: "Changed the heading to \"Fillings and Silver Diamine Fluoride (SDF) Treatment.\"",
    259: "Added photos to steps 1, 3 and 4, from the practice's own photos: two clinicians with a patient, a clinician with a child in the chair, and a dentist checking a boy's teeth. Step 2 already had one, and step 5 is changed per your note #260.",
    260: "Replaced with a photo not used anywhere else on the site: the girl giving the dentist a high five.",
    261: "Replaced this section with one on Silver Diamine Fluoride: what it is, who it helps, how it is done, what to expect (the treated spot turns dark) and aftercare. It is based on Grand Mission's SDF page and written for the kids practice. We left out the price and the doctor's name.",
    266: "Moved to the bottom of the list and changed to your text.",
    271: "Added \"Mason Park Dental for Kids\" to this paragraph.",
    276: "Changed. The filled button beside it said \"Call (281) 578-7100\" but opened the booking page, so the section showed the number twice. It now says \"Book now\". The outlined button still calls the practice. Five other pages had the same mistake and are fixed too.",
    279: "Changed the heading to \"What the treatment will look like.\"",
    281: "Changed the list to your three lines.",
    282: "Changed the heading to \"Healthy habits kept at home help prevent restorative treatments.\" (\"keep\" is now \"kept\").",
    289: "Changed to \"If a baby tooth came out early, let us know.\"",
    296: "Changed the heading to your text.",
    298: "Added space between the heading and the note. This applies on every page that has this note.",
    304: "Removed.",
    305: "Changed the heading to your text.",
    307: "Removed.", 308: "Removed.",
    316: "Added space between the heading and the note. This applies on every page that has this note.",
    317: "Added a link to the Insurance and financing page.",
    318: "Added a link to the Insurance and financing page.",
    320: "Changed to \"Find out if your child is a candidate.\"",
    321: "Added the ®.",
    322: "Changed to \"whether it is the right solution for your child.\"",
    323: "Fixed. Every page now links to the profile you gave us (facebook.com/profile.php?id=100080674540904), in the footer and in the page data Google reads.",
    326: "Changed to \"What it is, and is it safe?\"",
    330: "Changed to \"Is it right for your child?\"",
    332: "Changed the heading to your text.",
    333: "Removed.",
    343: "Changed the caption to your text.",
    344: "Changed to your text.",
    355: "Moved the photo up in its frame so their heads are no longer cut off.",
    356: "Removed the question and its answer.",
    360: "Changed to a lighter color. This applies to every small label on a dark background across the site.",
    361: "Changed to a lighter color. This applies to this kind of link on every dark section of the site.",
    362: "Moved the photo up in its frame so her head is no longer cut off.",
    363: "Added space between the heading and the note. This applies on every page that has this note.",
    366: "Added \"Ask us about our in house Dental Savings Plan.\" It links to the plan's page.",
    370: "The phone number is now a tap-to-call link.",
    372: "Changed to \"answer your questions.\"",
    374: "Changed to \"Mason Park Dental for Kids\". We also changed the same wording lower on this page.",
    375: "Added \"Plus we have an in house Dental Savings Plan!\" It links to the plan's page.",
    376: "Added the logos for all twelve carriers. There is no current logo for DHA, so that tile shows the Assurant logo with \"DHA\" under it. Assurant sold its dental business to Sun Life in 2016; please check whether this carrier should still be listed.",
    377: "The phone number is now a tap-to-call link.",
    385: "Changed to \"Mason Park Dental for Kids\".",
    386: "Changed \"Katy\" to \"Harris County\".",
    387: "Made darker. This large text starts pale and fills in as you scroll; the pale state is now dark enough to read. This applies to every text of this kind across the site.",
    388: "Changed to \"Mason Park Dental for Kids\".",
    389: "Added \"fluoride treatments\".",
    390: "Added \"fluoride\".",
    391: "Made darker. This applies to the whole \"Typical insurance\" column.",
    392: "Made darker. This applies to the whole \"Typical insurance\" column.",
    393: "Made darker. This applies to the whole \"Typical insurance\" column.",
    394: "Made darker. This applies to the whole \"Typical insurance\" column.",
    395: "Changed to your text.",
    396: "Changed to \"Mason Park Dental for Kids\".",
    398: "The phone number is now a tap-to-call link.",
    400: "The phone number is now a tap-to-call link.",
    407: "Done. The moving row now stops while the mouse is over it.",
    408: "Removed.",
    412: "Changed the caption to your text.",
    414: "The phone number is now a tap-to-call link.",
    423: "Removed.",
    426: "Removed from the blog page. The same floating label is on every page of the site; tell us if you want it removed everywhere.",
    427: "Made the photo taller and moved it down in the frame, so both faces and heads are fully in view.",
    428: "Changed the heading to your text.",
    429: "Changed. The same line was also the heading of the card below, so both now say \"A dedicated side of the office for children and their needs.\"",
    430: "Changed the caption to your text.",
    431: "Replaced with your new paragraph (#432).",
    432: "Changed to your text.",
}

OPEN = {
    34: "Still open. We need a GoHighLevel form for the kids practice before we can add one (see #198).",
    198: "We can add this as soon as there is a form. The kids practice has no GoHighLevel form. The adult practice has three (Contact, Invisalign, New Patient Special) in its own account, but using one of those would send kids enquiries into the adult practice's system. Could you create a kids form in GHL, with a \"Service you are looking for\" field, and send us its embed link? Or tell us to use the adult practice's Contact form.",
    368: "We could not find a working online forms link. The old site's \"Online forms\" button pointed to a PatientViewer page that now shows \"There was an error loading the web forms\", and Flexbook is for booking only. Could you send us the link to the practice's online patient forms? We will link \"forms\" to it the same day.",
    378: "For now, \"CareCredit\" links to CareCredit's own application page, so it works today. We could not find a CareCredit account for the kids practice: the only CareCredit listing is the adult practice's (suite 104A). Please send us the practice's CareCredit apply link and we will switch to it.",
    379: "The CareCredit, Alphaeon and Lending Club names further down this page now link to each lender's application page (see #378, #380, #381). We did not put links inside this large line, because it is animated word by word as you scroll. The practice-specific links are still needed; see #378.",
    380: "For now, \"Alphaeon\" links to Alphaeon's dental application page, so it works today. The practice is not in Alphaeon's provider directory. Please send us the practice's Alphaeon link and we will switch to it.",
    381: "For now, \"Lending Club\" links to its patient financing page (LendingClub patient financing is now run by Happen Bank), so it works today. There is no Lending Club account for Mason Park; there is one for Grand Mission Dentistry. Should kids patients use Grand Mission's link, or does the practice have its own?",
    406: "We need your help with this one. We could not confirm the practice's Invisalign tier: there is no Platinum mention on the old site or the adult site, and we have no badge image. Could you send us the Invisalign Platinum Provider badge (or a photo that shows it)? We will put it in this spot.",
}

out = []
for n in sorted(k for k, t in tasks.items() if t["status"] not in ("done", "closed")):
    d = tasks[n]["description"]
    if n in OPEN:
        out.append({"n": n, "done": False, "text": OPEN[n]})
        continue
    if n in T:
        text = T[n]
    else:
        html = str((tasks[n].get("selector_info") or {}).get("html") or "")
        m = re.search(r"(AdobeStock_\d+|PXL_\d+_\[?\d+)", d)
        if "badges-in" in html:
            text = BADGES
        elif html.startswith("<figcaption") and re.fullmatch(r"\s*remove\s*", d, re.I):
            text = CAPTION
        elif m:
            text = f"Replaced with {m.group(1).replace('[', '')}."
            if n == 421:
                text = "Replaced with AdobeStock_1406063303. Your note #418 asked for AdobeStock_1806344091 in the same spot; this later note wins. The card for this post on the Blog page shows AdobeStock_1806344091, per #417. Tell us if you want them to match."
            if n == 418:
                text = "Your later note #421 asked for AdobeStock_1406063303 in this same spot, so that is the one used. AdobeStock_1806344091 is on this post's card on the Blog page (#417). Tell us if you would rather have it here."
            if n == 327:
                text = "Replaced with AdobeStock_462171644. That file is a video, so we used a still from it (the aligner in the mirror)."
            if n in (328, 329, 331, 410, 413, 415, 416):
                text = f"Added {m.group(1).replace('[', '')} to this section."
        else:
            text = None
    if text is None:
        continue
    out.append({"n": n, "done": True, "text": text + S})

missing = [n for n, t in tasks.items() if t["status"] not in ("done", "closed") and n not in {o["n"] for o in out}]
print("no reply for:", missing)
for f in ("replies-0926.json", "replies.json"):
    with open(f, "w", encoding="utf-8", newline="") as fh:
        json.dump(out, fh, indent=2, ensure_ascii=False)
print(len(out), "replies,", sum(o["done"] for o in out), "close")
