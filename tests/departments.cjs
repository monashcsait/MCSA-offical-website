const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const app = fs.readFileSync('assets/app.js', 'utf8');
const renderSource = app.slice(app.indexOf('  function departmentPage()'), app.indexOf('  function content()'));
function render(record, page = 'department-publicity') {
 const context = {
  page, lang: 'en', data: {departments: record ? [record] : []},
  t: value => typeof value === 'string' ? value : value?.en || '',
  ui: (zh,en) => en,
  esc: value => String(value ?? '').replace(/[<>&"']/g, x => ({'<':'&lt;','>':'&gt;','&':'&amp;','"':'&quot;',"'":'&#39;'}[x])),
  a: (url,text) => `<a href="${url}">${text}</a>`, image: src => `<img src="${src}">`, URL
 };
 return vm.runInNewContext(renderSource + '\ndepartmentPage()', context);
}
const department = {id:'publicity',name:{en:'Publicity'},intro:{en:'Media'},heads:[{name:'Older',termStart:'2024-01'},{name:'Newest',termStart:'2026-07'},{name:'Middle',termStart:'2025-01'}]};
const html = render(department);
assert.ok(html.indexOf('Newest') < html.indexOf('Middle') && html.indexOf('Middle') < html.indexOf('Older'));
assert.deepEqual(department.heads.map(h=>h.name), ['Older','Newest','Middle']);
assert.match(html,/Details will be added soon/);
assert.match(render(null),/Department unavailable/);
assert.match(render({...department,published:false}),/Department unavailable/);
assert.match(render({...department,recruitmentUrl:'https://mp.weixin.qq.com/s/example'}),/href="https:\/\/mp.weixin.qq.com\/s\/example"/);
for (const url of ['javascript:alert(1)','https://mp.weixin.qq.com.evil.test/s/x','https://user:password@mp.weixin.qq.com/s/x','http://mp.weixin.qq.com/s/x']) {
 assert.doesNotMatch(render({...department,recruitmentUrl:url}),/Read the WeChat recruitment post/);
}
assert.match(render({...department,name:'<script>alert(1)</script>'}),/&lt;script&gt;/);
for (const id of ['organisation','publicity','marketing','secretariat','alumni','sports-culture']) {
 const page=fs.readFileSync(`department-${id}.html`,'utf8');
 assert.ok(page.includes(`data-page="department-${id}"`));
 assert.doesNotMatch(page,/http-equiv="refresh"/);
}
assert.ok(app.includes("linkedHeading(ui('部门介绍','Departments','部門介紹'),departmentDirectoryRoute()"));
assert.ok(app.includes("a(departmentDirectoryRoute(), ui('部门招新'"));
console.log('Department checks passed: routes, missing/unpublished content, date ordering, escaping, and WeChat URL validation.');
const organisation = JSON.parse(fs.readFileSync('content/departments/organisation.json','utf8'));
const organisationHtml = render({...organisation,name:'Organisation Department'},'department-organisation');
assert.match(organisationHtml,/Messages from the Department Leaders/);
assert.equal(organisation.leadership.length,3);
assert.match(organisationHtml,/Applications for this round have closed/);
assert.match(organisationHtml,/tOxhxiIIGJkB7bnaVxp71w/);
assert.match(organisationHtml,/Interview preparation/);
assert.equal(organisation.groups[0].requirements.length,4);
assert.equal(organisation.groups[1].requirements.length,3);
for (const person of organisation.leadership) if (person.image) assert.ok(fs.existsSync(person.image));
assert.ok(fs.existsSync(organisation.applicationImage));
console.log('Organisation source-content checks passed.');
const orderedAssets = [organisation.poster, ...organisation.gallery, ...organisation.leadership.map(p=>p.image).filter(Boolean)];
let previous = -1;
for (const asset of orderedAssets) {
 const position = organisationHtml.indexOf(asset);
 assert.ok(position > previous, `Expected article order for ${asset}`);
 previous = position;
 assert.ok(fs.existsSync(asset));
}
assert.equal(organisation.leadership[0].crop, undefined);
assert.equal(organisation.leadership[1].crop, undefined);
console.log('Original-asset references and article reading order passed.');

assert.match(organisationHtml,/Jocelyn 钱语涵/);
assert.match(organisationHtml,/jocelyn.jpg/);
assert.doesNotMatch(organisationHtml,/Orink|orink-source/);

assert.doesNotMatch(organisationHtml, /<a[^>]+href="images\//);
assert.equal(organisation.leadership[2].quote.zh, "祝大家在新的一年里勇往直前，捧着梦走遍天涯！");
assert.ok(organisationHtml.indexOf("Wishing you the courage") > organisationHtml.indexOf("jocelyn.jpg"));

assert.match(organisationHtml,/about-manifesto/);
assert.match(organisationHtml,/about-narrative/);
