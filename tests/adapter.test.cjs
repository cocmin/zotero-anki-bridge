const test=require('node:test');
const assert=require('node:assert/strict');
const Core=require('../addon/lib/core.js');
const Adapter=require('../addon/lib/adapter.js');

function element(tag) {
  return {tag,style:{},attributes:{},children:[],listeners:{},isConnected:true,disabled:false,textContent:'',
    setAttribute(name,value){this.attributes[name]=value;},
    appendChild(child){this.children.push(child);},
    addEventListener(name,handler){this.listeners[name]=handler;},
    remove(){this.removed=true;this.isConnected=false;}
  };
}
function setup(options={}) {
  const registered=[],unregistered=[],requests=[],rendered=[];
  const pref={
    'extensions.zotero.ZoteroPDFTranslate.translateSource':'customgpt1',
    'extensions.zotero.zodh.deckname':'文献单词',
    'extensions.zotero.zodh.typename':'问答题',
    'extensions.zotero.zodh.expression':'正面',
    'extensions.zotero.zodh.definitions':'背面',
    ...options.prefs
  };
  let translated=0;
  const Zotero={
    Prefs:{get:(key)=>pref[key]},
    Reader:{registerEventListener:(...args)=>registered.push(args),unregisterEventListener:(...args)=>unregistered.push(args)},
    HTTP:{request:async(method,url,init)=>{
      const payload=JSON.parse(init.body);requests.push({method,url,init,payload});
      if(options.http) return options.http(payload);
      const result=payload.action==='deckNames'?['文献单词']:payload.action==='modelFieldNames'?['正面','背面']:payload.action==='canAddNotes'?[true]:42;
      return {response:JSON.stringify({result,error:null})};
    }},
    PDFTranslate:options.missingTranslation?undefined:{data:{translate:{queue:options.queue||[]}},api:{translate:async(raw,opts)=>{
      translated++;
      if(options.translate) return options.translate(raw,opts);
      assert.equal(opts.pluginID,'zotero-anki-bridge@local');
      assert.equal(opts.itemID,12);
      assert.equal(opts.service,'customgpt1');
      return {raw,status:'success',result:'机制',itemId:opts.itemID,service:opts.service};
    }}},
  };
  const adapter=Adapter.createAdapter(Zotero,Core,{pluginID:'zotero-anki-bridge@local',timeoutMs:50,pollMs:1});
  function select(text='mechanism',itemID=12) {
    const event={reader:{itemID},params:{annotation:{text}},doc:{createElementNS:(_,tag)=>element(tag)},append:node=>rendered.push(node)};
    registered[0][1](event);
    const root=rendered.at(-1);
    return {root,button:root?.children[0],status:root?.children[1],event};
  }
  return {adapter,registered,unregistered,requests,rendered,select,translations:()=>translated};
}
test('registers exactly one Zotero 10 selection listener and removes it on stop',()=>{
  const s=setup();s.adapter.start();s.adapter.start();
  assert.equal(s.registered.length,1);
  assert.equal(s.registered[0][0],'renderTextSelectionPopup');
  assert.equal(s.registered[0][2],'zotero-anki-bridge@local');
  s.adapter.stop();
  assert.equal(s.unregistered.length,1);
  assert.equal(s.unregistered[0][1],s.registered[0][1]);
});
test('selection alone does not add a note; click calls the translator and adds once',async()=>{
  const s=setup();s.adapter.start();const ui=s.select();
  assert.equal(ui.button.textContent,'＋ 加入 Anki');
  assert.equal(s.requests.length,0);
  await ui.button.listeners.click({preventDefault(){},stopPropagation(){}});
  assert.equal(ui.button.textContent,'✓ 已加入 Anki');
  assert.equal(ui.button.disabled,true);
  assert.equal(s.translations(),1);
  const add=s.requests.find(x=>x.payload.action==='addNote');
  assert.equal(add.method,'POST');
  assert.equal(add.url,'http://127.0.0.1:8765');
  assert.equal(add.payload.version,6);
  assert.equal(add.payload.params.note.fields['背面'],'机制');
});
test('button captures the clicked word instead of a later changing selection',async()=>{
  const s=setup();s.adapter.start();const ui=s.select();
  ui.event.params.annotation.text='another';
  await ui.button.listeners.click({preventDefault(){},stopPropagation(){}});
  assert.equal(s.requests.find(x=>x.payload.action==='addNote').payload.params.note.fields['正面'],'mechanism');
});
test('reuses matching DeepSeek output and ignores later dictionary output',async()=>{
  const s=setup({queue:[
    {type:'text',raw:'mechanism',itemId:12,service:'customgpt1',status:'success',result:'已显示的译文'},
    {type:'text',raw:'mechanism',itemId:12,service:'cambridgedict',status:'success',result:'词典释义'}
  ]});s.adapter.start();const ui=s.select();
  await ui.button.listeners.click({preventDefault(){},stopPropagation(){}});
  assert.equal(s.translations(),0);
  assert.equal(s.requests.find(x=>x.payload.action==='addNote').payload.params.note.fields['背面'],'已显示的译文');
});
test('connection failure remains visible and allows retry',async()=>{
  const s=setup({http:async()=>{throw new Error('socket failure');}});s.adapter.start();const ui=s.select();
  await ui.button.listeners.click({preventDefault(){},stopPropagation(){}});
  assert.equal(ui.button.disabled,false);
  assert.equal(ui.button.textContent,'重试加入 Anki');
  assert.equal(/Anki/.test(ui.status.textContent),true);
  assert.equal(s.translations(),0);
});
test('missing translator does not persist anything or silently fail',async()=>{
  const s=setup({missingTranslation:true});s.adapter.start();const ui=s.select();
  await ui.button.listeners.click({preventDefault(){},stopPropagation(){}});
  assert.equal(/Translate for Zotero/.test(ui.status.textContent),true);
  assert.equal(s.requests.some(x=>x.payload.action==='addNote'),false);
});
test('malformed AnkiConnect response never becomes a successful save',async()=>{
  const s=setup({http:async()=>({response:'not-json'})});s.adapter.start();const ui=s.select();
  await ui.button.listeners.click({preventDefault(){},stopPropagation(){}});
  assert.equal(ui.button.disabled,false);
  assert.equal(/AnkiConnect/.test(ui.status.textContent),true);
  assert.equal(s.translations(),0);
});
test('disabling the bridge while translation is pending prevents a later addNote',async()=>{
  let release;
  const pending=new Promise(resolve=>release=resolve);
  const s=setup({translate:async()=>{await pending;return {status:'success',result:'机制'};}});
  s.adapter.start();const ui=s.select();
  const clicking=ui.button.listeners.click({preventDefault(){},stopPropagation(){}});
  await new Promise(resolve=>setTimeout(resolve,2));
  s.adapter.stop();release();await clicking;
  assert.equal(s.requests.some(x=>x.payload.action==='addNote'),false);
  assert.equal(ui.root.removed,true);
});
test('restarting an adapter cannot revive its previous pending save',async()=>{
  let release;const pending=new Promise(resolve=>release=resolve);
  const s=setup({translate:async()=>{await pending;return {status:'success',result:'机制'};}});
  s.adapter.start();const ui=s.select();
  const clicking=ui.button.listeners.click({preventDefault(){},stopPropagation(){}});
  await new Promise(resolve=>setTimeout(resolve,2));
  s.adapter.stop();s.adapter.start();release();await clicking;
  assert.equal(s.requests.some(x=>x.payload.action==='addNote'),false);
});
test('unloading remains safe after a reader window document has been destroyed',()=>{
  const s=setup();s.adapter.start();const ui=s.select();
  ui.root.remove=()=>{throw new Error('dead object');};
  let threw=false;try{s.adapter.stop();}catch(_){threw=true;}
  assert.equal(threw,false);
  s.adapter.start();assert.equal(s.registered.length,2);
});
test('closing a reader cannot prevent the button from appearing in the next reader',()=>{
  const s=setup();s.adapter.start();const first=s.select();
  Object.defineProperty(first.root,'isConnected',{get(){throw new Error('dead object');}});
  const next=s.select('cell');
  assert.equal(s.rendered.length,2);
  assert.equal(next.button.textContent,'＋ 加入 Anki');
});
test('rejects a non-local Anki endpoint before sending data',async()=>{
  const s=setup({prefs:{'extensions.zotero.ZoteroAnkiBridge.endpoint':'https://example.com'}});
  s.adapter.start();const ui=s.select();await ui.button.listeners.click({preventDefault(){},stopPropagation(){}});
  assert.equal(s.requests.length,0);
  assert.equal(/本机/.test(ui.status.textContent),true);
});
