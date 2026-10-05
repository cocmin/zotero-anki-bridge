const test = require('node:test');
const assert = require('node:assert/strict');
const Core = require('../addon/lib/core.js');

const config = {deckName:'文献单词', modelName:'问答题', frontField:'正面', backField:'背面', tags:['Zotero'], service:'customgpt1'};
function setup(options={}) {
  const calls=[];
  let translated=0;
  const deps={
    config,
    rpc:async(action,params)=>{
      calls.push({action,params});
      if (options.rpc) return options.rpc(action,params);
      if (action==='deckNames') return ['文献单词'];
      if (action==='modelFieldNames') return ['正面','背面'];
      if (action==='canAddNotes') return [true];
      if (action==='addNote') return 42;
      throw new Error('Unexpected action '+action);
    },
    getTask: options.getTask || (()=>null),
    translate: async(selection)=>{
      translated++;
      if (options.translate) return options.translate(selection);
      return {status:'success',raw:selection.text,itemId:selection.itemID,service:'customgpt1',result:'机制'};
    },
    pollMs:1, timeoutMs:30,
  };
  return {calls,bridge:Core.createBridge(deps),translations:()=>translated};
}
const selected={text:'mechanism',itemID:12};
const lastNote=(calls)=>calls.findLast(x=>x.action==='addNote')?.params.note;

test('API exists and normalizes PDF selection',()=>{
  assert.equal(typeof Core.createBridge,'function');
  assert.equal(Core.normalizeSelection('  mechanism\r\n '),'mechanism');
});
test('selected word and translation enter the configured fields',async()=>{
  const s=setup();
  assert.deepEqual(await s.bridge.addSelection(selected),{status:'added',noteID:42});
  const note=lastNote(s.calls);
  assert.equal(note.deckName,'文献单词');
  assert.equal(note.modelName,'问答题');
  assert.deepEqual(note.fields,{'正面':'mechanism','背面':'机制'});
  assert.equal(note.options.allowDuplicate,false);
  assert.equal(note.options.duplicateScope,'deck');
});
test('reuses only a successful matching word, document and engine',async()=>{
  const s=setup({getTask:()=>({raw:'mechanism',itemId:12,service:'customgpt1',status:'success',result:'当前译文'})});
  await s.bridge.addSelection(selected);
  assert.equal(s.translations(),0);
  assert.equal(lastNote(s.calls).fields['背面'],'当前译文');
});
for (const mismatch of [{raw:'previous'},{itemId:999},{service:'cambridgedict'}]) {
  test('ignores unrelated translation '+JSON.stringify(mismatch),async()=>{
    const s=setup({getTask:()=>({raw:'mechanism',itemId:12,service:'customgpt1',status:'success',result:'不能保存',...mismatch})});
    await s.bridge.addSelection(selected);
    assert.equal(s.translations(),1);
    assert.equal(lastNote(s.calls).fields['背面'],'机制');
  });
}
test('waits for the current matching in-flight translation',async()=>{
  const task={raw:'mechanism',itemId:12,service:'customgpt1',status:'processing',result:''};
  const s=setup({getTask:()=>task});
  const pending=s.bridge.addSelection(selected);
  setTimeout(()=>{task.result='完成的译文';task.status='success';},3);
  await pending;
  assert.equal(s.translations(),0);
  assert.equal(lastNote(s.calls).fields['背面'],'完成的译文');
});
test('manually starts translation when automatic translation left the selection waiting',async()=>{
  const s=setup({getTask:()=>({raw:'mechanism',itemId:12,service:'customgpt1',status:'waiting',result:''})});
  await s.bridge.addSelection(selected);
  assert.equal(s.translations(),1);
  assert.equal(lastNote(s.calls).fields['背面'],'机制');
});
test('rejects empty or failed translations without writing a note',async()=>{
  for (const task of [{status:'success',result:'  '},{status:'fail',result:'API error'}]) {
    const s=setup({translate:async()=>task});
    await assert.rejects(()=>s.bridge.addSelection(selected),/翻译/);
    assert.equal(lastNote(s.calls),undefined);
  }
});
test('a rejected duplicate creates no second note',async()=>{
  const s=setup({rpc:async(action)=>action==='deckNames'?['文献单词']:action==='modelFieldNames'?['正面','背面']:[false]});
  assert.equal((await s.bridge.addSelection(selected)).status,'duplicate');
  assert.equal(lastNote(s.calls),undefined);
});
test('concurrent clicks on the same selection submit at most one note',async()=>{
  let release;
  const waiting=new Promise(r=>release=r);
  const s=setup({translate:async()=>{await waiting;return {status:'success',result:'机制'};}});
  const first=s.bridge.addSelection(selected);
  assert.equal((await s.bridge.addSelection(selected)).status,'busy');
  release();
  await first;
  assert.equal(s.calls.filter(x=>x.action==='addNote').length,1);
});
test('escapes selected text and AI output as text rather than executable HTML',async()=>{
  const s=setup({translate:async()=>({status:'success',result:'<script>alert(1)</script>\nA & B'})});
  await s.bridge.addSelection({text:'A < B',itemID:12});
  const note=lastNote(s.calls);
  assert.equal(note.fields['正面'],'A &lt; B');
  assert.equal(note.fields['背面'],'&lt;script&gt;alert(1)&lt;/script&gt;<br>A &amp; B');
});
test('validates Anki fields before requesting a paid translation',async()=>{
  const s=setup({rpc:async(action)=>action==='deckNames'?['文献单词']:['Front','Back']});
  await assert.rejects(()=>s.bridge.addSelection(selected),/字段/);
  assert.equal(s.translations(),0);
  assert.equal(lastNote(s.calls),undefined);
});
test('requires the word field to be the first Anki field for correct duplicate detection',async()=>{
  const s=setup({rpc:async(action)=>action==='deckNames'?['文献单词']:action==='modelFieldNames'?['背面','正面']:action==='canAddNotes'?[true]:42});
  await assert.rejects(()=>s.bridge.addSelection(selected),/第一个字段/);
  assert.equal(s.translations(),0);
});
test('cannot silently send to a missing deck',async()=>{
  const s=setup({rpc:async()=>['Default']});
  await assert.rejects(()=>s.bridge.addSelection(selected),/牌组/);
  assert.equal(s.translations(),0);
});
test('translation timeout never writes a note and permits retry',async()=>{
  let succeed=false;
  const s=setup({translate:async()=>succeed?{status:'success',result:'机制'}:new Promise(()=>{})});
  await assert.rejects(()=>s.bridge.addSelection(selected),/超时/);
  assert.equal(lastNote(s.calls),undefined);
  succeed=true;
  assert.equal((await s.bridge.addSelection(selected)).status,'added');
});
test('retry is possible after an Anki connection failure',async()=>{
  let failing=true;
  const s=setup({rpc:async(action)=>{
    if(failing) throw new Error('Anki 未连接');
    return action==='deckNames'?['文献单词']:action==='modelFieldNames'?['正面','背面']:action==='canAddNotes'?[true]:42;
  }});
  await assert.rejects(()=>s.bridge.addSelection(selected),/Anki/);
  failing=false;
  assert.equal((await s.bridge.addSelection(selected)).status,'added');
});
test('rejects invalid selection before any API calls',async()=>{
  const s=setup();
  await assert.rejects(()=>s.bridge.addSelection({text:'  ',itemID:12}),/选择/);
  assert.equal(s.calls.length,0);
});
