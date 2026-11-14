// Behavioral checks for the app's state and form flows without browser dependencies.
const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const html = fs.readFileSync(__dirname + '/../dist/index.html', 'utf8');
const main = html.match(/<script>([\s\S]*?)<\/script>/)[1];
const source = main.replace(/\}\)\(\);\s*$/, `globalThis.app={get db(){return db},state,fresh,validDB,render,renderIncome,incomeModal,importFile,navigate,exportData};})();`);

function boot(initial) {
  const nodes = new Map();
  const storage = new Map(initial ? [['open-world-quest-v2', JSON.stringify(initial)]] : []);
  const bodyListeners = {};
  let document;
  class Element {
    constructor(id = '') { this.id=id; this.style={}; this.attributes={}; this.listeners={}; this.value=''; this.textContent=''; this._html=''; this.disabled=false; }
    set innerHTML(value) {
      this._html=value;
      for(const match of value.matchAll(/<(\w+)\b([^>]*\bid="([^"]+)"[^>]*)>([\s\S]*?)(?=<\/\1>|$)/g)) {
        const node=get('#'+match[3]);
        const attrs=match[2];
        node.value=match[1]==='textarea'?match[4]:(attrs.match(/\bvalue="([^"]*)"/)?.[1]||'');
      }
    }
    get innerHTML() { return this._html; }
    get children() { return this._html ? [{}] : []; }
    get isConnected() { return true; }
    get valueAsNumber() { return this.value==='' ? NaN : Number(this.value); }
    setCustomValidity(value) { this.validationMessage=value; }
    setAttribute(k,v) { this.attributes[k]=v; }
    addEventListener(k,v) { this.listeners[k]=v; }
    focus() { document.activeElement=this; }
    querySelectorAll() { return []; }
    click() {}
    remove() {}
  }
  function get(key) { if(!nodes.has(key))nodes.set(key,new Element(key.replace(/^#/,''))); return nodes.get(key); }
  document={querySelector:get,activeElement:null,body:{addEventListener:(k,v)=>bodyListeners[k]=v,append(){}},addEventListener(){},createElement:()=>new Element(),getElementById:id=>get('#'+id)};
  const sandbox={console,Intl,Date,Math,Number,JSON,String,Map,Set,Blob,document,localStorage:{getItem:k=>storage.get(k)||null,setItem:(k,v)=>storage.set(k,v)},window:{scrollTo(){}},requestAnimationFrame:fn=>fn(),setTimeout:()=>1,clearTimeout(){},confirm:()=>true,alert:msg=>{throw new Error(msg)},URL:{createObjectURL:()=> 'blob:test',revokeObjectURL(){}},FileReader:class{readAsText(file){this.result=file.text;this.onload()}}};
  vm.createContext(sandbox);
  vm.runInContext(source,sandbox);
  return {app:sandbox.app,get,storage};
}
function submit(env, values) {
  for(const [name,value] of Object.entries(values))env.get('#income'+name).value=String(value);
  env.get('#incomeForm').listeners.input();
  env.get('#incomeForm').listeners.submit({preventDefault(){}});
}
const pristine=boot();
assert.equal(pristine.app.state.view,'income');
assert.equal(pristine.app.db.opportunities.length,1);
const first=pristine.get('#page').innerHTML;
assert.match(first,/Build websites for local businesses/);
assert.match(first,/€500–€1,500/);
assert.match(first,/30 hours/);
assert.match(first,/€16\.67–€50\.00/);
assert.equal((pristine.get('#mobileNav').innerHTML.match(/data-view=/g)||[]).length,6);

// An old v2 backup gains income opportunities without changing quest progress.
const old=JSON.parse(JSON.stringify(pristine.app.db));
delete old.opportunities;
old.done['family-food:0']=true;
old.quests.push({id:'my-existing-quest',type:'side',domain:'Work',title:'My quest',desc:'Keep me',tasks:['One action']});
const migrated=boot(old);
assert.equal(migrated.app.db.done['family-food:0'],true);
assert.equal(migrated.app.db.quests.at(-1).title,'My quest');
assert.equal(migrated.app.db.opportunities[0].hours,30);

// Create, update, render escaped user text, and keep after reloading stored data.
pristine.app.incomeModal();
submit(pristine,{Title:'<img src=x onerror=alert(1)>',Description:'One client',Min:200,Max:400,Hours:2.5});
assert.equal(pristine.app.db.opportunities.length,2);
assert.match(pristine.get('#page').innerHTML,/&lt;img/);
assert.doesNotMatch(pristine.get('#page').innerHTML,/<img src=x/);
const newItem=pristine.app.db.opportunities[1];
pristine.app.incomeModal(newItem);
submit(pristine,{Title:'Consulting',Description:'One session',Min:300,Max:300,Hours:3});
assert.equal(pristine.app.db.opportunities[1].id,newItem.id);
assert.match(pristine.get('#page').innerHTML,/€100\.00/);
const reload=boot(JSON.parse(pristine.storage.get('open-world-quest-v2')));
assert.equal(reload.app.db.opportunities[1].title,'Consulting');

// Invalid ranges and zero hours never write a new opportunity.
pristine.app.incomeModal();
submit(pristine,{Title:'Invalid',Description:'',Min:500,Max:100,Hours:0});
assert.equal(pristine.app.db.opportunities.length,2);
assert.match(pristine.get('#incomeError').textContent,/valid earnings range/);
assert.match(pristine.get('#incomeMax').validationMessage,/at least the minimum/);
assert.equal(pristine.get('#incomePreview').textContent,'—');

// Zero earnings are valid and do not cause a misleading infinite rate.
pristine.app.incomeModal();
submit(pristine,{Title:'Trial project',Description:'',Min:0,Max:0,Hours:0.5});
assert.equal(pristine.app.db.opportunities.length,3);
assert.match(pristine.get('#page').innerHTML,/€0\.00/);

// Sorting uses the selected measure, including the hourly midpoint.
pristine.app.state.incomeSort='rate';
let page=pristine.app.renderIncome();
assert.ok(page.indexOf('Consulting')<page.indexOf('Build websites'));
pristine.app.state.incomeSort='earnings';
page=pristine.app.renderIncome();
assert.ok(page.indexOf('Build websites')<page.indexOf('Consulting'));
pristine.app.state.incomeSort='time';
page=pristine.app.renderIncome();
assert.ok(page.indexOf('Trial project')<page.indexOf('Consulting'));

// Delete all opportunities; the empty map must survive reload and backup restore.
for(const item of [...pristine.app.db.opportunities]) {
  pristine.app.incomeModal(item);
  pristine.get('#deleteIncome').onclick();
}
assert.equal(pristine.app.db.opportunities.length,0);
assert.match(pristine.get('#page').innerHTML,/Your income map starts here/);
const emptyBackup=JSON.parse(pristine.storage.get('open-world-quest-v2'));
assert.equal(boot(emptyBackup).app.db.opportunities.length,0);
reload.app.importFile({size:100,text:JSON.stringify(emptyBackup)});
assert.equal(reload.app.db.opportunities.length,0);
reload.app.importFile({size:100,text:JSON.stringify(old)});
assert.equal(reload.app.db.opportunities.length,1);
assert.equal(reload.app.db.done['family-food:0'],true);

// Backups containing corrupt new numeric data must not be accepted.
for(const change of [{hours:0},{hours:Infinity},{min:-1},{min:500,max:100},{max:NaN}]) {
  const bad=JSON.parse(JSON.stringify(reload.app.db));
  Object.assign(bad.opportunities[0],change);
  assert.equal(reload.app.validDB(bad),false);
}
for(const view of ['map','path','side','life','journal','income']) {
  reload.app.navigate(view);
  assert.ok(reload.get('#page').innerHTML.length>100);
}
console.log('PASS: income calculations, CRUD, validation, sorting, persistence, migrations, backups, and all existing views.');
