const assert=require('node:assert/strict');
const fs=require('node:fs');
const crypto=require('node:crypto');
const vm=require('node:vm');
require('../assets/publicity.js');
const d=JSON.parse(fs.readFileSync('content/departments/publicity.json'));
const manifest=JSON.parse(fs.readFileSync('content/departments/publicity-originals.json'));
assert.equal(manifest.files.length,10);
for(const item of manifest.files){const b=fs.readFileSync(item.file);assert.equal(b.length,item.bytes);assert.equal(crypto.createHash('sha256').update(b).digest('hex'),item.sha256,item.file);}
for(const lang of ['zh','en']){
 const html=globalThis.MCSAPublicity.render(d,lang);
 assert.deepEqual([...html.matchAll(/publicity\/(64\d)\.png/g)].map(m=>Number(m[1])),[641,642,643]);
 assert.match(html,/publicity\/ella-original\.jpg/);
 assert.equal((html.match(/<h1>/g)||[]).length,1);
 assert.doesNotMatch(html,/<script|undefined|secretariat/);
 assert.match(html,/2026/);
 assert.match(html,lang==='en'?/Applications for this round have closed/:/本轮报名已结束/);
 assert.match(html,lang==='en'?/not current account figures/:/不代表当前账号数据/);
 const hostile=globalThis.MCSAPublicity.render({...d,name:'<script>alert(1)</script>',sourceUrl:'javascript:alert(1)',leaders:[{name:'Bad',image:'../../secret.png'}]},lang);
 assert.match(hostile,/&lt;script&gt;/);assert.doesNotMatch(hostile,/href="javascript:|src="[^" ]*\.\.\//);
}
const app=fs.readFileSync('assets/app.js','utf8');
const fn=app.slice(app.indexOf('  function departmentPage()'),app.indexOf('  function content()'));
const context={window:globalThis,URL,page:'department-publicity',lang:'en',data:{departments:[d]},t:v=>typeof v==='string'?v:v?.en||'',ui:(_,en)=>en,esc:String,a:()=>''};
assert.match(vm.runInNewContext(fn+';departmentPage()',context),/Guan Yingchen/);
context.data.departments=[{...d,published:false}];
assert.match(vm.runInNewContext(fn+';departmentPage()',context),/Department unavailable/);
const shell=fs.readFileSync('department-publicity.html','utf8');
assert.ok(shell.indexOf('assets/publicity.js')>=0 && shell.indexOf('assets/publicity.js')<shell.indexOf('assets/app.js'));
assert.ok(shell.includes('assets/publicity.css'));
console.log('Publicity checks passed: original hashes, order, bilingual content, historical labels, escaping and publication gate.');
