"""Replies for #34, #198 (the GHL contact form), #82 (Playarea.jpg) and #502 #504 #506 (Canva team) -> replies.json for reply.mjs."""
import json, os

S = " It is on staging now (staging.masonparkpediatricdental.com); please hard-refresh (Ctrl+Shift+R) to see it."
D = {
    34: "Added: the practice's GoHighLevel \"Contact form\" now sits on the Contact page in its own section, \"Send us a message\", between the four ways to reach us and the hours. The same form is also on the Patient Reviews page.",
    198: "Added the GHL contact form (above). One thing we can't do from the website: the form itself has no field for the service they are looking for, only name, email, phone and message. Until a \"Service\" dropdown is added to the form in GoHighLevel, the text beside it asks parents to name the service in their message. If you add the field in GHL, it shows up on the site automatically. Also in GHL: the form's Privacy Policy and Terms links point to example.com.",
    82: "Done with Playarea.jpg from the Drive. The file is small (382x510 pixels), too small to stretch across the full-width band without going blurry, so it now sits in a portrait frame with a short line beside it (\"A dinosaur wall to keep little hands busy.\"). If you have the original photo from the phone, send it and we can show it larger.",
    502: "Added Priscilla (Treatment coordinator), Amanda (Patient and treatment coordinator) and Nicole to the front desk, from the Canva team photos. Canva titles Nicole \"RDA\"; we listed her under the front desk as this note says. Tell us if she should be with the dental assistants instead. Every team photo on the page (and Dr. Dave Cho's on the doctors page) now uses the new Canva portraits, so they all match.",
    504: "Added Josh, Alison and Luis to the dental assistants, from the Canva team photos.",
    506: "Added Lola to the dental hygienists (Canva lists her as RDH). One more person is in the Canva folder, Anju Lekshmi (RDA), who is not on the page: should we add her?",
}
OPEN = {198}  # the services field has to be added in GoHighLevel; stays open until it is
plan = [{"n": n, "text": t + S, "done": n not in OPEN} for n, t in sorted(D.items())]
here = os.path.dirname(os.path.abspath(__file__))
with open(os.path.join(here, "replies.json"), "w", encoding="utf-8", newline="") as f:
    json.dump(plan, f, indent=2, ensure_ascii=False)
print(len(plan), "replies:", sum(p["done"] for p in plan), "close")
