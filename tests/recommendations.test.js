const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const html = fs.readFileSync('rintisusaha-mvp.html', 'utf8');
const source = html.split('<script type="text/babel">')[1].split('function App()')[0];
const context = vm.createContext({React: {}});
vm.runInContext(source, context);
const run = expression => vm.runInContext(expression, context);
test('known business scenarios provide a roadmap and checklist', () => {
  for (const id of ['packaged_food', 'catering', 'salon']) {
    const result = run(`generateRecommendations(DEMO_SCENARIOS.${id}.profile)`);
    assert.ok(result.roadmap.length > 0);
    assert.ok(result.checklist.length > 0);
  }
});
test('ambiguous drinks do not receive guessed KBLI codes', () => {
  const result = run('generateRecommendations(parseNaturalInput("Saya ingin jualan minuman"))');
  assert.equal(result.status, 'NEEDS_CLARIFICATION');
  assert.equal(result.kbliCandidates.length, 0);
});
test('unrecognized short businesses are not classified as drinks', () => {
  assert.equal(run('parseNaturalInput("jasa fotografi").category'), 'unverified_custom');
});
test('medical activity is routed for authority verification', () => {
  assert.equal(run('generateRecommendations(parseNaturalInput("klinik suntik kecantikan")).status'), 'UNVERIFIED_SCOPE');
});

function serviceIds(profileExpression, hasProfile = true) {
  return Array.from(run(`getRelevantServices(generateRecommendations(${profileExpression}), ${hasProfile}).map(service => service.id)`));
}
test('no portals before profiling or while clarification is required', () => {
  assert.deepEqual(serviceIds('DEMO_SCENARIOS.packaged_food.profile', false), []);
  assert.deepEqual(serviceIds('DEMO_SCENARIOS.ambiguous_drink.profile'), []);
});
test('packaged food gets SPP-IRT; changed production location switches to BPOM', () => {
  assert.deepEqual(serviceIds('DEMO_SCENARIOS.packaged_food.profile'), ['oss', 'sppirt', 'bpjph', 'pajak']);
  assert.deepEqual(serviceIds('{...DEMO_SCENARIOS.packaged_food.profile, productionLocation: "pabrik_terpisah"}'), ['oss', 'bpom_md', 'bpjph', 'pajak']);
});
test('catering does not get SPP-IRT; shared OSS portal retains SLHS preparation', () => {
  assert.deepEqual(serviceIds('DEMO_SCENARIOS.catering.profile'), ['oss', 'bpjph', 'pajak']);
  const services = run('getRelevantServices(generateRecommendations(DEMO_SCENARIOS.catering.profile), true)');
  assert.equal(services[0].steps.length, 2);
  assert.ok(services[0].steps.some(step => step.id === 'rule_slhs_catering'));
  assert.ok(services[0].prepareBeforeVisiting.length > 0);
});
test('salon excludes food portals; unsupported activity gets only verification referral', () => {
  assert.deepEqual(serviceIds('DEMO_SCENARIOS.salon.profile'), ['oss', 'pajak']);
  assert.deepEqual(serviceIds('DEMO_SCENARIOS.unverified_custom.profile'), ['oss']);
});

test('completion needs an explicit signal and no outstanding questions', () => {
  assert.equal(run('isRiriAnalysisComplete({complete:true,questions:[]}, DEMO_SCENARIOS.salon.profile)'), true);
  assert.equal(run('isRiriAnalysisComplete({questions:[]}, DEMO_SCENARIOS.salon.profile)'), false);
  assert.equal(run('isRiriAnalysisComplete({complete:true,questions:[{question:"Lokasinya?"}]}, DEMO_SCENARIOS.salon.profile)'), false);
  assert.equal(run('isRiriAnalysisComplete({complete:true,questions:[]}, DEMO_SCENARIOS.ambiguous_drink.profile)'), false);
});
test('completion uses the resolved profile after the final clarification', () => {
  assert.equal(run(`isRiriAnalysisComplete({complete:true,questions:[]}, {...DEMO_SCENARIOS.ambiguous_drink.profile,activityType:'produksi_kemasan',shelfLife:'serbuk_kering_awet',productionLocation:'dapur_rumah'})`), true);
});
test('Enter submits, Shift+Enter and IME composition do not', () => {
  const handle = run('handleChatEnter');
  let submissions = 0, prevented = 0;
  const submit = () => submissions++;
  const event = {key:'Enter', preventDefault:()=>prevented++, nativeEvent:{isComposing:false}};
  handle(event, submit);
  assert.equal(submissions, 1);
  assert.equal(prevented, 1);
  handle({...event, shiftKey:true}, submit);
  handle({...event, nativeEvent:{isComposing:true}}, submit);
  handle({...event, keyCode:229}, submit);
  handle({...event, key:'a'}, submit);
  assert.equal(submissions, 1);
  assert.equal(prevented, 1);
});
