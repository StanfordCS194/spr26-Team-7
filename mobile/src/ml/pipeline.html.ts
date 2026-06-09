// On-device port of the Python ML pipeline (ml/pipeline + ml/models).
//
// CLIP (zero-shot) handles routing + structured extraction and BLIP handles
// captioning, mirroring ml/models/classifier.py and ml/models/captioner.py.
// Everything runs client-side via transformers.js inside a WebView, so the app
// needs no separate Python/FastAPI server.
//
// The inner module script intentionally avoids backtick template literals so it
// can live inside this outer template string without escaping.

const TRANSFORMERS_CDN = 'https://cdn.jsdelivr.net/npm/@huggingface/transformers@3';
const CLIP_MODEL = 'Xenova/clip-vit-base-patch32';
const BLIP_MODEL = 'Xenova/blip-image-captioning-base';

const PIPELINE_SCRIPT = `
import { pipeline, env } from '${TRANSFORMERS_CDN}';

env.allowLocalModels = false;
env.backends.onnx.wasm.numThreads = 1;

function post(obj) {
  if (window.ReactNativeWebView) {
    window.ReactNativeWebView.postMessage(JSON.stringify(obj));
  }
}

let clip = null;
let blip = null;
let ready = false;

function loadProgress(which) {
  return function (p) {
    if (p && p.status === 'progress' && p.total) {
      post({ type: 'load', which: which, file: p.file, pct: Math.round((p.loaded / p.total) * 100) });
    }
  };
}

async function init() {
  try {
    post({ type: 'status', state: 'loading', detail: 'Loading vision model' });
    clip = await pipeline('zero-shot-image-classification', '${CLIP_MODEL}', { progress_callback: loadProgress('clip') });
    post({ type: 'status', state: 'loading', detail: 'Loading caption model' });
    blip = await pipeline('image-to-text', '${BLIP_MODEL}', { progress_callback: loadProgress('blip') });
    ready = true;
    post({ type: 'status', state: 'ready' });
  } catch (e) {
    post({ type: 'status', state: 'error', message: String(e && e.message ? e.message : e) });
  }
}

// --- CLIP helpers (mirror ml/models/classifier.py) ---

async function clipScores(image, texts) {
  // hypothesis_template '{}' passes raw text, matching the Python CLIPProcessor.
  const out = await clip(image, texts, { hypothesis_template: '{}' });
  const byLabel = new Map();
  for (const o of out) { byLabel.set(o.label, o.score); }
  return texts.map(function (t) { return byLabel.get(t); });
}

async function clipLabel(image, options) {
  const keys = Object.keys(options);
  const texts = keys.map(function (k) { return options[k]; });
  const scores = await clipScores(image, texts);
  let best = 0;
  for (let i = 1; i < scores.length; i++) { if (scores[i] > scores[best]) best = i; }
  return [keys[best], scores[best]];
}

async function clipBool(image, trueText, falseText) {
  const s = await clipScores(image, [trueText, falseText]);
  return s[0] > s[1];
}

async function caption(image) {
  const out = await blip(image, { max_new_tokens: 60 });
  return (out && out[0] && out[0].generated_text ? out[0].generated_text : '').trim();
}

function deUnderscore(value) { return String(value).replace(/_/g, ' '); }

// --- Router (mirror ml/pipeline/router.py) ---

const CATEGORIES = {
  pothole: 'damaged road surface with cracks, holes, or broken pavement',
  streetlight: 'a broken, dark, or malfunctioning street light or lamp post',
  encampment: 'a tent, makeshift shelter, or homeless encampment on public land',
  fireworks: 'fireworks packaging, fireworks debris, or evidence of illegal fireworks',
  sewer: 'a flooded street, open sewer, water main break, or drainage overflow',
  dumping: 'piles of garbage, construction debris, or trash illegally dumped in public',
  graffiti: 'graffiti, spray paint, or vandalism markings on a wall, fence, or structure',
  vehicle: 'an abandoned, damaged, or improperly parked vehicle on a city street',
};

async function route(image, topK) {
  const k = topK || 3;
  const texts = Object.keys(CATEGORIES).map(function (key) { return CATEGORIES[key]; });
  const textToKey = new Map();
  Object.keys(CATEGORIES).forEach(function (key) { textToKey.set(CATEGORIES[key], key); });
  const out = await clip(image, texts, { hypothesis_template: '{}' });
  const ranked = out.map(function (o) { return [textToKey.get(o.label), o.score]; });
  const alternatives = ranked.slice(1, k).map(function (pair) {
    return { category: pair[0], confidence: pair[1] };
  });
  return { top_category: ranked[0][0], confidence: ranked[0][1], alternatives: alternatives };
}

// --- Category stages (mirror ml/pipeline/stages/*.py) ---

const STAGES = {};

STAGES.pothole = {
  severities: {
    minor: 'a small crack or minor surface imperfection in the road',
    moderate: 'a moderately sized pothole or significant road damage',
    severe: 'a large, deep pothole or severely deteriorated road surface',
  },
  sizes: {
    small: 'a small pothole less than a foot across',
    medium: 'a medium-sized pothole roughly one to two feet across',
    large: 'a large pothole more than two feet across',
  },
  async extract(image) {
    const severity = (await clipLabel(image, this.severities))[0];
    const size = (await clipLabel(image, this.sizes))[0];
    const water = await clipBool(image, 'standing water or puddles in a road pothole', 'a dry road pothole with no standing water');
    return { severity: severity, approximate_size: size, water_present: water };
  },
  async describe(image, ex) {
    const scene = await caption(image);
    const parts = [
      'The image appears to show ' + ex.severity + ' road damage approximately ' + ex.approximate_size + ' in extent.',
      'Visual observation: ' + scene + '.',
    ];
    if (ex.water_present) parts.push('Standing water or puddles are visible within the damaged area, which may obscure the full depth of the damage.');
    parts.push('The system suggests this may qualify as a pothole or road damage report for the City of San Jose.');
    return parts.join(' ');
  },
};

STAGES.streetlight = {
  issueTypes: {
    outage: 'a completely dark or non-functioning street light',
    flickering: 'a flickering or intermittently working street light',
    damaged_fixture: 'a street light with a damaged, broken, or vandalized fixture',
    leaning_pole: 'a street light pole that is leaning, bent, or knocked over',
    exposed_wiring: 'a street light with exposed or dangerous wiring',
  },
  async extract(image) {
    const issue = (await clipLabel(image, this.issueTypes))[0];
    const daytime = await clipBool(image, 'a street light photographed during daytime with daylight visible', 'a street light photographed at night or in low light conditions');
    return { issue_type: issue, daytime_photo: daytime };
  },
  async describe(image, ex) {
    const scene = await caption(image);
    const parts = [
      'The image appears to show a ' + deUnderscore(ex.issue_type) + ' on a public street.',
      'Visual observation: ' + scene + '.',
    ];
    if (ex.daytime_photo) parts.push('The photo was taken during daytime; the outage or damage may be less immediately obvious but does not reduce the severity of the concern.');
    parts.push('The system suggests this may qualify as a streetlight outage or damage report for the City of San Jose.');
    return parts.join(' ');
  },
};

STAGES.encampment = {
  structureTypes: {
    tent: 'a camping tent or tarp used as a makeshift shelter',
    vehicle_dwelling: 'a vehicle being used as a dwelling or sleeping space',
    lean_to: 'a lean-to or improvised structure made from scavenged materials',
    sleeping_area: 'a sleeping bag, bedroll, or outdoor sleeping setup with no structure',
    established_camp: 'an established camp with multiple shelters and accumulated belongings',
  },
  sizes: {
    individual: 'a single-person encampment with one shelter or sleeping area',
    small_group: 'a small group encampment with a few shelters',
    large: 'a large encampment with many shelters and extensive belongings',
  },
  async extract(image) {
    const structure = (await clipLabel(image, this.structureTypes))[0];
    const size = (await clipLabel(image, this.sizes))[0];
    const trash = await clipBool(image, 'trash, garbage, or debris accumulated near a shelter or encampment', 'a campsite area with no visible trash or debris nearby');
    return { structure_type: structure, estimated_size: size, trash_nearby: trash };
  },
  async describe(image, ex) {
    const scene = await caption(image);
    const parts = [
      'The image appears to show a ' + deUnderscore(ex.estimated_size) + ' encampment with a ' + deUnderscore(ex.structure_type) + ' on public property.',
      'Visual observation: ' + scene + '.',
    ];
    if (ex.trash_nearby) parts.push('Trash or debris accumulation is visible near the encampment.');
    parts.push('The system suggests this may qualify as an encampment report for the City of San Jose.');
    return parts.join(' ');
  },
};

STAGES.fireworks = {
  evidenceTypes: {
    active_fireworks: 'fireworks being actively lit or mid-explosion',
    fireworks_debris: 'spent fireworks casings or remnants on the ground',
    fireworks_packaging: 'fireworks packaging, boxes, or unopened fireworks',
    burn_marks: 'burn marks or scorching on pavement or surfaces caused by fireworks',
  },
  async extract(image) {
    const evidence = (await clipLabel(image, this.evidenceTypes))[0];
    const residential = await clipBool(image, 'fireworks in a residential neighborhood or near homes and buildings', 'fireworks in an open field, park, or unpopulated outdoor area');
    return { evidence_type: evidence, in_residential_area: residential };
  },
  async describe(image, ex) {
    const scene = await caption(image);
    const parts = [
      'The image appears to show ' + deUnderscore(ex.evidence_type) + ' in a public area.',
      'Visual observation: ' + scene + '.',
    ];
    if (ex.in_residential_area) parts.push('The fireworks activity appears to be located in or near a residential neighborhood, which poses an elevated safety risk.');
    parts.push('The system suggests this may qualify as an illegal fireworks report for the City of San Jose.');
    return parts.join(' ');
  },
};

STAGES.sewer = {
  issueTypes: {
    flooding: 'a flooded street or sidewalk with standing water',
    water_main_break: 'a broken water main with water gushing from the ground or street',
    sewer_overflow: 'a sewer overflow or sewage backing up onto a street or sidewalk',
    drain_blockage: 'a blocked storm drain or clogged catch basin',
    open_manhole: 'an open, missing, or damaged manhole cover on a street',
  },
  async extract(image) {
    const issue = (await clipLabel(image, this.issueTypes))[0];
    const flooding = await clipBool(image, 'visible flooding, standing water, or water flowing across a road or sidewalk', 'a dry road or sidewalk with no visible water accumulation');
    return { issue_type: issue, flooding_visible: flooding };
  },
  async describe(image, ex) {
    const scene = await caption(image);
    const parts = [
      'The image appears to show a ' + deUnderscore(ex.issue_type) + ' on a public street or sidewalk.',
      'Visual observation: ' + scene + '.',
    ];
    if (ex.flooding_visible) parts.push('Visible flooding or standing water is present, which may pose a hazard to pedestrians and vehicles.');
    parts.push('The system suggests this may qualify as a sewer or water infrastructure report for the City of San Jose.');
    return parts.join(' ');
  },
};

STAGES.dumping = {
  materialTypes: {
    household_trash: 'bags of household garbage or trash illegally dumped',
    construction_debris: 'construction debris, wood, drywall, or building materials dumped illegally',
    furniture: 'furniture, mattresses, or large household items dumped illegally',
    electronics: 'electronics, appliances, or e-waste dumped illegally',
    yard_waste: 'yard waste, branches, or vegetation dumped illegally',
    mixed_debris: 'a mixed pile of various debris and trash dumped illegally',
  },
  volumes: {
    small: 'a small pile of trash that could fit in a few garbage bags',
    medium: 'a medium amount of illegally dumped material filling a pickup truck bed',
    large: 'a large amount of illegally dumped material requiring multiple truckloads',
  },
  async extract(image) {
    const material = (await clipLabel(image, this.materialTypes))[0];
    const volume = (await clipLabel(image, this.volumes))[0];
    const blocking = await clipBool(image, 'dumped material blocking a road, travel lane, or sidewalk', 'dumped material piled on the side of a road without blocking traffic');
    return { material_type: material, approximate_volume: volume, blocking_road_or_sidewalk: blocking };
  },
  async describe(image, ex) {
    const scene = await caption(image);
    const parts = [
      'The image appears to show a ' + ex.approximate_volume + ' amount of illegally dumped ' + deUnderscore(ex.material_type) + ' in a public area.',
      'Visual observation: ' + scene + '.',
    ];
    if (ex.blocking_road_or_sidewalk) parts.push('The dumped material appears to be blocking a road, lane, or sidewalk, creating a potential hazard.');
    parts.push('The system suggests this may qualify as an illegal dumping report for the City of San Jose.');
    return parts.join(' ');
  },
};

STAGES.graffiti = {
  surfaces: {
    painted_wall: 'graffiti on a painted wall',
    unpainted_wall: 'graffiti on a bare or unpainted wall',
    sidewalk: 'graffiti on a sidewalk or pavement',
    tree: 'graffiti carved or painted on a tree',
    wood_fence: 'graffiti on a wooden fence',
    chain_link_fence: 'graffiti on a chain link fence',
    utility_box: 'graffiti on an electrical or utility box',
    light_pole: 'graffiti on a street light pole',
    park_restroom: 'graffiti on a park restroom building',
    picnic_table: 'graffiti on a picnic table',
  },
  publicLikelihood: {
    park_restroom: 0.95, light_pole: 0.90, sidewalk: 0.90, picnic_table: 0.90,
    utility_box: 0.85, tree: 0.70, chain_link_fence: 0.70, painted_wall: 0.60,
    unpainted_wall: 0.55, wood_fence: 0.50,
  },
  async extract(image) {
    const surface = (await clipLabel(image, this.surfaces))[0];
    const onPublic = await clipBool(image, 'graffiti on public property or public infrastructure', 'graffiti on private property or a private building');
    const onHighway = await clipBool(image, 'graffiti on a state highway sign, overpass, or highway infrastructure', 'graffiti not on a state highway');
    const likelihood = this.publicLikelihood[surface] !== undefined ? this.publicLikelihood[surface] : 0.60;
    return { surface_type: surface, public_property_likelihood: likelihood, appears_on_public_property: onPublic, on_state_highway: onHighway };
  },
  async describe(image, ex) {
    const scene = await caption(image);
    const parts = [
      'The image appears to show graffiti markings on a ' + deUnderscore(ex.surface_type) + ' adjacent to a public area.',
      'Visual observation: ' + scene + '.',
    ];
    if (ex.appears_on_public_property) parts.push('The surface appears to be public property or public infrastructure.');
    if (ex.on_state_highway) parts.push('The graffiti may be located on or near state highway infrastructure.');
    parts.push('The system classifies this as a likely graffiti-related concern with ' + Math.round(ex.public_property_likelihood * 100) + '% estimated likelihood of being on public property.');
    return parts.join(' ');
  },
};

STAGES.vehicle = {
  types: {
    sedan: 'a sedan or coupe passenger car',
    pickup_truck: 'a pickup truck',
    suv: 'an SUV or crossover vehicle',
    van: 'a van or minivan',
    rv: 'an RV or motorhome',
    motorcycle: 'a motorcycle or scooter',
    commercial_truck: 'a commercial truck, semi-truck, or box truck',
  },
  colors: {
    white: 'a white vehicle', black: 'a black vehicle', gray: 'a gray or silver vehicle',
    red: 'a red vehicle', blue: 'a blue vehicle', green: 'a green vehicle',
    brown: 'a brown or tan vehicle', yellow: 'a yellow or gold vehicle',
    other: 'a vehicle of an unusual or unspecified color',
  },
  conditions: {
    poor: 'a heavily damaged, burned, or inoperable vehicle',
    fair: 'a vehicle with minor visible damage or wear',
    good: 'a vehicle in good overall condition',
  },
  concernTypes: {
    lived_in: 'a vehicle that appears to have someone living inside it',
    trash_sewage: 'trash or sewage accumulated around or near a vehicle',
    park_creek: 'a vehicle parked inside a park, along a creek, or on a trail',
    private_property: 'a vehicle parked on private property without permission',
    poor_condition: 'a vehicle in severely deteriorated condition on a city street',
    parking_violation: 'a vehicle parked in a prohibited or illegal location',
    criminal_activity: 'a vehicle involved in suspected criminal or illegal activity',
  },
  async extract(image) {
    const vtype = (await clipLabel(image, this.types))[0];
    const vcolor = (await clipLabel(image, this.colors))[0];
    const condition = (await clipLabel(image, this.conditions))[0];
    const concern = (await clipLabel(image, this.concernTypes))[0];
    const flatTires = await clipBool(image, 'a vehicle with flat, deflated, or missing tires', 'a vehicle with properly inflated tires');
    const trash = await clipBool(image, 'trash, garbage, or debris visible near a vehicle', 'a clean area with no trash near a vehicle');
    const livedIn = await clipBool(image, 'a vehicle with curtains, belongings, or clutter indicating habitation', 'an unoccupied parked vehicle with no signs of habitation');
    return {
      vehicle_type: vtype, vehicle_color: vcolor, condition: condition, concern_type: concern,
      possible_flat_tires: flatTires, trash_nearby: trash, appears_lived_in: livedIn,
    };
  },
  async describe(image, ex) {
    const scene = await caption(image);
    const parts = [
      'The image appears to show a ' + ex.vehicle_color + ' ' + deUnderscore(ex.vehicle_type) + ' on a public street.',
      'Visual observation: ' + scene + '.',
    ];
    if (ex.possible_flat_tires) parts.push('The vehicle appears to have one or more flat or significantly deflated tires.');
    if (ex.appears_lived_in) parts.push('There are visible signs that the vehicle may be inhabited.');
    if (ex.trash_nearby) parts.push('Trash or debris is visible in the vicinity of the vehicle.');
    if (ex.condition === 'poor') parts.push('The vehicle appears to be in poor or deteriorated condition.');
    parts.push('The system suggests this may qualify as a vehicle concern report for the City of San Jose.');
    return parts.join(' ');
  },
};

// --- Orchestrator (mirror ml/pipeline/orchestrator.py) ---

window.__mlClassify = async function (requestId, dataUrl) {
  try {
    if (!ready) { post({ type: 'error', requestId: requestId, message: 'Model not ready' }); return; }
    post({ type: 'progress', requestId: requestId, stage: 'router' });
    const routerResult = await route(dataUrl);
    const category = routerResult.top_category;
    const stage = STAGES[category];
    post({ type: 'progress', requestId: requestId, stage: 'extract', category: category });
    const extraction = await stage.extract(dataUrl);
    post({ type: 'progress', requestId: requestId, stage: 'describe', category: category });
    const description = await stage.describe(dataUrl, extraction);
    post({ type: 'result', requestId: requestId, data: { router: routerResult, category: category, extraction: extraction, description: description } });
  } catch (e) {
    post({ type: 'error', requestId: requestId, message: String(e && e.message ? e.message : e) });
  }
};

init();
`;

export const PIPELINE_HTML = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>CityFix ML</title>
</head>
<body>
<script type="module">${PIPELINE_SCRIPT}</script>
</body>
</html>`;
