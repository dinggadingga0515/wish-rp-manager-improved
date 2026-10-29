import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
const code=fs.readFileSync(process.argv[2],'utf8').replace(/^\uFEFF/,'');
const a=code.indexOf('  const AI_SUMMARY_PROVIDER_DEFAULTS'),b=code.indexOf('  const AI_VERTEX_OAUTH_URL',a);
const c=code.indexOf('  function refinerThinkingLevels(provider,model){'),d=code.indexOf('  function normalizeOpenAiEndpoint(',c);
assert.ok(a>0&&b>a&&c>0&&d>c);
const env={};vm.createContext(env);
vm.runInContext(code.slice(a,b)+'\n'+code.slice(c,d)+'\nthis.api={models:AI_SUMMARY_PROVIDER_MODELS,defaults:AI_SUMMARY_PROVIDER_DEFAULTS,payload:aiGeminiPayload,refiner:refinerThinkingLevels};',env);
let passed=0;
const check=(label,fn)=>{fn();console.log('PASS',label);passed++};
for(const provider of ['gemini','firebase','vertex'])check(provider+' Argon, 3.8 default',()=>{
assert.equal(env.api.models[provider].filter(x=>x.value==='gemini-4-argon').length,1);
assert.equal(env.api.defaults[provider].model,'gemini-3.8-flash');
});
for(const level of ['', 'low','medium','high'])check('Argon '+(level||'default'),()=>{
const cfg=env.api.payload('s','p',8192,{model:'gemini-4-argon',...(level?{thinkingLevel:level}:{})}).generationConfig;
assert.equal(cfg.thinkingConfig.thinkingLevel,(level||'medium').toUpperCase());
assert.equal(cfg.thinkingConfig.includeThoughts,false);assert.equal(cfg.temperature,undefined);
});
check('3.8 thinking preserved',()=>assert.equal(env.api.payload('s','p',8192,{model:'gemini-3.8-flash'}).generationConfig.thinkingConfig.thinkingLevel,'MEDIUM'));
check('2.5 default preserved',()=>assert.equal(env.api.payload('s','p',8192,{model:'gemini-2.5-flash'}).generationConfig.thinkingConfig,undefined));
check('refiner Argon preserved',()=>assert.deepEqual(Array.from(env.api.refiner('gemini','gemini-4-argon')),['low','medium','high']));
check('no duplicated Argon thinking branch',()=>assert.equal(code.includes("if (name === 'gemini-4-argon') return"),false));
check('version 0.17.30.2',()=>{assert.equal((code.match(/0\.17\.30\.2/g)||[]).length,5);assert.equal((code.match(/0\.17\.30\.1/g)||[]).length,0);});
assert.equal(passed,12);console.log('RESULT 12/12');
