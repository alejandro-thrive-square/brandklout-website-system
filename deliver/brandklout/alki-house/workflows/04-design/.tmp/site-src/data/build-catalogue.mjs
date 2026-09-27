// Turns the client's stock ledger (a per-lot purchase log, Spanish names, one
// row per lot bought) into the catalogue the site renders: one row per product,
// Spanish name, brand, category, latest sale price, units on hand. A clean
// English name is made first (classification and image search run on it) and
// kept as nameEn; the Spanish name is made from it by spanish().
//
// This JSON is the stand-in for the Google Sheet the client will maintain. Its
// columns ARE the sheet's columns; the sync plugin (later) writes the same shape.
// Hand-written copy (taglines, descriptions, specs, featured flags) lives in
// catalogue-overrides.json keyed by slug, so re-running never loses it.
//
// Usage: node build-catalogue.mjs
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const CSV = path.resolve(HERE, '../../../../00-client-delivery-initialization/.tmp/client-handoff/Stock/products.csv');
const OUT = path.join(HERE, 'products.json');
const OVERRIDES = path.join(HERE, 'catalogue-overrides.json');

const csv = fs.readFileSync(CSV, 'utf8');
const rows = [];
for (const line of csv.split(/\r?\n/).slice(1)) {
  if (!line.trim()) continue;
  const cells = []; let cur = '', q = false;
  for (const ch of line) { if (ch === '"') q = !q; else if (ch === ',' && !q) { cells.push(cur); cur = ''; } else cur += ch; }
  cells.push(cur); rows.push(cells);
}
const money = (s) => (s ? Number(s.replace(/[$,]/g, '')) : null);

/* ---- naming ------------------------------------------------------------ */
const WORDS = [
  [/\bAdaptador\b/gi, 'Adapter'], [/\bJaula\b/gi, 'Cage'], [/\bLuz\b/gi, 'Light'],
  [/\bBater[ií]as?\b/gi, 'Battery'], [/\bCargador\b/gi, 'Charger'], [/\bBarra Led\b/gi, 'LED Bar'],
  [/\bTr[ií]pode\b/gi, 'Tripod'], [/\bMicr[oó]fono\b/gi, 'Microphone'], [/\bLente\b/gi, 'Lens'],
  [/\bMaleta\b/gi, 'Hard Case'], [/\bpara\b/gi, 'for'], [/\bcon\b/gi, 'with'], [/\bsin\b/gi, 'without'],
  [/\bRejilla\b/gi, 'Grid'], [/\bCuadro Led\b/gi, 'LED Panel'], [/\bClip Led\b/gi, 'LED Clip Light'],
  [/\bCelulares?\b/gi, 'Phones'], [/\bC[aá]maras?\b/gi, 'Camera'], [/\bLuces\b/gi, 'Lights'],
  [/\bAnillo Giratorio\b/gi, 'Rotating Ring'], [/\bBase Grande\b/gi, 'Large Base'], [/\bGrande\b/gi, 'Large'],
  [/\bSet de Roscas\b/gi, 'Thread Adapter Set'], [/\bKit de Limpieza de\b/gi, 'Cleaning Kit for'],
  [/\bAro\b/gi, 'Ring'], [/\bRoja\b/gi, 'Red'], [/\bRojo\b/gi, 'Red'], [/\bAmarillo\b/gi, 'Yellow'], [/\bBlanco\b/gi, 'White'],
  [/\bLampara Atardecer\b/gi, 'Sunset Lamp'], [/\bFiltro\b/gi, 'Filter'], [/\bSofbox\b/gi, 'Softbox'],
  [/\bDisparador\b/gi, 'Shutter Trigger'], [/\bNueva\b/gi, 'New'], [/\bPar\b/g, 'Pair'],
  [/\bSilicon\b/g, 'Silicone'], [/\bCases\b/g, 'Case'], [/\bMonitor Holder\b/g, 'Monitor Mount'],
  [/\bFIltro\b/g, 'Filter'], [/\bZoom Rubber\b/g, 'Zoom Ring Rubber'], [/\bFocus Rubber\b/g, 'Focus Ring Rubber'],
];
const STRIP = [/\s*\((sellado|julio|junio|agosto|w|b|frainer)\)/gi, /\s*for Leon\b/i, /\s+Brand New\b/i, /\s*\(New\)/i, /\bx 3\b/i];
function english(raw) {
  const k = raw.toLowerCase().replace(/\s+/g, ' ').trim();
  if (CANON[k]) return CANON[k];
  let n = raw.replace(/\s+/g, ' ').trim();
  for (const [re, to] of WORDS) n = n.replace(re, to);
  for (const re of STRIP) n = n.replace(re, '');
  n = n.replace(/\bDjI\b/, 'DJI').replace(/\bLed\b/g, 'LED').replace(/\bSmallrig\b/g, 'SmallRig').replace(/\bFeiyu Scorp\b/, 'Feiyutech Scorp')
    .replace(/\bMini Bowens\b/g, 'Mini-Bowens').replace(/\b(\d+)w\b/g, '$1W').replace(/\bKF Concept\b/g, 'K&F Concept').replace(/\bDJI OM4\b/g, 'DJI Osmo Mobile 4')
    .replace(/\bSpeedlight\b/g, 'Speedlite').replace(/\b(\d)\s*TX\b/g, '$1 TX').replace(/\s+/g, ' ').trim();
  // "Adapter Canon EF a Sony E" -> "Canon EF to Sony E Adapter"
  const m = n.match(/^Adapter (.+?) a (.+)$/i);
  if (m) n = `${m[1]} to ${m[2]} Adapter`;
  const m2 = n.match(/^Cage for (.+)$/i); if (m2) n = `${m2[1]} Cage`;
  const m3 = n.match(/^Cage (.+)$/i); if (m3 && !/ Cage$/i.test(n)) n = `${m3[1].replace(/\bfor\b ?/i, '')} Cage`;
  return n.replace(/\s+/g, ' ').trim();
}


/* ---- canonical names -----------------------------------------------------
   Ledger spellings that the word map cannot fix: mixed languages, brand in the
   wrong place, the same item written three ways. Keyed by the ledger's raw
   name, lower-cased and whitespace-collapsed. Two raws mapping to one name
   FOLD into one product. */
const CANON = {
  'jaula + top handle fx30': 'Sony FX30 Cage + Top Handle', 'jaula fx30 + top handle': 'Sony FX30 Cage + Top Handle', 'jaula para fx30': 'Sony FX30 Cage',
  'canon ef a rf adapter': 'Canon EF to RF Adapter', 'adaptador canon ef a rf': 'Canon EF to RF Adapter', 'adaptador canon ef a rf (w)': 'Canon EF to RF Adapter', 'adaptador canon ef a rf (b)': 'Canon EF to RF Adapter',
  'adaptador canon ef a rf blanco': 'Canon EF to RF Adapter (White)', '7artisans adapter canon ef-se': '7artisans Canon EF to Sony E Adapter',
  'adaptador viltrox ef a m': 'Viltrox EF to EF-M Adapter', "alvin's cables hdmi a micro hdmi": "Alvin's Cables HDMI to Micro HDMI Cable",
  'feelworld f6 plus monitor': 'Feelworld F6 Plus Monitor', 'feelworld f6 plus v2 kit': 'Feelworld F6 Plus V2 Monitor Kit', 'monitor feelworld f6 plus v2 kit': 'Feelworld F6 Plus V2 Monitor Kit',
  'feelworld fw568': 'Feelworld FW568 Monitor', 'feelworld s55': 'Feelworld S55 Monitor', 'andycine a6 v2': 'Andycine A6 V2 Monitor', 'monitor viltrox dc-550': 'Viltrox DC-550 Monitor',
  'luz zgrl-60 rgb': 'ZGRL-60 RGB COB Light', 'luz 80w zu80': 'ZU80 80W COB Light', 'luz 80w zgrl': 'ZGRL 80W COB Light', 'luz zgrl 80w': 'ZGRL 80W COB Light',
  '100w video light': '100W Bowens COB Video Light', 'luz 100w sin tripode': '100W Bowens COB Video Light', 'luz bowens 100w': '100W Bowens COB Video Light', 'luz 100w + softbox': '100W COB Light + Softbox Kit',
  'colbor cl60': 'Colbor CL60 COB Light', 'colbor cl60m light': 'Colbor CL60M COB Light', 'colbor cl60r': 'Colbor CL60R RGB COB Light', 'colbor cl100': 'Colbor CL100 COB Light',
  'tolifo 60w light rgb': 'Tolifo 60W RGB Light', 'manbily cfl 100w rgb': 'Manbily CFL 100W RGB Light', 'zhiyun molus g60': 'Zhiyun Molus G60 COB Light',
  'barra led rgb 30cm': 'RGB LED Tube Light 30cm', 'barra led rgb (julio)': 'RGB LED Tube Light 30cm', 'barra led rgb (agosto)': 'RGB LED Tube Light 30cm', 'barra led rgb': 'RGB LED Tube Light 30cm',
  'barra led rgb 50cm': 'RGB LED Tube Light 50cm', 'barra led ulanzi rgb 50cm': 'Ulanzi 50cm RGB LED Tube Light',
  'cuadro led para celular': 'Phone LED Panel Light', 'clip led para celular': 'Phone LED Clip Light', 'clip led para celulares': 'Phone LED Clip Light', 'lampara atardecer (frainer)': 'Sunset Projection Lamp',
  'softbox mini bowens 30cm': '30cm Mini-Bowens Softbox', 'sofbox 30cm mini bowens': '30cm Mini-Bowens Softbox', 'softbox lantern 30cm mini bowens': '30cm Mini-Bowens Lantern Softbox', 'softbox octa 30cm mini bowens': '30cm Mini-Bowens Octa Softbox',
  'softbox ulanzi mini bowens': 'Ulanzi Mini-Bowens Softbox', 'softbox soonpho 95cm': 'Soonpho 95cm Softbox', 'softbox triopo k3 55cm': 'Triopo K3 55cm Softbox', 'softbox triopo k3 mars t30': 'Triopo K3 Mars T30 Softbox',
  'softbox triopo k3 65cm + grid': 'Triopo K3 65cm Softbox + Grid', 'softbox triopo 65cm': 'Triopo K3 65cm Softbox + Grid', 'triopo softbox con rejilla': 'Triopo K3 65cm Softbox + Grid', 'triopo 65cm speedlite softbox': 'Triopo 65cm Speedlite Softbox',
  'adaptador speedlite a bowens': 'Speedlite to Bowens Adapter', 'speedlight to bowens adapter': 'Speedlite to Bowens Adapter', 'adaptador speedlite a bowens v2': 'Speedlite to Bowens Adapter V2', 'speedlite to bowens adapter v2': 'Speedlite to Bowens Adapter V2',
  'adaptador mini bowens a bowens': 'Mini-Bowens to Bowens Adapter', 'adaptador zy a bowens': 'Zhiyun ZY Mount to Bowens Adapter', 'godox speedlite to elinchrom': 'Godox Speedlite to Elinchrom Adapter',
  'tripode 2m para luces': '2m Light Stand', 'tripode para gimbal grande': 'Gimbal Tripod (Large)', 'base grande para gimbal': 'Gimbal Base Plate', 'anillo giratorio para tripode vrig': 'VRIG Rotating Tripod Ring',
  'set de roscas para camara': 'Camera Thread Adapter Set', 'aro para canon 70-200mm f2.8l': 'Canon 70-200mm f/2.8L Tripod Collar', 'canon 70-200mm f2.8l rubber': 'Canon 70-200mm f/2.8L Ring Rubber',
  'top handle grip': 'Top Handle Grip', 'top handle': 'Top Handle Grip', 'top handle smallrig': 'SmallRig Top Handle', 'top handle neewer': 'Neewer Top Handle', 'neewer top handle nato': 'Neewer NATO Top Handle',
  'super clamp para camaras': 'Camera Super Clamp', 'jaula para sony a7': 'Sony a7 Cage', 'jaula sony a7 m-remote': 'Sony a7 Cage with M-Remote', 'jaula para sony a7 m - remote': 'Sony a7 Cage with M-Remote', 'jaula sony a7cr': 'Sony a7CR Cage',
  'jaula para sony a6000': 'Sony a6000 Cage', 'jaula sony a6000': 'Sony a6000 Cage', 'jaula para sony a6000 puluz': 'Puluz Sony a6000 Cage', 'jaula smallrig para sony a6000': 'SmallRig Sony a6000 Cage',
  'jaula sony zve10': 'Sony ZV-E10 Cage', 'jaula sony zve-10': 'Sony ZV-E10 Cage', 'sony zv-e10 cage': 'Sony ZV-E10 Cage', 'sirui cage para sony zve10': 'Sirui Sony ZV-E10 Cage', 'jaula smallrig para sony zv-e10': 'SmallRig Sony ZV-E10 Cage', 'sony zv-e10 cage smallrig': 'SmallRig Sony ZV-E10 Cage',
  'jaula nitze sony zve-10 mark ii': 'Nitze Sony ZV-E10 II Cage', 'jaula para sony a6700': 'Sony a6700 Cage', 'jaula sirui para sony a6700': 'Sirui Sony a6700 Cage', 'jaula para canon r7': 'Canon R7 Cage', 'canon r8 cage': 'Canon R8 Cage',
  'kastar lp-e17h batteries': 'Kastar LP-E17H Battery', 'kastar lp-e17h battery': 'Kastar LP-E17H Battery', 'bateria lpe17 para canon': 'Canon LP-E17 Battery', 'baterias kastar lp-e12 (par)': 'Kastar LP-E12 Battery Pair',
  'kastar np-550 baterías + cargador': 'Kastar NP-F550 Battery Pair + Charger', 'baterias (2) np-550 + cargador': 'Kastar NP-F550 Battery Pair + Charger', 'andycine np-550 battery': 'Andycine NP-F550 Battery',
  'bateria kastar np-780': 'Kastar NP-F780 Battery', 'kastar np-f780 battery': 'Kastar NP-F780 Battery',
  'baterias kastar fw-50 + charger': 'Kastar NP-FW50 Battery Pair + Charger', 'kit kastar baterias sony np-fw50': 'Kastar NP-FW50 Battery Pair + Charger', '2 baterias fw-50 + cargador': 'Kastar NP-FW50 Battery Pair + Charger',
  'baterias viltrox np-fz100': 'Viltrox NP-FZ100 Battery Pair', 'baterias fz100 k&f concept': 'K&F Concept NP-FZ100 Battery Pair', 'bateria neewer fz100 usb c': 'Neewer NP-FZ100 USB-C Battery', 'baterias smallrig fz100': 'SmallRig NP-FZ100 Battery Pair',
  'neewer fz100 charger + batteries': 'Neewer NP-FZ100 Batteries + Charger', 'powerbank neewer fz100': 'Neewer NP-FZ100 Power Bank', 'battery case para sony fz100': 'Sony NP-FZ100 Battery Case',
  'baterias kastar jvc-ssl70': 'Kastar JVC SSL-70 Battery', 'cargador kastar jvc-ssl70': 'Kastar JVC SSL-70 Charger', 'kit kastar vbg-260': 'Kastar VBG-260 Battery Kit', 'cable 90w 19v 4.73a': '90W 19V Laptop Power Cable',
  'lente canon rf 50mm f1.8': 'Canon RF 50mm f/1.8 STM Lens', 'sony fx30 (nueva)': 'Sony FX30 Cinema Camera', 'equate lens cleaner liquid x 3': 'Lens Cleaner Fluid (3 pack)', 'kit de limpieza de cámaras': 'Camera Cleaning Kit',
  'microfono fifine para leon': 'Fifine USB Microphone', 'microphone shield': 'Microphone Isolation Shield', 'calibrite color checker': 'Calibrite ColorChecker', 'filtro nd para matte box': '4x5.65 ND Filter for Matte Box',
  'filtro nd + cpl variable neewer 67mm': 'Neewer 67mm Variable ND + CPL Filter', 'k&f concept filtro nd 58mm': 'K&F Concept 58mm ND Filter', 'adaptador kf concept ef a rf': 'K&F Concept EF to RF Adapter',
  'kit para osmo nano': 'DJI Osmo Nano Accessory Kit', 'maleta para osmo pocket 3': 'DJI Osmo Pocket 3 Hard Case', 'osmo pocket 3 silicone case rojo': 'DJI Osmo Pocket 3 Silicone Case (Red)', 'cell phone holder para dji om pocket 3': 'DJI Osmo Pocket 3 Phone Holder',
  'handgrip para ronin rs2': 'Handgrip for DJI Ronin RS2', 'neewer dual handle para ronin sc': 'Neewer Dual Handle for DJI Ronin SC', 'zhiyun weebill s plate': 'Zhiyun Weebill S Quick Release Plate',
  'sony a7 ii rubber viewfinder': 'Sony a7 II Viewfinder Eyecup', 'sony a7 ii sd door': 'Sony a7 II SD Card Door', 'sony a7ii silicone cover': 'Sony a7 II Silicone Cover', 'sony a7riii silicone cases': 'Sony a7R III Silicone Case',
  'sony a7riv silicone case black': 'Sony a7R IV Silicone Case (Black)', 'sony a7v silicone case roja': 'Sony a7 V Silicone Case (Red)', 'sony a7 v silicone case': 'Sony a7 V Silicone Case (Black)',
  'canon 5d mark iv silicone cover': 'Canon 5D Mark IV Silicone Cover', 'silicone cover para canon 5d3': 'Canon 5D Mark III Silicone Cover', 'canon 600d silicone case amarillo': 'Canon 600D Silicone Case (Yellow)',
  'canon 70d silicon case camo': 'Canon 70D Silicone Case (Camo)', 'canon 70d silicon case red': 'Canon 70D Silicone Case (Red)', 'canon 24-105mm ii zoom rubber': 'Canon 24-105mm II Zoom Ring Rubber', 'canon 24-105mm ii focus rubber': 'Canon 24-105mm II Focus Ring Rubber',
  'case para samsung s25 fe': 'Samsung S25 FE Case', 'dji om4 brand new': 'DJI Osmo Mobile 4', 'dji om4 se brand new': 'DJI Osmo Mobile 4 SE', 'dji osmo mobile 2 (sellado)': 'DJI Osmo Mobile 2', 'zhiyun weebill 3 brand new': 'Zhiyun Weebill 3',
  'feiyu scorp c': 'Feiyutech Scorp C', 'feiyutech vimble 2 (junio)': 'Feiyutech Vimble 2', 'magic arm + super clamp': 'Magic Arm + Super Clamp Kit', 'side handle': 'Side Handle', 'wood side handle': 'Wooden Side Handle',
  'hdmi recorder kit': 'HDMI Recorder Kit', 'selfie stick 3m': '3m Selfie Stick', 'flash bracket': 'Flash Bracket', 'quantum mod fw12': 'Quantum FW12 Module', 'quantum qf91c radio': 'Quantum QF91C Radio', 'satechi mac mini hub': 'Satechi Mac Mini Hub',
  'zhiyun cinepeer cx100': 'Zhiyun Cinepeer CX100', 'ritz gear 64gb v60 sd card': 'Ritz Gear 64GB V60 SD Card', 'dji mic 2 (1tx + 1rx)': 'DJI Mic 2 (1 TX + 1 RX)', 'dji mic mini (2 tx + 1 rx)': 'DJI Mic Mini (2 TX + 1 RX)',
  'godox propac pb60': 'Godox PB960 Propac Power Pack', 'sony hvl-f60m flash': 'Sony HVL-F60M Flash', 'godox x3 pro': 'Godox X3 Pro Trigger (Canon)', 'godox x3 pro para sony': 'Godox X3 Pro Trigger (Sony)', 'godox it30 pro para canon': 'Godox iT30 Pro Flash (Canon)',
  'neewer fl-10 flashlight': 'Neewer FL-10 Flashlight', 'godox ad-15s cover': 'Godox AD-15S Cover', 'godox s2 bracket': 'Godox S2 Speedlite Bracket', 'godox c26 charger': 'Godox C26 Charger',
};
/* ---- Spanish display name -------------------------------------------------
   The site is in Spanish. Everything above and below classifies on the English
   canonical name (the brand and category rules, and the image harvester's
   search queries, are written against it); the name a customer reads is made
   here from that English name. ES holds the names no rule fits; RULES move the
   English head noun to the front, Spanish order: "Jaula Sony FX30". */
const ES = {
  'RGB LED Tube Light 30cm': 'Tubo LED RGB 30 cm', 'RGB LED Tube Light 50cm': 'Tubo LED RGB 50 cm', 'Ulanzi 50cm RGB LED Tube Light': 'Tubo LED RGB Ulanzi 50 cm',
  'Magic Arm + Super Clamp Kit': 'Kit brazo mágico + súper clamp', 'Camera Super Clamp': 'Súper clamp para cámara',
  'Sony FX30 Cage + Top Handle': 'Jaula Sony FX30 + asa superior', 'Top Handle Grip': 'Asa superior', 'Side Handle': 'Asa lateral',
  'Wooden Side Handle': 'Asa lateral de madera', 'Mini Side Handle SmallRig': 'Mini asa lateral SmallRig', 'Side Handle for Canon R50V': 'Asa lateral para Canon R50V',
  'SmallRig Side Handle with Shutter Trigger': 'Asa lateral SmallRig con disparador', 'Neewer Dual Handle for DJI Ronin SC': 'Asa doble Neewer para DJI Ronin SC',
  'Handgrip for DJI Ronin RS2': 'Empuñadura para DJI Ronin RS2',
  '30cm Mini-Bowens Lantern Softbox': 'Softbox linterna Mini-Bowens 30 cm', '30cm Mini-Bowens Octa Softbox': 'Softbox octagonal Mini-Bowens 30 cm',
  'Triopo 65cm Speedlite Softbox': 'Softbox Triopo 65 cm para speedlite', 'Ulanzi Mini-Bowens Softbox': 'Softbox Mini-Bowens Ulanzi',
  'Bowens Snoot Optical Condenser': 'Snoot óptico condensador Bowens', 'Studio Backdrop 20ft x 10ft': 'Fondo de estudio de 20 x 10 pies',
  '2m Light Stand': 'Trípode para luces de 2 m', '3m Selfie Stick': 'Bastón selfie de 3 m', 'Gimbal Base Plate': 'Base para gimbal', 'Gimbal Tripod (Large)': 'Trípode para gimbal (grande)',
  'Canon 24-105mm II Zoom Ring Rubber': 'Goma del anillo de zoom Canon 24-105mm II', 'Canon 24-105mm II Focus Ring Rubber': 'Goma del anillo de enfoque Canon 24-105mm II',
  'Canon 70-200mm f/2.8L Ring Rubber': 'Goma de anillo Canon 70-200mm f/2.8L', 'Canon 70-200mm f/2.8L Tripod Collar': 'Collarín para trípode Canon 70-200mm f/2.8L',
  'HDMI Recorder Kit': 'Kit grabador HDMI', 'L Bracket': 'Soporte en L', 'ProMediaGear Bracket': 'Soporte en L ProMediaGear', 'Flash Bracket': 'Soporte para flash',
  'Godox S2 Speedlite Bracket': 'Soporte Godox S2 para speedlite',
  'Neewer 67mm Variable ND + CPL Filter': 'Filtro ND variable + CPL Neewer 67mm', 'Neewer True Colors 58mm ND + CPL': 'Filtro ND + CPL Neewer True Colors 58mm',
  'Neewer True Colors 67mm ND + CPL Filter': 'Filtro ND + CPL Neewer True Colors 67mm', 'K&F Concept 58mm ND Filter': 'Filtro ND K&F Concept 58mm',
  '4x5.65 ND Filter for Matte Box': 'Filtro ND 4x5.65 para matte box', 'SmallRig Filters Kit': 'Kit de filtros SmallRig',
  'Neewer NP-FZ100 Power Bank': 'Power bank Neewer NP-FZ100', 'Phone LED Clip Light': 'Luz LED de clip para celular', 'Phone LED Panel Light': 'Panel LED para celular',
  '90W 19V Laptop Power Cable': 'Cable de corriente 90W 19V para laptop', 'Camera Cleaning Kit': 'Kit de limpieza para cámara', 'Camera Thread Adapter Set': 'Set de roscas para cámara',
  'Canon M50 Shutter Motor': 'Motor de obturador Canon M50', 'DJI Osmo Nano Accessory Kit': 'Kit de accesorios DJI Osmo Nano', 'DJI Osmo Pocket 3 Hard Case': 'Estuche rígido DJI Osmo Pocket 3',
  'DJI Osmo Pocket 3 Phone Holder': 'Soporte para celular DJI Osmo Pocket 3', 'Godox AD-15S Cover': 'Cubierta Godox AD-15S', 'Lens Cleaner Fluid (3 pack)': 'Líquido limpiador de lentes (paquete de 3)',
  'Minifocus Monitor Mount': 'Soporte para monitor Minifocus', 'Presonus HD9 Headphones': 'Audífonos Presonus HD9', 'Ritz Gear 64GB V60 SD Card': 'Tarjeta SD Ritz Gear 64GB V60',
  'Sigma USB Dock UD01': 'Dock USB Sigma UD01', 'Sunset Projection Lamp': 'Lámpara de proyección atardecer', 'Triple Cold Shoe': 'Zapata fría triple', 'Ulanzi CU01 Fan Cooler': 'Ventilador Ulanzi CU01',
  'VRIG Rotating Tripod Ring': 'Anillo giratorio para trípode VRIG', '100W COB Light + Softbox Kit': 'Kit luz COB 100W + softbox', "Alvin's Cables HDMI to Micro HDMI Cable": "Cable HDMI a Micro HDMI Alvin's Cables",
  'Canon Battery Cover': 'Tapa de batería Canon', 'DJI Mic 2 Camera Adapter': 'Adaptador de cámara DJI Mic 2', 'Godox PB960 Propac Power Pack': 'Batería externa Godox PB960 Propac',
  'K&F Concept Matte Box': 'Matte box K&F Concept', 'Neewer Mini Matte Box': 'Mini matte box Neewer', 'Llano Dual Battery Charger': 'Cargador doble Llano',
  'Microphone Isolation Shield': 'Pantalla de aislamiento para micrófono', 'Neewer FL-10 Flashlight': 'Linterna Neewer FL-10', 'Quantum FW12 Module': 'Módulo Quantum FW12',
  'Quantum QF91C Radio': 'Radio Quantum QF91C', 'Samsung S25 FE Case': 'Funda Samsung S25 FE', 'Satechi Mac Mini Hub': 'Hub Satechi para Mac Mini',
  'Sony a7 II SD Card Door': 'Tapa de tarjeta SD Sony a7 II', 'Sony a7 II Viewfinder Eyecup': 'Ocular del visor Sony a7 II',
  'Zhiyun Weebill S Quick Release Plate': 'Placa de liberación rápida Zhiyun Weebill S', 'Fifine USB Microphone': 'Micrófono USB Fifine', 'Sony FX30 Cinema Camera': 'Cámara de cine Sony FX30',
  'Canon RF 50mm f/1.8 STM Lens': 'Lente Canon RF 50mm f/1.8 STM', 'Zhiyun Weebill 2 Special Edition': 'Zhiyun Weebill 2 Edición Especial',
  'Feiyutech Scorp Mini 3 Smartphone Version': 'Feiyutech Scorp Mini 3 (versión smartphone)', 'Sony NP-FZ100 Battery Case': 'Estuche para baterías Sony NP-FZ100',
};
/* [English pattern, Spanish, gender of the Spanish head: 'm' | 'f'] — first match wins, so longer heads come first. */
const RULES = [
  [/^(.+?) to (.+?) Adapter( V2)?$/, (m) => `Adaptador ${m[1]} a ${m[2]}${m[3] || ''}`, 'm'],
  [/^(.+?) Battery Pair \+ Charger$/, (m) => `Par de baterías ${m[1]} + cargador`, 'm'],
  [/^(.+?) Battery Pair$/, (m) => `Par de baterías ${m[1]}`, 'm'],
  [/^(.+?) Batteries \+ Charger$/, (m) => `Baterías ${m[1]} + cargador`, 'f'],
  [/^(.+?) Battery Kit$/, (m) => `Kit de baterías ${m[1]}`, 'm'],
  [/^(.+?) Battery Grip$/, (m) => `Grip de batería ${m[1]}`, 'm'],
  [/^(.+?) Battery$/, (m) => `Batería ${m[1]}`, 'f'],
  [/^(.+?) Charger$/, (m) => `Cargador ${m[1]}`, 'm'],
  [/^(.+?) Cage with (.+)$/, (m) => `Jaula ${m[1]} con ${m[2]}`, 'f'],
  [/^(.+?) Cage$/, (m) => `Jaula ${m[1]}`, 'f'],
  [/^(.+?) Silicone (?:Case|Cover)$/, (m) => `Funda de silicona ${m[1]}`, 'f'],
  [/^(.+?) COB Video Light$/, (m) => `Luz de video COB ${m[1]}`, 'f'],
  [/^(.+?) RGB COB Light$/, (m) => `Luz COB RGB ${m[1]}`, 'f'],
  [/^(.+?) COB Light$/, (m) => `Luz COB ${m[1]}`, 'f'],
  [/^(.+?) RGB Light$/, (m) => `Luz RGB ${m[1]}`, 'f'],
  [/^(.+?) Light$/, (m) => `Luz ${m[1]}`, 'f'],
  [/^(.+?) Softbox \+ Grid$/, (m) => `Softbox ${m[1]} + rejilla`, 'm'],
  [/^(\d+cm) (.+?) Softbox$/, (m) => `Softbox ${m[2]} ${m[1]}`, 'm'],
  [/^(.+?) Softbox$/, (m) => `Softbox ${m[1]}`, 'm'],
  [/^(.+?) Monitor Kit$/, (m) => `Kit monitor ${m[1]}`, 'm'],
  [/^(.+?) Monitor$/, (m) => `Monitor ${m[1]}`, 'm'],
  [/^(.+?) Top Handle$/, (m) => `Asa superior ${m[1]}`, 'f'],
  [/^(.+?) Side Handle$/, (m) => `Asa lateral ${m[1]}`, 'f'],
  [/^(.+?) Magic Arm$/, (m) => `Brazo mágico ${m[1]}`, 'm'],
  [/^(.+?) Super Clamp$/, (m) => `Súper clamp ${m[1]}`, 'm'],
  [/^(.+?) Lens Hood$/, (m) => `Parasol ${m[1]}`, 'm'],
  [/^(.+?) Trigger$/, (m) => `Disparador ${m[1]}`, 'm'],
  [/^(.+?) Flash$/, (m) => `Flash ${m[1]}`, 'm'],
  [/^(.+?) Kit$/, (m) => `Kit ${m[1]}`, 'm'],
];
const COLOUR = { Red: ['rojo', 'roja'], Black: ['negro', 'negra'], Yellow: ['amarillo', 'amarilla'], White: ['blanco', 'blanca'], Camo: ['camuflaje', 'camuflaje'] };
function spanish(en) {
  if (ES[en]) return ES[en];
  // A trailing "(Red)" or "(Canon)" rides along; colours agree with the Spanish head.
  const pm = en.match(/^(.+?) \(([^)]+)\)$/);
  const base = pm ? pm[1] : en, qual = pm ? pm[2] : '';
  let out = base, gender = 'm';
  for (const [re, to, g] of RULES) { const m = base.match(re); if (m) { out = to(m); gender = g; break; } }
  if (qual) out += ` (${COLOUR[qual] ? COLOUR[qual][gender === 'f' ? 1 : 0] : qual})`;
  return out.replace(/\b(\d+)cm\b/g, '$1 cm').replace(/\s+/g, ' ').trim();
}

/* Category corrections keyed by final name. */
const CAT_FIX = {
  'Speedlite to Bowens Adapter': 'modifiers', 'Speedlite to Bowens Adapter V2': 'modifiers', 'Godox Speedlite to Elinchrom Adapter': 'modifiers', 'Flash Bracket': 'modifiers', 'Godox S2 Speedlite Bracket': 'modifiers', '2m Light Stand': 'modifiers', 'Studio Backdrop 20ft x 10ft': 'modifiers',
  'Canon RF 50mm f/1.8 STM Lens': 'cameras', 'Lens Cleaner Fluid (3 pack)': 'care', 'Camera Cleaning Kit': 'care', 'Calibrite ColorChecker': 'accessories', 'Satechi Mac Mini Hub': 'accessories', 'Ritz Gear 64GB V60 SD Card': 'accessories', '4x5.65 ND Filter for Matte Box': 'adapters',
  'DJI Osmo Nano Accessory Kit': 'rigs', 'DJI Osmo Pocket 3 Hard Case': 'care', 'DJI Osmo Pocket 3 Silicone Case (Red)': 'care', 'DJI Osmo Pocket 3 Phone Holder': 'rigs', 'Gimbal Tripod (Large)': 'rigs', 'Gimbal Base Plate': 'rigs', 'Zhiyun Weebill S Quick Release Plate': 'rigs',
  'Canon 70-200mm f/2.8L Tripod Collar': 'rigs', 'Puluz Side Handle': 'rigs', 'Puluz Sony a6000 Cage': 'rigs', 'Samsung S25 FE Case': 'care', 'Sony NP-FZ100 Battery Case': 'power', 'Presonus HD9 Headphones': 'audio', 'Microphone Isolation Shield': 'audio',
  'Vello BG-S3 Battery Grip': 'power', 'Vello BG-S7 Battery Grip': 'power', 'GoPro Hero 7 Battery': 'power', 'Sunset Projection Lamp': 'lighting', 'Godox PB960 Propac Power Pack': 'lighting', 'Handgrip for DJI Ronin RS2': 'rigs', 'Neewer Dual Handle for DJI Ronin SC': 'rigs', 'Zhiyun Cinepeer CX100': 'accessories',
};
/* Brands that also name the camera an accessory FITS. Only credited as the
   maker when the item is a genuine OEM part. */
const FIT_BRANDS = ['Sony', 'Canon', 'Samsung', 'GoPro', 'Apple', 'JVC'];
const OEM = /\blens\b|\bflash\b|lens hood|fx30|rf 50mm|battery cover|shutter motor|sd card door|eyecup|np-fw50 charger|lp-e17 battery|hvl-|canon e[tw]-/i;

/* ---- brand & category -------------------------------------------------- */
const BRANDS = ['DJI', 'Zhiyun', 'Feiyutech', 'Moza', 'Hollyland', 'Godox', 'Neewer', 'SmallRig', 'Ulanzi', 'Viltrox', 'Feelworld', 'Colbor', 'Tolifo', 'Triopo', 'Kastar', 'Andycine', 'Sirui', 'Nitze', 'Puluz', 'K&F Concept', '7artisans', 'Fusnid', 'Sony', 'Canon', 'Sigma', 'Vello', 'Quantum', 'Calibrite', 'Satechi', 'Presonus', 'Fifine', 'Soonpho', 'Manbily', 'MIAOTU', 'Ambitful', 'Llano', 'ProMediaGear', 'Ritz Gear', "Alvin's Cables", 'Minifocus', 'VRIG', 'GoPro', 'Equate', 'Samsung', 'Apple', 'Frainer'];
function brand(name) {
  const l = name.toLowerCase();
  for (const b of BRANDS) if (!FIT_BRANDS.includes(b) && l.includes(b.toLowerCase())) return b;
  for (const b of FIT_BRANDS) if (l.includes(b.toLowerCase()) && OEM.test(name)) return b;
  if (/\bosmo\b|\bronin\b|\bRS[24]\b|\bOM[45]\b/i.test(name)) return 'DJI';
  if (/\bsmooth\b|\bweebill\b|\bcrane\b|\bmolus\b|\bcinepeer\b/i.test(name)) return 'Zhiyun';
  if (/\bscorp\b|\bvimble\b|\bak2000/i.test(name)) return 'Feiyutech';
  if (/\baircross\b/i.test(name)) return 'Moza';
  if (/\blark\b/i.test(name)) return 'Hollyland';
  return '';
}
const CATS = [
  ['gimbals', 'Gimbals & Stabilizers', /osmo mobile|smooth|weebill|crane|scorp|vimble|ak2000|aircross|ronin|rs4|cinepeer cq|osmo pocket|osmo nano|gimbal/i],
  ['lighting', 'Studio Lighting', /light\b|\bluz\b|led bar|led panel|led clip|colbor|tolifo|zgrl|zu80|molus|manbily|miaotu|hb80c|flash|speedlite|speedlight|propac|x3 pro|it30|quantum|sunset lamp|fl-10|ad-15s/i],
  ['modifiers', 'Softboxes & Modifiers', /softbox|snoot|lantern|octa|bowens|backdrop|tripod for lights|flash bracket|s2 bracket|grid/i],
  ['audio', 'Audio', /lark|dji mic|microphone|headphones|fifine|mic mini|mic 2/i],
  ['monitors', 'Monitors & Recording', /monitor|feelworld|andycine a6|hdmi|viltrox dc|recorder/i],
  ['rigs', 'Cages, Rigs & Support', /cage|top handle|side handle|l bracket|magic arm|super clamp|matte box|handgrip|dual handle|base for gimbal|tripod for gimbal|rotating ring|cold shoe|phone holder|battery grip|promediagear|fan cooler|selfie stick|bracket|plate|thread adapter|osmo pocket 3|hard case|kit for osmo/i],
  ['adapters', 'Lens Adapters & Filters', /adapter|filter|lens hood|lens\b|usb dock|color checker|nd\b|cpl/i],
  ['power', 'Batteries & Power', /batter|charger|powerbank|cable|kastar|np-|fz100|lp-e|fw-50|vbg-260|ssl70/i],
  ['care', 'Camera Care & Cases', /silicone|rubber|cleaning|cleaner|sd door|viewfinder|battery cover|shutter motor|case|sd card|hub/i],
  ['cameras', 'Cameras & Lenses', /cinema camera|\blens$/i],
];
function category(name) {
  if (CAT_FIX[name]) return { id: CAT_FIX[name], label: CATS.find((x) => x[0] === CAT_FIX[name])?.[1] || 'Accessories' };
  if (/silicone|hard case|cleaning|cleaner|rubber|eyecup|sd card door/i.test(name)) return { id: 'care', label: 'Camera Care & Cases' };
  for (const [id, label, re] of CATS) if (re.test(name)) return { id, label };
  return { id: 'accessories', label: 'Accessories' };
}
/* Classification runs on the English ids above; the sheet and the site use
   these Spanish ids (they appear in ?cat= links) and labels. */
const CAT_ES = {
  gimbals: ['gimbals', 'Gimbals y estabilizadores'], lighting: ['iluminacion', 'Iluminación de estudio'], modifiers: ['modificadores', 'Softboxes y modificadores'],
  audio: ['audio', 'Audio'], monitors: ['monitores', 'Monitores y grabación'], rigs: ['rigs', 'Jaulas, rigs y soportes'], adapters: ['adaptadores', 'Adaptadores y filtros'],
  power: ['energia', 'Baterías y energía'], care: ['cuidado', 'Cuidado y fundas'], cameras: ['camaras', 'Cámaras y lentes'], accessories: ['accesorios', 'Accesorios'],
};
const slugify = (s) => s.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase().replace(/&/g, 'and').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

/* ---- fold lots into products ------------------------------------------ */
const map = new Map();
for (const r of rows) {
  const raw = r[0].trim();
  if (!raw || r.slice(1, 8).every((c) => !c || c === '$0.00')) continue; // month separators
  if (/^(enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|octubre|noviembre|diciembre)$/i.test(raw)) continue;
  const name = english(raw);
  const key = name.toLowerCase();
  const e = map.get(key) || { name, raw: new Set(), lots: 0, stock: 0, price: [], sold: 0, isNew: false };
  e.raw.add(raw); e.lots++; e.stock += Number(r[1]) || 0; if (money(r[7])) e.price.push(money(r[7])); e.sold += Number(r[8] || 0);
  if (/brand new|nueva|sellado/i.test(raw)) e.isNew = true;
  map.set(key, e);
}

const overrides = fs.existsSync(OVERRIDES) ? JSON.parse(fs.readFileSync(OVERRIDES, 'utf8')) : {};
const products = [];
// id   = the English slug: the stable key for images (assets/products/<id>/),
//        overrides and the harvester. Never shown, never changes.
// slug = the Spanish slug: the URL, productos/<slug>.html.
const seen = new Set(), seenSlug = new Set();
for (const e of map.values()) {
  const c = category(e.name);
  let id = slugify(e.name); while (seen.has(id)) id += '-2'; seen.add(id);
  const o = overrides[id] || {};
  const catEn = o.category && CAT_ES[o.category] ? o.category : c.id;
  const [catId, catLabel] = CAT_ES[catEn] || CAT_ES.accessories;
  const name = o.name || spanish(e.name);
  let slug = slugify(name); while (seenSlug.has(slug)) slug += '-2'; seenSlug.add(slug);
  products.push({
    id, slug, name, nameEn: e.name, brand: o.brand ?? brand(e.name), category: catId, categoryLabel: catLabel,
    price: o.price ?? e.price.at(-1) ?? null, stock: e.stock, status: e.stock > 0 ? 'in-stock' : 'sold-out',
    condition: o.condition || (e.isNew ? 'Nuevo, sellado' : ''),
    tagline: o.tagline || '', description: o.description || '', specs: o.specs || [], featured: !!o.featured,
    tags: o.tags || [], images: [], lots: e.lots, sold: e.sold, ledgerNames: [...e.raw],
  });
}
products.sort((a, b) => (b.featured - a.featured) || ((b.stock > 0) - (a.stock > 0)) || b.lots - a.lots || a.name.localeCompare(b.name, 'es'));
const categories = Object.values(CAT_ES).map(([id, label]) => ({ id, label }));
fs.writeFileSync(OUT, JSON.stringify({ generated: new Date().toISOString().slice(0, 10), categories, products }, null, 2));
const byCat = {}; for (const p of products) byCat[p.category] = (byCat[p.category] || 0) + 1;
console.log(products.length, 'products', JSON.stringify(byCat));
console.log('no brand:', products.filter((p) => !p.brand).map((p) => p.name).join(' | '));
