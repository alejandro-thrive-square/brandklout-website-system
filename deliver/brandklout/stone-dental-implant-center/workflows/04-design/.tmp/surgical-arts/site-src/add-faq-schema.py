# Adds FAQPage structured data for the FAQ blocks written into treatments.html
# during the 2026-08-31 content expansion.
#
# WHY THIS IS A SCRIPT AND NOT A HAND EDIT. seo.json's `schema` key takes ONE
# node per page and build-site.mjs drops it into the @graph beside the practice.
# Writing six question/answer pairs by hand into JSON, in sync with the markup,
# is exactly the kind of thing that silently drifts. Re-running this rewrites
# the node from a single source below, so markup and schema can be checked
# against each other.
#
# NO EM DASHES. This file writes rendered copy (JSON-LD is copy), so
# SYSTEM_RULES.md "Copy Standards" applies to every string below.
# check-copy.mjs reads the built JSON-LD back and will fail on one.
#
# The answers here are deliberately SHORTER than the markup's. Google wants the
# answer text to match the visible answer; these are the same claims in the
# same order, trimmed of the em-dash asides that do not survive a rich result.
#
# Usage: python add-faq-schema.py <path to seo.json>
import collections
import io
import json
import sys

path = sys.argv[1]
d = json.load(io.open(path, encoding="utf-8"), object_pairs_hook=collections.OrderedDict)

TREATMENTS_FAQ = [
    (
        "MyEllevate® or a neck lift: how do I know which?",
        "A neck lift uses small incisions behind the ears and under the chin and can last up to ten "
        "years. MyEllevate® places internal sutures through small punctures and lasts around five. "
        "MyEllevate® suits earlier laxity; a neck lift reverses more advanced sagging. MyEllevate® "
        "also needs only local anaesthetic, so you can drive yourself home.",
    ),
    (
        "Will a neck lift fix my jowls?",
        "No. Jowls sit low on the face but originate in sagging facial tissue, so they are addressed "
        "in a facelift rather than a neck lift. A minimally invasive facelift is the procedure that "
        "reduces them.",
    ),
    (
        "Implants or filler?",
        "Fillers are gel injectables that plump and smooth lines, acne scars and thin lips, lasting "
        "months to a couple of years. Facial implants are customised inserts made from a biocompatible "
        "material that stays intact, so the contour is permanent. Filler changes the surface; an "
        "implant changes the underlying structure.",
    ),
    (
        "How long does each result last?",
        "Blepharoplasty 10–15 years or more. A neck lift up to ten years. MyEllevate® around five. "
        "Facial implants and buccal fat reduction are permanent, though significant weight gain can "
        "return fullness elsewhere in the cheek. Injectables last months rather than years.",
    ),
    (
        "Can I have more than one procedure at once?",
        "Often, and it is frequently the better plan. A neck lift can be performed alongside a facelift "
        "or eyelid surgery in one procedure, with a single recovery. What can be combined safely depends "
        "on your anatomy and time under anaesthetic, so it is decided at the consultation.",
    ),
    (
        "Why do some treatments not show a price?",
        "Because the practice never published a figure for those. Genioplasty, fat transfer and facelift "
        "fees vary genuinely with the case. Every other fee shown is the practice's own published price, "
        "currently being reconfirmed for 2026.",
    ),
]


def faq_page(pairs):
    return collections.OrderedDict(
        [
            ("@type", "FAQPage"),
            (
                "mainEntity",
                [
                    collections.OrderedDict(
                        [
                            ("@type", "Question"),
                            ("name", q),
                            (
                                "acceptedAnswer",
                                collections.OrderedDict(
                                    [("@type", "Answer"), ("text", a)]
                                ),
                            ),
                        ]
                    )
                    for q, a in pairs
                ],
            ),
        ]
    )


d["pages"]["treatments"]["schema"] = faq_page(TREATMENTS_FAQ)

io.open(path, "w", encoding="utf-8").write(
    json.dumps(d, indent=2, ensure_ascii=False) + "\n"
)
print("treatments: FAQPage with %d questions" % len(TREATMENTS_FAQ))
