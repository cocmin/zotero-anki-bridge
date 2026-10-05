const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const Core=require('../addon/lib/core.js');
const Adapter=require('../addon/lib/adapter.js');
const bootstrapSource=fs.readFileSync(path.join(__dirname,'../addon/bootstrap.js'),'utf8');
function setup(initializationPromise=Promise.resolve()) {
  const registered=[],unregistered=[],loads=[];
  const Zotero={initializationPromise,Reader:{
    registerEventListener:(...args)=>registered.push(args),
    unregisterEventListener:(...args)=>unregistered.push(args)
  }};
  const Services={scriptloader:{loadSubScript:(uri,scope)=>{
    loads.push({uri,scope});
    assert.equal(scope.Zotero,Zotero);
    assert.equal(typeof scope.setTimeout,'function');
    if(uri.endsWith('core.js')) scope.ZoteroAnkiBridgeCore=Core;
    else if(uri.endsWith('adapter.js')) scope.ZoteroAnkiBridgeAdapter=Adapter;
    else throw new Error('Unexpected load '+uri);
  }}};
  const ChromeUtils={importESModule:(uri)=>{
    assert.equal(uri,'resource://gre/modules/Timer.sys.mjs');
    return {setTimeout,clearTimeout};
  }};
  const boot=new Function('Zotero','Services','ChromeUtils',bootstrapSource+'\nreturn {startup,shutdown};')(Zotero,Services,ChromeUtils);
  return {boot,registered,unregistered,loads};
}
test('starts packaged scripts and activates the public selection event',async()=>{
  const s=setup();await s.boot.startup({id:'zotero-anki-bridge@local',rootURI:'jar:file:///bridge.xpi!/'},3);
  assert.equal(s.loads.length,2);
  assert.equal(s.loads[0].uri,'jar:file:///bridge.xpi!/lib/core.js');
  assert.equal(s.registered.length,1);
});
test('uses resourceURI when rootURI is absent and unloads its listener',async()=>{
  const s=setup();await s.boot.startup({id:'zotero-anki-bridge@local',resourceURI:{spec:'jar:file:///bridge.xpi!/'}},3);
  s.boot.shutdown({},4);
  assert.equal(s.loads.length,2);
  assert.equal(s.unregistered.length,1);
});
test('restarting the plugin does not leave duplicate listeners',async()=>{
  const s=setup();const data={id:'zotero-anki-bridge@local',rootURI:'jar:file:///bridge.xpi!/'};
  await s.boot.startup(data,3);await s.boot.startup(data,5);
  assert.equal(s.registered.length,2);
  assert.equal(s.unregistered.length,1);
  s.boot.shutdown({},4);
  assert.equal(s.unregistered.length,2);
});
test('shutdown during initialization cancels the pending startup',async()=>{
  let release;const ready=new Promise(resolve=>release=resolve);
  const s=setup(ready);
  const starting=s.boot.startup({id:'zotero-anki-bridge@local',rootURI:'jar:file:///bridge.xpi!/'},3);
  s.boot.shutdown({},4);release();await starting;
  assert.equal(s.registered.length,0);
  assert.equal(s.loads.length,0);
});
