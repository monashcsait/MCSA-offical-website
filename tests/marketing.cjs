const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'..');require('../assets/marketing.js');
const data=JSON.parse(fs.readFileSync(path.join(root,'content/departments/marketing.json')));
for(const lang of ['zh','en']){
 const html=globalThis.MCSAMarketing.render(data,lang);
 assert.equal((html.match(/class="article-original"/g)||[]).length,8);
 assert(!html.includes('<details'));assert(!html.includes('source.png'));
 const evil=structuredClone(data);evil.leaders[0].name='<script>bad</script>';evil.leaders[0].image='../bad.png';evil.sourceUrl='javascript:alert(1)';
 const safe=globalThis.MCSAMarketing.render(evil,lang);assert(!safe.includes('<script>'));assert(!safe.includes('../bad'));assert(!safe.includes('javascript:'));
}
for(const a of JSON.parse(fs.readFileSync(path.join(root,'content/departments/marketing-originals.json')))) assert.equal(crypto.createHash('sha256').update(fs.readFileSync(path.join(root,'images/departments/marketing',a.file))).digest('hex'),a.sha256);
console.log('Marketing bilingual render, original asset integrity and escaping checks passed.');
