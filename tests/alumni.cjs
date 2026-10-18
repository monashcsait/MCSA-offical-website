const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'..');require('../assets/alumni.js');
const data=JSON.parse(fs.readFileSync(path.join(root,'content/departments/alumni.json')));
for(const lang of ['zh','en']){
 const html=globalThis.MCSAAlumni.render(data,lang);
 assert.equal((html.match(/class="article-original"/g)||[]).length,10);
 assert(html.includes('alumni-benefits')); assert(html.includes(lang === 'en' ? 'have closed' : '报名已结束')); assert(html.includes('Chloe')); assert(html.includes('Keith')); assert(!html.includes('<details'));assert(!html.includes('source.png'));
 const evil=structuredClone(data);evil.leaders[0].name='<script>bad</script>';evil.leaders[0].image='../bad.png';evil.sourceUrl='javascript:alert(1)';
 const safe=globalThis.MCSAAlumni.render(evil,lang);assert(!safe.includes('<script>'));assert(!safe.includes('../bad'));assert(!safe.includes('javascript:'));
}
for(const a of JSON.parse(fs.readFileSync(path.join(root,'content/departments/alumni-originals.json')))) assert.equal(crypto.createHash('sha256').update(fs.readFileSync(path.join(root,'images/departments/alumni',a.file))).digest('hex'),a.sha256);
console.log('Alumni bilingual render, original asset integrity and escaping checks passed.');
