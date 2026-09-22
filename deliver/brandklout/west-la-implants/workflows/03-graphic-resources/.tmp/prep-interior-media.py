"""Copy the photographs the interior pages use out of the scraped mirror into
site-src/media/img under clean, stable names. Idempotent. Anything wider than
2000px is resized; JPEG quality 84. Run: python prep-interior-media.py

The names here are the names the page sources reference. A re-cut of an image
needs a NEW name (the media library skips uploads by basename)."""
import os, shutil, sys
from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
DL = os.path.join(HERE, 'downloads')
OUT = os.path.normpath(os.path.join(HERE, '..', '..', '04-design', '.tmp', 'site-src', 'media', 'img'))
L = '_long/'
W = 'wp-content/uploads/'

PHOTOS = {
    # practice, doctor, team
    'yomi-robot-surgical.jpg': L + '8423472c7556-yomi_robot_surgical_dentalimplants_westla_barriere.jpg',
    'yomi-technology.jpg': L + '2f083d3be9ee-yomi_technology_advancements_westlaimplants_barrerie.jpg',
    'state-of-the-art.jpg': L + 'a5739f624348-stateoftheartdental_dentalimplant_westla_barriere2.jpg',
    'waiting-room.jpg': L + '68b1915b6e82-waitingroom_westlaimplants_dentalpractice_barrerie1.jpg',
    'front-desk-leslie.jpg': L + '8301494cf592-leslie_receptiontist_frontdesk_westlaimplants_barrerie.jpg',
    'front-desk-emily.jpg': L + '5d42b83cd711-emily_insurance_frontdesk_westlaimplants_barrerie.jpg',
    'front-desk-receptionist.jpg': L + '788db9d740c2-receptiontist_frontdesk_westlaimplants_barrerie2.jpg',
    'doctor-handshake.jpg': L + '34003cc1b1b9-rie_dentalpatient_handshake_dentalimplant_westlaimplants.jpg',
    'doctor-explaining.jpg': L + 'd2e5f177a61d-barriere_westlaimplants_explanation_dentalimplants.jpg',
    'doctor-leslie.jpg': L + '58a1550bce04-barriere_leslie_patientinteraction_westlaimplants.jpg',
    'doctor-patient-2.jpg': L + 'a2506b41a3b9-_dentalpatient_interaction_dentalimplant_westlaimplants2.jpg',
    'doctor-headshot-2.jpg': L + '9adee8c0f2c1-drbarrerie_headshot_westlaimplant_dentalimplant2.jpg',
    'doctor-headshot-square.png': L + '3e6b8f86bf5b-rriere_headshot_confident_dentalpractice_westlaimplants1.png',
    'doctor-cosmetic.jpg': L + '2dfb3243a7ac-rbarriere_cosmetic_transformation_dentalpractice_westla1.jpg',
    'practice-full.jpg': L + '6254a73e8cda-barriere_dentalpractice_dentalimplant_westla_1full.jpg',
    'practice-patient-2.jpg': L + '5a250838ea18-riere_dentalpractice_dentalimplant_dentalpatient_westla2.jpg',
    'practice-patient-3.jpg': L + 'f399eab11e62-riere_dentalpractice_dentalimplant_dentalpatient_westla3.jpg',
    'hygienist-procedure.jpg': L + '4fedbde590fe-ient_procedure_rdh_dentalpratice_barriere_westlaimplants.jpg',
    'cbct-emily.jpg': L + '150024cd92a6-dentalimplant_cbct_dentalpratice_westlaimplants_barriere.jpg',
    'surgical-kit.jpg': L + 'ec0a754176bb-mplantcenter_surgicalkit_dentalimplants_westla_barriere1.jpg',
    'wisdom-tooth-extraction.jpg': L + '4d4a8f75468c-wisdom_tooth_extractions_drbarriere_westlaimplant.jpg',
    # patients
    'leslie-welcome.jpg': L + 'aeef950cbf0c-leslie_dentalpatient_welcome_westlaimplant_barrerie1.jpg',
    'leslie-allon4-2.jpg': L + '1ddddccdf4d5-leslie_dentalimplant_barriere_westlaimplants_allon42.jpg',
    'leslie-allon4-3.jpg': L + '778026b48b72-slie_dentalimplantpatient_allon4_barrerie_westlaimplants.jpg',
    'emily-mirror-portrait.jpg': L + 'b69e945bf4a8-emily_smile_mirror_dentalimplant_westlaimplants_barriere.jpg',
    'emily-makeover-after.jpg': L + '6af4c1509141-emily_smilemakeover_after_barriere_dentalpractice2.jpg',
    'emily-makeover.jpg': L + '7a16fea95627-ily_smilemakeover_dentalimplant_denntalpractice_barriere.jpg',
    'emily-practice.jpg': L + '2a7147f662ed-ily_dentalimplant_dentalpractice_barriere_westlaimplants.jpg',
    'emily-implants.jpg': L + 'eaa6f308b9b6-ily_dentalpatient_dentalimplants_westlaimplants_barriere.jpg',
    'patient-smiling-2.jpg': L + '038d07c91182-lpatient_dentalimplants_westlaimplants_barriere_smiling2.jpg',
    'michael-full-mouth.jpg': L + '8a0d6b814151-michael_dentalpatient_fullmouth_barrerie_westlaimplants.jpg',
    'michael-before-after.jpg': L + '5f5d8d099ee9-michael_beforeafter_fullmouth_dentalimplant_westla.jpg',
    'denture-patient-renewed.jpg': L + '27521645b5fe-enture_patient_renewedself_dentalimplant_westlaimplants1.jpg',
    # stock the practice already publishes
    'sedation-patient-smiling.jpg': W + '2022/02/sedation-dentistry-patient-smiling.jpg',
    'patient-under-sedation.jpg': W + '2019/11/dental-patient-under-sedation.jpg',
    'veneer-patient.jpg': W + '2022/02/veneer_cosmetic_dentalpatient1.jpg',
    'painful-dentures.jpg': W + '2022/02/dental-patient-with-painfull-dentures.jpg',
    'older-couple-smiling.jpg': W + '2022/02/older_couple_dental_success_smiling.jpg',
    'patient-covering-mouth.jpg': W + '2021/02/dental-patient-covering-her-mouth.jpg',
    'jaw-bone-loss.jpg': W + '2022/02/jaw-bone-loss.jpg',
    'bone-graft-model.jpg': W + '2022/02/bone-graft-model.jpg',
    'sinus-lift-graphic.jpg': W + '2022/02/sinus-lift-graphic-2.jpg',
    'ridge-augmentation-model.jpg': W + '2022/02/ridgeaugmentation_dentalimplant_3dmodel_after.jpg',
    'zirconia-model.jpg': W + '2021/02/zirconia-model.jpg',
    'hybrid-denture-model.jpg': W + '2022/02/hybrid_fixed_denture_model10.jpg',
    'hybrid-denture-model-2.jpg': W + '2022/02/hybrid_fixed_denture_model7.jpg',
    'gum-disease-patient.jpg': W + '2021/02/dental-patient-in-need-of-gum-disease-treamtent.jpg',
    'patient-smiling.jpg': W + '2022/02/dentalpatient_smiling2.jpg',
    'patient-paying.jpg': W + '2022/02/dental-patient-paying-for-procedure-1.jpg',
    'patient-calculator.jpg': W + '2022/02/dental-patient-using-calculator.jpeg',
    'using-laptop.jpg': W + '2021/02/using-laptop.jpg',
    'patient-laptop.jpg': W + '2023/08/dental-patient-using-laptop.jpg',
    'whitening-patient.jpg': W + '2019/11/teeth-whitening-patient-smiling.jpg',
    'invisalign-patient.jpg': W + '2021/02/dental-patient-using-invisalign.jpg',
    'periimplantitis-model.jpg': W + '2022/02/periimplantits_model.jpg',
    'missing-teeth-model.jpg': W + '2022/02/missing_teeth_implant_model.jpg',
    'blog-hero.webp': W + '2022/04/blog-hero.webp',
    'dental-xray-consult.jpg': W + '2022/04/dental-xray.jpg',
    'full-arch-model.jpg': W + '2021/02/full-arch-dental-implants-model-1.jpg',
    'implant-crown-model.jpg': W + '2021/02/dental-implant-crown-model.jpg',
    'implant-post-model.jpg': W + '2022/12/dental-implant-post-model.jpg',
    'three-single-implants.jpg': W + '2022/10/three-single-dental-implants.jpg',
    'tooth-extraction-model.jpg': W + '2023/03/tooth-extraction.jpg',
    'older-woman-chair.jpg': W + '2023/03/older-woman-smiling-in-a-dental-chair.jpg',
    'nurses-with-patient.jpg': W + '2022/09/two-nurses-with-an-implant-patient.jpg',
    'full-mouth-patient-dentist.jpg': W + '2023/02/full-mouth-dental-implants-patient-and-dentist.jpg',
    'patient-getting-implants.jpg': W + '2022/06/patient-getting-dental-implants.jpg',
    'dentures-patient-eating.jpg': W + '2022/02/dentures-patient-eating.jpg',
    'patients-eating.jpg': W + '2022/03/dental-patients-eating-2.jpg',
    'woman-tea.jpg': W + '2022/09/hero-woman-smiling-indoors-with-tea.jpg',
    'older-man-smiling.jpg': W + '2022/09/older-man-smiling.jpg',
    # before / after pairs
    'ba-veneers-1-before.jpg': W + '2021/02/case-1-porcelain-veneers-before.jpg',
    'ba-veneers-1-after.jpg': W + '2021/02/case-1-porcelain-veneers-after.jpg',
    'ba-veneers-2-before.jpg': W + '2021/02/case-2-porcelain-veneers-before.jpg',
    'ba-veneers-2-after.jpg': W + '2021/02/case-2-porcelain-veneers-after.jpg',
    'ba-whitening-before.jpg': W + '2021/02/teeth-whitening-before.jpg',
    'ba-whitening-after.jpg': W + '2021/02/teeth-whitening-after.jpg',
    'ba-whitening-2-before.jpg': W + '2021/02/2-teeth-whitening-before-1.jpg',
    'ba-whitening-2-after.jpg': W + '2021/02/2-teeth-whitening-after-1.jpg',
    'ba-invisalign-before.jpg': W + '2021/02/invisalign-before.jpg',
    'ba-invisalign-after.jpg': W + '2021/02/invisalign-after.jpg',
    'ba-case1-before.jpg': W + '2022/02/case1_before_westlaimplants_barriere.jpg',
    'ba-case1-after.jpg': W + '2022/02/case1_after_westlaimplants_barriere.jpg',
    'ba-case4-before.jpg': W + '2022/02/case4_before_westlaimplants_barriere.jpg',
    'ba-case4-after.jpg': W + '2022/02/case4_after_westlaimplants_barriere.jpg',
    'ba-case5-before.jpg': W + '2022/02/case5_before_westlaimplants_barriere.jpg',
    'ba-case5-after.jpg': W + '2022/02/case5_after_westlaimplants_barriere.jpg',
    'ba-case6-before.jpg': W + '2022/02/case6_before_westlaimplants_barriere1.jpg',
    'ba-case6-after.jpg': W + '2022/02/case6_after_westlaimplants_barriere1.jpg',
    'ba-case7-before.jpg': W + '2022/02/case7_before_westlaimplants_barriere.jpg',
    'ba-case7-after.jpg': W + '2022/02/case7_after_westlaimplants_barriere.jpg',
    'ba-case9-before.jpg': W + '2022/02/case9_before_westlaimplants_barriere.jpg',
    'ba-case9-after.jpg': W + '2022/02/case9_after_westlaimplants_barriere.jpg',
    'ba-pat-before.jpg': W + '2022/12/pat-before-002.jpg',
    'ba-pat-after.jpg': W + '2022/12/pat-after-002.jpg',
    # team portraits (the practice's own circles)
    'team-tielar.png': W + '2023/11/meet-3-circle.png',
    'team-veronica.png': W + '2023/11/meet-4-circle.png',
    'team-jacob.png': W + '2023/11/meet-5-circle.png',
    'team-delia.png': W + '2023/11/meet-6-circle.png',
}

MAXW = 2000
os.makedirs(OUT, exist_ok=True)
done = skipped = missing = 0
for name, rel in PHOTOS.items():
    src = os.path.join(DL, rel)
    dst = os.path.join(OUT, name)
    if not os.path.exists(src):
        print('MISSING', rel); missing += 1; continue
    if os.path.exists(dst):
        skipped += 1; continue
    im = Image.open(src)
    if im.width > MAXW:
        im = im.convert('RGB') if im.mode not in ('RGB', 'RGBA') else im
        im.thumbnail((MAXW, MAXW * 4))
        if name.lower().endswith('.png'):
            im.save(dst, 'PNG', optimize=True)
        else:
            im.convert('RGB').save(dst, 'JPEG', quality=84, optimize=True, progressive=True)
    else:
        shutil.copyfile(src, dst)
    done += 1
print(f'copied {done}, already there {skipped}, missing {missing} -> {OUT}')
